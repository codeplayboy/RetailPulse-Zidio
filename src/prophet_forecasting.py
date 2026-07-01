"""Backward-compatible Prophet forecasting utilities.

This module mirrors the production implementation in src/forecasting.py while
preserving the existing Prophet-facing APIs used by the repository.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

try:
    from .forecasting import (
        REQUIRED_REGRESSORS,
        PROPHET_PARAMS,
        OUTLIER_CAP_PERCENTILE,
        REMOVE_ZERO_DEMAND_FROM_TRAIN,
        load_data as _load_data,
        prepare_time_series as _prepare_time_series,
        train_test_split_ts as _train_test_split_ts,
        train_prophet_model as _train_prophet_model,
        generate_forecast as _generate_forecast,
        calculate_metrics as _calculate_metrics,
        save_forecast as _save_forecast,
        main as _main,
    )
except ImportError:  # pragma: no cover - fallback for direct script execution
    from src.forecasting import (  # type: ignore
        REQUIRED_REGRESSORS,
        PROPHET_PARAMS,
        OUTLIER_CAP_PERCENTILE,
        REMOVE_ZERO_DEMAND_FROM_TRAIN,
        load_data as _load_data,
        prepare_time_series as _prepare_time_series,
        train_test_split_ts as _train_test_split_ts,
        train_prophet_model as _train_prophet_model,
        generate_forecast as _generate_forecast,
        calculate_metrics as _calculate_metrics,
        save_forecast as _save_forecast,
        main as _main,
    )

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


def load_data(path: str) -> pd.DataFrame:
    """Load demand data from a CSV file."""
    return _load_data(path)


def prepare_time_series(
    df: pd.DataFrame,
    date_col: str = "Date",
    value_col: str = "Total_Quantity",
    regressor_cols: Optional[List[str]] = None,
) -> pd.DataFrame:
    """Transform raw demand data into a Prophet-compatible daily time series."""
    return _prepare_time_series(df, date_col=date_col, value_col=value_col, regressor_cols=regressor_cols)


def train_test_split_ts(ts_df: pd.DataFrame, test_size: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Split a time series DataFrame into chronological train and test sets."""
    return _train_test_split_ts(ts_df, test_size=test_size)


def train_prophet_model(
    train_df: pd.DataFrame,
    regressor_cols: Optional[List[str]] = None,
    prophet_params: Optional[Dict[str, Any]] = None,
    apply_preprocessing: bool = True,
) -> Tuple[Any, Dict[str, Any]]:
    """Train a production-ready Prophet model matching src/forecasting.py."""
    return _train_prophet_model(
        train_df,
        regressor_cols=regressor_cols,
        prophet_params=prophet_params,
        apply_preprocessing=apply_preprocessing,
    )


def train_prophet(train_df: pd.DataFrame, prophet_params: Optional[Dict[str, Any]] = None) -> Any:
    """Backward-compatible wrapper for legacy Prophet training calls."""
    model, _ = train_prophet_model(
        train_df,
        regressor_cols=None,
        prophet_params=prophet_params,
        apply_preprocessing=True,
    )
    return model


def calculate_metrics(y_true: Any, y_pred: Any) -> Dict[str, Optional[float]]:
    """Calculate forecast metrics matching the production implementation."""
    return _calculate_metrics(y_true, y_pred)


def generate_forecast(
    model: Any,
    periods: int = 30,
    freq: str = "D",
    future_df: Optional[pd.DataFrame] = None,
    test_df: Optional[pd.DataFrame] = None,
) -> pd.DataFrame:
    """Generate forecast predictions with compatibility for both APIs."""
    if test_df is not None:
        return _generate_forecast(model, test_df=test_df)
    if future_df is not None:
        return _generate_forecast(model, test_df=future_df)
    return _generate_forecast(model, periods=periods, freq=freq)


