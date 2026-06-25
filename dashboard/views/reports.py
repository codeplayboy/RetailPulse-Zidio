"""
Page 6 — Analytics & Reports
============================

Generate and export consolidated business reports (Customer, Sales, Churn,
Forecast, Inventory) in CSV / Excel / PDF formats with a live preview and
headline metrics.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from utils import components as C
from utils import ml_models

REPORTS = ["Customer Report", "Sales Report", "Churn Report",
           "Forecast Report", "Inventory Report"]


def _build_report(name: str, data: dict, settings: dict):
    """Return (DataFrame, summary, headline_metrics) for the chosen report."""
    if name == "Customer Report":
        rfm = ml_models.compute_rfm(data["customers"])
        df = rfm[["customer_id", "recency", "frequency", "monetary",
                  "avg_order_value", "RFM_score", "segment", "clv"]].round(2)
        summary = (f"{len(df):,} customers • avg CLV "
                   f"${rfm['clv'].mean():,.0f} • "
                   f"{(rfm['segment']=='Champions').sum():,} champions.")
        metrics = {"Customers": f"{len(df):,}",
                   "Avg CLV": f"${rfm['clv'].mean():,.0f}",
                   "Champions": f"{(rfm['segment']=='Champions').sum():,}"}
        return df, summary, metrics

    if name == "Sales Report":
        tx = data["transactions"]
        df = (tx.groupby(["category", "product"])
              .agg(units=("quantity", "sum"), revenue=("revenue", "sum"),
                   profit=("profit", "sum"), orders=("revenue", "size"))
              .round(2).reset_index().sort_values("revenue", ascending=False))
        summary = (f"Total revenue ${tx['revenue'].sum():,.0f} • "
                   f"{tx['quantity'].sum():,} units • "
                   f"{tx['product'].nunique()} products.")
        metrics = {"Revenue": C.human_number(tx['revenue'].sum(), True),
                   "Units": C.human_number(tx['quantity'].sum()),
                   "Profit": C.human_number(tx['profit'].sum(), True)}
        return df, summary, metrics

    if name == "Churn Report":
        scored = ml_models.predict_churn(data["customers"])
        df = scored[["customer_id", "risk_band", "churn_probability", "recency",
                     "frequency", "monetary", "satisfaction"]].copy()
        df["recommendation"] = df["churn_probability"].apply(ml_models.retention_action)
        df = df.sort_values("churn_probability", ascending=False).round(3)
        high = (scored["risk_band"] == "High").sum()
        summary = (f"{high:,} high-risk customers • "
                   f"${scored[scored['risk_band']=='High']['monetary'].sum():,.0f} "
                   f"revenue at risk.")
        metrics = {"High Risk": f"{high:,}",
                   "Avg Churn %": f"{scored['churn_probability'].mean()*100:.1f}%",
                   "At-Risk Rev.": C.human_number(
                       scored[scored['risk_band']=='High']['monetary'].sum(), True)}
        return df, summary, metrics

    if name == "Forecast Report":
        horizon = settings.get("forecast_horizon", 30)
        res = ml_models.forecast_demand(data["daily"], periods=horizon, metric="revenue")
        fut = res["forecast"][res["forecast"]["ds"] > res["history"]["ds"].max()]
        df = fut[["ds", "yhat", "yhat_lower", "yhat_upper"]].round(2)
        df.columns = ["date", "forecast", "lower_bound", "upper_bound"]
        summary = (f"{horizon}-day forecast • engine {res['engine']} • "
                   f"accuracy {res['accuracy']}% • projected "
                   f"${fut['yhat'].sum():,.0f}.")
        metrics = {"Horizon": f"{horizon} days",
                   "Accuracy": f"{res['accuracy']}%",
                   "Projected Rev.": C.human_number(fut['yhat'].sum(), True)}
        return df, summary, metrics

    # Inventory Report
    opt = ml_models.optimize_inventory(data["products"])
    df = opt[["product_id", "product", "category", "current_stock",
              "safety_stock", "reorder_point", "reorder_qty",
              "days_of_cover", "stock_status"]]
    health = ml_models.inventory_health_score(opt)
    summary = (f"Inventory health {health}/100 • "
               f"{(opt['stock_status']=='Critical').sum()} critical • "
               f"{int(opt['reorder_qty'].sum()):,} units to reorder.")
    metrics = {"Health": f"{health}/100",
               "Critical SKUs": f"{(opt['stock_status']=='Critical').sum()}",
               "Reorder Units": C.human_number(opt['reorder_qty'].sum())}
    return df, summary, metrics


def render(ctx: dict) -> None:
    data, settings = ctx["data"], ctx["settings"]

    C.hero("Analytics & Reports",
           "Generate and export board-ready reports in CSV, Excel or PDF.")
    st.write("")

    c1, c2 = st.columns([2, 1])
    report_name = c1.selectbox("Select report", REPORTS)
    rows_preview = c2.number_input("Preview rows", 10, 500, 50, step=10)

    with C.loading(f"Compiling {report_name}…"):
        df, summary, metrics = _build_report(report_name, data, settings)

    # Headline metrics
    cards = [C.kpi_card(k, v, "📌") for k, v in metrics.items()]
    C.kpi_row(cards, per_row=len(cards))
    st.write("")

    C.section(report_name, summary, "📄")
    st.dataframe(df.head(int(rows_preview)), use_container_width=True, height=420,
                 hide_index=True)

    st.write("")
    C.section("⬇️ Export", "Download the full report")
    safe = report_name.lower().replace(" ", "_")
    C.export_buttons(df, safe, summary=summary)

    st.caption(f"Full report contains **{len(df):,} rows**. "
               "PDF export includes the first 40 rows for readability.")
