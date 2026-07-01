# Demand Forecasting Module

## Objective
Predict future product demand using historical sales data.

## Production Status
The demand forecasting pipeline is complete and integrated into the dashboard using the production Prophet implementation provided by Sachin.

## Production Pipeline
1. preprocess historical demand data
2. generate forecasting features and external regressors
3. train Prophet with tuned seasonality settings
4. generate forward-looking demand forecasts
5. evaluate forecast quality
6. export dashboard-ready output files

## External Regressors Used When Available
- Invoice_Count
- SKU_Count
- Rolling_7_Day_Demand
- Rolling_30_Day_Demand
- Is_Weekend

## Latest Verified Metrics
- MAE: 5534.49
- RMSE: 8759.64
- MAPE: 22.53%

## Output Files
- demand_forecast.csv
- inventory_recommendations.csv
- churn_predictions.csv
- high_risk_customers.csv

## Forecasting Limitation
The current dataset includes several zero-demand and very low-demand periods. Because MAPE is percentage-based, those rows raise the error score sharply and make the target harder to achieve. Experimental hybrid models were tested separately, but none outperformed the current production Prophet pipeline on this dataset.

## Input Data
- Date
- Product ID
- Product Name
- Quantity Sold
- Sales Revenue
- Inventory Level

## Forecasting Pipeline

1. Data Loading
2. Data Cleaning
3. Time Series Preparation
4. Trend Analysis
5. Prophet Model
6. Forecast Generation
7. Forecast Evaluation

## Evaluation Metrics

- MAPE
- RMSE
- MAE

## Outputs

- forecast_output.csv
- forecast_metrics.csv
