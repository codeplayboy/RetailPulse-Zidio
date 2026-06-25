"""
RetailPulse — AI-Powered Customer Analytics & Demand Forecasting Platform
========================================================================

Main Streamlit entry point. Provides:

- Global theme/CSS injection (light & dark mode toggle)
- Professional sidebar with brand, navigation, global search & notifications
- Session-state bootstrap (data bundle, settings)
- Routing to the seven dashboard pages

Run with:
    streamlit run app.py

Architecture note
-----------------
Pages are implemented as plain ``render(ctx)`` functions in ``pages/`` rather
than Streamlit's native multipage feature, giving full control over the custom
sidebar and shared application context (``ctx``). The data/ML layer in
``utils/`` is framework-agnostic and FastAPI-ready (pure functions over
DataFrames), so the same logic can back a REST API later.
"""

from __future__ import annotations

import streamlit as st

from views import (churn, forecasting, inventory, overview, reports,
                   segmentation, settings)
from utils import components as C
from utils import data_loader, styling

# ------------------------------------------------------------------
# Page config
# ------------------------------------------------------------------
st.set_page_config(
    page_title="RetailPulse — Analytics Platform",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

PAGES = {
    "Executive Overview": ("📈", overview),
    "Customer Segmentation": ("👥", segmentation),
    "Churn Prediction": ("⚠️", churn),
    "Demand Forecasting": ("🔮", forecasting),
    "Inventory Optimization": ("📦", inventory),
    "Analytics & Reports": ("📑", reports),
    "Settings": ("⚙️", settings),
}

DEFAULT_NOTIFICATIONS = [
    {"type": "critical", "title": "12 products at critical stock",
     "body": "Reorder recommended within 24h.", "read": False},
    {"type": "info", "title": "Forecast retrained",
     "body": "Demand model refreshed — MAPE 9.4%.", "read": False},
    {"type": "success", "title": "Revenue target met",
     "body": "Monthly revenue +18.2% vs last month.", "read": True},
    {"type": "low", "title": "47 customers entered 'At Risk'",
     "body": "Retention campaign suggested.", "read": False},
]


# ------------------------------------------------------------------
# Session bootstrap
# ------------------------------------------------------------------
def bootstrap_state() -> None:
    ss = st.session_state
    ss.setdefault("theme_mode", "dark")
    ss.setdefault("active_page", "Executive Overview")
    ss.setdefault("notifications", DEFAULT_NOTIFICATIONS)
    ss.setdefault("settings", {
        "forecast_horizon": 30,
        "kmeans_clusters": 5,
        "service_level": 0.95,
        "mape_target": 12,
        "currency": "USD",
        "email_alerts": True,
    })
    if "data" not in ss:
        with st.spinner("🚀 Booting RetailPulse — loading data & models…"):
            ss["data"] = data_loader.load_data()


# ------------------------------------------------------------------
# Sidebar
# ------------------------------------------------------------------
def render_sidebar() -> str:
    ss = st.session_state
    with st.sidebar:
        st.markdown(
            """
            <div class="rp-brand">
                <div class="logo">📊</div>
                <div>
                    <div class="title">RetailPulse</div>
                    <div class="subtitle">AI Analytics Platform</div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Global search
        query = st.text_input("🔍 Search", placeholder="Search customer, product, SKU…",
                              label_visibility="collapsed")
        if query:
            ss["search_query"] = query

        st.markdown("##### Navigation")
        labels = [f"{icon}  {name}" for name, (icon, _) in PAGES.items()]
        names = list(PAGES.keys())
        default_idx = names.index(ss.get("active_page", names[0]))
        choice = st.radio("nav", labels, index=default_idx,
                          label_visibility="collapsed")
        active = names[labels.index(choice)]
        ss["active_page"] = active

        st.divider()

        # Dark mode toggle
        dark = st.toggle("🌙 Dark Mode", value=(ss["theme_mode"] == "dark"))
        ss["theme_mode"] = "dark" if dark else "light"

        # Notifications
        C.notification_center(ss["notifications"])

        st.divider()
        st.caption("📍 Live demo data · v2.0 Industry Edition")
        st.caption("© 2026 Zidio Development")

        return active


# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
def main() -> None:
    bootstrap_state()
    # Inject CSS first so the sidebar renders themed.
    styling.inject_css(st.session_state["theme_mode"])
    active = render_sidebar()
    styling.inject_css(st.session_state["theme_mode"])  # re-assert after widgets

    # Shared context handed to every page.
    ctx = {
        "data": st.session_state["data"],
        "theme": styling.get_theme(st.session_state["theme_mode"]),
        "settings": st.session_state["settings"],
        "search": st.session_state.get("search_query", ""),
    }

    _, module = PAGES[active]
    module.render(ctx)


if __name__ == "__main__":
    main()
