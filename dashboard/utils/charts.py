"""
RetailPulse :: Charts
=====================

Reusable Plotly chart builders. Every function takes the active ``theme``
palette (from :mod:`utils.styling`) so all charts stay visually consistent
with the injected CSS, in both light and dark modes.
"""

from __future__ import annotations

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from utils.styling import CHART_SEQUENCE, plotly_layout


def _rgba(hex_color: str, alpha: float) -> str:
    """Convert a #rrggbb theme color to Plotly-compatible rgba()."""
    value = hex_color.lstrip("#")
    if len(value) != 6:
        return hex_color
    r, g, b = (int(value[i:i + 2], 16) for i in (0, 2, 4))
    return f"rgba({r},{g},{b},{alpha})"


def _apply(fig: go.Figure, theme: dict, title: str | None = None,
           height: int = 340) -> go.Figure:
    fig.update_layout(**plotly_layout(theme), height=height)
    if title:
        fig.update_layout(title=dict(text=title, x=0.01, font=dict(size=15)))
    return fig


# ------------------------------------------------------------------
# Time-series / trend charts
# ------------------------------------------------------------------
def line_trend(df: pd.DataFrame, x: str, y: str, theme: dict,
               title: str = "", color: str | None = None,
               area: bool = True, height: int = 340) -> go.Figure:
    """Smooth line/area trend chart."""
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df[x], y=df[y], mode="lines",
        line=dict(color=color or theme["primary"], width=2.6, shape="spline"),
        fill="tozeroy" if area else None,
        fillcolor=_rgba(color or theme["primary"], 0.13),
        name=y.title(),
    ))
    return _apply(fig, theme, title, height)


def forecast_chart(history: pd.DataFrame, forecast: pd.DataFrame,
                   theme: dict, split_date, title: str = "Demand Forecast",
                   height: int = 420) -> go.Figure:
    """History + forecast with confidence interval band."""
    fig = go.Figure()

    # Confidence interval
    fig.add_trace(go.Scatter(
        x=list(forecast["ds"]) + list(forecast["ds"][::-1]),
        y=list(forecast["yhat_upper"]) + list(forecast["yhat_lower"][::-1]),
        fill="toself", fillcolor=_rgba(theme["accent"], 0.13),
        line=dict(color="rgba(0,0,0,0)"), name="Confidence Interval",
        hoverinfo="skip",
    ))
    # History
    fig.add_trace(go.Scatter(
        x=history["ds"], y=history["y"], mode="lines",
        line=dict(color=theme["primary"], width=2.4), name="Historical",
    ))
    # Forecast (future only)
    future = forecast[forecast["ds"] > split_date]
    fig.add_trace(go.Scatter(
        x=future["ds"], y=future["yhat"], mode="lines",
        line=dict(color=theme["accent"], width=2.8, dash="dash"), name="Forecast",
    ))
    fig.add_vline(x=split_date, line_width=1, line_dash="dot",
                  line_color=theme["text_muted"])
    return _apply(fig, theme, title, height)


# ------------------------------------------------------------------
# Distribution / categorical charts
# ------------------------------------------------------------------
def bar_ranking(df: pd.DataFrame, x: str, y: str, theme: dict,
                title: str = "", horizontal: bool = True,
                height: int = 340) -> go.Figure:
    """Ranked bar chart (top-N)."""
    if horizontal:
        fig = px.bar(df, x=x, y=y, orientation="h",
                     color=x, color_continuous_scale=["#1d4ed8", "#22d3ee"])
    else:
        fig = px.bar(df, x=x, y=y, color=y,
                     color_continuous_scale=["#1d4ed8", "#22d3ee"])
    fig.update_layout(coloraxis_showscale=False)
    return _apply(fig, theme, title, height)


def donut(labels, values, theme: dict, title: str = "",
          height: int = 340) -> go.Figure:
    """Donut / pie distribution chart."""
    fig = go.Figure(go.Pie(
        labels=labels, values=values, hole=0.58,
        marker=dict(colors=CHART_SEQUENCE,
                    line=dict(color=theme["bg"], width=2)),
        textinfo="percent", textfont=dict(size=12),
    ))
    return _apply(fig, theme, title, height)


def histogram(series, theme: dict, title: str = "", nbins: int = 40,
              color: str | None = None, height: int = 340) -> go.Figure:
    """Distribution histogram."""
    fig = go.Figure(go.Histogram(
        x=series, nbinsx=nbins,
        marker=dict(color=_rgba(color or theme["primary"], 0.8),
                    line=dict(color=theme["bg"], width=0.5)),
    ))
    return _apply(fig, theme, title, height)


def scatter_clusters(df: pd.DataFrame, x: str, y: str, color: str,
                     theme: dict, size: str | None = None,
                     title: str = "", height: int = 420) -> go.Figure:
    """Cluster scatter plot (e.g. recency vs monetary by cluster)."""
    fig = px.scatter(
        df, x=x, y=y, color=color, size=size,
        color_discrete_sequence=CHART_SEQUENCE, opacity=0.78,
        hover_data=df.columns[:6],
    )
    fig.update_traces(marker=dict(line=dict(width=0.4, color=theme["bg"])))
    return _apply(fig, theme, title, height)


def grouped_bar(df: pd.DataFrame, x: str, y: str, color: str, theme: dict,
                title: str = "", height: int = 360) -> go.Figure:
    """Grouped/stacked categorical comparison."""
    fig = px.bar(df, x=x, y=y, color=color, barmode="group",
                 color_discrete_sequence=CHART_SEQUENCE)
    return _apply(fig, theme, title, height)


def heatmap(matrix: pd.DataFrame, theme: dict, title: str = "",
            height: int = 420, colorscale: str = "Blues") -> go.Figure:
    """Generic heatmap (e.g. product stock by category/status)."""
    fig = go.Figure(go.Heatmap(
        z=matrix.values, x=list(matrix.columns), y=list(matrix.index),
        colorscale=colorscale, hoverongaps=False,
    ))
    return _apply(fig, theme, title, height)


def gauge(value: float, theme: dict, title: str = "Health Score",
          height: int = 280, vmax: float = 100) -> go.Figure:
    """Radial gauge for a single 0-100 KPI."""
    color = (theme["success"] if value >= 70 else
             theme["warning"] if value >= 45 else theme["danger"])
    fig = go.Figure(go.Indicator(
        mode="gauge+number", value=value,
        number=dict(suffix=" / 100", font=dict(size=26)),
        gauge=dict(
            axis=dict(range=[0, vmax], tickcolor=theme["text_muted"]),
            bar=dict(color=color, thickness=0.28),
            bgcolor="rgba(0,0,0,0)",
            borderwidth=0,
            steps=[
                dict(range=[0, 45], color=_rgba(theme["danger"], 0.2)),
                dict(range=[45, 70], color=_rgba(theme["warning"], 0.2)),
                dict(range=[70, 100], color=_rgba(theme["success"], 0.2)),
            ],
        ),
    ))
    return _apply(fig, theme, title, height)
