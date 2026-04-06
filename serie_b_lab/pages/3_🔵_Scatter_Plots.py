"""
Scatter Plots page - Compare all teams on two metrics.
"""

import streamlit as st
import plotly.graph_objects as go

from utils.theme import (
    inject_css,
    get_plotly_layout,
    ACCENT_GREEN,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
)
from utils.data_loader import load_team_summary

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Scatter Plots - Série B Lab", layout="wide")
inject_css()

# ---------------------------------------------------------------------------
# Metric options and column mapping
# ---------------------------------------------------------------------------
METRIC_OPTIONS: list[str] = [
    "xG adj.",
    "xGA adj.",
    "xG",
    "xGA",
    "npxG",
    "npxGA",
    "Shots",
    "Shots Against",
    "Possession",
    "PPDA",
    "Box Touches",
    "Box Touches Against",
    "Big Chances",
    "Big Chances Against",
    "Goals",
    "Goals Against",
]

# Presets: name -> (y_metric, x_metric)
PRESETS: dict[str, tuple[str, str]] = {
    "xGA adj. vs xG adj.": ("xGA adj.", "xG adj."),
    "PPDA vs Possession": ("PPDA", "Possession"),
    "Shots vs xG/Shot": ("Shots", "xG/Shot"),
}

# Map display name -> (column_name, per_game, is_defensive)
# per_game means divide by matches_played; is_defensive means invert y-axis
COLUMN_MAP: dict[str, tuple[str, bool, bool]] = {
    "xG adj.": ("xg_for", True, False),
    "xGA adj.": ("xg_against", True, True),
    "xG": ("xg_for", True, False),
    "xGA": ("xg_against", True, True),
    "npxG": ("npxg_for", True, False),
    "npxGA": ("npxg_against", True, True),
    "Shots": ("shots_for", True, False),
    "Shots Against": ("shots_against", True, True),
    "Possession": ("possession_avg", False, False),
    "PPDA": ("ppda", False, True),
    "Box Touches": ("box_touches_for", True, False),
    "Box Touches Against": ("box_touches_against", True, True),
    "Big Chances": ("big_chances_for", True, False),
    "Big Chances Against": ("big_chances_against", True, True),
    "Goals": ("goals_for", True, False),
    "Goals Against": ("goals_against", True, True),
}


def resolve_metric(df, metric_name: str):
    """Return a Series of values for the given metric name."""
    if metric_name == "xG/Shot":
        return (df["xg_for"] / df["shots_for"]).round(3)

    col, per_game, _ = COLUMN_MAP[metric_name]
    vals = df[col].astype(float)
    if per_game:
        vals = vals / df["matches_played"]
    return vals.round(3)


def is_defensive(metric_name: str) -> bool:
    """Return True if lower values are better (should invert y-axis)."""
    if metric_name == "xG/Shot":
        return False
    _, _, defensive = COLUMN_MAP[metric_name]
    return defensive


# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------
col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    preset = st.selectbox(
        "Preset",
        ["xGA adj. vs xG adj.", "PPDA vs Possession", "Shots vs xG/Shot", "Custom"],
    )

is_custom = preset == "Custom"

# Default axes from preset
if preset in PRESETS:
    default_y, default_x = PRESETS[preset]
else:
    default_y, default_x = "xGA adj.", "xG adj."

all_x_options = METRIC_OPTIONS + ["xG/Shot"]

with col2:
    y_metric = st.selectbox(
        "Y-axis metric",
        METRIC_OPTIONS,
        index=METRIC_OPTIONS.index(default_y) if default_y in METRIC_OPTIONS else 0,
        disabled=not is_custom,
    )
with col3:
    x_metric = st.selectbox(
        "X-axis metric",
        all_x_options,
        index=all_x_options.index(default_x) if default_x in all_x_options else 0,
        disabled=not is_custom,
    )
with col4:
    matches_filter = st.selectbox("Matches", ["All", "Home", "Away"])
with col5:
    value_type = st.selectbox("Type", ["Raw", "Adjusted"])

# Override axes when using a preset
if not is_custom and preset in PRESETS:
    y_metric, x_metric = PRESETS[preset]

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
header_left, header_right = st.columns([3, 1])

with header_left:
    st.markdown(
        f'<h2 style="color:{TEXT_PRIMARY}; margin-bottom:0;">S\u00e9rie B 2026</h2>',
        unsafe_allow_html=True,
    )

with header_right:
    st.markdown(
        f'<p style="color:{TEXT_SECONDARY}; text-align:right; font-size:0.85rem; '
        f'margin-top:1.2rem;">{matches_filter} Matches \u2013 '
        f'{y_metric} vs {x_metric}</p>',
        unsafe_allow_html=True,
    )

# ---------------------------------------------------------------------------
# Data preparation
# ---------------------------------------------------------------------------
df = load_team_summary().copy()

x_vals = resolve_metric(df, x_metric)
y_vals = resolve_metric(df, y_metric)

avg_x = float(x_vals.mean())
avg_y = float(y_vals.mean())

invert_y = is_defensive(y_metric)

# ---------------------------------------------------------------------------
# Build scatter chart
# ---------------------------------------------------------------------------
fig = go.Figure()

fig.add_trace(
    go.Scatter(
        x=x_vals,
        y=y_vals,
        mode="markers+text",
        text=df["team_short"],
        textposition="top center",
        textfont=dict(color=TEXT_PRIMARY, size=10),
        marker=dict(
            size=10,
            color=ACCENT_GREEN,
            opacity=0.8,
            line=dict(width=1, color=TEXT_PRIMARY),
        ),
        customdata=df["team"].values,
        hovertemplate=(
            "<b>%{customdata}</b><br>"
            f"{x_metric}: %{{x:.2f}}<br>"
            f"{y_metric}: %{{y:.2f}}<extra></extra>"
        ),
    )
)

# Mean reference lines
fig.add_vline(
    x=avg_x,
    line_dash="dash",
    line_color="rgba(255,255,255,0.3)",
    line_width=1,
)
fig.add_hline(
    y=avg_y,
    line_dash="dash",
    line_color="rgba(255,255,255,0.3)",
    line_width=1,
)

# Layout
layout_kwargs = get_plotly_layout(
    xaxis={"title": x_metric},
    yaxis={
        "title": y_metric,
        "autorange": "reversed" if invert_y else True,
    },
    showlegend=False,
    height=600,
    margin={"l": 60, "r": 40, "t": 50, "b": 60},
)
fig.update_layout(**layout_kwargs)

st.plotly_chart(fig, use_container_width=True)

# ---------------------------------------------------------------------------
# Quadrant annotation
# ---------------------------------------------------------------------------
if invert_y:
    annotation_text = (
        "Top-right: Strong attack + Strong defense &nbsp;|&nbsp; "
        "Top-left: Weak attack + Strong defense &nbsp;|&nbsp; "
        "Bottom-right: Strong attack + Weak defense &nbsp;|&nbsp; "
        "Bottom-left: Weak attack + Weak defense"
    )
else:
    annotation_text = (
        "Top-right: High in both metrics &nbsp;|&nbsp; "
        "Top-left: High Y, Low X &nbsp;|&nbsp; "
        "Bottom-right: Low Y, High X &nbsp;|&nbsp; "
        "Bottom-left: Low in both metrics"
    )

st.markdown(
    f'<p style="color:{TEXT_SECONDARY}; font-size:0.72rem; text-align:center; '
    f'margin-top:-0.5rem;">{annotation_text}</p>',
    unsafe_allow_html=True,
)
