"""
RetailPulse :: UI Components
============================

Reusable HTML/Streamlit building blocks: KPI cards, section headers,
hero banners, badges/alerts, notification center and export helpers.

Keeping these here means every page renders with identical, on-brand
markup and the glassmorphism styling defined in :mod:`utils.styling`.
"""

from __future__ import annotations

import io
from datetime import datetime

import pandas as pd
import streamlit as st


# ------------------------------------------------------------------
# Formatting helpers
# ------------------------------------------------------------------
def human_number(n: float, currency: bool = False) -> str:
    """Format large numbers compactly: 1.2K, 3.4M, 1.1B."""
    prefix = "$" if currency else ""
    try:
        n = float(n)
    except (TypeError, ValueError):
        return str(n)
    for unit, div in (("B", 1e9), ("M", 1e6), ("K", 1e3)):
        if abs(n) >= div:
            return f"{prefix}{n / div:.2f}{unit}"
    return f"{prefix}{n:,.0f}"


# ------------------------------------------------------------------
# KPI cards
# ------------------------------------------------------------------
def kpi_card(label: str, value: str, icon: str = "📊",
             delta: float | None = None, delta_suffix: str = "%") -> str:
    """Return HTML for a single glassmorphism KPI card."""
    delta_html = ""
    if delta is not None:
        cls = "up" if delta > 0 else "down" if delta < 0 else "flat"
        arrow = "▲" if delta > 0 else "▼" if delta < 0 else "■"
        delta_html = (f"<span class='rp-delta {cls}'>{arrow} "
                      f"{abs(delta):.1f}{delta_suffix}</span>")
    return f"""
    <div class="rp-kpi">
        <span class="rp-kpi-icon">{icon}</span>
        <div class="rp-kpi-label">{label}</div>
        <div class="rp-kpi-value">{value}</div>
        {delta_html}
    </div>
    """


def kpi_row(cards: list[str], per_row: int = 4) -> None:
    """Render a responsive row (or grid) of KPI card HTML strings."""
    for i in range(0, len(cards), per_row):
        chunk = cards[i:i + per_row]
        cols = st.columns(len(chunk))
        for col, html in zip(cols, chunk):
            col.markdown(html, unsafe_allow_html=True)


# ------------------------------------------------------------------
# Headers / layout primitives
# ------------------------------------------------------------------
def hero(title: str, subtitle: str = "") -> None:
    """Gradient page header banner."""
    st.markdown(
        f"""<div class="rp-hero"><h1>{title}</h1><p>{subtitle}</p></div>""",
        unsafe_allow_html=True,
    )


def section(title: str, subtitle: str = "", icon: str = "") -> None:
    """Section heading with optional subtitle."""
    st.markdown(
        f"""<div class="rp-section-title">{icon} {title}</div>"""
        + (f"""<div class="rp-section-sub">{subtitle}</div>""" if subtitle else ""),
        unsafe_allow_html=True,
    )


def card_open() -> None:
    st.markdown('<div class="rp-card">', unsafe_allow_html=True)


def card_close() -> None:
    st.markdown("</div>", unsafe_allow_html=True)


def badge(text: str, color: str = "blue") -> str:
    """Return a pill badge (color: red/amber/green/blue)."""
    return f'<span class="rp-badge {color}">{text}</span>'


def alert(level: str, message: str) -> None:
    """Coloured alert line. level: critical/low/healthy/info."""
    icons = {"critical": "🔴", "low": "🟠", "healthy": "🟢", "info": "🔵"}
    colors = {"critical": "red", "low": "amber", "healthy": "green", "info": "blue"}
    st.markdown(
        badge(f"{icons.get(level, 'ℹ️')} {message}", colors.get(level, "blue")),
        unsafe_allow_html=True,
    )


# ------------------------------------------------------------------
# Notification center / search (sidebar widgets)
# ------------------------------------------------------------------
def notification_center(notifications: list[dict]) -> None:
    """Render a collapsible notification panel."""
    unread = sum(1 for n in notifications if not n.get("read"))
    with st.expander(f"🔔 Notifications ({unread})", expanded=False):
        for n in notifications:
            icon = {"critical": "🔴", "low": "🟠", "info": "🔵",
                    "success": "🟢"}.get(n["type"], "🔵")
            st.markdown(f"{icon} **{n['title']}**  \n"
                        f"<span style='color:#94a3c4;font-size:.8rem'>{n['body']}</span>",
                        unsafe_allow_html=True)
            st.divider()


def loading(text: str = "Crunching numbers…"):
    """Context manager wrapper for a themed spinner."""
    return st.spinner(text)


# ------------------------------------------------------------------
# Export helpers
# ------------------------------------------------------------------
def to_csv_bytes(df: pd.DataFrame) -> bytes:
    return df.to_csv(index=False).encode("utf-8")


def to_excel_bytes(df: pd.DataFrame, sheet_name: str = "Report") -> bytes:
    buffer = io.BytesIO()
    try:
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name=sheet_name[:31])
    except Exception:
        # Fallback: CSV bytes if openpyxl missing.
        return to_csv_bytes(df)
    return buffer.getvalue()


def to_pdf_bytes(title: str, df: pd.DataFrame, summary: str = "") -> bytes:
    """Render a simple tabular PDF report. Falls back to plain text bytes."""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import (Paragraph, SimpleDocTemplate, Spacer,
                                        Table, TableStyle)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
        styles = getSampleStyleSheet()
        elems = [Paragraph(f"RetailPulse — {title}", styles["Title"])]
        elems.append(Paragraph(
            f"Generated {datetime.now():%Y-%m-%d %H:%M}", styles["Normal"]))
        if summary:
            elems.append(Spacer(1, 8))
            elems.append(Paragraph(summary, styles["Normal"]))
        elems.append(Spacer(1, 14))

        preview = df.head(40).copy()
        data = [list(preview.columns)] + preview.astype(str).values.tolist()
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d4ed8")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#f1f5f9")]),
        ]))
        elems.append(table)
        doc.build(elems)
        return buffer.getvalue()
    except Exception:
        return f"RetailPulse — {title}\n\n{summary}\n\n{df.head(40).to_string()}".encode()


def export_buttons(df: pd.DataFrame, name: str, summary: str = "") -> None:
    """Render CSV / Excel / PDF download buttons side by side."""
    c1, c2, c3 = st.columns(3)
    c1.download_button("⬇️ CSV", to_csv_bytes(df), f"{name}.csv",
                       "text/csv", use_container_width=True)
    c2.download_button("⬇️ Excel", to_excel_bytes(df, name), f"{name}.xlsx",
                       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                       use_container_width=True)
    c3.download_button("⬇️ PDF", to_pdf_bytes(name, df, summary), f"{name}.pdf",
                       "application/pdf", use_container_width=True)
