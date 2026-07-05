"""
RetailPulse - Feature Engineering Tests
Author: Rohinee

Run:
python tests/test_features.py
"""

import os
import pandas as pd
import numpy as np


FEATURE_FILE = "data/processed/features_data.csv"


def load_data():
    """Load feature dataset."""

    assert os.path.exists(FEATURE_FILE), \
        "features_data.csv not found"

    df = pd.read_csv(
        FEATURE_FILE,
        parse_dates=["InvoiceDate"]
    )

    return df


def test_file_exists():

    print("Checking feature dataset...")

    assert os.path.exists(FEATURE_FILE)

    print("✓ Feature dataset found")


def test_dataset_not_empty():

    df = load_data()

    assert len(df) > 0

    print("✓ Dataset is not empty")


def test_required_columns():

    df = load_data()

    required = [

        "Invoice",
        "InvoiceDate",
        "Customer ID",
        "StockCode",
        "Quantity",
        "Price",
        "TotalPrice",

        "Recency",
        "Frequency",
        "Monetary",

        "TotalItems",
        "AvgOrderValue",
        "PurchaseRate",

        "Year",
        "Month",
        "Quarter",
        "Week",
        "Day",

        "Lag1",
        "Lag7",

        "RollingMean7",
        "RollingStd7"

    ]

    missing = []

    for col in required:

        if col not in df.columns:

            missing.append(col)

    assert len(missing) == 0, \
        f"Missing Columns: {missing}"

    print("✓ Required Columns Present")


def test_rfm_positive():

    df = load_data()

    assert (df["Recency"] >= 0).all()

    assert (df["Frequency"] > 0).all()

    assert (df["Monetary"] > 0).all()

    print("✓ RFM Features Valid")


def test_purchase_rate():

    df = load_data()

    assert (df["PurchaseRate"] >= 0).all()

    print("✓ Purchase Rate Valid")


def test_total_items():

    df = load_data()

    assert (df["TotalItems"] > 0).all()

    print("✓ Total Items Valid")


def test_avg_order_value():

    df = load_data()

    assert (df["AvgOrderValue"] > 0).all()

    print("✓ Average Order Value Valid")


def test_date_columns():

    df = load_data()

    assert df["Year"].between(2009, 2011).all()

    assert df["Month"].between(1, 12).all()

    assert df["Quarter"].between(1, 4).all()

    assert df["Day"].between(1, 31).all()

    print("✓ Date Features Valid")


def test_lag_features():

    df = load_data()

    assert "Lag1" in df.columns

    assert "Lag7" in df.columns

    print("✓ Lag Features Created")


def test_rolling_features():

    df = load_data()

    assert "RollingMean7" in df.columns

    assert "RollingStd7" in df.columns

    print("✓ Rolling Features Created")


def test_total_price():

    df = load_data()

    calc = df["Quantity"] * df["Price"]

    assert np.allclose(

        calc,

        df["TotalPrice"],

        atol=0.01

    )

    print("✓ TotalPrice Correct")


def dataset_summary():

    df = load_data()

    print("\n========== FEATURE SUMMARY ==========")

    print(f"Rows      : {len(df):,}")

    print(f"Columns   : {len(df.columns)}")

    print(f"Customers : {df['Customer ID'].nunique():,}")

    print(f"Products  : {df['StockCode'].nunique():,}")

    print(f"Revenue   : £{df['TotalPrice'].sum():,.2f}")

    print("======================================")


if __name__ == "__main__":

    print("=" * 55)

    print("RetailPulse Feature Engineering Tests")

    print("=" * 55)

    test_file_exists()

    test_dataset_not_empty()

    test_required_columns()

    test_rfm_positive()

    test_purchase_rate()

    test_total_items()

    test_avg_order_value()

    test_date_columns()

    test_lag_features()

    test_rolling_features()

    test_total_price()

    dataset_summary()

    print("\n🎉 ALL FEATURE TESTS PASSED SUCCESSFULLY!")