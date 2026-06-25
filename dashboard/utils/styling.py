"""
RetailPulse :: Styling & Theming
================================

Centralised theme tokens + global CSS injection for a premium,
enterprise-grade look (professional blue / white / dark) featuring:

- Glassmorphism cards
- Smooth hover & entrance animations
- Loading shimmer/spinner
- Responsive / mobile-friendly layout tweaks
- Light & dark mode palettes

All colors are exposed through :data:`THEMES` so charts and components
stay visually consistent with the injected CSS.
"""

from __future__ import annotations

import streamlit as st

# ------------------------------------------------------------------
# Theme palettes (single source of truth for CSS + Plotly charts)
# ------------------------------------------------------------------
THEMES: dict[str, dict[str, str]] = {
    "dark": {
        "name": "dark",
        "bg": "#0b1220",
        "bg_alt": "#0f1830",
        "surface": "rgba(255, 255, 255, 0.04)",
        "surface_solid": "#141d33",
        "border": "rgba(255, 255, 255, 0.08)",
        "text": "#e8eefc",
        "text_muted": "#94a3c4",
        "primary": "#3b82f6",
        "primary_soft": "#1d4ed8",
        "accent": "#22d3ee",
        "success": "#22c55e",
        "warning": "#f59e0b",
        "danger": "#ef4444",
        "grid": "rgba(255,255,255,0.06)",
    },
    "light": {
        "name": "light",
        "bg": "#f4f7fc",
        "bg_alt": "#ffffff",
        "surface": "rgba(255, 255, 255, 0.75)",
        "surface_solid": "#ffffff",
        "border": "rgba(15, 23, 42, 0.08)",
        "text": "#0f1830",
        "text_muted": "#5b6b8c",
        "primary": "#2563eb",
        "primary_soft": "#1d4ed8",
        "accent": "#0891b2",
        "success": "#16a34a",
        "warning": "#d97706",
        "danger": "#dc2626",
        "grid": "rgba(15,23,42,0.07)",
    },
}

# Sequential / categorical palette shared by all Plotly charts.
CHART_SEQUENCE = [
    "#3b82f6", "#22d3ee", "#8b5cf6", "#22c55e",
    "#f59e0b", "#ec4899", "#14b8a6", "#ef4444",
]


def get_theme(mode: str = "dark") -> dict[str, str]:
    """Return the palette dict for ``mode`` (defaults to dark)."""
    return THEMES.get(mode, THEMES["dark"])


def plotly_layout(theme: dict[str, str]) -> dict:
    """Common Plotly layout kwargs that match the active theme."""
    return dict(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color=theme["text"], family="Inter, Segoe UI, sans-serif", size=13),
        margin=dict(l=10, r=10, t=50, b=10),
        legend=dict(bgcolor="rgba(0,0,0,0)", orientation="h", y=-0.18),
        xaxis=dict(gridcolor=theme["grid"], zerolinecolor=theme["grid"]),
        yaxis=dict(gridcolor=theme["grid"], zerolinecolor=theme["grid"]),
        colorway=CHART_SEQUENCE,
        hoverlabel=dict(
            bgcolor=theme["surface_solid"],
            font_size=12,
            font_family="Inter, sans-serif",
        ),
    )


