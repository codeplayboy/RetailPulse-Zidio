# RetailPulse-Zidio

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
source venv/bin/activate  # On Windows use venv\Scripts\activate
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
