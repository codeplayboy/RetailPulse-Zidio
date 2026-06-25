"""
Page 2 — Customer Segmentation
==============================

RFM analysis + KMeans clustering with business-friendly segment labels,
cluster scatter, segment distribution, CLV and spending distributions,
plus an actionable customer-insights panel.
"""

from __future__ import annotations

import streamlit as st

from utils import charts
from utils import components as C
from utils import ml_models

SEGMENT_PLAYBOOK = {
    "Champions": ("🏅", "Reward them. Early access, referrals, VIP perks."),
    "Loyal Customers": ("💙", "Upsell premium tiers, ask for reviews."),
    "Potential Loyalists": ("🌱", "Membership offers & onboarding nudges."),
    "New Customers": ("✨", "Strong welcome journey, build the 2nd purchase."),
    "At Risk": ("⚠️", "Win-back discounts, reactivation emails."),
    "Lost Customers": ("💤", "Aggressive win-back or let churn gracefully."),
}


def render(ctx: dict) -> None:
    data, theme, settings = ctx["data"], ctx["theme"], ctx["settings"]
    customers = data["customers"]

    C.hero("Customer Segmentation",
           "RFM scoring & KMeans clustering to target the right customers.")
    st.write("")

    with C.loading("Scoring RFM & clustering customers…"):
        rfm = ml_models.compute_rfm(customers)
        n_clusters = settings.get("kmeans_clusters", 5)
        clustered = ml_models.run_kmeans(rfm, n_clusters=n_clusters)

    # KPIs
    champions = int((rfm["segment"] == "Champions").sum())
    at_risk = int((rfm["segment"] == "At Risk").sum())
    avg_clv = rfm["clv"].mean()
    avg_rfm = rfm["RFM_score"].mean()
    cards = [
        C.kpi_card("Total Customers", C.human_number(len(rfm)), "👥"),
        C.kpi_card("Champions", C.human_number(champions), "🏅", delta=4.5),
        C.kpi_card("At-Risk Customers", C.human_number(at_risk), "⚠️", delta=-2.1),
        C.kpi_card("Avg Customer LTV", C.human_number(avg_clv, currency=True), "💎"),
        C.kpi_card("Avg RFM Score", f"{avg_rfm:.1f} / 15", "🎯"),
    ]
    C.kpi_row(cards, per_row=5)
    st.write("")

    tab1, tab2, tab3 = st.tabs(["📊 Segments", "🔬 RFM Analysis", "🧠 Clusters"])

    # ---------------- Segments ----------------
    with tab1:
        c1, c2 = st.columns([1, 1.3])
        with c1:
            C.section("Segment Distribution", "Share of customer base", "🥧")
            seg_counts = rfm["segment"].value_counts().reset_index()
            seg_counts.columns = ["segment", "count"]
            st.plotly_chart(charts.donut(seg_counts["segment"], seg_counts["count"],
                                         theme, height=380),
                            use_container_width=True)
        with c2:
            C.section("Customer Lifetime Value by Segment", "Average CLV", "💎")
            clv = (rfm.groupby("segment")["clv"].mean()
                   .reset_index().sort_values("clv"))
            st.plotly_chart(charts.bar_ranking(clv, "clv", "segment", theme,
                                               horizontal=True, height=380),
                            use_container_width=True)

        C.section("Spending Distribution", "Monetary value across customers", "💸")
        st.plotly_chart(charts.histogram(rfm["monetary"], theme,
                                         color=theme["accent"]),
                        use_container_width=True)

    # ---------------- RFM ----------------
    with tab2:
        c1, c2, c3 = st.columns(3)
        c1.plotly_chart(charts.histogram(rfm["recency"], theme, "Recency (days)",
                                         color=theme["primary"]),
                        use_container_width=True)
        c2.plotly_chart(charts.histogram(rfm["frequency"], theme, "Frequency",
                                         color=theme["accent"]),
                        use_container_width=True)
        c3.plotly_chart(charts.histogram(rfm["monetary"], theme, "Monetary ($)",
                                         color=theme["success"]),
                        use_container_width=True)

        C.section("RFM Detail", "Per-customer scores (top 200 by CLV)", "📋")
        cols = ["customer_id", "recency", "frequency", "monetary",
                "R_score", "F_score", "M_score", "RFM_score", "segment", "clv"]
        st.dataframe(rfm.sort_values("clv", ascending=False)[cols].head(200),
                     use_container_width=True, height=360)

    # ---------------- Clusters ----------------
    with tab3:
        C.section("KMeans Cluster Scatter", "Recency vs Monetary, sized by frequency",
                  "🧠")
        st.plotly_chart(
            charts.scatter_clusters(clustered, "recency", "monetary",
                                    "cluster_label", theme, size="frequency",
                                    height=460),
            use_container_width=True)
        prof = (clustered.groupby("cluster_label")
                .agg(customers=("customer_id", "count"),
                     avg_recency=("recency", "mean"),
                     avg_frequency=("frequency", "mean"),
                     avg_monetary=("monetary", "mean"),
                     avg_clv=("clv", "mean")).round(1).reset_index())
        C.section("Cluster Profiles", "Centroid summary per cluster", "📐")
        st.dataframe(prof, use_container_width=True)

    # ---------------- Insights panel ----------------
    st.write("")
    C.section("💡 Customer Insights & Playbook", "Recommended actions per segment")
    for seg, (icon, advice) in SEGMENT_PLAYBOOK.items():
        n = int((rfm["segment"] == seg).sum())
        share = n / len(rfm) * 100
        with st.expander(f"{icon}  {seg} — {n:,} customers ({share:.1f}%)"):
            st.markdown(f"**Recommended action:** {advice}")
            sample = rfm[rfm["segment"] == seg].nlargest(5, "clv")[
                ["customer_id", "recency", "frequency", "monetary", "clv"]]
            st.dataframe(sample, use_container_width=True, hide_index=True)
