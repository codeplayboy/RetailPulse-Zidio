"""
RetailPulse :: Data Loader
==========================

Generates a realistic, deterministic synthetic retail dataset so the
dashboard is fully functional out-of-the-box (no external data needed).

If real CSVs are dropped into ``RetailPulse/data/`` with the expected
schema, :func:`load_data` will prefer them automatically.

The generated bundle contains four cached DataFrames:

- ``transactions`` : line-level sales (date, customer, product, qty, revenue …)
- ``customers``    : one row per customer with RFM-ready aggregates
- ``products``     : product master + inventory levels
- ``daily``        : daily revenue/sales time-series (for forecasting)

All generation is seeded for reproducibility and cached with
``st.cache_data`` so it only runs once per session.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import streamlit as st

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
SEED = 42

REGIONS = ["North", "South", "East", "West", "Central"]
CATEGORIES = {
    "Electronics": ["Smartphone", "Laptop", "Headphones", "Smartwatch", "Tablet"],
    "Apparel": ["T-Shirt", "Jeans", "Jacket", "Sneakers", "Dress"],
    "Home & Kitchen": ["Blender", "Cookware Set", "Vacuum", "Coffee Maker", "Lamp"],
    "Groceries": ["Coffee Beans", "Olive Oil", "Pasta", "Cereal", "Snack Box"],
    "Beauty": ["Perfume", "Serum", "Lipstick", "Shampoo", "Face Cream"],
}


# ------------------------------------------------------------------
# Generation helpers
# ------------------------------------------------------------------
def _build_products(rng: np.random.Generator) -> pd.DataFrame:
    rows = []
    pid = 1000
    for category, items in CATEGORIES.items():
        for name in items:
            pid += 1
            base_price = float(rng.uniform(8, 1200))
            rows.append(
                {
                    "product_id": f"P{pid}",
                    "product": name,
                    "category": category,
                    "unit_price": round(base_price, 2),
                    "unit_cost": round(base_price * rng.uniform(0.45, 0.72), 2),
                    "popularity": float(rng.uniform(0.2, 1.0)),
                }
            )
    df = pd.DataFrame(rows)

    # Inventory state
    df["current_stock"] = rng.integers(0, 600, len(df))
    df["avg_daily_demand"] = (df["popularity"] * rng.uniform(2, 40, len(df))).round(1)
    df["lead_time_days"] = rng.integers(2, 14, len(df))
    return df


def _build_transactions(rng: np.random.Generator, products: pd.DataFrame,
                        n_customers: int, days: int) -> pd.DataFrame:
    end = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)
    start = end - timedelta(days=days)
    date_range = pd.date_range(start, end, freq="D")

    # Seasonality: weekly + yearly + upward trend + noise
    t = np.arange(len(date_range))
    weekly = 1 + 0.18 * np.sin(2 * np.pi * t / 7)
    yearly = 1 + 0.25 * np.sin(2 * np.pi * t / 365.25)
    trend = 1 + 0.0009 * t
    holiday_boost = np.where((date_range.month == 12) | (date_range.month == 11), 1.35, 1.0)
    intensity = weekly * yearly * trend * holiday_boost

    prob = products["popularity"].to_numpy()
    prob = prob / prob.sum()

    customer_ids = np.array([f"C{i:05d}" for i in range(1, n_customers + 1)])
    # Customer activity skew (some buy a lot, most occasionally)
    cust_weight = rng.power(0.6, n_customers)
    cust_weight /= cust_weight.sum()

    records = []
    base_daily_orders = 35
    for day_idx, day in enumerate(date_range):
        n_orders = max(5, int(rng.poisson(base_daily_orders * intensity[day_idx])))
        prod_idx = rng.choice(len(products), size=n_orders, p=prob)
        cust_idx = rng.choice(n_customers, size=n_orders, p=cust_weight)
        for pi, ci in zip(prod_idx, cust_idx):
            prod = products.iloc[pi]
            qty = int(rng.integers(1, 6))
            discount = float(rng.choice([0, 0, 0, 0.05, 0.1, 0.15]))
            revenue = round(prod["unit_price"] * qty * (1 - discount), 2)
            records.append(
                {
                    "order_date": day,
                    "customer_id": customer_ids[ci],
                    "product_id": prod["product_id"],
                    "product": prod["product"],
                    "category": prod["category"],
                    "region": REGIONS[ci % len(REGIONS)],
                    "quantity": qty,
                    "discount": discount,
                    "revenue": revenue,
                    "cost": round(prod["unit_cost"] * qty, 2),
                }
            )
    df = pd.DataFrame.from_records(records)
    df["profit"] = (df["revenue"] - df["cost"]).round(2)
    return df


def _build_customers(rng: np.random.Generator, tx: pd.DataFrame) -> pd.DataFrame:
    today = tx["order_date"].max() + pd.Timedelta(days=1)
    grp = tx.groupby("customer_id")
    cust = grp.agg(
        first_purchase=("order_date", "min"),
        last_purchase=("order_date", "max"),
        frequency=("order_date", "nunique"),
        total_orders=("revenue", "size"),
        monetary=("revenue", "sum"),
        avg_order_value=("revenue", "mean"),
        total_qty=("quantity", "sum"),
    ).reset_index()

    cust["recency"] = (today - cust["last_purchase"]).dt.days
    cust["tenure_days"] = (today - cust["first_purchase"]).dt.days
    cust["monetary"] = cust["monetary"].round(2)
    cust["avg_order_value"] = cust["avg_order_value"].round(2)

    # Synthetic engagement features used by the churn model
    cust["support_tickets"] = rng.integers(0, 6, len(cust))
    cust["satisfaction"] = np.clip(rng.normal(3.9, 0.8, len(cust)), 1, 5).round(1)
    cust["days_since_login"] = (cust["recency"] * rng.uniform(0.6, 1.2, len(cust))).round().astype(int)
    cust["email_open_rate"] = np.clip(rng.normal(0.42, 0.2, len(cust)), 0, 1).round(2)

    # Customer Lifetime Value (simple predictive proxy)
    cust["clv"] = (
        cust["avg_order_value"] * cust["frequency"] * (cust["tenure_days"] / 30 + 1) ** 0.3
    ).round(2)
    return cust


# ------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def generate_dataset(n_customers: int = 300, days: int = 180) -> dict[str, pd.DataFrame]:
    """Generate (and cache) the full synthetic retail bundle."""
    rng = np.random.default_rng(SEED)
    products = _build_products(rng)
    tx = _build_transactions(rng, products, n_customers, days)
    customers = _build_customers(rng, tx)

    # Daily aggregate time-series for forecasting
    daily = (
        tx.groupby("order_date")
        .agg(revenue=("revenue", "sum"), sales=("quantity", "sum"),
             orders=("revenue", "size"), profit=("profit", "sum"))
        .reset_index()
        .rename(columns={"order_date": "date"})
        .sort_values("date")
        .reset_index(drop=True)
    )
    return {"transactions": tx, "customers": customers,
            "products": products, "daily": daily}


@st.cache_data(show_spinner=False)
def load_data() -> dict[str, pd.DataFrame]:
    """Load real CSVs from ``data/`` if present, else generate synthetic data."""
    files = {
        "transactions": "transactions.csv",
        "customers": "customers.csv",
        "products": "products.csv",
        "daily": "daily.csv",
    }
    if all(os.path.exists(os.path.join(DATA_DIR, f)) for f in files.values()):
        out = {}
        for key, fname in files.items():
            df = pd.read_csv(os.path.join(DATA_DIR, fname))
            for col in df.columns:
                if "date" in col or "purchase" in col:
                    try:
                        df[col] = pd.to_datetime(df[col])
                    except (ValueError, TypeError):
                        pass  # leave column untouched if not parseable
            out[key] = df
        return out
    return generate_dataset()


# ------------------------------------------------------------------
# Filtering helpers (used by Executive Overview & Reports)
# ------------------------------------------------------------------
def filter_transactions(tx: pd.DataFrame, date_range=None,
                        categories=None, regions=None) -> pd.DataFrame:
    """Apply optional date / category / region filters to transactions."""
    out = tx
    if date_range and len(date_range) == 2:
        start, end = pd.to_datetime(date_range[0]), pd.to_datetime(date_range[1])
        out = out[(out["order_date"] >= start) & (out["order_date"] <= end)]
    if categories:
        out = out[out["category"].isin(categories)]
    if regions:
        out = out[out["region"].isin(regions)]
    return out
