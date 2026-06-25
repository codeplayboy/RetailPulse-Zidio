"""
RetailPulse :: ML Models
========================

Reusable, cached analytics & ML helpers:

- :func:`compute_rfm`             – RFM scoring + rule-based segments
- :func:`run_kmeans`              – KMeans clustering on scaled RFM features
- :func:`predict_churn`           – churn risk scoring (logistic model) + bands
- :func:`churn_feature_importance`– feature importances for the churn model
- :func:`forecast_demand`         – Prophet forecast with graceful fallback
- :func:`optimize_inventory`      – reorder point / safety stock recommendations

Every function is decorated with ``st.cache_data`` (keyed on a hash of the
input frame) so heavy work runs once per session.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import streamlit as st
from sklearn.cluster import KMeans
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

# Human-readable segment names used across the app.
SEGMENTS = [
    "Champions", "Loyal Customers", "Potential Loyalists",
    "New Customers", "At Risk", "Lost Customers",
]


# ------------------------------------------------------------------
# RFM
# ------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def compute_rfm(customers: pd.DataFrame) -> pd.DataFrame:
    """Add R/F/M quintile scores and a rule-based segment label."""
    df = customers.copy()

    # Quintile scoring (1-5). Recency is reversed (lower = better).
    df["R_score"] = pd.qcut(df["recency"].rank(method="first"), 5,
                            labels=[5, 4, 3, 2, 1]).astype(int)
    df["F_score"] = pd.qcut(df["frequency"].rank(method="first"), 5,
                            labels=[1, 2, 3, 4, 5]).astype(int)
    df["M_score"] = pd.qcut(df["monetary"].rank(method="first"), 5,
                            labels=[1, 2, 3, 4, 5]).astype(int)
    df["RFM_score"] = df["R_score"] + df["F_score"] + df["M_score"]

    df["segment"] = df.apply(_rule_segment, axis=1)
    return df


def _rule_segment(row: pd.Series) -> str:
    """Map R/F/M scores to a business segment."""
    r, f, m = row["R_score"], row["F_score"], row["M_score"]
    fm = (f + m) / 2
    if r >= 4 and fm >= 4:
        return "Champions"
    if r >= 3 and fm >= 3:
        return "Loyal Customers"
    if r >= 4 and fm < 3:
        return "Potential Loyalists"
    if r >= 4 and f <= 2:
        return "New Customers"
    if r <= 2 and fm >= 3:
        return "At Risk"
    return "Lost Customers"


# ------------------------------------------------------------------
# KMeans clustering
# ------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def run_kmeans(rfm: pd.DataFrame, n_clusters: int = 5) -> pd.DataFrame:
    """Cluster customers on scaled [recency, frequency, monetary]."""
    df = rfm.copy()
    features = df[["recency", "frequency", "monetary"]].to_numpy(dtype=float)
    scaled = StandardScaler().fit_transform(features)
    km = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
    df["cluster"] = km.fit_predict(scaled)
    df["cluster_label"] = df["cluster"].map(lambda c: f"Cluster {c}")
    return df


# ------------------------------------------------------------------
# Churn prediction
# ------------------------------------------------------------------
def _churn_features(customers: pd.DataFrame) -> tuple[np.ndarray, list[str]]:
    cols = ["recency", "frequency", "monetary", "avg_order_value",
            "support_tickets", "satisfaction", "days_since_login",
            "email_open_rate", "tenure_days"]
    return customers[cols].to_numpy(dtype=float), cols


@st.cache_data(show_spinner=False)
def predict_churn(customers: pd.DataFrame) -> pd.DataFrame:
    """Score each customer's churn probability and assign a risk band.

    A synthetic ground-truth label is derived from behaviour, then a
    LogisticRegression is trained on it — mirroring a real pipeline while
    remaining fully self-contained.
    """
    df = customers.copy()
    X, cols = _churn_features(df)

    # Synthetic latent churn signal (high recency / low satisfaction / etc.)
    z = (
        0.020 * df["recency"]
        - 0.040 * df["frequency"]
        - 0.85 * df["satisfaction"]
        + 0.30 * df["support_tickets"]
        + 0.015 * df["days_since_login"]
        - 1.6 * df["email_open_rate"]
    )
    prob_true = 1 / (1 + np.exp(-(z - z.mean()) / (z.std() + 1e-9)))
    y = (prob_true > 0.55).astype(int)

    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    model = LogisticRegression(max_iter=1000, class_weight="balanced")
    model.fit(Xs, y)
    df["churn_probability"] = model.predict_proba(Xs)[:, 1].round(4)

    df["risk_band"] = pd.cut(
        df["churn_probability"],
        bins=[-0.01, 0.4, 0.7, 1.01],
        labels=["Low", "Medium", "High"],
    )
    # Stash coefficients for feature-importance view.
    df.attrs["churn_coef"] = dict(zip(cols, model.coef_[0]))
    return df


@st.cache_data(show_spinner=False)
def churn_feature_importance(scored: pd.DataFrame) -> pd.DataFrame:
    """Return absolute logistic coefficients as feature importances."""
    coef = scored.attrs.get("churn_coef")
    if not coef:
        scored = predict_churn(scored)
        coef = scored.attrs["churn_coef"]
    imp = pd.DataFrame({"feature": list(coef), "weight": list(coef.values())})
    imp["importance"] = imp["weight"].abs()
    imp["direction"] = np.where(imp["weight"] >= 0, "Increases churn", "Reduces churn")
    return imp.sort_values("importance", ascending=False).reset_index(drop=True)


def retention_action(prob: float) -> str:
    """Rule-based retention recommendation for a churn probability."""
    if prob >= 0.7:
        return "Offer Discount + Personal Outreach"
    if prob >= 0.4:
        return "Loyalty Program Enrollment"
    return "Personalized Campaign"


# ------------------------------------------------------------------
# Demand forecasting (Prophet with graceful fallback)
# ------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def forecast_demand(daily: pd.DataFrame, periods: int = 30,
                    metric: str = "revenue",
                    multipliers: tuple[float, float, float] = (0.0, 0.0, 0.0)
                    ) -> dict:
    """Forecast ``metric`` ``periods`` days ahead.

    Uses Prophet when available; otherwise falls back to a seasonal-naive
    + linear-trend model with empirical confidence intervals.

    ``multipliers`` = (demand_increase_pct, marketing_pct, seasonal_pct)
    are applied to the forecast for the What-If analysis.
    """
    ts = daily[["date", metric]].rename(columns={"date": "ds", metric: "y"}).copy()
    ts["ds"] = pd.to_datetime(ts["ds"])

    used_prophet = False
    try:
        from prophet import Prophet  # type: ignore

        m = Prophet(daily_seasonality=False, weekly_seasonality=True,
                    yearly_seasonality=True, interval_width=0.9)
        m.fit(ts.rename(columns={"y": "y"}))
        future = m.make_future_dataframe(periods=periods)
        fc = m.predict(future)
        forecast = fc[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
        used_prophet = True
    except Exception:
        forecast = _fallback_forecast(ts, periods)

    # Apply What-If multipliers to the forecasted (future) portion only.
    demand_pct, mkt_pct, seasonal_pct = multipliers
    total_factor = 1 + (demand_pct + mkt_pct + seasonal_pct) / 100.0
    future_mask = forecast["ds"] > ts["ds"].max()
    for col in ["yhat", "yhat_lower", "yhat_upper"]:
        forecast.loc[future_mask, col] = forecast.loc[future_mask, col] * total_factor

    # Backtest accuracy (MAPE) on the historical overlap.
    merged = ts.merge(forecast, on="ds", how="inner")
    mape = float(
        np.mean(np.abs((merged["y"] - merged["yhat"]) / merged["y"].replace(0, np.nan)).dropna()) * 100
    ) if not merged.empty else float("nan")

    return {
        "history": ts,
        "forecast": forecast,
        "mape": round(mape, 2),
        "accuracy": round(max(0.0, 100 - mape), 2),
        "engine": "Prophet" if used_prophet else "Statistical fallback",
        "metric": metric,
    }


def _fallback_forecast(ts: pd.DataFrame, periods: int) -> pd.DataFrame:
    """Seasonal-naive + linear trend forecaster (no external deps)."""
    y = ts["y"].to_numpy(dtype=float)
    n = len(y)
    x = np.arange(n)

    # Linear trend
    coef = np.polyfit(x, y, 1)
    trend = np.poly1d(coef)

    # Weekly seasonal component (residual averaged by weekday)
    resid = y - trend(x)
    dow = ts["ds"].dt.dayofweek.to_numpy()
    seasonal = np.array([resid[dow == d].mean() if (dow == d).any() else 0.0
                         for d in range(7)])
    sigma = float(resid.std())

    last_date = ts["ds"].max()
    future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=periods)
    fx = np.arange(n, n + periods)
    fdow = future_dates.dayofweek.to_numpy()
    fcast = trend(fx) + seasonal[fdow]

    # In-sample fit
    fit = trend(x) + seasonal[dow]

    all_dates = list(ts["ds"]) + list(future_dates)
    yhat = np.concatenate([fit, fcast])
    band = 1.64 * sigma  # ~90% interval
    return pd.DataFrame({
        "ds": all_dates,
        "yhat": yhat,
        "yhat_lower": yhat - band,
        "yhat_upper": yhat + band,
    })


# ------------------------------------------------------------------
# Inventory optimization
# ------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def optimize_inventory(products: pd.DataFrame, service_level_z: float = 1.65
                       ) -> pd.DataFrame:
    """Compute safety stock, reorder point & reorder qty per product.

    Uses a classic (s, Q) model:
        safety_stock = z * sigma_demand * sqrt(lead_time)
        reorder_point = avg_daily_demand * lead_time + safety_stock
        reorder_qty   = max(0, reorder_point + 2*weekly_demand - current_stock)
    """
    df = products.copy()
    demand_sigma = (df["avg_daily_demand"] * 0.35).clip(lower=0.5)
    df["safety_stock"] = (service_level_z * demand_sigma *
                          np.sqrt(df["lead_time_days"])).round().astype(int)
    df["reorder_point"] = (df["avg_daily_demand"] * df["lead_time_days"]
                           + df["safety_stock"]).round().astype(int)
    target = df["reorder_point"] + (df["avg_daily_demand"] * 14)
    df["reorder_qty"] = (target - df["current_stock"]).clip(lower=0).round().astype(int)

    # Days of cover & health classification
    df["days_of_cover"] = (df["current_stock"] /
                           df["avg_daily_demand"].clip(lower=0.1)).round(1)
    df["stock_status"] = np.select(
        [
            df["current_stock"] <= df["safety_stock"],
            df["current_stock"] <= df["reorder_point"],
            df["current_stock"] > df["reorder_point"] * 2.2,
        ],
        ["Critical", "Low", "Overstock"],
        default="Healthy",
    )
    return df


def inventory_health_score(opt: pd.DataFrame) -> float:
    """Aggregate inventory health into a 0-100 score."""
    weights = {"Healthy": 1.0, "Low": 0.6, "Overstock": 0.5, "Critical": 0.0}
    return round(opt["stock_status"].map(weights).mean() * 100, 1)
