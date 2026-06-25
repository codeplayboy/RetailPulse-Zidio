"""
Page 5 — Inventory Optimization
===============================

Reorder-point / safety-stock recommendations, over/under-stock detection,
stock-level charts, a category×status heatmap, an inventory health gauge,
and colour-coded stock alerts.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from utils import charts
from utils import components as C
from utils import ml_models

STATUS_COLOR = {"Critical": "red", "Low": "amber",
                "Healthy": "green", "Overstock": "blue"}


def render(ctx: dict) -> None:
    data, theme, settings = ctx["data"], ctx["theme"], ctx["settings"]
    products = data["products"]

    C.hero("Inventory Optimization",
           "Right stock, right place, right time — minimise stockouts & overstock.")
    st.write("")

    # Service-level z from settings (default 95% -> 1.65)
    sl = settings.get("service_level", 0.95)
    z = {0.90: 1.28, 0.95: 1.65, 0.975: 1.96, 0.99: 2.33}.get(round(sl, 3), 1.65)

    with C.loading("Optimizing inventory policy…"):
        opt = ml_models.optimize_inventory(products, service_level_z=z)
        health = ml_models.inventory_health_score(opt)

    critical = opt[opt["stock_status"] == "Critical"]
    low = opt[opt["stock_status"] == "Low"]
    over = opt[opt["stock_status"] == "Overstock"]
    healthy = opt[opt["stock_status"] == "Healthy"]
    total_reorder = int(opt["reorder_qty"].sum())

    cards = [
        C.kpi_card("SKUs Tracked", C.human_number(len(opt)), "📦"),
        C.kpi_card("Critical Stock", C.human_number(len(critical)), "🔴", delta=-3.0),
        C.kpi_card("Understock (Low)", C.human_number(len(low)), "🟠"),
        C.kpi_card("Overstock", C.human_number(len(over)), "🔵"),
        C.kpi_card("Units to Reorder", C.human_number(total_reorder), "🔁"),
    ]
    C.kpi_row(cards, per_row=5)
    st.write("")

    # ---------------- Health gauge + alerts ----------------
    c1, c2 = st.columns([1, 1.4])
    with c1:
        C.section("Inventory Health", "Weighted across all SKUs", "❤️")
        st.plotly_chart(charts.gauge(health, theme, "Inventory Health Score"),
                        use_container_width=True)
    with c2:
        C.section("Stock Alerts", "Items needing attention now", "🚨")
        if len(critical):
            C.alert("critical", f"{len(critical)} products at CRITICAL stock — reorder now")
        if len(low):
            C.alert("low", f"{len(low)} products LOW — schedule replenishment")
        C.alert("healthy", f"{len(healthy)} products at healthy levels")
        if len(over):
            C.alert("info", f"{len(over)} products OVERSTOCKED — consider promotions")
        st.write("")
        st.markdown("**Top critical SKUs**")
        st.dataframe(
            critical.nsmallest(8, "days_of_cover")[
                ["product", "category", "current_stock", "reorder_point",
                 "days_of_cover", "reorder_qty"]],
            use_container_width=True, hide_index=True)

    # ---------------- Charts ----------------
    c3, c4 = st.columns(2)
    with c3:
        C.section("Stock Levels vs Reorder Point", "Lowest days-of-cover SKUs", "📉")
        worst = opt.nsmallest(12, "days_of_cover").sort_values("current_stock")
        melt = worst.melt(id_vars="product",
                          value_vars=["current_stock", "reorder_point", "safety_stock"],
                          var_name="metric", value_name="units")
        st.plotly_chart(charts.grouped_bar(melt, "product", "units", "metric", theme,
                                           height=380),
                        use_container_width=True)
    with c4:
        C.section("Stock Status Mix", "Distribution of SKU health", "🧩")
        mix = opt["stock_status"].value_counts().reset_index()
        mix.columns = ["status", "count"]
        st.plotly_chart(charts.donut(mix["status"], mix["count"], theme, height=380),
                        use_container_width=True)

    C.section("Product Stock Heatmap", "Average days-of-cover by category & status",
              "🌡️")
    pivot = (opt.pivot_table(index="category", columns="stock_status",
                             values="days_of_cover", aggfunc="mean")
             .fillna(0).round(1))
    st.plotly_chart(charts.heatmap(pivot, theme, height=380, colorscale="Blues"),
                    use_container_width=True)

    # ---------------- Recommendations table ----------------
    st.write("")
    C.section("📋 Inventory Recommendations", "Suggested reorder plan")
    only_reorder = st.checkbox("Show only SKUs needing reorder", value=True)
    table = opt[opt["reorder_qty"] > 0] if only_reorder else opt
    cols = ["product_id", "product", "category", "current_stock", "avg_daily_demand",
            "lead_time_days", "safety_stock", "reorder_point", "reorder_qty",
            "days_of_cover", "stock_status"]
    st.dataframe(
        table.sort_values("days_of_cover")[cols],
        use_container_width=True, height=400, hide_index=True,
        column_config={
            "stock_status": st.column_config.TextColumn("Status"),
            "reorder_qty": st.column_config.NumberColumn("Reorder Qty"),
        },
    )
    C.export_buttons(table[cols], "inventory_recommendations",
                     summary=f"Inventory health {health}/100 • "
                             f"{int((opt['reorder_qty']>0).sum())} SKUs need reorder.")
