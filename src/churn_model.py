"""Production-ready churn prediction module for customer retention analysis.

This module converts the notebook-based churn workflow into reusable, validated
functions that can be used in production pipelines.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

__all__ = [
    "load_customer_data",
    "preprocess_customer_data",
    "create_churn_label",
    "create_churn_labels",
    "classify_customer_risk",
    "generate_churn_predictions",
    "identify_high_risk_customers",
    "generate_churn_report",
    "save_predictions",
    "build_churn_feature_frame",
    "train_churn_model_artifacts",
    "save_churn_model_artifacts",
    "load_churn_model_artifacts",
]

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

LOW_PURCHASE_FREQUENCY_THRESHOLD = 2.0
MIN_ORDER_THRESHOLD = 5
CHURN_COLUMNS = ["Total_Orders", "Purchase_Frequency", "Customer_Lifetime_Value"]
RISK_COLUMNS = CHURN_COLUMNS + ["Churn"]


def _validate_dataframe(df: Any, name: str = "df") -> pd.DataFrame:
    """Validate that the object is a non-empty pandas DataFrame."""
    if not isinstance(df, pd.DataFrame):
        raise TypeError(f"{name} must be a pandas DataFrame")
    if df.empty:
        raise ValueError(f"{name} must not be empty")
    return df


def _validate_columns(df: pd.DataFrame, required_columns: Sequence[str], function_name: str) -> None:
    """Validate that required columns exist in the DataFrame."""
    missing_columns = [column for column in required_columns if column not in df.columns]
    if missing_columns:
        raise KeyError(f"{function_name} requires columns: {missing_columns}")


def _validate_file_path(file_path: Union[str, Path]) -> Path:
    """Validate a file path and return a Path object."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Customer data file not found: {file_path}")
    if path.is_dir():
        raise ValueError(f"Path is a directory, expected a file: {file_path}")
    return path


def load_customer_data(file_path: Union[str, Path]) -> pd.DataFrame:
    """Load customer data from a CSV file.

    Args:
        file_path: Path to the customer data CSV file.

    Returns:
        A DataFrame containing customer records.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file is empty or cannot be read.
    """
    path = _validate_file_path(file_path)
    try:
        logger.info("Loading customer data from %s", path)
        df = pd.read_csv(path)
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error("Failed to read customer data from %s: %s", path, exc)
        raise ValueError(f"Failed to read customer data from {path}: {exc}") from exc

    if df.empty:
        raise ValueError("Loaded customer data is empty")

    return df


