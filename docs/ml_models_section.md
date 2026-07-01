# RetailPulse Machine Learning Models Documentation

## 1. Project Overview

RetailPulse is a production-oriented retail intelligence platform designed to support forecasting, replenishment planning, and customer retention decision-making. The solution transforms historical business data into operationally actionable outputs for demand planning, inventory optimization, and churn management.

The platform integrates three complementary machine learning and rule-based modules:

- Demand forecasting for predicting expected future demand
- Inventory optimization for determining replenishment actions
- Churn prediction for identifying customers at elevated risk of disengagement

These modules are intended for use by business stakeholders, operations teams, and analytics practitioners who require interpretable, reliable, and deployment-ready decision support.

---

## 2. Demand Forecasting

### Algorithm

Demand forecasting is implemented using Prophet, a probabilistic time-series model well suited to business forecasting scenarios with trend and seasonality components.

The forecasting workflow includes:

1. Loading historical daily demand data
2. Preparing a Prophet-compatible time series
3. Engineering external regressors
4. Training the model on historical observations
5. Generating future demand projections
6. Evaluating forecast quality against holdout periods

### Prophet

Prophet was selected because it provides a robust framework for modeling daily demand patterns with configurable trend and seasonal behavior. The implementation supports business-style time series with multiple known drivers and is suitable for operational planning contexts where explainability and stability are important.

### Features

The forecasting model uses a structured set of demand-related features, including:

- Daily demand volume
- Invoice count
- SKU count
- Rolling 7-day demand
- Rolling 30-day demand
- Weekend indicator

These features capture both short-term demand momentum and recurring business patterns.

### External Regressors

External regressors are integrated into the forecasting process to improve the model’s responsiveness to operational drivers. These regressors include:

- Invoice_Count
- SKU_Count
- Rolling_7_Day_Demand
- Rolling_30_Day_Demand
- Is_Weekend

These variables help the model reflect changes in order activity, product breadth, recent demand acceleration, and week/weekend effects.

### Seasonality

The Prophet configuration includes:

- Weekly seasonality
- Yearly seasonality
- Monthly seasonality
- Multiplicative seasonality mode

This setup allows the model to represent recurring demand cycles while preserving sensitivity to changes in scale over time.

### Hyperparameters

The production configuration uses a conservative and stable parameter set:

- changepoint_prior_scale: 0.01
- seasonality_prior_scale: 15
- seasonality_mode: multiplicative
- yearly_seasonality: enabled
- weekly_seasonality: enabled
- daily_seasonality: disabled
- interval_width: 0.95

### Final Metrics

The trained Prophet model was evaluated on a holdout period using the production pipeline. Verified metrics are:

- MAPE: 17.53%
- MAE: 7589.93
- RMSE: 14478.21

These values indicate that the forecasting module is operationally useful for planning decisions while leaving room for further tuning and feature enhancement.

---

## 3. Inventory Optimization

### Logic

Inventory optimization converts forecasted demand into replenishment actions by evaluating stock sufficiency against expected consumption. The logic uses average daily demand, stock position, and replenishment thresholds to classify inventory status.

The module determines whether an SKU should be replenished based on whether the current net quantity remains below the target inventory position.

### Safety Stock

Safety stock is used as a buffer against variability in demand and replenishment timing. In the current production logic, safety stock is estimated as:

- Safety Stock = Average Daily Demand × 7

This provides a simple but practical protection mechanism for higher-variance items.

### Reorder Point

The reorder point defines the stock level at which replenishment should be triggered. In the current implementation, it is calculated as:

- Reorder Point = Average Daily Demand × 14

The inventory gap is then derived as the difference between the reorder point and current net quantity, enabling prioritization of restocking decisions.

### Business Recommendations

Inventory recommendations are generated for each SKU and categorized into actionable business outcomes:

- Restock Required
- Sufficient Stock
- Order Immediately when shortages are detected
- Monitor Stock when inventory is adequate

These outputs support purchasing, procurement, and store-level replenishment workflows.

---

## 4. Churn Prediction

### Algorithm

Churn prediction is implemented as a supervised classification workflow using a logistic regression model. The model is trained on customer behavior and value-related indicators and predicts whether a customer is likely to churn.

The module follows a production-style pipeline:

1. Load customer data
2. Create churn labels based on business rules
3. Prepare standardized numeric features
4. Train a logistic regression classifier
5. Generate probability and risk outputs
6. Save model artifacts for reuse in inference workflows

### Features

The churn model uses customer-level behavioral and financial attributes, including:

- Total Orders
- Purchase Frequency
- Customer Lifetime Value
- Total Revenue
- Average Order Value
- Average Basket Size
- Age
- Total Quantity Purchased

These features allow the model to capture both engagement depth and economic value.

### Outputs

The churn module produces structured outputs that support retention operations:

- Customer churn labels
- Churn risk classification
- Risk level segmentation
- Retention recommendations

The resulting outputs are exported to CSV files for downstream reporting and campaign planning.

### Business Impact

The churn model provides value by identifying customers who may require targeted outreach. This enables organizations to:

- Prioritize retention campaigns for high-risk segments
- Allocate loyalty and marketing resources more efficiently
- Reduce revenue loss from avoidable customer attrition
- Improve customer lifetime value through timely intervention

---

## 5. Model Files

The following production model artifacts are maintained for deployment and reuse:

- models/prophet_model.pkl
- models/churn_model.pkl
- models/scaler_churn.pkl
- models/churn_feature_cols.pkl

These files support model persistence, consistent inference behavior, and backward-compatible reloading in downstream workflows.

---

## 6. Output CSV Files

The project generates the following output files for business reporting and operational execution:

- outputs/demand_forecast.csv
  - Contains forecast outputs for demand planning and future projections
- outputs/inventory_recommendations.csv
  - Contains SKU-level inventory status, reorder points, safety stock, and recommended actions
- outputs/churn_predictions.csv
  - Contains customer-level churn predictions, risk levels, and recommendations
- outputs/high_risk_customers.csv
  - Contains the subset of customers classified as high priority for retention intervention
- outputs/business_recommendations.txt
  - Contains executive-facing recommendations derived from the generated outputs

---

## 7. Dashboard Integration

The current model outputs are structured to support future dashboard integration. The recommended integration approach is to expose the generated CSV outputs and model artifacts through a lightweight analytics layer or BI platform so that business users can monitor:

- Forecast performance and demand trends
- Inventory health and replenishment priority
- Churn risk segmentation and retention action coverage

A dashboard would improve operational visibility and reduce the latency between insight generation and business action.

---

## 8. Future Improvements

The current implementation provides a solid production foundation and can be extended in several important ways:

- Improve forecast accuracy through hyperparameter tuning and expanded feature engineering
- Introduce cross-validation for stronger validation of forecasting performance
- Incorporate additional customer behavioral variables into the churn model
- Connect demand forecasts directly to reorder planning workflows for automated replenishment
- Add a live dashboard or reporting interface for real-time operational monitoring
- Establish a closed-loop feedback mechanism so actual outcomes can refine future models and business rules

---

## Conclusion

RetailPulse delivers a practical and production-ready machine learning framework for retail analytics. By combining time-series forecasting, inventory optimization logic, and churn prediction into a unified workflow, the platform supports more informed business decisions across planning, merchandising, operations, and customer retention.
