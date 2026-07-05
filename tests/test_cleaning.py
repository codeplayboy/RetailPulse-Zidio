"""
RetailPulse - Test Data Cleaning
Author: Rohinee

Run:
python tests/test_cleaning.py
"""

import os
import pandas as pd


def test_cleaned_file_exists():

    print("Checking cleaned_data.csv...")

    assert os.path.exists(
        "data/processed/cleaned_data.csv"
    ), "cleaned_data.csv not found"

    print("✓ File Exists")


def test_no_missing_customer():

    df = pd.read_csv(
        "data/processed/cleaned_data.csv"
    )

    assert df["Customer ID"].isna().sum() == 0

    print("✓ No Missing Customer IDs")


def test_positive_quantity():

    df = pd.read_csv(
        "data/processed/cleaned_data.csv"
    )

    assert (df["Quantity"] > 0).all()

    print("✓ Quantity Valid")


def test_positive_price():

    df = pd.read_csv(
        "data/processed/cleaned_data.csv"
    )

    assert (df["Price"] > 0).all()

    print("✓ Price Valid")


def test_cancelled_orders_removed():

    df = pd.read_csv(
        "data/processed/cleaned_data.csv"
    )

    cancelled = df["Invoice"].astype(str).str.startswith("C").sum()

    assert cancelled == 0

    print("✓ Cancelled Orders Removed")


def test_total_price():

    df = pd.read_csv(
        "data/processed/cleaned_data.csv"
    )

    calc = df["Quantity"] * df["Price"]

    assert (
        calc.round(2) ==
        df["TotalPrice"].round(2)
    ).all()

    print("✓ TotalPrice Correct")


def test_duplicates_removed():

    df = pd.read_csv(
        "data/processed/cleaned_data.csv"
    )

    assert df.duplicated().sum() == 0

    print("✓ No Duplicate Rows")


def test_null_values():

    df = pd.read_csv(
        "data/processed/cleaned_data.csv"
    )

    print("\nMissing Values")

    print(df.isnull().sum())


def dataset_summary():

    df = pd.read_csv(
        "data/processed/cleaned_data.csv"
    )

    print("\n========== SUMMARY ==========")

    print("Rows :", len(df))

    print("Columns :", len(df.columns))

    print("Customers :", df["Customer ID"].nunique())

    print("Products :", df["StockCode"].nunique())

    print("Countries :", df["Country"].nunique())

    print("=============================\n")


if __name__ == "__main__":

    print("=" * 50)

    print("RetailPulse Data Cleaning Tests")

    print("=" * 50)

    test_cleaned_file_exists()

    test_no_missing_customer()

    test_positive_quantity()

    test_positive_price()

    test_cancelled_orders_removed()

    test_total_price()

    test_duplicates_removed()

    test_null_values()

    dataset_summary()

    print("All Cleaning Tests Passed Successfully ✅")