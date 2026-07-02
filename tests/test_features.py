"""
RetailPulse - Feature Engineering Validation
Author: Rohinee
Integration update: Rashad Roushan

Run:
python -m pytest tests/test_features.py -q
"""

import os

import numpy as np
import pandas as pd


FULL_FEATURE_FILE = "data/processed/features_data.csv"
SAMPLE_FEATURE_FILE = "data/processed/features_data_sample.csv"
CUSTOMER_ID_COLUMN = "Customer_ID"
LAG_1_COLUMN = "Lag_1"
LAG_7_COLUMN = "Lag_7"


def feature_file_path() -> str:
    """Use the full feature file when available, otherwise validate the repo-safe sample."""
    if os.path.exists(FULL_FEATURE_FILE):
        return FULL_FEATURE_FILE
    return SAMPLE_FEATURE_FILE


def load_data() -> pd.DataFrame:
    """Load the available standardized feature dataset."""
    path = feature_file_path()
    assert os.path.exists(path), f"Feature dataset not found: {path}"
    return pd.read_csv(path, parse_dates=["InvoiceDate"])


def test_file_exists():
    path = feature_file_path()
    print(f"Checking feature dataset: {path}")
    assert os.path.exists(path)
    print("[OK] Feature dataset found")


def test_dataset_not_empty():
    df = load_data()
    assert len(df) > 0
    print("[OK] Dataset is not empty")


def test_required_columns():
    df = load_data()
    required = [
        "Invoice",
        "InvoiceDate",
        CUSTOMER_ID_COLUMN,
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
        LAG_1_COLUMN,
        LAG_7_COLUMN,
        "RollingMean7",
        "RollingStd7",
    ]
    missing = [column for column in required if column not in df.columns]
    assert not missing, f"Missing columns: {missing}"
    print("[OK] Required columns present")


def test_rfm_positive():
    df = load_data()
    assert (df["Recency"] >= 0).all()
    assert (df["Frequency"] > 0).all()
    assert (df["Monetary"] > 0).all()
    print("[OK] RFM features valid")


def test_purchase_rate():
    df = load_data()
    assert (df["PurchaseRate"] >= 0).all()
    print("[OK] Purchase rate valid")


def test_total_items():
    df = load_data()
    assert (df["TotalItems"] > 0).all()
    print("[OK] Total items valid")


def test_avg_order_value():
    df = load_data()
    assert (df["AvgOrderValue"] > 0).all()
    print("[OK] Average order value valid")


def test_date_columns():
    df = load_data()
    assert df["Year"].between(2009, 2011).all()
    assert df["Month"].between(1, 12).all()
    assert df["Quarter"].between(1, 4).all()
    assert df["Day"].between(1, 31).all()
    print("[OK] Date features valid")


def test_lag_features():
    df = load_data()
    assert LAG_1_COLUMN in df.columns
    assert LAG_7_COLUMN in df.columns
    print("[OK] Lag features created")


def test_rolling_features():
    df = load_data()
    assert "RollingMean7" in df.columns
    assert "RollingStd7" in df.columns
    print("[OK] Rolling features created")


def test_total_price():
    df = load_data()
    calc = df["Quantity"] * df["Price"]
    assert np.allclose(calc, df["TotalPrice"], atol=0.01)
    print("[OK] TotalPrice correct")


def dataset_summary():
    df = load_data()
    print("\n========== FEATURE SUMMARY ==========")
    print(f"Source    : {feature_file_path()}")
    print(f"Rows      : {len(df):,}")
    print(f"Columns   : {len(df.columns)}")
    print(f"Customers : {df[CUSTOMER_ID_COLUMN].nunique():,}")
    print(f"Products  : {df['StockCode'].nunique():,}")
    print(f"Revenue   : {df['TotalPrice'].sum():,.2f}")
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
    print("\nAll feature tests passed successfully")
