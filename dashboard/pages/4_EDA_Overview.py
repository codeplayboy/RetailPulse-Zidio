"""
RetailPulse Dashboard
Page 4 - EDA Overview
Author: Rohinee
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(
    page_title="EDA Overview",
    page_icon="📊",
    layout="wide"
)

@st.cache_data
def load_data():
    return pd.read_csv(
        "data/processed/features_data.csv",
        parse_dates=["InvoiceDate"]
    )

df = load_data()

st.title("📊 Exploratory Data Analysis Dashboard")
st.markdown("Business insights generated from the Online Retail II dataset.")

st.markdown("---")

# ===========================
# KPI CARDS
# ===========================

total_sales = df["TotalPrice"].sum()
total_orders = df["Invoice"].nunique()
total_customers = df["Customer ID"].nunique()
total_products = df["StockCode"].nunique()

c1, c2, c3, c4 = st.columns(4)

c1.metric("💰 Total Revenue", f"£{total_sales:,.2f}")
c2.metric("🧾 Orders", f"{total_orders:,}")
c3.metric("👥 Customers", f"{total_customers:,}")
c4.metric("📦 Products", f"{total_products:,}")

st.markdown("---")

# ===========================
# DAILY SALES
# ===========================

daily = (
    df.groupby(df["InvoiceDate"].dt.date)["TotalPrice"]
    .sum()
    .reset_index()
)

daily.columns = ["Date", "Revenue"]

fig = px.line(
    daily,
    x="Date",
    y="Revenue",
    title="Daily Sales Trend"
)

st.plotly_chart(fig, use_container_width=True)

# ===========================
# MONTHLY SALES
# ===========================

monthly = (
    df.groupby(df["InvoiceDate"].dt.to_period("M"))["TotalPrice"]
    .sum()
    .reset_index()
)

monthly["InvoiceDate"] = monthly["InvoiceDate"].astype(str)

fig = px.bar(
    monthly,
    x="InvoiceDate",
    y="TotalPrice",
    title="Monthly Revenue"
)

st.plotly_chart(fig, use_container_width=True)

# ===========================
# TOP PRODUCTS
# ===========================

col1, col2 = st.columns(2)

with col1:

    products = (
        df.groupby("Description")["Quantity"]
        .sum()
        .sort_values(ascending=False)
        .head(10)
        .reset_index()
    )

    fig = px.bar(
        products,
        x="Quantity",
        y="Description",
        orientation="h",
        title="Top Selling Products"
    )

    st.plotly_chart(fig, use_container_width=True)

with col2:

    customers = (
        df.groupby("Customer ID")["TotalPrice"]
        .sum()
        .sort_values(ascending=False)
        .head(10)
        .reset_index()
    )

    fig = px.bar(
        customers,
        x="TotalPrice",
        y="Customer ID",
        orientation="h",
        title="Top Customers"
    )

    st.plotly_chart(fig, use_container_width=True)

st.markdown("---")

# ===========================
# COUNTRY SALES
# ===========================

country = (
    df.groupby("Country")["TotalPrice"]
    .sum()
    .sort_values(ascending=False)
    .head(10)
    .reset_index()
)

fig = px.pie(
    country,
    values="TotalPrice",
    names="Country",
    hole=0.45,
    title="Revenue by Country"
)

st.plotly_chart(fig, use_container_width=True)

# ===========================
# SALES BY WEEKDAY
# ===========================

order = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
]

weekday = (
    df.groupby("DayOfWeek")["TotalPrice"]
    .sum()
    .reindex(order)
    .reset_index()
)

fig = px.bar(
    weekday,
    x="DayOfWeek",
    y="TotalPrice",
    title="Sales by Day of Week"
)

st.plotly_chart(fig, use_container_width=True)

# ===========================
# REVENUE DISTRIBUTION
# ===========================

fig = px.histogram(
    df,
    x="TotalPrice",
    nbins=50,
    title="Revenue Distribution"
)

st.plotly_chart(fig, use_container_width=True)

# ===========================
# TOP 20 RECORDS
# ===========================

st.subheader("Dataset Preview")

show_cols = [
    "Invoice",
    "InvoiceDate",
    "Customer ID",
    "Description",
    "Quantity",
    "Price",
    "TotalPrice",
    "Country"
]

show_cols = [c for c in show_cols if c in df.columns]

st.dataframe(
    df[show_cols].head(20),
    use_container_width=True
)

# ===========================
# DOWNLOAD
# ===========================

csv = df.to_csv(index=False)

st.download_button(
    "⬇ Download Feature Dataset",
    csv,
    "features_data.csv",
    "text/csv"
)

# ===========================
# BUSINESS INSIGHTS
# ===========================

st.markdown("---")

st.subheader("📌 Business Insights")

st.success(
"""
• A few products generate the highest sales.

• A small percentage of customers contribute most revenue.

• Sales vary considerably across months, indicating seasonal demand.

• The United Kingdom contributes the majority of revenue.

• Daily sales trends show periods of high demand that can support forecasting.

• These insights are useful for customer segmentation, demand forecasting,
inventory optimization, and churn prediction.
"""
)