# RetailPulse Forecasting Plan

## Objective
Predict future product demand using historical sales data.

## Production Model
- Prophet

## Final Production Configuration
- changepoint_prior_scale = 0.01
- seasonality_prior_scale = 15
- seasonality_mode = multiplicative
- yearly seasonality enabled
- weekly seasonality enabled
- custom monthly seasonality enabled (period = 30.5, fourier_order = 5)

## External Regressors
- Invoice_Count
- SKU_Count
- Rolling_7_Day_Demand
- Rolling_30_Day_Demand
- Is_Weekend

## Experimental Research
- Prophet + LSTM hybrid
- Prophet + GRU hybrid
- residual learning
- ensemble comparisons

These experiments were evaluated separately and did not outperform the production Prophet model, so they were not adopted into the dashboard-integrated pipeline.

## Outputs
- Forecast Dataset
- Forecast Metrics
- Inventory Recommendations

## Evaluation Metrics
- MAPE
- RMSE
- MAE

## Latest Verified Result
- MAE: 5534.49
- RMSE: 8759.64
- MAPE: 22.53%

## Limitation Note
The current demand dataset contains multiple zero-demand and low-demand periods. That makes MAPE more sensitive and harder to reduce, even when the forecast trend is directionally correct. Based on the current dataset and experiments completed so far, the production Prophet model is the best verified configuration.