def merge_forecast_with_test(test_df: pd.DataFrame, forecast_df: pd.DataFrame) -> pd.DataFrame:
    """Merge actual test data with forecast predictions."""
    test_df = _validate_dataframe(test_df, "test_df")
    _validate_columns(test_df, ("ds", "y"), "merge_forecast_with_test")
    forecast_df = _validate_dataframe(forecast_df, "forecast_df")
    _validate_columns(forecast_df, ("ds", "yhat", "yhat_lower", "yhat_upper"), "merge_forecast_with_test")

    return pd.merge(
        test_df[["ds", "y"]],
        forecast_df[["ds", "yhat", "yhat_lower", "yhat_upper"]],
        on="ds",
        how="left",
    )


def save_forecast(forecast_df: pd.DataFrame, output_path: str, columns: Optional[List[str]] = None) -> None:
    """Persist forecast output to CSV using the production implementation."""
    _save_forecast(forecast_df, output_path, columns=columns)


def export_forecast(forecast_df: pd.DataFrame, output_path: str) -> None:
    """Export forecast results to a CSV file."""
    save_forecast(forecast_df, output_path)


def forecast_ts(
    ts: pd.DataFrame,
    test_size: float = 0.2,
    prophet_params: Optional[Dict[str, Any]] = None,
    freq: Optional[str] = None,
) -> Dict[str, Any]:
    """Run an end-to-end Prophet forecasting pipeline with proper train/test evaluation."""
    train_df, test_df = train_test_split_ts(ts, test_size=test_size)
    if test_df.empty:
        raise ValueError("Test set is empty after split; reduce test_size or provide more data.")

    freq = freq or pd.infer_freq(train_df["ds"])
    freq = freq if freq else "D"

    model, meta = train_prophet_model(
        train_df,
        regressor_cols=None,
        prophet_params=prophet_params,
        apply_preprocessing=True,
    )

    registered_regs = meta.get("registered_regressors", [])
    pred_cols = ["ds"] + [col for col in registered_regs if col in test_df.columns]
    test_for_pred = test_df[pred_cols].copy() if pred_cols != ["ds"] else test_df[["ds"]].copy()

    forecast_df = generate_forecast(model, periods=len(test_df), freq=freq, future_df=test_for_pred)
    merged_df = merge_forecast_with_test(test_df, forecast_df)
    metrics = calculate_metrics(merged_df["y"].values, merged_df["yhat"].values)

    logger.info(
        "Pipeline completed - MAE: %.4f, RMSE: %.4f, MAPE: %.2f%%",
        metrics.get("mae"),
        metrics.get("rmse"),
        metrics.get("mape") or 0,
    )

    return {
        "model": model,
        "train": train_df,
        "test": test_df,
        "predictions": merged_df,
        "metrics": metrics,
    }


def main(
    data_path: str = "data/dataset_2_daily_demand_forecasting.csv.csv",
    output_path: str = "outputs/demand_forecast.csv",
    date_col: str = "Date",
    value_col: str = "Total_Quantity",
    regressor_cols: Optional[List[str]] = None,
    forecast_periods: int = 30,
    test_size: float = 0.2,
) -> Dict[str, Any]:
    """Run the end-to-end production forecasting pipeline."""
    return _main(
        data_path=data_path,
        output_path=output_path,
        date_col=date_col,
        value_col=value_col,
        regressor_cols=regressor_cols,
        forecast_periods=forecast_periods,
        test_size=test_size,
    )


__all__ = [
    "REQUIRED_REGRESSORS",
    "PROPHET_PARAMS",
    "OUTLIER_CAP_PERCENTILE",
    "REMOVE_ZERO_DEMAND_FROM_TRAIN",
    "load_data",
    "prepare_time_series",
    "train_test_split_ts",
    "train_prophet_model",
    "train_prophet",
    "generate_forecast",
    "calculate_metrics",
    "merge_forecast_with_test",
    "save_forecast",
    "export_forecast",
    "forecast_ts",
    "main",
]
