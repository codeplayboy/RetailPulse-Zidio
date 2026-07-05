from src.forecasting import (
    load_data,
    prepare_time_series,
    train_prophet_model,
    calculate_metrics,
)

from sklearn.model_selection import train_test_split

# Load dataset
df = load_data("data/dataset_1_daily_revenue_forecasting.csv")

# Prepare
ts = prepare_time_series(
    df,
    date_col="Date",
    value_col="Total_Quantity",
)

# Train/Test Split
train = ts.iloc[:-147]
test = ts.iloc[-147:]

# Train Model
model, model_info = train_prophet_model(train)

print(model_info)

print(type(model))
print(model)

# Predict only test dates
predict_cols = [
    "ds",
    "Invoice_Count",
    "SKU_Count",
    "Rolling_7_Day_Demand",
    "Rolling_30_Day_Demand",
    "Is_Weekend",
]
print(test.columns.tolist())
forecast = model.predict(test[predict_cols])

metrics = calculate_metrics(
    test["y"],
    forecast["yhat"],
)

print("\n========================")
print(metrics)
print("========================")
