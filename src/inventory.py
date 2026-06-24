"""Inventory optimization module for retail demand planning."""

from typing import Dict, List
import pandas as pd

__all__ = [
    "calculate_safety_stock",
    "calculate_reorder_point",
    "calculate_inventory_gap",
    "identify_stockout_risk",
    "identify_overstock_risk",
    "generate_recommendations",
]


def calculate_safety_stock(
    demand_std: float, lead_time: float, service_level: float
) -> float:
    """Safety stock = z_score × sqrt(lead_time) × demand_std."""
    raise NotImplementedError


def calculate_reorder_point(
    avg_demand: float, lead_time: float, safety_stock: float
) -> float:
    """Reorder point = (avg_demand × lead_time) + safety_stock."""
    raise NotImplementedError


def calculate_inventory_gap(
    current_stock: float, optimal_level: float
) -> float:
    """Gap = optimal_level - current_stock. Negative = overstock."""
    raise NotImplementedError


def identify_stockout_risk(
    current_stock: float, reorder_point: float, lead_time: float
) -> bool:
    """Flag risk if current_stock approaches or falls below reorder point."""
    raise NotImplementedError


def identify_overstock_risk(
    current_stock: float, avg_demand: float, lead_time: float
) -> bool:
    """Flag risk if current_stock exceeds demand over lead time + buffer."""
    raise NotImplementedError


def optimize_inventory(df: pd.DataFrame) -> pd.DataFrame:
    """
    Optimize inventory levels based on demand and current stock.
    
    Parameters
    ----------
    df : pd.DataFrame
        Input dataframe with columns: Average_Daily_Demand, Net_Quantity
    
    Returns
    -------
    pd.DataFrame
        DataFrame with added columns: Safety_Stock, Reorder_Point, Inventory_Gap
    """
    result = df.copy()
    result["Safety_Stock"] = result["Average_Daily_Demand"] * 7
    result["Reorder_Point"] = result["Average_Daily_Demand"] * 14
    result["Inventory_Gap"] = result["Reorder_Point"] - result["Net_Quantity"]
    
    return result


def generate_recommendations(
    inventory_data: pd.DataFrame,
) -> pd.DataFrame:
    """Generate order/restock recommendations by SKU."""
    raise NotImplementedError
