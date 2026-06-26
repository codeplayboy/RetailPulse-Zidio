"""Production-ready demand forecasting module using Prophet."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, mean_squared_error

__all__ = [
    "load_data",
    "prepare_time_series",
    "train_prophet_model",
    "generate_forecast",
    "calculate_metrics",
    "save_forecast",
    "main",
]

logger = logging.getLogger(__name__)


def _validate_dataframe(df: Any, name: str = "DataFrame") -> pd.DataFrame:
    """Validate that input is a non-empty pandas DataFrame."""
    if not isinstance(df, pd.DataFrame):
        raise TypeError(f"{name} must be a pandas DataFrame")
    if df.empty:
        raise ValueError(f"{name} must not be empty")
    return df


def _validate_columns(df: pd.DataFrame, columns: List[str], context: str) -> None:
    """Validate that required columns are present in the DataFrame."""
    missing = [column for column in columns if column not in df.columns]
    if missing:
        raise KeyError(f"{context} requires columns: {missing}")


def _validate_path(path: str) -> Path:
    """Validate and normalize a filesystem path string."""
    if not isinstance(path, str) or not path.strip():
        raise ValueError("path must be a non-empty string")
    resolved_path = Path(path)
    if not resolved_path.is_file():
        raise FileNotFoundError(f"Data file does not exist: {path}")
    return resolved_path


def load_data(path: str) -> pd.DataFrame:
    """Load demand data from a CSV file.

    Args:
        path: Path to the CSV file containing the data.

    Returns:
        Loaded data as a DataFrame.

    Raises:
        FileNotFoundError: If the input path does not exist.
        ValueError: If the file cannot be read as CSV.
    """
    resolved_path = _validate_path(path)

    try:
        logger.info("Loading data from %s", resolved_path)
        df = pd.read_csv(resolved_path)
        _validate_dataframe(df, "Loaded data")
        logger.info("Data loaded successfully. Shape: %s", df.shape)
        return df
    except pd.errors.ParserError as exc:
        logger.error("Error parsing CSV file: %s", exc)
        raise ValueError(f"Cannot parse CSV file: {exc}") from exc


def prepare_time_series(
    df: pd.DataFrame,
    date_col: str = "date",
    value_col: str = "demand",
) -> pd.DataFrame:
    """Transform raw demand data into a Prophet-compatible time series.

    Args:
        df: Raw DataFrame containing date and value columns.
        date_col: Column name for dates.
        value_col: Column name for target values.

    Returns:
        A DataFrame with columns 'ds' and 'y'.

    Raises:
        KeyError: If required columns are missing.
        ValueError: If no valid records remain after cleaning.
    """
    df = _validate_dataframe(df, "df")
    _validate_columns(df, [date_col, value_col], "prepare_time_series")

    ts_df = df[[date_col, value_col]].copy()
    ts_df.columns = ["ds", "y"]
    ts_df["ds"] = pd.to_datetime(ts_df["ds"], errors="coerce")
    ts_df["y"] = pd.to_numeric(ts_df["y"], errors="coerce")
    ts_df = ts_df.dropna(subset=["ds", "y"])

    if ts_df.empty:
        raise ValueError("No valid data remaining after preparation")

    ts_df = ts_df.sort_values("ds").reset_index(drop=True)
    logger.info(
        "Time series prepared. Rows: %s, Date range: %s to %s",
        len(ts_df),
        ts_df["ds"].min(),
        ts_df["ds"].max(),
    )
    return ts_df


def train_prophet_model(
    ts_df: pd.DataFrame,
    growth: str = "linear",
    seasonality_mode: str = "additive",
    yearly_seasonality: bool = True,
    weekly_seasonality: bool = True,
    daily_seasonality: bool = False,
    changepoint_prior_scale: float = 0.05,
    interval_width: float = 0.95,
) -> Prophet:
    """Train a Prophet model on a prepared time series.

    Args:
        ts_df: Time series DataFrame with 'ds' and 'y' columns.
        growth: Growth model, either 'linear' or 'logistic'.
        seasonality_mode: Seasonality mode for Prophet.
        yearly_seasonality: Whether to enable yearly seasonality.
        weekly_seasonality: Whether to enable weekly seasonality.
        daily_seasonality: Whether to enable daily seasonality.
        changepoint_prior_scale: Controls how flexible trend changepoints are.
        interval_width: Prediction interval width.

    Returns:
        Fitted Prophet model.

    Raises:
        ValueError: If input validation fails or training fails.
    """
    ts_df = _validate_dataframe(ts_df, "ts_df")
    _validate_columns(ts_df, ["ds", "y"], "train_prophet_model")

    if growth not in {"linear", "logistic"}:
        raise ValueError("growth must be 'linear' or 'logistic'")
    if seasonality_mode not in {"additive", "multiplicative"}:
        raise ValueError("seasonality_mode must be 'additive' or 'multiplicative'")
    if not 0.0 < interval_width < 1.0:
        raise ValueError("interval_width must be between 0 and 1")

    logger.info("Training Prophet model")
    try:
        model = Prophet(
            growth=growth,
            seasonality_mode=seasonality_mode,
            yearly_seasonality=yearly_seasonality,
            weekly_seasonality=weekly_seasonality,
            daily_seasonality=daily_seasonality,
            changepoint_prior_scale=changepoint_prior_scale,
            interval_width=interval_width,
        )
        model.fit(ts_df)
        logger.info("Model training completed successfully")
        return model
    except Exception as exc:
        logger.error("Model training failed: %s", exc)
        raise ValueError(f"Failed to train Prophet model: {exc}") from exc


def generate_forecast(
    model: Prophet,
    periods: int = 30,
    freq: str = "D",
) -> pd.DataFrame:
    """Produce future forecasts from a fitted Prophet model.

    Args:
        model: A trained Prophet model.
        periods: Number of future periods to forecast.
        freq: Frequency string for forecast horizon.

    Returns:
        Forecast DataFrame containing Prophet output.

    Raises:
        ValueError: If periods is not positive.
    """
    if not isinstance(periods, int) or periods <= 0:
        raise ValueError("periods must be a positive integer")
    if not isinstance(freq, str) or not freq.strip():
        raise ValueError("freq must be a non-empty string")

    logger.info("Generating forecast for %s periods at frequency %s", periods, freq)
    try:
        future = model.make_future_dataframe(periods=periods, freq=freq)
        forecast = model.predict(future)
        logger.info("Forecast generated successfully. Length: %s", len(forecast))
        return forecast
    except Exception as exc:
        logger.error("Forecast generation failed: %s", exc)
        raise ValueError(f"Failed to generate forecast: {exc}") from exc


def calculate_metrics(
    y_true: pd.Series | np.ndarray,
    y_pred: pd.Series | np.ndarray,
) -> Dict[str, float]:
    """Compute forecast accuracy metrics.

    Args:
        y_true: Actual target values.
        y_pred: Predicted target values.

    Returns:
        Dictionary with MAE, RMSE, and MAPE.

    Raises:
        ValueError: If arrays are empty or incompatible.
    """
    y_true_array = np.asarray(y_true)
    y_pred_array = np.asarray(y_pred)

    if y_true_array.size == 0 or y_pred_array.size == 0:
        raise ValueError("y_true and y_pred must contain at least one value")

    min_size = min(y_true_array.size, y_pred_array.size)
    y_true_array = y_true_array[:min_size]
    y_pred_array = y_pred_array[:min_size]

    logger.info("Calculating forecast metrics")
    try:
        mae = mean_absolute_error(y_true_array, y_pred_array)
        rmse = np.sqrt(mean_squared_error(y_true_array, y_pred_array))
        mape = mean_absolute_percentage_error(y_true_array, y_pred_array)
        metrics = {
            "mae": float(mae),
            "rmse": float(rmse),
            "mape": float(mape),
        }
        logger.info(
            "Metrics calculated - MAE: %.4f, RMSE: %.4f, MAPE: %.4f",
            mae,
            rmse,
            mape,
        )
        return metrics
    except Exception as exc:
        logger.error("Error calculating metrics: %s", exc)
        raise ValueError(f"Failed to calculate metrics: {exc}") from exc


def save_forecast(
    forecast_df: pd.DataFrame,
    output_path: str,
    columns: Optional[List[str]] = None,
) -> None:
    """Persist the forecast output to CSV.

    Args:
        forecast_df: Forecast DataFrame to save.
        output_path: Destination file path.
        columns: Optional list of columns to include.

    Raises:
        ValueError: If the output path is invalid or no valid columns exist.
        IOError: If saving fails.
    """
    forecast_df = _validate_dataframe(forecast_df, "forecast_df")
    if not isinstance(output_path, str) or not output_path.strip():
        raise ValueError("output_path must be a non-empty string")

    if columns is None:
        columns = ["ds", "yhat", "yhat_lower", "yhat_upper"]

    available_cols = [col for col in columns if col in forecast_df.columns]
    if not available_cols:
        raise ValueError("No valid columns available to save")

    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    logger.info("Saving forecast to %s", output_file)
    try:
        forecast_df[available_cols].to_csv(output_file, index=False)
        logger.info("Forecast saved successfully to %s", output_file)
    except Exception as exc:
        logger.error("Error saving forecast: %s", exc)
        raise IOError(f"Failed to save forecast: {exc}") from exc


def main(
    data_path: str = "data/dataset_1_daily_revenue_forecasting.csv",
    output_path: str = "outputs/demand_forecast.csv",
    date_col: str = "date",
    value_col: str = "revenue",
    forecast_periods: int = 30,
) -> Dict[str, Any]:
    """Run the demand forecasting pipeline.

    Args:
        data_path: Input CSV data path.
        output_path: Forecast output file path.
        date_col: Date column name.
        value_col: Value column name.
        forecast_periods: Number of future periods to forecast.

    Returns:
        Dictionary containing the model, forecast, metrics, and prepared data.
    """
    if not isinstance(forecast_periods, int) or forecast_periods <= 0:
        raise ValueError("forecast_periods must be a positive integer")

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger.info("Starting demand forecasting pipeline")

    df = load_data(data_path)
    ts_df = prepare_time_series(df, date_col=date_col, value_col=value_col)
    model = train_prophet_model(ts_df)
    forecast = generate_forecast(model, periods=forecast_periods)

    history_forecast = model.predict(ts_df[["ds"]])
    metrics = calculate_metrics(ts_df["y"].values, history_forecast["yhat"].values)

    save_forecast(forecast, output_path)
    logger.info("Demand forecasting pipeline completed successfully")

    return {
        "model": model,
        "forecast": forecast,
        "metrics": metrics,
        "data": ts_df,
    }


if __name__ == "__main__":
    main()
