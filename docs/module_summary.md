# RetailPulse-Zidio

RetailPulse-Zidio is a retail analytics solution that converts historical sales, inventory, and customer behavior data into operational insights. The project delivers three production-ready modules for demand forecasting, inventory optimization, and customer churn prediction. Each module transforms raw input datasets into actionable outputs that guide procurement, stock management, and retention strategies.

# Project Architecture

Data flows through RetailPulse-Zidio in a clear pipeline:

1. Input datasets are loaded from `data/` and validated.
2. The Demand Forecasting module transforms sales history into SKU-level demand forecasts.
3. The Inventory Optimization module uses demand estimates and current stock levels to calculate reorder points, safety stock, and replenishment recommendations.
4. The Customer Churn Prediction module evaluates customer purchase behavior to identify churn risk and high-priority retention targets.
5. Generated outputs are written to `outputs/` for downstream reporting, planning, and business action.

# Module 1: Demand Forecasting

## Objective

Provide accurate demand forecasts at the SKU and time-series level so inventory and procurement teams can plan replenishment and avoid stockouts.

## Input Dataset

- Historical sales and demand data
- SKU identifiers
- Date/time fields
- Quantity or units sold

## Key Features Used

- Time index and seasonality signals
- Historical demand values
- Holiday or event indicators where available
- SKU-level demand patterns

## Data Preprocessing

- Clean missing or invalid time series values
- Convert dates to a proper datetime index
- Aggregate sales by SKU and time segment
- Validate continuous time periods for forecasting

## Prophet Forecasting Pipeline

- Build a Prophet model for each SKU or aggregated demand series
- Configure seasonal components and holidays as needed
- Fit the model to historical demand data
- Generate future demand projections for target horizons

## Train/Test Split

- Split historic demand into training and test sets
- Preserve temporal order to avoid data leakage
- Use test set results to validate model generalization

## Forecast Generation

- Produce forecasted demand for future dates
- Add confidence intervals and prediction columns
- Merge forecasts with actual historical values for review

## Evaluation Metrics (MAE, RMSE, MAPE)

- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- Mean Absolute Percentage Error (MAPE)

These metrics quantify forecast accuracy and support model tuning.

## Output File

- `demand_forecast.csv`

Contains SKU-level demand forecasts and model evaluation summaries.

## Business Impact

- Reduces overstock and stockout risk
- Improves demand-driven purchasing decisions
- Supports accurate replenishment and planning
- Increases supply chain responsiveness

# Module 2: Inventory Optimization

## Objective

Translate forecasted demand and stock holdings into actionable inventory recommendations to preserve working capital while maintaining service levels.

## Input Dataset

- Current inventory holdings by SKU
- Estimated average daily demand
- Net quantity on hand
- Lead time and reorder policy parameters

## Safety Stock Formula

Safety stock is computed to cover variability in demand and lead time. In the current implementation, the formula is:

- `Safety Stock = Average_Daily_Demand × 7`

## Reorder Point Formula

Reorder point determines when new inventory should be ordered:

- `Reorder Point = Average_Daily_Demand × 14 + Safety Stock`

## Inventory Gap Formula

Inventory gap defines the quantity difference between target inventory and current stock:

- `Inventory Gap = Reorder Point - Net Quantity`

## Inventory Status Logic

- `Restock Required` when `Inventory Gap > 0`
- `Sufficient Stock` when `Inventory Gap <= 0`

## Recommendation Logic

- `Order More` when restocking is required
- `No Action Required` when inventory is sufficient
- `Order Quantity` is calculated as the positive inventory gap amount

## Output File

- `inventory_recommendations.csv`

Includes reorder points, safety stock, inventory gaps, restock status, and order quantities.

## Business Impact

- Balances inventory investment with sales demand
- Prevents stockouts through proactive ordering
- Minimizes excess inventory by flagging overstock situations
- Enables operational purchasing discipline

# Module 3: Customer Churn Prediction

## Objective

Identify customers at risk of churn and recommend retention actions to preserve revenue and improve customer lifetime value.

## Input Dataset

- Customer transaction and engagement records
- Total orders
- Purchase frequency
- Customer lifetime value metrics

## Churn Classification Logic

- Convert raw behavior data to numeric format
- Apply churn rules based on purchase frequency, order count, and lifetime value
- Label customers as `Yes` or `No` for churn

## High Risk Customer Identification

- Classify customers into risk segments: `High Risk`, `Medium Risk`, `Low Risk`
- `High Risk` customers satisfy multiple churn conditions
- `Medium Risk` customers satisfy one condition
- `Low Risk` customers satisfy none

## Output Files

- `churn_predictions.csv`
- `high_risk_customers.csv`

The first file contains churn labels, risk levels, and retention recommendations. The second file isolates the highest priority retention cohort.

## Business Impact

- Enables targeted retention campaigns
- Helps preserve customer lifetime value
- Provides data-driven customer segmentation
- Reduces revenue loss from churn

# Source Code Structure

The RetailPulse-Zidio source code is organized under `src/`:

- `src/forecasting.py` — High-level demand forecasting orchestration, data preparation, model training, forecast generation, and evaluation.
- `src/prophet_forecasting.py` — Reusable Prophet forecasting utilities, train/test split, forecast generation, metric calculation, and export support.
- `src/inventory.py` — Inventory optimization logic, safety stock and reorder point calculations, gap analysis, status detection, and recommendation generation.
- `src/churn_model.py` — Customer churn prediction utilities, label creation, risk classification, high-risk identification, report summarization, and persistence.

# Output Files

| File | Description |
|---|---|
| `demand_forecast.csv` | Forecasted demand results with model evaluation metrics. |
| `inventory_recommendations.csv` | Inventory reorder recommendations and order quantities. |
| `churn_predictions.csv` | Customer churn labels, risk levels, and retention recommendations. |
| `high_risk_customers.csv` | Subset of customers identified as high churn risk. |
| `business_recommendations.txt` | Executive summary of tactical recommendations from model outputs. |

# Technologies Used

- Python
- Pandas
- NumPy
- Prophet
- Scikit-learn
- Matplotlib
- VS Code
- Git

# Future Improvements

- Hyperparameter tuning for better model performance
- Prophet cross-validation to validate forecast horizons
- Prophet + LSTM hybrid forecasting for improved demand signals
- Automated dashboard integration for real-time operational visibility
- Real-time forecast updates to reflect changing demand patterns

# Conclusion

RetailPulse-Zidio provides an integrated analytics framework for retail forecasting, inventory planning, and customer retention. The project converts raw data into operational outputs that support purchasing, inventory management, and retention strategy. With clear inputs, robust processing pipelines, and actionable outputs, this documentation reflects a production-ready implementation designed for business impact and continuous improvement.
