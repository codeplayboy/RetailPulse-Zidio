# Prophet Notes

## Input Format

ds -> Date

y -> Target Value

## Example

ds          y
2025-01-01  120
2025-01-02  145

## Production Use In RetailPulse
The dashboard-integrated forecasting module uses Prophet as the current production model.

## Workflow

Load data

Prepare ds and y

Add supported regressors when available

Train tuned Prophet model

Generate forecast

Evaluate forecast

Export results

## Latest Verified Metrics
- MAE: 5534.49
- RMSE: 8759.64
- MAPE: 22.53%

## Limitation
MAPE remains elevated because the source dataset contains several zero-demand and low-demand periods. Separate hybrid experiments were evaluated, but the current Prophet production pipeline remains the best verified option for this project state.
