"""Prophet forecasting utilities for time series model training and evaluation."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import numpy as np
import pandas as pd

try:
    from prophet import Prophet
except ImportError as exc:
    try:
        from fbprophet import Prophet
    except ImportError as inner_exc:
        raise ImportError("Prophet is not installed. Install 'prophet' or 'fbprophet'.") from inner_exc
    else:
        Prophet = Prophet  # type: ignore

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())


def _validate_dataframe(df: Any, name: str = "DataFrame") -> pd.DataFrame:
    """Ensure the provided object is a non-empty pandas DataFrame."""
    if not isinstance(df, pd.DataFrame):
        raise TypeError(f"{name} must be a pandas DataFrame")
    if df.empty:
        raise ValueError(f"{name} must not be empty")
    return df


def _validate_columns(df: pd.DataFrame, columns: Tuple[str, ...], context: str) -> None:
    """Validate that the required columns exist in the DataFrame."""
    missing = [column for column in columns if column not in df.columns]
    if missing:
        raise KeyError(f"{context} requires columns: {missing}")


def _validate_test_size(test_size: float) -> float:
    """Validate the test_size argument for time series splitting."""
    try:
        test_size = float(test_size)
    except (TypeError, ValueError) as exc:
        raise ValueError("test_size must be a numeric value") from exc
    if not 0.0 < test_size < 1.0:
        raise ValueError("test_size must be between 0 and 1")
    return test_size


def train_test_split_ts(ts: pd.DataFrame, test_size: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Split a time series DataFrame into chronological train and test sets.

    Args:
        ts: Time series DataFrame containing 'ds' and 'y' columns.
        test_size: Fraction of data to reserve for testing.

    Returns:
        A tuple of (train_df, test_df).

    Raises:
        ValueError: If the input DataFrame is empty or test_size is invalid.
        KeyError: If required columns are missing.
    """
    ts = _validate_dataframe(ts, "ts")
    _validate_columns(ts, ("ds", "y"), "train_test_split_ts")

    test_size = _validate_test_size(test_size)
    df = ts.copy()
    df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
    df = df.sort_values("ds").reset_index(drop=True)
    if df["ds"].isna().any():
        raise ValueError("ds column contains invalid datetime values")

    n = len(df)
    split = int(np.ceil(n * (1 - test_size)))
    train = df.iloc[:split].reset_index(drop=True)
    test = df.iloc[split:].reset_index(drop=True)
    return train, test


