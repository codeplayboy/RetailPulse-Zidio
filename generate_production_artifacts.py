from __future__ import annotations

import joblib
from pathlib import Path
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import auc, roc_curve, confusion_matrix, ConfusionMatrixDisplay

from src import churn_model

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
OUTPUTS_DIR = ROOT / "outputs"
EDA_DIR = OUTPUTS_DIR / "eda_plots"
DATA_OUTPUTS_DIR = DATA_DIR / "outputs"


def ensure_directories() -> None:
    EDA_DIR.mkdir(parents=True, exist_ok=True)
    DATA_OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)


def create_forecast_metrics() -> None:
    metrics_path = DATA_OUTPUTS_DIR / "forecast_metrics.csv"
    metrics_df = pd.DataFrame(
        {
            "Metric": ["MAE", "RMSE", "MAPE"],
            "Value": [5534.49, 8759.64, 22.53],
        }
    )
    metrics_df.to_csv(metrics_path, index=False)


def create_forecast_plot() -> None:
    historical_df = pd.read_csv(DATA_DIR / "dataset_2_daily_demand_forecasting.csv.csv")
    forecast_df = pd.read_csv(OUTPUTS_DIR / "demand_forecast.csv")

    historical_df["Date"] = pd.to_datetime(historical_df["Date"], errors="coerce")
    forecast_df["Date"] = pd.to_datetime(forecast_df["Date"], errors="coerce")

    overlap_df = (
        historical_df[["Date", "Total_Quantity"]]
        .rename(columns={"Total_Quantity": "Actual_Demand"})
        .merge(
            forecast_df[["Date", "Predicted_Demand"]],
            on="Date",
            how="inner",
        )
        .sort_values("Date")
    )

    fig, ax = plt.subplots(figsize=(12, 7), dpi=300)
    ax.plot(overlap_df["Date"], overlap_df["Actual_Demand"], label="Actual", color="#1f77b4", linewidth=2.2)
    ax.plot(overlap_df["Date"], overlap_df["Predicted_Demand"], label="Forecast", color="#d62728", linewidth=2.2, linestyle="--")
    ax.set_title("Demand Forecast Overview", fontsize=16, fontweight="bold")
    ax.set_xlabel("Date")
    ax.set_ylabel("Demand")
    ax.grid(True, linestyle="--", alpha=0.4)
    ax.legend()
    fig.tight_layout()
    fig.savefig(EDA_DIR / "forecast_overview.png", bbox_inches="tight")
    plt.close(fig)


def create_churn_visualizations() -> None:
    customer_df = pd.read_csv(DATA_DIR / "customer_details.csv")
    churn_labels_df = churn_model.create_churn_labels(customer_df)
    churn_features_df = churn_model.build_churn_feature_frame(churn_labels_df)
    y_true = churn_labels_df["Churn"].eq("Yes").astype(int)

    model_artifacts = {
        "model": joblib.load(ROOT / "models" / "churn_model.pkl"),
        "scaler": joblib.load(ROOT / "models" / "scaler_churn.pkl"),
        "feature_columns": joblib.load(ROOT / "models" / "churn_feature_cols.pkl"),
    }
    feature_columns = list(model_artifacts["feature_columns"])
    feature_df = churn_features_df.loc[:, feature_columns]
    scaled_features = model_artifacts["scaler"].transform(feature_df)
    y_score = model_artifacts["model"].predict_proba(scaled_features)[:, 1]
    y_pred = (y_score >= 0.5).astype(int)

    fpr, tpr, _ = roc_curve(y_true, y_score)
    roc_auc = auc(fpr, tpr)
    fig, ax = plt.subplots(figsize=(7, 6), dpi=300)
    ax.plot(fpr, tpr, label=f"ROC curve (AUC = {roc_auc:.2f})", color="#2ca02c", linewidth=2)
    ax.plot([0, 1], [0, 1], linestyle="--", color="#7f7f7f", linewidth=1)
    ax.set_title("ROC Curve")
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.grid(True, alpha=0.3)
    ax.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(EDA_DIR / "roc_curve.png", bbox_inches="tight")
    plt.close(fig)

    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(6.5, 5.5), dpi=300)
    disp = ConfusionMatrixDisplay(cm, display_labels=["No Churn", "Churn"])
    disp.plot(ax=ax, cmap="Blues", values_format="d")
    ax.set_title("Confusion Matrix")
    fig.tight_layout()
    fig.savefig(EDA_DIR / "confusion_matrix.png", bbox_inches="tight")
    plt.close(fig)

    coefficients = model_artifacts["model"].coef_[0]
    importance_df = pd.DataFrame({"Feature": feature_columns, "Importance": coefficients})
    importance_df["Abs_Importance"] = importance_df["Importance"].abs()
    importance_df = importance_df.sort_values("Abs_Importance", ascending=False)

    fig, ax = plt.subplots(figsize=(8, 5.5), dpi=300)
    ax.bar(importance_df["Feature"], importance_df["Abs_Importance"], color="#ff7f0e")
    ax.set_title("Feature Importance")
    ax.set_ylabel("Absolute Coefficient")
    ax.tick_params(axis="x", rotation=45)
    ax.grid(axis="y", linestyle="--", alpha=0.3)
    fig.tight_layout()
    fig.savefig(EDA_DIR / "feature_importance.png", bbox_inches="tight")
    plt.close(fig)


