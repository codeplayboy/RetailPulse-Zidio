"""Inventory optimization module for retail demand planning."""

from __future__ import annotations

import logging
from typing import Any, Dict, Tuple

import numpy as np
import pandas as pd

__all__ = [
    "calculate_safety_stock",
    "calculate_reorder_point",
    "calculate_inventory_gap",
    "identify_stockout_risk",
    "identify_overstock_risk",
    "optimize_inventory",
    "generate_recommendations",
]

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

SERVICE_LEVEL_ZSCORES: Dict[float, float] = {
    0.85: 1.04,
    0.90: 1.28,
    0.95: 1.645,
    0.99: 2.326,
}


def _validate_dataframe(df: Any, name: str = "DataFrame") -> pd.DataFrame:
    """Validate that the input is a non-empty pandas DataFrame."""
    if not isinstance(df, pd.DataFrame):
        raise TypeError(f"{name} must be a pandas DataFrame")
    if df.empty:
        raise ValueError(f"{name} must not be empty")
    return df


def _validate_columns(df: pd.DataFrame, columns: Tuple[str, ...], context: str) -> None:
    """Validate that required columns exist in the DataFrame."""
    missing = [column for column in columns if column not in df.columns]
    if missing:
        raise KeyError(f"{context} requires columns: {missing}")


def _validate_non_negative(value: float, name: str) -> None:
    """Validate that numeric values are non-negative."""
    if not isinstance(value, (int, float)):
        raise TypeError(f"{name} must be a numeric value")
    if value < 0:
        raise ValueError(f"{name} must be non-negative")


def calculate_safety_stock(avg_demand: float, lead_time: float = 7.0) -> float:
    """Calculate safety stock using a fixed lead-time buffer.

    Safety Stock = Average_Daily_Demand × 7

    Args:
        avg_demand: Average daily demand.
        lead_time: Lead time in days. Default is 7 days.

    Returns:
        Safety stock quantity.

    Raises:
        TypeError: If inputs are not numeric.
        ValueError: If inputs are negative.
    """
    _validate_non_negative(avg_demand, "avg_demand")
    _validate_non_negative(lead_time, "lead_time")

    return float(avg_demand * 7)


def calculate_reorder_point(avg_demand: float, lead_time: float, safety_stock: float) -> float:
    """Calculate the reorder point.

    Reorder Point = (Average_Daily_Demand × Lead Time) + Safety Stock

    Args:
        avg_demand: Average daily demand.
        lead_time: Lead time in days.
        safety_stock: Safety stock quantity.

    Returns:
        Reorder point quantity.

    Raises:
        TypeError: If inputs are not numeric.
        ValueError: If inputs are negative.
    """
    _validate_non_negative(avg_demand, "avg_demand")
    _validate_non_negative(lead_time, "lead_time")
    _validate_non_negative(safety_stock, "safety_stock")

    return float((avg_demand * lead_time) + safety_stock)


def calculate_inventory_gap(current_stock: float, optimal_level: float) -> float:
    """Calculate the inventory gap.

    Inventory Gap = Optimal Level − Current Stock

    Args:
        current_stock: Current inventory quantity.
        optimal_level: Optimal inventory level.

    Returns:
        Inventory gap. Positive indicates a shortage.

    Raises:
        TypeError: If inputs are not numeric.
    """
    if not isinstance(current_stock, (int, float)):
        raise TypeError("current_stock must be numeric")
    if not isinstance(optimal_level, (int, float)):
        raise TypeError("optimal_level must be numeric")

    return float(optimal_level - current_stock)


def identify_stockout_risk(current_stock: float, reorder_point: float) -> bool:
    """Determine whether the current stock poses stockout risk.

    Args:
        current_stock: Current inventory quantity.
        reorder_point: Reorder point threshold.

    Returns:
        True if stockout risk exists.

    Raises:
        TypeError: If inputs are not numeric.
    """
    if not isinstance(current_stock, (int, float)):
        raise TypeError("current_stock must be numeric")
    if not isinstance(reorder_point, (int, float)):
        raise TypeError("reorder_point must be numeric")

    return current_stock <= reorder_point


def identify_overstock_risk(current_stock: float, avg_demand: float, lead_time: float = 14.0) -> bool:
    """Determine whether the current stock is overstocked.

    Args:
        current_stock: Current inventory quantity.
        avg_demand: Average daily demand.
        lead_time: Lead time in days.

    Returns:
        True if overstock risk exists.

    Raises:
        TypeError: If inputs are not numeric.
        ValueError: If avg_demand or lead_time are negative.
    """
    if not isinstance(current_stock, (int, float)):
        raise TypeError("current_stock must be numeric")
    _validate_non_negative(avg_demand, "avg_demand")
    _validate_non_negative(lead_time, "lead_time")

    threshold = avg_demand * lead_time * 2
    return current_stock > threshold


def optimize_inventory(df: pd.DataFrame) -> pd.DataFrame:
    """Compute inventory metrics and status for each SKU.

    Args:
        df: DataFrame with columns Average_Daily_Demand and Net_Quantity.

    Returns:
        DataFrame enriched with inventory calculations.

    Raises:
        TypeError: If df is not a DataFrame.
        ValueError: If df is empty.
        KeyError: If required columns are missing.
    """
    df = _validate_dataframe(df, "df")
    _validate_columns(df, ("Average_Daily_Demand", "Net_Quantity"), "optimize_inventory")

    result = df.copy()
    result["Safety_Stock"] = result["Average_Daily_Demand"].astype(float) * 7
    result["Reorder_Point"] = result["Average_Daily_Demand"].astype(float) * 14
    result["Inventory_Gap"] = result["Reorder_Point"] - result["Net_Quantity"].astype(float)
    result["Inventory_Status"] = result["Inventory_Gap"].apply(
        lambda gap: "Restock Required" if gap > 0 else "Sufficient Stock"
    )
    result["Restock_Recommendation"] = result["Inventory_Status"].map(
        {
            "Restock Required": "Order More",
            "Sufficient Stock": "No Action Required",
        }
    )
    result["Order_Quantity"] = result["Inventory_Gap"].apply(lambda gap: max(0.0, float(gap)))

    logger.info("Optimized inventory for %s records", len(result))
    return result


def generate_recommendations(inventory_data: pd.DataFrame) -> pd.DataFrame:
    """Generate restock recommendations from optimized inventory data.

    Args:
        inventory_data: DataFrame produced by optimize_inventory.

    Returns:
        DataFrame with recommendations and order quantities.

    Raises:
        TypeError: If inventory_data is not a DataFrame.
        KeyError: If required columns are missing.
    """
    inventory_data = _validate_dataframe(inventory_data, "inventory_data")
    _validate_columns(
        inventory_data,
        ("Inventory_Gap", "Inventory_Status"),
        "generate_recommendations",
    )

    result = inventory_data.copy()
    result["Recommendation"] = result["Inventory_Status"].apply(
        lambda status: "Order More" if status == "Restock Required" else "No Action Required"
    )
    result["Order_Quantity"] = result.apply(
        lambda row: max(0.0, float(row["Inventory_Gap"]))
        if row["Recommendation"] == "Order More"
        else 0.0,
        axis=1,
    )

    logger.info("Generated recommendations for %s records", len(result))
    return result
