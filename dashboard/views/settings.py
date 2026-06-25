"""
Page 7 — Settings
=================

Theme, model, forecast and notification preferences. Settings persist in
``st.session_state['settings']`` and feed directly into the analytics pages
(e.g. KMeans cluster count, forecast horizon, inventory service level).
"""

from __future__ import annotations

import streamlit as st

from utils import components as C


def render(ctx: dict) -> None:
    settings = ctx["settings"]

    C.hero("Settings", "Configure theme, models, forecasting and alerts.")
    st.write("")

    tab1, tab2, tab3, tab4 = st.tabs(
        ["🎨 Theme", "🤖 Model", "🔮 Forecast", "🔔 Notifications"])

    # ---------------- Theme ----------------
    with tab1:
        C.section("Theme Settings", "Appearance of the dashboard", "🎨")
        mode = st.radio("Color mode",
                        ["dark", "light"],
                        index=0 if st.session_state["theme_mode"] == "dark" else 1,
                        horizontal=True)
        st.session_state["theme_mode"] = mode
        st.caption("Tip: you can also toggle dark mode from the sidebar.")
        st.color_picker("Accent preview (visual only)", ctx["theme"]["primary"])

    # ---------------- Model ----------------
    with tab2:
        C.section("Model Settings", "Segmentation & churn parameters", "🤖")
        clusters = st.slider("KMeans clusters", 3, 8,
                             settings.get("kmeans_clusters", 5))
        sl = st.select_slider("Inventory service level",
                              options=[0.90, 0.95, 0.975, 0.99],
                              value=settings.get("service_level", 0.95),
                              format_func=lambda x: f"{x*100:.1f}%")
        settings["kmeans_clusters"] = clusters
        settings["service_level"] = sl
        st.info("Changing clusters re-runs segmentation on next visit to that page.")

    # ---------------- Forecast ----------------
    with tab3:
        C.section("Forecast Settings", "Default horizon & accuracy target", "🔮")
        horizon = st.selectbox("Default forecast horizon (days)",
                               [7, 30, 90, 180],
                               index=[7, 30, 90, 180].index(
                                   settings.get("forecast_horizon", 30)))
        mape = st.slider("MAPE target (%)", 5, 25, settings.get("mape_target", 12))
        settings["forecast_horizon"] = horizon
        settings["mape_target"] = mape
        st.caption("Acceptance criterion from spec: MAPE ≤ 12%.")

    # ---------------- Notifications ----------------
    with tab4:
        C.section("Notification Settings", "Alerts & digests", "🔔")
        settings["email_alerts"] = st.toggle(
            "Email alerts", value=settings.get("email_alerts", True))
        st.multiselect("Alert me about",
                       ["Critical stock", "Churn spikes", "Forecast drift",
                        "Revenue targets"],
                       default=["Critical stock", "Churn spikes"])
        st.text_input("Digest recipient", placeholder="ops@retailpulse.io")

    st.write("")
    if st.button("💾 Save Settings", type="primary"):
        st.session_state["settings"] = settings
        st.success("Settings saved for this session.")
        st.toast("✅ Settings updated", icon="✅")

    st.write("")
    with st.expander("ℹ️ About RetailPulse"):
        st.markdown(
            "**RetailPulse v2.0 — Industry Edition**  \n"
            "AI-Powered Customer Analytics & Demand Forecasting Platform.  \n"
            "Built with Streamlit · Pandas · NumPy · Plotly · Scikit-learn · Prophet.  \n"
            "© 2026 Zidio Development.")
