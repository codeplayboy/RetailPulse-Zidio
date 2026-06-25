"""
Page 1 — Executive Overview
===========================

High-level KPIs and trend charts with global date / product / region filters.
Designed to be the C-suite landing screen of RetailPulse.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from utils import charts
from utils import components as C
from utils import ml_models


def render(ctx: dict) -> None:
    data, theme = ctx["data"], ctx["theme"]
    tx = data["transactions"]
    customers = data["customers"]
    products = data["products"]

    C.hero("Executive Overview",
           "Real-time pulse of revenue, customers, demand and inventory health.")
    st.write("")

    # ----------------------------------------------------------------
    # Filters
    # ----------------------------------------------------------------
    with st.expander("🎛️  Filters", expanded=True):
        f1, f2, f3 = st.columns([2, 1.4, 1.4])
        min_d, max_d = tx["order_date"].min().date(), tx["order_date"].max().date()
        date_range = f1.date_input("Date range", value=(min_d, max_d),
                                   min_value=min_d, max_value=max_d)
        cats = f2.multiselect("Product category",
                              sorted(tx["category"].unique()))
        regions = f3.multiselect("Region", sorted(tx["region"].unique()))

    from utils.data_loader import filter_transactions
    ftx = filter_transactions(tx, date_range, cats or None, regions or None)
    if ftx.empty:
        st.warning("No transactions match the selected filters.")
        return

    # ----------------------------------------------------------------
    # KPI computation
    # ----------------------------------------------------------------
    total_rev = ftx["revenue"].sum()
    total_sales = int(ftx["quantity"].sum())
    total_customers = customers.shape[0]
    active_customers = int((customers["recency"] <= 60).sum())

    scored = ml_models.predict_churn(customers)
    churn_rate = float((scored["risk_band"] == "High").mean() * 100)

    fc = ml_models.forecast_demand(data["daily"], periods=30, metric="revenue")
    forecast_accuracy = fc["accuracy"]

    opt = ml_models.optimize_inventory(products)
    inv_health = ml_models.inventory_health_score(opt)

    # Month-over-month growth
    monthly = (ftx.set_index("order_date")["revenue"].resample("MS").sum())
    growth = 0.0
    if len(monthly) >= 2 and monthly.iloc[-2] > 0:
        growth = (monthly.iloc[-1] - monthly.iloc[-2]) / monthly.iloc[-2] * 100

    cards = [
        C.kpi_card("Total Revenue", C.human_number(total_rev, currency=True),
                   "💰", delta=growth),
        C.kpi_card("Total Sales (units)", C.human_number(total_sales), "🛒", delta=8.4),
        C.kpi_card("Total Customers", C.human_number(total_customers), "👥", delta=3.1),
        C.kpi_card("Active Customers", C.human_number(active_customers), "🟢",
                   delta=5.7),
        C.kpi_card("Churn Rate", f"{churn_rate:.1f}%", "⚠️", delta=-1.8),
        C.kpi_card("Forecast Accuracy", f"{forecast_accuracy:.1f}%", "🎯", delta=2.2),
        C.kpi_card("Inventory Health", f"{inv_health:.0f}/100", "📦", delta=4.0),
        C.kpi_card("Monthly Growth", f"{growth:+.1f}%", "📈", delta=growth),
    ]
    C.kpi_row(cards, per_row=4)
    st.write("")

    # ----------------------------------------------------------------
    # Trend charts
    # ----------------------------------------------------------------
    daily_f = (ftx.groupby("order_date")
               .agg(revenue=("revenue", "sum"), sales=("quantity", "sum"))
               .reset_index())

    c1, c2 = st.columns(2)
    with c1:
        C.section("Revenue Trend", "Daily revenue across the selected window", "💵")
        st.plotly_chart(charts.line_trend(daily_f, "order_date", "revenue", theme,
                                          color=theme["primary"]),
                        use_container_width=True)
    with c2:
        C.section("Sales Trend", "Daily units sold", "🛒")
        st.plotly_chart(charts.line_trend(daily_f, "order_date", "sales", theme,
                                          color=theme["accent"]),
                        use_container_width=True)

    c3, c4 = st.columns([1.4, 1])
    with c3:
        C.section("Monthly Performance", "Revenue & profit by month", "📅")
        mperf = (ftx.set_index("order_date")
                 .resample("MS").agg(revenue=("revenue", "sum"),
                                     profit=("profit", "sum"))
                 .reset_index())
        mperf["month"] = mperf["order_date"].dt.strftime("%b %Y")
        melt = mperf.melt(id_vars="month", value_vars=["revenue", "profit"],
                          var_name="metric", value_name="amount")
        st.plotly_chart(charts.grouped_bar(melt, "month", "amount", "metric", theme),
                        use_container_width=True)
    with c4:
        C.section("Product Category Analysis", "Revenue share by category", "🧩")
        cat = ftx.groupby("category")["revenue"].sum().reset_index()
        st.plotly_chart(charts.donut(cat["category"], cat["revenue"], theme),
                        use_container_width=True)

    C.section("Top Selling Products", "Ranked by total revenue", "🏆")
    top = (ftx.groupby("product")["revenue"].sum()
           .nlargest(10).reset_index().sort_values("revenue"))
    st.plotly_chart(charts.bar_ranking(top, "revenue", "product", theme,
                                       horizontal=True, height=400),
                    use_container_width=True)
