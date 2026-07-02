import csv
import json
import sys
from collections import Counter
from pathlib import Path


NUMERIC_FIELDS = [
    "Recency",
    "Frequency",
    "Monetary",
    "TotalItems",
    "AvgOrderValue",
    "PurchaseRate",
    "Lag_1",
    "Lag_7",
    "RollingMean7",
    "RollingStd7",
    "ProfitEstimate",
]


def parse_number(value: str) -> float:
    text = (value or "").strip()
    if not text:
        return 0.0
    try:
        return float(text.replace(",", ""))
    except ValueError:
        return 0.0


def build_summary(source_path: Path) -> dict:
    totals = {field: 0.0 for field in NUMERIC_FIELDS}
    row_count = 0
    customer_ids = set()
    stock_codes = set()
    countries = Counter()
    invoice_months = Counter()

    with source_path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)

        for row in reader:
            row_count += 1
            customer_id = (row.get("Customer_ID") or "").strip()
            stock_code = (row.get("StockCode") or "").strip()
            country = (row.get("Country") or "").strip() or "Unknown"
            invoice_month = (row.get("InvoiceMonth") or "").strip() or "Unknown"

            if customer_id:
                customer_ids.add(customer_id)
            if stock_code:
                stock_codes.add(stock_code)

            countries[country] += 1
            invoice_months[invoice_month] += 1

            for field in NUMERIC_FIELDS:
                totals[field] += parse_number(row.get(field, ""))

    averages = {
        field: round((totals[field] / row_count), 4) if row_count else 0.0
        for field in NUMERIC_FIELDS
    }

    return {
        "sourceFile": str(source_path),
        "rowCount": row_count,
        "columnCount": 34,
        "uniqueCustomers": len(customer_ids),
        "uniqueSkus": len(stock_codes),
        "averages": averages,
        "topCountries": [
            {"country": country, "count": count}
            for country, count in countries.most_common(5)
        ],
        "topInvoiceMonths": [
            {"month": month, "count": count}
            for month, count in invoice_months.most_common(6)
        ],
    }


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: python scripts/build_feature_summary.py <input_csv> <output_json> [<output_json> ...]")
        return 1

    source_path = Path(sys.argv[1])
    output_paths = [Path(arg) for arg in sys.argv[2:]]

    summary = build_summary(source_path)

    for output_path in output_paths:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        print(f"Wrote {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
