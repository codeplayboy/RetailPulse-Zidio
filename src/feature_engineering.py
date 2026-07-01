"""
RetailPulse - Feature Engineering Module
Author: Rohinee

Description:
Generates customer and time-series features required for
Customer Segmentation, Churn Prediction and Demand Forecasting.
"""

import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings("ignore")


class FeatureEngineering:

    def __init__(self, file_path):

        self.file_path = file_path
        self.df = None

    def load_data(self):

        print("Loading cleaned dataset...")

        self.df = pd.read_csv(
            self.file_path,
            parse_dates=["InvoiceDate"]
        )

        return self.df

    def create_time_features(self):

        print("Creating Date Features...")

        self.df["Year"] = self.df["InvoiceDate"].dt.year
        self.df["Month"] = self.df["InvoiceDate"].dt.month
        self.df["Day"] = self.df["InvoiceDate"].dt.day
        self.df["Week"] = self.df["InvoiceDate"].dt.isocalendar().week.astype(int)
        self.df["Quarter"] = self.df["InvoiceDate"].dt.quarter
        self.df["DayOfWeek"] = self.df["InvoiceDate"].dt.day_name()
        self.df["Hour"] = self.df["InvoiceDate"].dt.hour

    def create_rfm_features(self):

        print("Generating RFM Features...")

        snapshot = self.df["InvoiceDate"].max() + pd.Timedelta(days=1)

        rfm = self.df.groupby("Customer_ID").agg(
            Recency=("InvoiceDate",
                     lambda x: (snapshot - x.max()).days),
            Frequency=("Invoice", "nunique"),
            Monetary=("TotalPrice", "sum")
        ).reset_index()

        self.df = self.df.merge(
            rfm,
            on="Customer_ID",
            how="left"
        )

    def create_customer_features(self):

        customer = self.df.groupby("Customer_ID").agg(

            TotalItems=("Quantity", "sum"),

            AvgOrderValue=("TotalPrice", "mean"),

            DaysSinceFirst=("InvoiceDate",
                            lambda x:
                            (x.max() - x.min()).days),

            PurchaseCount=("Invoice", "count")

        ).reset_index()

        customer["PurchaseRate"] = (
            customer["PurchaseCount"] /
            (customer["DaysSinceFirst"] + 1)
        )

        self.df = self.df.merge(
            customer,
            on="Customer_ID",
            how="left"
        )

    def create_sales_features(self):

        print("Creating Sales Features...")

        self.df.sort_values(
            "InvoiceDate",
            inplace=True
        )

        self.df["Lag_1"] = (
            self.df.groupby("StockCode")["Quantity"]
            .shift(1)
        )

        self.df["Lag_7"] = (
            self.df.groupby("StockCode")["Quantity"]
            .shift(7)
        )

        self.df["RollingMean7"] = (

            self.df.groupby("StockCode")["Quantity"]

            .transform(
                lambda x:
                x.rolling(7, min_periods=1).mean()
            )

        )

        self.df["RollingStd7"] = (

            self.df.groupby("StockCode")["Quantity"]

            .transform(
                lambda x:
                x.rolling(7, min_periods=1).std()
            )

        )

    def create_business_metrics(self):

        self.df["ProfitEstimate"] = (
            self.df["TotalPrice"] * 0.30
        )

        self.df["InvoiceMonth"] = (
            self.df["InvoiceDate"]
            .dt.to_period("M")
            .astype(str)
        )

    def fill_missing_values(self):

        numeric = self.df.select_dtypes(include=np.number).columns

        self.df[numeric] = (
            self.df[numeric]
            .fillna(0)
        )

    def summary(self):

        print("\nFeature Dataset Summary")

        print("-----------------------------")

        print(self.df.shape)

        print(self.df.columns.tolist())

        print("-----------------------------")

    def save(self):

        self.df.to_csv(

            "data/processed/features_data.csv",

            index=False

        )

        print("\nfeatures_data.csv Saved Successfully")

    def run(self):

        self.load_data()

        self.create_time_features()

        self.create_rfm_features()

        self.create_customer_features()

        self.create_sales_features()

        self.create_business_metrics()

        self.fill_missing_values()

        self.summary()

        self.save()

        return self.df


if __name__ == "__main__":

    feature = FeatureEngineering(

        "data/processed/cleaned_data.csv"

    )

    df = feature.run()

    print(df.head())