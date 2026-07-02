from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(r"C:\Users\rasha\Downloads\RetailPulse\RetailPulse-Zidio")

CHECKS = [
    (
        "Revenue source",
        ROOT / "dashboard/public/data/dataset_1_daily_revenue_forecasting.csv",
        ["Date", "Total_Revenue", "Total_Quantity", "Invoice_Count", "SKU_Count", "Avg_Price"],
    ),
    (
        "Demand source",
        ROOT / "dashboard/public/data/dataset_2_daily_demand_forecasting.csv",
        ["Date", "Total_Quantity", "Rolling_30_Day_Demand", "Day_Of_Week"],
    ),
    (
        "SKU inventory source",
        ROOT / "dashboard/public/data/dataset_3_sku_level_inventory_forecasting.csv",
        ["StockCode", "Description", "Total_Quantity_Sold", "Total_Revenue", "Average_Daily_Demand"],
    ),
    (
        "Forecast output",
        ROOT / "dashboard/public/data/demand_forecast.csv",
        ["Date", "Predicted_Demand", "Lower_Bound", "Upper_Bound"],
    ),
    (
        "Churn output",
        ROOT / "dashboard/public/data/churn_predictions.csv",
        ["Customer_ID", "Churn_Risk", "Churn", "Risk_Level", "Customer_Lifetime_Value", "Total_Orders"],
    ),
    (
        "Inventory recommendations",
        ROOT / "dashboard/public/data/inventory_recommendations.csv",
        ["StockCode", "Safety_Stock", "Reorder_Point", "Inventory_Gap", "Inventory_Status", "Recommendation"],
    ),
    (
        "Feature sample",
        ROOT / "dashboard/public/data/features_data_sample.csv",
        ["Recency", "Frequency", "Monetary", "TotalItems", "AvgOrderValue", "PurchaseRate", "Lag_1", "Lag_7"],
    ),
]


def inspect_csv(path: Path, required: list[str]) -> dict:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle)
        header = next(reader)
        rows = sum(1 for _ in reader)
    missing = [column for column in required if column not in header]
    return {
        "exists": path.exists(),
        "rows": rows,
        "columns": len(header),
        "missing_required": missing,
        "header": header,
        "bytes": path.stat().st_size,
    }


def main() -> int:
    results = {}
    failed = False
    for name, path, required in CHECKS:
        if not path.exists():
            results[name] = {"exists": False, "path": str(path), "missing_required": required}
            failed = True
            continue
        result = inspect_csv(path, required)
        result["path"] = str(path)
        results[name] = result
        failed = failed or bool(result["missing_required"]) or result["rows"] <= 0

    summary_path = ROOT / "docs/dashboard_evidence/dashboard_data_contract_results.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(results, indent=2), encoding="utf-8")

    for name, result in results.items():
        status = "PASS" if result.get("exists") and not result.get("missing_required") and result.get("rows", 0) > 0 else "FAIL"
        print(f"{status} | {name} | rows={result.get('rows', 0)} | cols={result.get('columns', 0)} | missing={result.get('missing_required')}")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
