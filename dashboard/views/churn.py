"""
Page 3 — Churn Prediction
=========================

Churn risk scoring with risk bands, probability distribution, feature
importance, a top-at-risk customer table, and a rule-based retention
recommendation engine.
"""

from __future__ import annotations

import streamlit as st

from utils import charts
from utils import components as C
from utils import ml_models


def render(ctx: dict) -> None:
    data, theme = ctx["data"], ctx["theme"]
    customers = data["customers"]

    C.hero("Churn Prediction",
           "Identify at-risk customers early and act before they leave.")
    st.write("")

    with C.loading("Scoring churn probabilities…"):
        scored = ml_models.predict_churn(customers)
        importance = ml_models.churn_feature_importance(scored)

    high = scored[scored["risk_band"] == "High"]
    med = scored[scored["risk_band"] == "Medium"]
    low = scored[scored["risk_band"] == "Low"]
    revenue_at_risk = high["monetary"].sum()

    cards = [
        C.kpi_card("High Risk", C.human_number(len(high)), "🔴", delta=2.4),
        C.kpi_card("Medium Risk", C.human_number(len(med)), "🟠"),
        C.kpi_card("Low Risk", C.human_number(len(low)), "🟢", delta=-1.1),
        C.kpi_card("Revenue at Risk", C.human_number(revenue_at_risk, currency=True),
                   "💸"),
        C.kpi_card("Avg Churn Prob.", f"{scored['churn_probability'].mean()*100:.1f}%",
                   "📉"),
    ]
    C.kpi_row(cards, per_row=5)
    st.write("")

    c1, c2 = st.columns([1.3, 1])
    with c1:
        C.section("Churn Probability Distribution", "Across the customer base", "📊")
        st.plotly_chart(charts.histogram(scored["churn_probability"], theme,
                                         color=theme["danger"], nbins=30),
                        use_container_width=True)
    with c2:
        C.section("Risk Analysis", "Customers by risk band", "🎚️")
        band_counts = scored["risk_band"].value_counts().reset_index()
        band_counts.columns = ["band", "count"]
        st.plotly_chart(charts.donut(band_counts["band"], band_counts["count"], theme),
                        use_container_width=True)

    C.section("Feature Importance", "What drives churn (logistic model)", "🧬")
    imp_plot = importance.sort_values("importance")
    fig = charts.bar_ranking(imp_plot, "importance", "feature", theme,
                             horizontal=True, height=360)
    st.plotly_chart(fig, use_container_width=True)

    # ---------------- Retention engine ----------------
    st.write("")
    C.section("🎯 Retention Recommendation Engine",
              "Top customers likely to churn + suggested action")

    top_n = st.slider("How many at-risk customers to show", 10, 100, 25, step=5)
    at_risk = scored.sort_values("churn_probability", ascending=False).head(top_n).copy()
    at_risk["recommendation"] = at_risk["churn_probability"].apply(
        ml_models.retention_action)
    at_risk["churn_%"] = (at_risk["churn_probability"] * 100).round(1)

    show_cols = ["customer_id", "risk_band", "churn_%", "recency", "frequency",
                 "monetary", "satisfaction", "support_tickets", "recommendation"]
    st.dataframe(
        at_risk[show_cols],
        use_container_width=True, height=420, hide_index=True,
        column_config={
            "churn_%": st.column_config.ProgressColumn(
                "Churn %", min_value=0, max_value=100, format="%.1f%%"),
            "monetary": st.column_config.NumberColumn("Monetary", format="$%.0f"),
        },
    )

    # Action summary
    st.write("")
    a1, a2, a3 = st.columns(3)
    counts = at_risk["recommendation"].value_counts()
    with a1:
        C.card_open()
        st.markdown("### 💰 Offer Discount")
        st.markdown(f"**{counts.get('Offer Discount + Personal Outreach', 0)}** customers")
        st.caption("High-risk, high-value — direct outreach + incentive.")
        C.card_close()
    with a2:
        C.card_open()
        st.markdown("### 🎁 Loyalty Program")
        st.markdown(f"**{counts.get('Loyalty Program Enrollment', 0)}** customers")
        st.caption("Medium risk — nudge into rewards to rebuild habit.")
        C.card_close()
    with a3:
        C.card_open()
        st.markdown("### ✉️ Personalized Campaign")
        st.markdown(f"**{counts.get('Personalized Campaign', 0)}** customers")
        st.caption("Lower risk — targeted content keeps them engaged.")
        C.card_close()

    C.export_buttons(at_risk[show_cols], "churn_at_risk",
                     summary=f"Top {top_n} customers by churn probability.")