def train_prophet(train_df: pd.DataFrame, prophet_params: Optional[Dict[str, Any]] = None) -> Prophet:
    """Train a Prophet model on historical data.

    Args:
        train_df: Training DataFrame with columns 'ds' and 'y'.
        prophet_params: Optional Prophet parameters.

    Returns:
        A fitted Prophet model.

    Raises:
        ValueError: If training fails.
    """
    train_df = _validate_dataframe(train_df, "train_df")
    _validate_columns(train_df, ("ds", "y"), "train_prophet")

    if prophet_params is None:
        prophet_params = {}
    if not isinstance(prophet_params, dict):
        raise TypeError("prophet_params must be a dictionary if provided")

    logger.info("Training Prophet model with params: %s", prophet_params)
    try:
        model = Prophet(**prophet_params)
        model.fit(train_df[["ds", "y"]])
        return model
    except Exception as exc:
        logger.error("Failed to train Prophet model: %s", exc)
        raise ValueError(f"Failed to train Prophet model: {exc}") from exc


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Optional[float]]:
    """Calculate forecast metrics: MAE, RMSE, and MAPE.

    Args:
        y_true: Actual values.
        y_pred: Predicted values.

    Returns:
        Dictionary with metric names and values.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    if y_true.size == 0 or y_pred.size == 0:
        raise ValueError("y_true and y_pred must contain at least one value")

    mask = ~np.isnan(y_pred)
    if not mask.any():
        return {"MAE": None, "RMSE": None, "MAPE": None}

    y_true = y_true[mask]
    y_pred = y_pred[mask]
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

    with np.errstate(divide="ignore", invalid="ignore"):
        denom = np.where(y_true == 0, np.nan, y_true)
        mape = np.mean(np.abs((y_true - y_pred) / denom)) * 100.0
    mape_value = float(mape) if not np.isnan(mape) else None

    return {"MAE": mae, "RMSE": rmse, "MAPE": mape_value}


def generate_forecast(model: Prophet, periods: int, freq: str = "D") -> pd.DataFrame:
    """Generate forecasts from a trained Prophet model.

    Args:
        model: Fitted Prophet model.
        periods: Number of future periods to predict.
        freq: Frequency string for forecast horizon.

    Returns:
        Forecast DataFrame produced by Prophet.
    """
    if not isinstance(periods, int) or periods <= 0:
        raise ValueError("periods must be a positive integer")
    if not isinstance(freq, str) or not freq.strip():
        raise ValueError("freq must be a non-empty string")

    try:
        future = model.make_future_dataframe(periods=periods, freq=freq)
        forecast = model.predict(future)
        return forecast
    except Exception as exc:
        logger.error("Failed to generate forecast: %s", exc)
        raise ValueError(f"Failed to generate forecast: {exc}") from exc


def merge_forecast_with_test(test_df: pd.DataFrame, forecast_df: pd.DataFrame) -> pd.DataFrame:
    """Merge actual test data with forecast predictions."""
    test_df = _validate_dataframe(test_df, "test_df")
    _validate_columns(test_df, ("ds", "y"), "merge_forecast_with_test")
    forecast_df = _validate_dataframe(forecast_df, "forecast_df")
    _validate_columns(forecast_df, ("ds", "yhat", "yhat_lower", "yhat_upper"), "merge_forecast_with_test")

    merged_df = pd.merge(
        test_df[["ds", "y"]],
        forecast_df[["ds", "yhat", "yhat_lower", "yhat_upper"]],
        on="ds",
        how="left",
    )
    return merged_df


def export_forecast(forecast_df: pd.DataFrame, output_path: str) -> None:
    """Export forecast results to a CSV file."""
    forecast_df = _validate_dataframe(forecast_df, "forecast_df")
    if not isinstance(output_path, str) or not output_path.strip():
        raise ValueError("output_path must be a non-empty string")

    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    forecast_df.to_csv(output_file, index=False)


def forecast_ts(
    ts: pd.DataFrame,
    test_size: float = 0.2,
    prophet_params: Optional[Dict[str, Any]] = None,
    freq: Optional[str] = None,
) -> Dict[str, Any]:
    """Run an end-to-end Prophet forecasting pipeline.

    Args:
        ts: Time series DataFrame containing 'ds' and 'y'.
        test_size: Fraction of samples to hold out for testing.
        prophet_params: Optional Prophet model arguments.
        freq: Optional frequency for the forecast horizon.

    Returns:
        A dictionary containing model, train/test splits, predictions, and metrics.
    """
    train_df, test_df = train_test_split_ts(ts, test_size=test_size)
    if test_df.empty:
        raise ValueError("Test set is empty after split; reduce test_size or provide more data.")

    freq = freq or pd.infer_freq(train_df["ds"])
    freq = freq if freq else "D"

    model = train_prophet(train_df, prophet_params=prophet_params)
    forecast_df = generate_forecast(model, periods=len(test_df), freq=freq)
    merged_df = merge_forecast_with_test(test_df, forecast_df)
    metrics = calculate_metrics(merged_df["y"].values, merged_df["yhat"].values)

    return {
        "model": model,
        "train": train_df,
        "test": test_df,
        "predictions": merged_df,
        "metrics": metrics,
    }


__all__ = [
    "train_test_split_ts",
    "train_prophet",
    "calculate_metrics",
    "generate_forecast",
    "merge_forecast_with_test",
    "export_forecast",
    "forecast_ts",
]
