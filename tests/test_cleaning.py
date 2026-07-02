"""
RetailPulse - Data Cleaning Validation
Author: Rohinee
Integration update: Rashad Roushan

Run:
python -m pytest tests/test_cleaning.py -q
"""

import os

import pandas as pd


CLEANED_FILE = "data/processed/cleaned_data.csv"
CUSTOMER_ID_COLUMN = "Customer_ID"


def load_cleaned_data() -> pd.DataFrame:
    """Load the standardized cleaned dataset used by the dashboard."""
    assert os.path.exists(CLEANED_FILE), "cleaned_data.csv not found"
    return pd.read_csv(CLEANED_FILE)


def test_cleaned_file_exists():
    print("Checking cleaned_data.csv...")
    assert os.path.exists(CLEANED_FILE), "cleaned_data.csv not found"
    print("[OK] File exists")


def test_required_cleaned_columns():
    df = load_cleaned_data()
    required = [
        "Invoice",
        "StockCode",
        "Description",
        "Quantity",
        "InvoiceDate",
        "Price",
        CUSTOMER_ID_COLUMN,
        "Country",
        "TotalPrice",
    ]
    missing = [column for column in required if column not in df.columns]
    assert not missing, f"Missing cleaned dataset columns: {missing}"


def test_no_missing_customer():
    df = load_cleaned_data()
    assert df[CUSTOMER_ID_COLUMN].isna().sum() == 0
    print("[OK] No missing customer IDs")


def test_positive_quantity():
    df = load_cleaned_data()
    assert (df["Quantity"] > 0).all()
    print("[OK] Quantity valid")


def test_positive_price():
    df = load_cleaned_data()
    assert (df["Price"] > 0).all()
    print("[OK] Price valid")


def test_cancelled_orders_removed():
    df = load_cleaned_data()
    cancelled = df["Invoice"].astype(str).str.startswith("C").sum()
    assert cancelled == 0
    print("[OK] Cancelled orders removed")


def test_total_price():
    df = load_cleaned_data()
    calc = df["Quantity"] * df["Price"]
    assert (calc.round(2) == df["TotalPrice"].round(2)).all()
    print("[OK] TotalPrice correct")


def test_duplicates_removed():
    df = load_cleaned_data()
    assert df.duplicated().sum() == 0
    print("[OK] No duplicate rows")


def test_no_nulls_in_required_business_columns():
    df = load_cleaned_data()
    required = ["Invoice", "StockCode", "Quantity", "InvoiceDate", "Price", CUSTOMER_ID_COLUMN, "TotalPrice"]
    assert df[required].isnull().sum().sum() == 0


def dataset_summary():
    df = load_cleaned_data()
    print("\n========== SUMMARY ==========")
    print("Rows :", len(df))
    print("Columns :", len(df.columns))
    print("Customers :", df[CUSTOMER_ID_COLUMN].nunique())
    print("Products :", df["StockCode"].nunique())
    print("Countries :", df["Country"].nunique())
    print("=============================\n")


if __name__ == "__main__":
    print("=" * 50)
    print("RetailPulse Data Cleaning Tests")
    print("=" * 50)
    test_cleaned_file_exists()
    test_required_cleaned_columns()
    test_no_missing_customer()
    test_positive_quantity()
    test_positive_price()
    test_cancelled_orders_removed()
    test_total_price()
    test_duplicates_removed()
    test_no_nulls_in_required_business_columns()
    dataset_summary()
    print("All cleaning tests passed successfully")
