"""
Page 4 — Demand Forecasting
===========================

Prophet-powered demand forecasting (with statistical fallback) including
confidence intervals, horizon selector, seasonal / weekly / monthly trend
decomposition, and an interactive What-If analysis.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import streamlit as st

from utils import charts
from utils import components as C
from utils import ml_models

HORIZONS = {"7 Days": 7, "30 Days": 30, "90 Days": 90, "180 Days": 180}


def render(ctx: dict) -> None:
    data, theme = ctx["data"], ctx["theme"]
    daily = data["daily"]

    C.hero("Demand Forecasting",
           "Hybrid time-series forecasting to plan inventory and revenue.")
    st.write("")

    # ---------------- Controls ----------------
    c1, c2, c3 = st.columns([1.2, 1.2, 1.2])
    horizon_label = c1.selectbox("Forecast period", list(HORIZONS.keys()), index=1)
    metric = c2.selectbox("Metric", ["revenue", "sales", "orders"], index=0)
    periods = HORIZONS[horizon_label]

    C.section("🧪 What-If Analysis", "Adjust drivers — the forecast updates live")
    w1, w2, w3 = st.columns(3)
    demand_pct = w1.slider("Demand Increase %", -50, 100, 0, 5)
    marketing_pct = w2.slider("Marketing Impact %", 0, 60, 0, 5)
    seasonal_pct = w3.slider("Seasonal Factor %", -30, 50, 0, 5)

    with C.loading(f"Forecasting {metric} for {horizon_label}…"):
        result = ml_models.forecast_demand(
            daily, periods=periods, metric=metric,
            multipliers=(demand_pct, marketing_pct, seasonal_pct))

    history, forecast = result["history"], result["forecast"]
    split = history["ds"].max()
    future = forecast[forecast["ds"] > split]

    # ---------------- KPIs ----------------
    proj_total = future["yhat"].sum()
    hist_window = history.tail(periods)["y"].sum()
    delta_vs_hist = ((proj_total - hist_window) / hist_window * 100
                     if hist_window else 0)
    cards = [
        C.kpi_card(f"Projected {metric.title()}", C.human_number(
            proj_total, currency=(metric == "revenue")), "🔮", delta=delta_vs_hist),
        C.kpi_card("Forecast Engine", result["engine"], "⚙️"),
        C.kpi_card("Backtest MAPE", f"{result['mape']:.1f}%", "📏"),
        C.kpi_card("Forecast Accuracy", f"{result['accuracy']:.1f}%", "🎯", delta=2.1),
    ]
    C.kpi_row(cards, per_row=4)
    st.write("")

    # ---------------- Main forecast chart ----------------
    C.section("Historical Demand + Forecast", "Shaded band = confidence interval",
              "📈")
    st.plotly_chart(
        charts.forecast_chart(history, forecast, theme, split,
                              title=f"{metric.title()} Forecast — {horizon_label}"),
        use_container_width=True)

    # ---------------- Decomposition trends ----------------
    tab1, tab2, tab3 = st.tabs(["🌊 Seasonal Trend", "📅 Weekly Trend", "🗓️ Monthly Trend"])

    hist = history.copy()
    hist["ds"] = pd.to_datetime(hist["ds"])

    with tab1:
        C.section("Seasonal Trend", "30-day rolling average reveals seasonality", "🌊")
        seasonal = hist.copy()
        seasonal["rolling"] = seasonal["y"].rolling(30, min_periods=1).mean()
        st.plotly_chart(charts.line_trend(seasonal, "ds", "rolling", theme,
                                          color=theme["accent"]),
                        use_container_width=True)

    with tab2:
        C.section("Weekly Trend", "Average demand by day of week", "📅")
        wk = hist.copy()
        wk["dow"] = wk["ds"].dt.day_name()
        order = ["Monday", "Tuesday", "Wednesday", "Thursday",
                 "Friday", "Saturday", "Sunday"]
        wkg = (wk.groupby("dow")["y"].mean().reindex(order).reset_index())
        st.plotly_chart(charts.bar_ranking(wkg, "y", "dow", theme,
                                           horizontal=False),
                        use_container_width=True)

    with tab3:
        C.section("Monthly Trend", "Total demand by month", "🗓️")
        mo = hist.set_index("ds")["y"].resample("MS").sum().reset_index()
        mo["month"] = mo["ds"].dt.strftime("%b %Y")
        st.plotly_chart(charts.line_trend(mo, "month", "y", theme,
                                          color=theme["primary"], area=True),
                        use_container_width=True)

    # ---------------- Forecast table + export ----------------
    st.write("")
    C.section("Forecast Detail", f"Day-by-day projection for the next {periods} days",
              "📋")
    out = future[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
    out.columns = ["date", "forecast", "lower_bound", "upper_bound"]
    out = out.round(2)
    st.dataframe(out, use_container_width=True, height=320, hide_index=True)
    C.export_buttons(out, f"forecast_{metric}_{periods}d",
                     summary=(f"{metric} forecast • {horizon_label} • engine="
                              f"{result['engine']} • accuracy={result['accuracy']}%"))
