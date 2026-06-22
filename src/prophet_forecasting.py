from typing import Dict, Optional, Tuple
import pandas as pd
import numpy as np

try:
    from prophet import Prophet
except Exception:
    try:
        from fbprophet import Prophet
    except Exception:
        raise ImportError("Prophet is not installed. Install 'prophet' or 'fbprophet'.")


def train_test_split_ts(ts: pd.DataFrame, test_size: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Time-based train/test split (earlier -> train, later -> test)."""
    df = ts.copy()
    df['ds'] = pd.to_datetime(df['ds'])
    df = df.sort_values('ds').reset_index(drop=True)
    n = len(df)
    if n == 0:
        raise ValueError('Input dataframe `ts` is empty.')
    split = int(np.ceil(n * (1 - float(test_size))))
    train = df.iloc[:split].reset_index(drop=True)
    test = df.iloc[split:].reset_index(drop=True)
    return train, test


def train_prophet(train_df: pd.DataFrame, prophet_params: Optional[Dict] = None) -> Prophet:
    """Train a Prophet model on `train_df` containing `ds` and `y`."""
    params = prophet_params.copy() if prophet_params else {}
    model = Prophet(**params)
    model.fit(train_df[['ds', 'y']])
    return model


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Optional[float]]:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    mask = ~np.isnan(y_pred)
    if mask.sum() == 0:
        return {'MAE': None, 'RMSE': None, 'MAPE': None}
    y_true = y_true[mask]
    y_pred = y_pred[mask]
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    with np.errstate(divide='ignore', invalid='ignore'):
        denom = np.where(y_true == 0, np.nan, y_true)
        mape = np.mean(np.abs((y_true - y_pred) / denom)) * 100.0
    mape = float(mape) if not np.isnan(mape) else None
    return {'MAE': mae, 'RMSE': rmse, 'MAPE': mape}


def forecast_ts(ts: pd.DataFrame, test_size: float = 0.2, prophet_params: Optional[Dict] = None,
                freq: Optional[str] = None) -> Dict:
    """Run end-to-end Prophet forecasting and return model, predictions, and metrics.

    Returns a dict with keys: `model`, `train`, `test`, `predictions`, `metrics`.
    """
    train, test = train_test_split_ts(ts, test_size=test_size)
    if len(test) == 0:
        raise ValueError('Test set is empty after split; reduce `test_size` or provide more data.')
    if freq is None:
        freq = pd.infer_freq(train['ds'])
    freq = freq or 'D'
    model = train_prophet(train, prophet_params=prophet_params)
    periods = len(test)
    future = model.make_future_dataframe(periods=periods, freq=freq)
    forecast = model.predict(future)
    preds = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
    preds = preds[preds['ds'].isin(test['ds'])].reset_index(drop=True)
    merged = pd.merge(test[['ds', 'y']], preds, on='ds', how='left')
    metrics = calculate_metrics(merged['y'].values, merged['yhat'].values)
    return {'model': model, 'train': train, 'test': test, 'predictions': merged, 'metrics': metrics}


__all__ = ['train_test_split_ts', 'train_prophet', 'calculate_metrics', 'forecast_ts']
