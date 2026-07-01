"""
RetailPulse - Data Cleaning Module
Author: Rohinee

Description:
This module loads the Online Retail II dataset, cleans the data,
creates TotalPrice, and exports cleaned_data.csv.
"""

import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings("ignore")


class DataCleaning:

    def __init__(self, file_path):
        self.file_path = file_path
        self.df = None

    def load_dataset(self):
        """
        Load both sheets from Online Retail II dataset.
        """

        print("Loading Dataset...")

        df1 = pd.read_excel(
            self.file_path,
            sheet_name="Year 2009-2010"
        )

        df2 = pd.read_excel(
            self.file_path,
            sheet_name="Year 2010-2011"
        )

        self.df = pd.concat([df1, df2], ignore_index=True)

        print(f"Dataset Loaded Successfully")
        print(f"Rows : {self.df.shape[0]}")
        print(f"Columns : {self.df.shape[1]}")

        return self.df

    def standardize_columns(self):

        self.df.columns = [
            col.strip().replace(" ", "_")
            for col in self.df.columns
        ]

        return self.df

    def convert_datatypes(self):

        self.df["InvoiceDate"] = pd.to_datetime(
            self.df["InvoiceDate"]
        )

        self.df["Customer_ID"] = (
            self.df["Customer_ID"]
            .astype("Int64")
        )

        return self.df

    def remove_duplicates(self):

        before = len(self.df)

        self.df.drop_duplicates(inplace=True)

        after = len(self.df)

        print(f"Duplicates Removed : {before-after}")

        return self.df

    def remove_missing_customer(self):

        before = len(self.df)

        self.df = self.df[
            self.df["Customer_ID"].notna()
        ]

        after = len(self.df)

        print(f"Rows Removed (Customer ID Missing): {before-after}")

        return self.df

    def remove_cancelled_orders(self):

        before = len(self.df)

        self.df = self.df[
            ~self.df["Invoice"].astype(str).str.startswith("C")
        ]

        after = len(self.df)

        print(f"Cancelled Orders Removed : {before-after}")

        return self.df

    def remove_invalid_quantity(self):

        before = len(self.df)

        self.df = self.df[
            self.df["Quantity"] > 0
        ]

        after = len(self.df)

        print(f"Invalid Quantity Removed : {before-after}")

        return self.df

    def remove_invalid_price(self):

        before = len(self.df)

        self.df = self.df[
            self.df["Price"] > 0
        ]

        after = len(self.df)

        print(f"Invalid Price Removed : {before-after}")

        return self.df

    def create_total_price(self):

        self.df["TotalPrice"] = (
            self.df["Quantity"] *
            self.df["Price"]
        )

        return self.df

    def check_null_values(self):

        print("\nNull Values")

        print(self.df.isnull().sum())

    def dataset_summary(self):

        print("\n========== DATASET SUMMARY ==========")

        print(f"Rows : {self.df.shape[0]}")
        print(f"Columns : {self.df.shape[1]}")

        print(f"Customers : {self.df['Customer_ID'].nunique()}")

        print(f"Products : {self.df['StockCode'].nunique()}")

        print(f"Countries : {self.df['Country'].nunique()}")

        print(
            f"Date Range : "
            f"{self.df['InvoiceDate'].min()} "
            f"to "
            f"{self.df['InvoiceDate'].max()}"
        )

        print("====================================")

    def save_dataset(
            self,
            output_path="data/processed/cleaned_data.csv"
    ):

        self.df.to_csv(output_path, index=False)

        print(f"\nSaved Successfully")

        print(output_path)

    def clean(self):

        self.load_dataset()

        self.standardize_columns()

        self.convert_datatypes()

        self.remove_duplicates()

        self.remove_missing_customer()

        self.remove_cancelled_orders()

        self.remove_invalid_quantity()

        self.remove_invalid_price()

        self.create_total_price()

        self.check_null_values()

        self.dataset_summary()

        self.save_dataset()

        return self.df


if __name__ == "__main__":

    cleaner = DataCleaning(
        "data/raw/online_retail_II.xlsx"
    )

    cleaned_df = cleaner.clean()

    print("\nFirst Five Rows")

    print(cleaned_df.head())