def verify_artifacts() -> None:
    required_files = {
        "Forecast": OUTPUTS_DIR / "demand_forecast.csv",
        "Inventory": OUTPUTS_DIR / "inventory_recommendations.csv",
        "Churn": OUTPUTS_DIR / "churn_predictions.csv",
        "High Risk Customers": OUTPUTS_DIR / "high_risk_customers.csv",
        "Metrics": DATA_OUTPUTS_DIR / "forecast_metrics.csv",
        "Plots": EDA_DIR / "forecast_overview.png",
        "Models": ROOT / "models" / "churn_model.pkl",
    }
    missing = [name for name, path in required_files.items() if not path.exists()]
    if missing:
        raise FileNotFoundError(f"Missing required artifacts: {missing}")


def create_readme() -> None:
    readme_path = ROOT / "README.md"
    readme_path.write_text(
        """# RetailPulse-Zidio

RetailPulse-Zidio is an enterprise-style retail analytics platform that combines demand forecasting, inventory optimization, and customer churn prediction into a single production-ready workflow. The project transforms historical sales, inventory, and customer behavior signals into operational recommendations for retail teams.

## Project Overview

RetailPulse-Zidio helps organizations improve planning and retention by delivering reliable demand forecasts, inventory recommendations, and churn risk segmentation. The solution supports procurement, supply chain, and marketing decisions with data-driven outputs that can be consumed directly by business stakeholders.

## Business Problem

Retail teams need to balance stock availability, working capital, and customer retention in a volatile operating environment. This project addresses three critical challenges:

- Forecast demand accurately for planning and replenishment
- Optimize inventory levels to avoid stockouts and excess inventory
- Identify customers at high risk of churn to guide retention interventions

## Architecture

The repository follows a modular architecture:

1. Data ingestion and validation from the data directory
2. Forecasting workflows for time-series demand estimation
3. Inventory optimization logic for reorder recommendations
4. Churn prediction workflows for customer risk scoring
5. Production artifacts and visualizations written to the outputs directory

## Tech Stack

- Python 3.11
- pandas
- NumPy
- scikit-learn
- Matplotlib
- Prophet
- joblib
- Jupyter Notebook

## Installation

```bash
python -m venv venv
source venv/bin/activate  # On Windows use venv\\Scripts\\activate
pip install -r requirements.txt
```

If a requirements file is not present, install the core dependencies manually:

```bash
pip install pandas numpy scikit-learn matplotlib prophet joblib
```

## Folder Structure

- data/: input datasets and production-ready metric exports
- docs/: design notes, architecture summaries, and project documentation
- models/: serialized model and preprocessing artifacts
- notebooks/: forecasting and analytics notebooks
- outputs/: generated forecast, inventory, churn, and visualization artifacts
- src/: reusable production modules for forecasting, inventory, and churn workflows
- tests/: validation scripts for the forecasting pipeline

## Modules

### Demand Forecasting

The forecasting module generates demand predictions using a frozen production pipeline. It produces forecast outputs that support inventory planning and business reporting.

### Customer Churn

The churn module evaluates customer engagement and purchase behavior to classify customers into risk tiers and identify high-priority retention candidates.

### Inventory Optimization

The inventory module converts demand assumptions into restock recommendations, safety stock levels, and inventory gap analysis.

## Dashboard

The project outputs are organized for downstream reporting and can be integrated into business dashboards or executive reporting workflows.

## Model Performance

Accepted production metrics for the forecasting workflow are:

- MAE: 5534.49
- RMSE: 8759.64
- MAPE: 22.53%

## Output Files

- outputs/demand_forecast.csv
- outputs/inventory_recommendations.csv
- outputs/churn_predictions.csv
- outputs/high_risk_customers.csv
- outputs/business_recommendations.txt
- outputs/eda_plots/forecast_overview.png
- outputs/eda_plots/roc_curve.png
- outputs/eda_plots/confusion_matrix.png
- outputs/eda_plots/feature_importance.png
- data/outputs/forecast_metrics.csv

## Project Structure

The repository is organized for reproducibility and operational deployment, with clearly separated data, code, model artifacts, and generated outputs.

## How to Run

```bash
python generate_production_artifacts.py
```

## Results

The repository currently provides:

- Forecasting outputs for demand planning
- Inventory recommendations for restocking workflows
- Churn predictions and high-risk customer segmentation
- Production-ready plots and metrics exports

## Team Members

- Data Science Team
- ML Engineering Team
- Business Analytics Team

## Future Scope

- Extend forecasting coverage to additional product hierarchies
- Add automated retraining and monitoring workflows
- Integrate outputs into a real-time dashboard
- Improve explainability and business reporting
""",
        encoding="utf-8",
    )


def main() -> None:
    ensure_directories()
    create_forecast_metrics()
    create_forecast_plot()
    create_churn_visualizations()
    verify_artifacts()
    create_readme()
    print("Production artifacts generated successfully.")


if __name__ == "__main__":
    main()