def preprocess_customer_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and normalize customer data for churn analysis.

    Args:
        df: Raw customer DataFrame.

    Returns:
        A cleaned DataFrame with numeric columns coerced and missing values handled.

    Raises:
        KeyError: If required columns are missing.
    """
    df = _validate_dataframe(df, "df")
    _validate_columns(df, CHURN_COLUMNS, "preprocess_customer_data")

    cleaned_df = df.copy()
    for column in CHURN_COLUMNS:
        cleaned_df[column] = pd.to_numeric(cleaned_df[column], errors="coerce")

    cleaned_df["Total_Orders"] = cleaned_df["Total_Orders"].fillna(0.0)
    cleaned_df["Purchase_Frequency"] = cleaned_df["Purchase_Frequency"].fillna(0.0)

    clv_median = cleaned_df["Customer_Lifetime_Value"].median()
    cleaned_df["Customer_Lifetime_Value"] = cleaned_df["Customer_Lifetime_Value"].fillna(
        clv_median if pd.notna(clv_median) else 0.0
    )

    return cleaned_df


def create_churn_labels(df: pd.DataFrame) -> pd.DataFrame:
    """Create churn labels based on business rules.

    A customer is marked as churned if any of these conditions are true:
    - Purchase_Frequency is below the configured threshold
    - Total_Orders is below the minimum order threshold
    - Customer_Lifetime_Value is below the dataset median

    Args:
        df: Customer DataFrame with churn-related columns.

    Returns:
        A DataFrame with a Churn column containing 'Yes' or 'No'.

    Raises:
        KeyError: If required columns are missing.
    """
    df = preprocess_customer_data(df)
    _validate_columns(df, CHURN_COLUMNS, "create_churn_labels")

    clv_median = df["Customer_Lifetime_Value"].median()
    churn_flags = (
        (df["Purchase_Frequency"] < LOW_PURCHASE_FREQUENCY_THRESHOLD)
        | (df["Total_Orders"] < MIN_ORDER_THRESHOLD)
        | (df["Customer_Lifetime_Value"] < clv_median)
    )
    df = df.copy()
    df["Churn"] = churn_flags.map({True: "Yes", False: "No"})
    return df


def create_churn_label(df: pd.DataFrame) -> pd.DataFrame:
    """Alias for create_churn_labels to support single-label naming."""
    return create_churn_labels(df)


def classify_customer_risk(df: pd.DataFrame) -> pd.DataFrame:
    """Assign a risk level and recommendation to each customer.

    Args:
        df: Customer DataFrame that may or may not already contain churn labels.

    Returns:
        A DataFrame with Risk_Level and Recommendation columns.

    Raises:
        KeyError: If required columns are missing.
    """
    df = _validate_dataframe(df, "df")
    _validate_columns(df, CHURN_COLUMNS, "classify_customer_risk")

    if "Churn" not in df.columns:
        df = create_churn_labels(df)
    else:
        df = preprocess_customer_data(df)

    clv_median = df["Customer_Lifetime_Value"].median()
    signal_count = (
        (df["Purchase_Frequency"] < LOW_PURCHASE_FREQUENCY_THRESHOLD).astype(int)
        + (df["Total_Orders"] < MIN_ORDER_THRESHOLD).astype(int)
        + (df["Customer_Lifetime_Value"] < clv_median).astype(int)
    )

    df = df.copy()
    df["Risk_Level"] = pd.cut(
        signal_count,
        bins=[-1, 0, 1, 3],
        labels=["Low Risk", "Medium Risk", "High Risk"],
    ).astype(str)

    recommendation_map = {
        "High Risk": "Immediate Retention Campaign",
        "Medium Risk": "Personalized Offers",
        "Low Risk": "Regular Engagement",
    }
    df["Recommendation"] = df["Risk_Level"].map(recommendation_map)
    return df


def generate_churn_predictions(df: pd.DataFrame) -> pd.DataFrame:
    """Generate churn predictions for a customer dataset.

    Args:
        df: Raw customer data.

    Returns:
        A DataFrame containing churn labels, risk levels, and recommendations.
    """
    logger.info("Generating churn predictions")
    return classify_customer_risk(create_churn_labels(preprocess_customer_data(df)))


def identify_high_risk_customers(df: pd.DataFrame) -> pd.DataFrame:
    """Return only customers classified as high risk."""
    df = _validate_dataframe(df, "df")
    if "Risk_Level" not in df.columns:
        df = classify_customer_risk(df)

    _validate_columns(df, ["Risk_Level"], "identify_high_risk_customers")
    high_risk_df = df.loc[df["Risk_Level"] == "High Risk"].copy()
    return high_risk_df


def generate_churn_report(df: pd.DataFrame) -> pd.DataFrame:
    """Generate a churn and risk summary report.

    Args:
        df: Customer data or churn predictions.

    Returns:
        A summary DataFrame with churn and risk statistics.
    """
    df = _validate_dataframe(df, "df")
    if "Risk_Level" not in df.columns or "Churn" not in df.columns:
        df = generate_churn_predictions(df)

    total_customers = len(df)
    churned_customers = (df["Churn"] == "Yes").sum()
    high_risk_customers = (df["Risk_Level"] == "High Risk").sum()
    medium_risk_customers = (df["Risk_Level"] == "Medium Risk").sum()
    low_risk_customers = (df["Risk_Level"] == "Low Risk").sum()

    report_data = {
        "Metric": [
            "Total Customers",
            "Churned Customers",
            "Churn Rate",
            "High Risk Customers",
            "Medium Risk Customers",
            "Low Risk Customers",
            "High Risk Rate",
        ],
        "Value": [
            total_customers,
            churned_customers,
            f"{churned_customers / total_customers:.2%}" if total_customers else "0.00%",
            high_risk_customers,
            medium_risk_customers,
            low_risk_customers,
            f"{high_risk_customers / total_customers:.2%}" if total_customers else "0.00%",
        ],
    }
    return pd.DataFrame(report_data)


def save_predictions(df: pd.DataFrame, output_path: Union[str, Path]) -> None:
    """Persist churn predictions to disk as a CSV file.

    Args:
        df: Prediction output DataFrame.
        output_path: Destination file path.

    Raises:
        TypeError: If df is not a DataFrame.
        ValueError: If the output path is empty.
        OSError: If the file cannot be written.
    """
    if not isinstance(df, pd.DataFrame):
        raise TypeError("df must be a pandas DataFrame")
    if not output_path:
        raise ValueError("output_path cannot be empty")

    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        df.to_csv(path, index=False)
        logger.info("Saved churn predictions to %s", path)
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error("Failed to save churn predictions: %s", exc)
        raise OSError(f"Failed to save churn predictions: {exc}") from exc


DEFAULT_CHURN_FEATURE_COLUMNS: Tuple[str, ...] = (
    "Total_Orders",
    "Purchase_Frequency",
    "Customer_Lifetime_Value",
    "Total_Revenue",
    "Average_Order_Value",
    "Average_Basket_Size",
    "Age",
    "Total_Quantity_Purchased",
)


def build_churn_feature_frame(
    df: pd.DataFrame,
    feature_columns: Optional[Sequence[str]] = None,
) -> pd.DataFrame:
    """Create a numeric feature frame for churn model training.

    The feature set is intentionally kept compact and production-friendly so it
    can be used in both training and inference with a saved scaler.
    """
    df = _validate_dataframe(df, "df")
    resolved_columns = list(feature_columns or DEFAULT_CHURN_FEATURE_COLUMNS)
    _validate_columns(df, resolved_columns, "build_churn_feature_frame")

    feature_df = df.loc[:, resolved_columns].copy()
    for column in resolved_columns:
        feature_df[column] = pd.to_numeric(feature_df[column], errors="coerce")

    feature_df = feature_df.fillna(0.0)
    return feature_df


def save_churn_model_artifacts(
    model: Any,
    scaler: StandardScaler,
    feature_columns: Sequence[str],
    model_path: Union[str, Path] = "models/churn_model.pkl",
    scaler_path: Union[str, Path] = "models/scaler_churn.pkl",
    feature_columns_path: Union[str, Path] = "models/churn_feature_cols.pkl",
) -> Dict[str, Path]:
    """Persist churn model artifacts to disk using joblib."""
    model_path = Path(model_path)
    scaler_path = Path(scaler_path)
    feature_columns_path = Path(feature_columns_path)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    scaler_path.parent.mkdir(parents=True, exist_ok=True)
    feature_columns_path.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(list(feature_columns), feature_columns_path)

    logger.info("Saved churn artifacts to %s, %s, %s", model_path, scaler_path, feature_columns_path)
    return {
        "model_path": model_path,
        "scaler_path": scaler_path,
        "feature_columns_path": feature_columns_path,
    }


def load_churn_model_artifacts(
    model_path: Union[str, Path] = "models/churn_model.pkl",
    scaler_path: Union[str, Path] = "models/scaler_churn.pkl",
    feature_columns_path: Union[str, Path] = "models/churn_feature_cols.pkl",
) -> Dict[str, Any]:
    """Load churn model artifacts produced by save_churn_model_artifacts."""
    model_path = Path(model_path)
    scaler_path = Path(scaler_path)
    feature_columns_path = Path(feature_columns_path)

    if not model_path.exists():
        raise FileNotFoundError(f"Churn model artifact not found: {model_path}")
    if not scaler_path.exists():
        raise FileNotFoundError(f"Churn scaler artifact not found: {scaler_path}")
    if not feature_columns_path.exists():
        raise FileNotFoundError(f"Churn feature column artifact not found: {feature_columns_path}")

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    feature_columns = joblib.load(feature_columns_path)

    return {
        "model": model,
        "scaler": scaler,
        "feature_columns": feature_columns,
    }


def _evaluate_churn_model(
    model: LogisticRegression,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    output_dir: Union[str, Path],
) -> Dict[str, Any]:
    """Evaluate the trained churn model and persist metrics and a confusion matrix plot."""
    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(y_test, predictions, zero_division=0)
    recall = recall_score(y_test, predictions, zero_division=0)
    f1 = f1_score(y_test, predictions, zero_division=0)
    roc_auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
    confusion_mat = confusion_matrix(y_test, predictions)
    report = classification_report(y_test, predictions, zero_division=0)

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    confusion_matrix_path = output_path / "churn_confusion_matrix.png"
    metrics_path = output_path / "churn_metrics.json"

    fig, ax = plt.subplots(figsize=(6, 5))
    image = ax.imshow(confusion_mat, interpolation="nearest", cmap=plt.cm.Blues)
    ax.set_title("Churn Confusion Matrix")
    ax.set_xlabel("Predicted Label")
    ax.set_ylabel("True Label")
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(["No", "Yes"])
    ax.set_yticklabels(["No", "Yes"])

    for row_index in range(confusion_mat.shape[0]):
        for col_index in range(confusion_mat.shape[1]):
            ax.text(
                col_index,
                row_index,
                confusion_mat[row_index, col_index],
                ha="center",
                va="center",
                color="white" if confusion_mat[row_index, col_index] > confusion_mat.max() / 2 else "black",
            )

    fig.colorbar(image, ax=ax)
    fig.tight_layout()
    fig.savefig(confusion_matrix_path, dpi=300, bbox_inches="tight")
    plt.close(fig)

    metrics = {
        "Accuracy": float(accuracy),
        "Precision": float(precision),
        "Recall": float(recall),
        "F1 Score": float(f1),
        "ROC-AUC": float(roc_auc),
    }

    with metrics_path.open("w", encoding="utf-8") as handle:
        json.dump(metrics, handle, indent=2)

    print("=========================")
    print("CHURN MODEL PERFORMANCE")
    print("=========================")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision : {precision:.4f}")
    print(f"Recall : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"ROC-AUC : {roc_auc:.4f}")
    print("")
    print("Classification Report")
    print(report)
    print(f"Confusion Matrix saved to {confusion_matrix_path}")
    print(f"Metrics saved to {metrics_path}")

    return {
        "metrics": metrics,
        "confusion_matrix_path": confusion_matrix_path,
        "metrics_path": metrics_path,
    }


def train_churn_model_artifacts(
    df: pd.DataFrame,
    feature_columns: Optional[Sequence[str]] = None,
    model_path: Union[str, Path] = "models/churn_model.pkl",
    scaler_path: Union[str, Path] = "models/scaler_churn.pkl",
    feature_columns_path: Union[str, Path] = "models/churn_feature_cols.pkl",
) -> Dict[str, Any]:
    """Train and persist a production churn model with a separate scaler."""
    df = create_churn_labels(df)
    feature_df = build_churn_feature_frame(df, feature_columns=feature_columns)
    labels = df["Churn"].eq("Yes").astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        feature_df,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=labels,
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    churn_model = LogisticRegression(
        max_iter=1000,
        random_state=42,
        class_weight="balanced",
    )
    churn_model.fit(X_train_scaled, y_train)

    saved_paths = save_churn_model_artifacts(
        churn_model,
        scaler,
        feature_df.columns.tolist(),
        model_path=model_path,
        scaler_path=scaler_path,
        feature_columns_path=feature_columns_path,
    )

    evaluation_results = _evaluate_churn_model(
        churn_model,
        X_test_scaled,
        y_test,
        Path(__file__).resolve().parent.parent / "outputs",
    )

    return {
        "model": churn_model,
        "scaler": scaler,
        "feature_columns": feature_df.columns.tolist(),
        "paths": saved_paths,
        "evaluation": evaluation_results,
    }
