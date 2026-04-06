"""
Trends page - Rolling average trend charts for individual teams.
"""

import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from utils.theme import (
    inject_css,
    get_plotly_layout,
    ACCENT_GREEN,
    ACCENT_PINK,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
)
from utils.data_loader import load_match_data, get_team_list
from utils.metrics import rolling_average

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Trends - Série B Lab", layout="wide")
inject_css()

# ---------------------------------------------------------------------------
# Metric mapping: display name -> (for_column, against_column | None)
# ---------------------------------------------------------------------------
METRIC_MAP: dict[str, tuple[str, str | None]] = {
    "Blend xG adj.": ("xg", "xga"),
    "xG": ("xg", "xga"),
    "npxG": ("xg", "xga"),       # using xg as proxy since match data has xg
    "xGOT": ("xg", "xga"),       # using xg as proxy
    "Shots": ("shots", "shots_against"),
    "Possession": ("possession", None),
}

# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------
teams = get_team_list()

col1, col2, col3, col4 = st.columns(4)

with col1:
    selected_team = st.selectbox("Team", teams)
with col2:
    selected_metric = st.selectbox(
        "Metric",
        ["Blend xG adj.", "xG", "npxG", "xGOT", "Shots", "Possession"],
    )
with col3:
    selected_type = st.selectbox("Type", ["Raw", "Adjusted"])
with col4:
    window_option = st.selectbox(
        "Window",
        ["5-game average", "10-game average", "Full Season"],
    )

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
header_left, header_right = st.columns([3, 1])

with header_left:
    st.markdown(
        f'<h2 style="color:{TEXT_PRIMARY}; margin-bottom:0;">{selected_team}</h2>',
        unsafe_allow_html=True,
    )
    st.markdown(
        f'<p style="color:{TEXT_SECONDARY}; font-size:0.85rem; margin-top:0;">'
        f'S\u00e9rie B 2026</p>',
        unsafe_allow_html=True,
    )

with header_right:
    st.markdown(
        f'<p style="color:{TEXT_SECONDARY}; text-align:right; font-size:0.85rem; '
        f'margin-top:1.2rem;">{selected_metric} \u00b7 {window_option}</p>',
        unsafe_allow_html=True,
    )

# ---------------------------------------------------------------------------
# Load and prepare data
# ---------------------------------------------------------------------------
match_df = load_match_data(team=selected_team)

if match_df.empty:
    st.warning("No match data available for this team.")
    st.stop()

match_df = match_df.sort_values("matchday").reset_index(drop=True)
match_df["match_num"] = match_df.index + 1

# Resolve columns
for_col, against_col = METRIC_MAP[selected_metric]

# Parse window
if window_option == "5-game average":
    window = 5
elif window_option == "10-game average":
    window = 10
else:
    window = len(match_df)

# Calculate rolling averages
roll_for = rolling_average(match_df[for_col], window)
avg_for = float(match_df[for_col].mean())

has_against = against_col is not None
if has_against:
    roll_against = rolling_average(match_df[against_col], window)
    avg_against = float(match_df[against_col].mean())
    differential = match_df[for_col] - match_df[against_col]

# ---------------------------------------------------------------------------
# Build chart
# ---------------------------------------------------------------------------
fig = make_subplots(specs=[[{"secondary_y": True}]])

# Bar trace: differential (only if there is an "against" metric)
if has_against:
    bar_colors = ["rgba(160,160,160,0.30)"] * len(match_df)
    fig.add_trace(
        go.Bar(
            x=match_df["match_num"],
            y=differential,
            name="Differential",
            marker_color=bar_colors,
            hovertemplate="Game %{x}<br>Diff: %{y:.2f}<extra></extra>",
            showlegend=False,
        ),
        secondary_y=True,
    )

# Line: For metric rolling average
fig.add_trace(
    go.Scatter(
        x=match_df["match_num"],
        y=roll_for,
        mode="lines",
        name=f"{selected_metric} For ({avg_for:.2f})",
        line=dict(color=ACCENT_GREEN, width=2.5),
        hovertemplate="Game %{x}<br>%{y:.2f}<extra></extra>",
    ),
    secondary_y=False,
)

# Line: Against metric rolling average
if has_against:
    fig.add_trace(
        go.Scatter(
            x=match_df["match_num"],
            y=roll_against,
            mode="lines",
            name=f"{selected_metric} Against ({avg_against:.2f})",
            line=dict(color=ACCENT_PINK, width=2.5),
            hovertemplate="Game %{x}<br>%{y:.2f}<extra></extra>",
        ),
        secondary_y=False,
    )

# Horizontal dashed lines for season averages
fig.add_hline(
    y=avg_for,
    line_dash="dash",
    line_color=ACCENT_GREEN,
    line_width=1,
    opacity=0.6,
    secondary_y=False,
)

if has_against:
    fig.add_hline(
        y=avg_against,
        line_dash="dash",
        line_color=ACCENT_PINK,
        line_width=1,
        opacity=0.6,
        secondary_y=False,
    )

# Layout
layout_kwargs = get_plotly_layout(
    xaxis={"title": "Games Played"},
    yaxis={"title": selected_metric},
    legend=dict(
        orientation="h",
        yanchor="bottom",
        y=1.02,
        xanchor="center",
        x=0.5,
        font=dict(color=TEXT_SECONDARY, size=11),
        bgcolor="rgba(0,0,0,0)",
    ),
    height=500,
    margin={"l": 50, "r": 50, "t": 70, "b": 50},
    barmode="relative",
)
fig.update_layout(**layout_kwargs)

# Secondary y-axis styling
fig.update_yaxes(
    showgrid=False,
    zeroline=False,
    showticklabels=False,
    title="",
    secondary_y=True,
)

st.plotly_chart(fig, use_container_width=True)