def inject_css(mode: str = "dark") -> None:
    """Inject the global stylesheet for the chosen ``mode``."""
    t = get_theme(mode)

    css = f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    :root {{
        --rp-bg: {t['bg']};
        --rp-bg-alt: {t['bg_alt']};
        --rp-surface: {t['surface']};
        --rp-surface-solid: {t['surface_solid']};
        --rp-border: {t['border']};
        --rp-text: {t['text']};
        --rp-muted: {t['text_muted']};
        --rp-primary: {t['primary']};
        --rp-primary-soft: {t['primary_soft']};
        --rp-accent: {t['accent']};
        --rp-success: {t['success']};
        --rp-warning: {t['warning']};
        --rp-danger: {t['danger']};
    }}

    html, body, [class*="css"], .stApp {{
        font-family: 'Inter', 'Segoe UI', sans-serif;
    }}

    /* ---- App background (subtle radial gradient) ---- */
    .stApp {{
        background:
            radial-gradient(1200px 600px at 80% -10%, {t['primary']}22, transparent 60%),
            radial-gradient(1000px 500px at -10% 110%, {t['accent']}1a, transparent 55%),
            {t['bg']};
        color: var(--rp-text);
    }}

    /* ---- Hide default Streamlit chrome ---- */
    #MainMenu {{visibility: hidden;}}
    footer {{visibility: hidden;}}
    header[data-testid="stHeader"] {{background: transparent;}}
    .block-container {{padding-top: 1.4rem; padding-bottom: 3rem; max-width: 1500px;}}

    /* ---- Sidebar ---- */
    section[data-testid="stSidebar"] {{
        background: linear-gradient(180deg, {t['bg_alt']}, {t['bg']});
        border-right: 1px solid var(--rp-border);
    }}
    section[data-testid="stSidebar"] * {{ color: var(--rp-text); }}

    /* Hide Streamlit's auto multipage nav — we use a custom sidebar */
    [data-testid="stSidebarNav"] {{ display: none; }}

    /* ---- Glassmorphism card ---- */
    .rp-card {{
        background: var(--rp-surface);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid var(--rp-border);
        border-radius: 18px;
        padding: 18px 20px;
        box-shadow: 0 8px 30px rgba(2, 8, 23, 0.25);
        transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        animation: rp-fade-up .5s ease both;
    }}
    .rp-card:hover {{
        transform: translateY(-4px);
        border-color: {t['primary']}66;
        box-shadow: 0 14px 40px rgba(2, 8, 23, 0.4);
    }}

    /* ---- KPI card ---- */
    .rp-kpi {{
        position: relative;
        overflow: hidden;
        background: var(--rp-surface);
        backdrop-filter: blur(14px);
        border: 1px solid var(--rp-border);
        border-radius: 18px;
        padding: 16px 18px;
        min-height: 118px;
        transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        animation: rp-fade-up .5s ease both;
    }}
    .rp-kpi:hover {{
        transform: translateY(-5px);
        border-color: {t['primary']}66;
        box-shadow: 0 16px 42px rgba(2, 8, 23, 0.45);
    }}
    .rp-kpi::after {{
        content: "";
        position: absolute;
        top: -40%; right: -30%;
        width: 140px; height: 140px;
        background: radial-gradient(circle, {t['primary']}33, transparent 70%);
        border-radius: 50%;
    }}
    .rp-kpi .rp-kpi-label {{
        font-size: .78rem; font-weight: 600;
        color: var(--rp-muted); text-transform: uppercase;
        letter-spacing: .06em;
    }}
    .rp-kpi .rp-kpi-value {{
        font-size: 1.7rem; font-weight: 800; margin-top: 6px;
        color: var(--rp-text); line-height: 1.1;
    }}
    .rp-kpi .rp-kpi-icon {{
        font-size: 1.2rem; margin-bottom: 2px; display:block;
    }}
    .rp-kpi .rp-delta {{
        display: inline-flex; align-items: center; gap: 4px;
        margin-top: 8px; font-size: .8rem; font-weight: 600;
        padding: 2px 8px; border-radius: 999px;
    }}
    .rp-delta.up   {{ color: {t['success']}; background: {t['success']}1f; }}
    .rp-delta.down {{ color: {t['danger']};  background: {t['danger']}1f; }}
    .rp-delta.flat {{ color: var(--rp-muted); background: var(--rp-surface); }}

    /* ---- Section headings ---- */
    .rp-section-title {{
        font-size: 1.15rem; font-weight: 700; color: var(--rp-text);
        margin: 8px 0 2px 0; display:flex; align-items:center; gap:8px;
    }}
    .rp-section-sub {{ color: var(--rp-muted); font-size: .85rem; margin-bottom: 8px; }}

    /* ---- Hero / page header ---- */
    .rp-hero {{
        background: linear-gradient(110deg, {t['primary']}, {t['accent']});
        border-radius: 22px; padding: 22px 26px; color: white;
        box-shadow: 0 18px 50px {t['primary']}40;
        animation: rp-fade-up .5s ease both;
    }}
    .rp-hero h1 {{ font-size: 1.6rem; font-weight: 800; margin: 0; }}
    .rp-hero p  {{ opacity: .9; margin: 4px 0 0 0; font-size: .92rem; }}

    /* ---- Brand block (sidebar) ---- */
    .rp-brand {{
        display:flex; align-items:center; gap:12px; padding: 6px 4px 14px 4px;
        border-bottom: 1px solid var(--rp-border); margin-bottom: 12px;
    }}
    .rp-brand .logo {{
        width: 42px; height: 42px; border-radius: 12px;
        background: linear-gradient(135deg, {t['primary']}, {t['accent']});
        display:flex; align-items:center; justify-content:center;
        font-size: 1.3rem; box-shadow: 0 6px 18px {t['primary']}55;
    }}
    .rp-brand .title {{ font-weight: 800; font-size: 1.05rem; line-height:1; }}
    .rp-brand .subtitle {{ font-size: .72rem; color: var(--rp-muted); }}

    /* ---- Badges / alerts ---- */
    .rp-badge {{
        display:inline-flex; align-items:center; gap:6px;
        padding: 4px 10px; border-radius: 999px;
        font-size: .76rem; font-weight: 600;
    }}
    .rp-badge.red    {{ color:{t['danger']};  background:{t['danger']}1f; }}
    .rp-badge.amber  {{ color:{t['warning']}; background:{t['warning']}1f; }}
    .rp-badge.green  {{ color:{t['success']}; background:{t['success']}1f; }}
    .rp-badge.blue   {{ color:{t['primary']}; background:{t['primary']}1f; }}

    /* ---- Buttons ---- */
    .stButton > button, .stDownloadButton > button {{
        border-radius: 12px; border: 1px solid var(--rp-border);
        background: var(--rp-surface); color: var(--rp-text);
        font-weight: 600; transition: all .2s ease;
    }}
    .stButton > button:hover, .stDownloadButton > button:hover {{
        border-color: {t['primary']};
        box-shadow: 0 8px 22px {t['primary']}33;
        transform: translateY(-2px);
    }}

    /* ---- Tabs ---- */
    .stTabs [data-baseweb="tab-list"] {{ gap: 6px; }}
    .stTabs [data-baseweb="tab"] {{
        border-radius: 10px 10px 0 0; padding: 8px 16px;
        background: var(--rp-surface);
    }}
    .stTabs [aria-selected="true"] {{
        background: {t['primary']}22; color: var(--rp-text);
    }}

    /* ---- Dataframe polish ---- */
    [data-testid="stDataFrame"] {{ border-radius: 14px; overflow:hidden; }}

    /* ---- Loading shimmer ---- */
    .rp-shimmer {{
        height: 118px; border-radius: 18px;
        background: linear-gradient(90deg, {t['surface_solid']} 25%, {t['border']} 50%, {t['surface_solid']} 75%);
        background-size: 200% 100%;
        animation: rp-shimmer 1.3s infinite;
    }}
    @keyframes rp-shimmer {{ 0%{{background-position:200% 0}} 100%{{background-position:-200% 0}} }}

    /* ---- Entrance animation ---- */
    @keyframes rp-fade-up {{
        from {{ opacity: 0; transform: translateY(10px); }}
        to   {{ opacity: 1; transform: translateY(0); }}
    }}

    /* ---- Responsive / mobile ---- */
    @media (max-width: 768px) {{
        .rp-kpi .rp-kpi-value {{ font-size: 1.35rem; }}
        .rp-hero h1 {{ font-size: 1.25rem; }}
        .block-container {{ padding-left: .6rem; padding-right: .6rem; }}
    }}
    </style>
    """
    st.markdown(css, unsafe_allow_html=True)
