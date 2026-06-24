# RetailPulse Project Summary

## 1. Demand Forecasting

- Objective
  - Predict future daily demand at the SKU and store level to support sales planning and replenishment decisions.

- Dataset Used
  - `data/dataset_1_daily_revenue_forecasting.csv`
  - `data/dataset_2_daily_demand_forecasting.csv.csv`

- Methodology
  - Time-series modeling using historical demand and revenue patterns.
  - Feature engineering for seasonality, trends, and store/SKU-specific demand drivers.
  - Model evaluation using forecast accuracy metrics such as MAE, RMSE, and MAPE.

- Outputs Generated
  - `outputs/demand_forecast.csv`
  - Daily demand forecasts for inventory planning and promotional budgeting.

## 2. Inventory Optimization

- Objective
  - Optimize inventory levels across product SKUs to reduce stockouts and excess holding costs.

- Dataset Used
  - `data/dataset_3_sku_level_inventory_forecasting.csv`
  - `data/customer_inventory_set.csv`

- Methodology
  - Demand-driven inventory modeling based on forecasted sales.
  - Rule-based or optimization logic to balance service level targets and inventory investment.
  - Analysis of inventory usage and replenishment recommendations.

- Outputs Generated
  - `outputs/inventory_recommendations.csv`
  - SKU-level inventory recommendations for reorder quantities and safety stock.

## 3. Customer Churn Prediction

- Objective
  - Identify customers at high risk of churn to enable targeted retention campaigns.

- Dataset Used
  - `data/customer_details.csv`
  - Derived customer behavior and transaction features from sales history.

- Methodology
  - Classification modeling to predict churn likelihood from customer attributes.
  - Feature extraction for purchase frequency, recency, and customer engagement.
  - Model validation using precision, recall, and AUC to ensure reliable retention targeting.

- Outputs Generated
  - `outputs/high_risk_customers.csv`
  - Lists of customers with predicted churn risk for marketing and loyalty interventions.
