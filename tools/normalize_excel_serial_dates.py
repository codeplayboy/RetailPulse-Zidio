from __future__ import annotations

from pathlib import Path

import pandas as pd


ROOT = Path(r"C:\Users\rasha\Downloads\RetailPulse\RetailPulse-Zidio")
FILES = [
    ROOT / "data/processed/cleaned_data.csv",
    ROOT / "data/processed/features_data_sample.csv",
    ROOT / "dashboard/public/data/features_data_sample.csv",
]


def looks_like_epoch_serial(series: pd.Series) -> bool:
    sample = series.dropna().astype(str).head(25)
    return not sample.empty and sample.str.startswith("1970-01-01 00:00:00.0000").all()


def convert_epoch_serial_to_excel_date(series: pd.Series) -> pd.Series:
    parsed = pd.to_datetime(series, errors="coerce")
    # The broken files contain Excel serial day numbers interpreted as
    # nanoseconds after 1970-01-01, for example serial 40148 becomes
    # "1970-01-01 00:00:00.000040148". The raw int64 timestamp value is
    # therefore the Excel serial day count we need to recover.
    serial_days = parsed.astype("int64")
    converted = pd.to_datetime(serial_days, unit="D", origin="1899-12-30", errors="coerce")
    return converted.dt.strftime("%Y-%m-%d %H:%M:%S")


def normalize_file(path: Path) -> None:
    if not path.exists():
        print(f"SKIP missing {path}")
        return

    df = pd.read_csv(path)
    if "InvoiceDate" not in df.columns:
        print(f"SKIP no InvoiceDate {path}")
        return

    if not looks_like_epoch_serial(df["InvoiceDate"]):
        print(f"OK already normalized {path}")
        return

    df["InvoiceDate"] = convert_epoch_serial_to_excel_date(df["InvoiceDate"])
    invoice_date = pd.to_datetime(df["InvoiceDate"], errors="coerce")

    if "Year" in df.columns:
        df["Year"] = invoice_date.dt.year
    if "Month" in df.columns:
        df["Month"] = invoice_date.dt.month
    if "Day" in df.columns:
        df["Day"] = invoice_date.dt.day
    if "Week" in df.columns:
        df["Week"] = invoice_date.dt.isocalendar().week.astype("int64")
    if "Quarter" in df.columns:
        df["Quarter"] = invoice_date.dt.quarter
    if "DayOfWeek" in df.columns:
        df["DayOfWeek"] = invoice_date.dt.day_name()
    if "Hour" in df.columns:
        df["Hour"] = invoice_date.dt.hour
    if "InvoiceMonth" in df.columns:
        df["InvoiceMonth"] = invoice_date.dt.to_period("M").astype(str)

    df.to_csv(path, index=False)
    print(f"NORMALIZED {path} rows={len(df)}")


if __name__ == "__main__":
    for file_path in FILES:
        normalize_file(file_path)
