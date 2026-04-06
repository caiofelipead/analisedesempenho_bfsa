"""
Summary page - Heatmap ranking table for Serie B Lab.
"""

import datetime
from typing import Any

import streamlit as st

from utils.theme import (
    inject_css,
    heatmap_color,
    BG_PRIMARY,
    BG_SECONDARY,
    BG_CARD,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    GRID_LINES,
)
from utils.data_loader import load_team_summary

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Summary - Série B Lab", layout="wide")
inject_css()

# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------
col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    mode = st.selectbox("Mode", ["Differential", "For", "Against"])
with col2:
    value_type = st.selectbox("Type", ["Raw", "Per 90", "Adjusted"])
with col3:
    matches_filter = st.selectbox("Matches", ["All Matches", "Home", "Away"])
with col4:
    start_date = st.date_input("Start date", value=datetime.date(2026, 1, 1))
with col5:
    end_date = st.date_input("End date", value=datetime.date(2026, 12, 31))

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
header_left, header_right = st.columns([3, 1])

with header_left:
    st.markdown(
        f'<p style="color:{TEXT_SECONDARY}; letter-spacing:3px; font-size:0.75rem; '
        f'text-transform:uppercase; margin-bottom:0;">Brazil</p>',
        unsafe_allow_html=True,
    )
    st.markdown(
        f'<h2 style="color:{TEXT_PRIMARY}; margin-top:0;">S\u00e9rie B 2026</h2>',
        unsafe_allow_html=True,
    )

with header_right:
    st.markdown(
        f'<p style="color:{TEXT_SECONDARY}; text-align:right; font-size:0.85rem; '
        f'margin-top:1.2rem;">{matches_filter} \u2013 {mode}</p>',
        unsafe_allow_html=True,
    )

type_label = value_type
season_label = "Full Season"
st.markdown(
    f'<p style="color:{TEXT_SECONDARY}; font-size:0.75rem; margin-top:-0.5rem;">'
    f'{type_label} \u00b7 {season_label}</p>',
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# Data preparation
# ---------------------------------------------------------------------------
df = load_team_summary().copy()

# Metric definitions: (display_name, for_col, against_col)
METRIC_COLS: list[tuple[str, str, str]] = [
    ("xPTS/G", "xpts", "xpts"),
    ("G", "goals_for", "goals_against"),
    ("xGOT", "xgot_for", "xgot_against"),
    ("xG", "xg_for", "xg_against"),
    ("npxG", "npxg_for", "npxg_against"),
    ("OP xG", "op_xg_for", "op_xg_against"),
    ("Shots", "shots_for", "shots_against"),
    ("Box Touches", "box_touches_for", "box_touches_against"),
    ("Big Ch.", "big_chances_for", "big_chances_against"),
]

# Build display values per team
records: list[dict[str, Any]] = []

for _, row in df.iterrows():
    mp = row["matches_played"]
    entry: dict[str, Any] = {
        "team": row["team"],
        "team_short": row["team_short"],
        "mp": mp,
    }

    for display_name, for_col, against_col in METRIC_COLS:
        if display_name == "xPTS/G":
            # xPTS is always per-game
            raw_for = row["xpts"] / mp if mp > 0 else 0
            # xPTS has no meaningful "against" equivalent
            if mode == "Differential":
                val = raw_for
            elif mode == "Against":
                val = raw_for
            else:
                val = raw_for
        else:
            raw_for = float(row[for_col])
            raw_against = float(row[against_col])

            if mode == "Differential":
                val = raw_for - raw_against
            elif mode == "Against":
                val = raw_against
            else:
                val = raw_for

            # Per 90 / Adjusted: divide by matches
            if value_type in ("Per 90", "Adjusted") and mp > 0:
                val = val / mp

        entry[display_name] = round(val, 2)

    records.append(entry)

# Sort
sort_col = "xPTS/G"
ascending = mode == "Against"
records.sort(key=lambda r: r[sort_col], reverse=not ascending)

# Compute column min/max for heatmap
col_stats: dict[str, tuple[float, float]] = {}
for display_name, _, _ in METRIC_COLS:
    vals = [r[display_name] for r in records]
    col_stats[display_name] = (min(vals), max(vals))

# ---------------------------------------------------------------------------
# Build HTML table
# ---------------------------------------------------------------------------
header_names = ["#", "Time", "MP"] + [m[0] for m in METRIC_COLS]

table_html = f"""
<div style="overflow-x:auto; border-radius:10px; border:1px solid {GRID_LINES};">
<table style="width:100%; border-collapse:collapse; font-family:'Inter',sans-serif;
              font-size:0.82rem; color:{TEXT_PRIMARY};">
<thead>
<tr style="background-color:{BG_SECONDARY}; position:sticky; top:0; z-index:1;">
"""

for h in header_names:
    align = "left" if h == "Time" else "center"
    table_html += (
        f'<th style="padding:10px 12px; text-align:{align}; font-weight:600; '
        f'border-bottom:2px solid {GRID_LINES}; white-space:nowrap;">{h}</th>'
    )

table_html += "</tr></thead><tbody>"

for rank, rec in enumerate(records, start=1):
    bg = BG_CARD if rank % 2 == 0 else BG_SECONDARY
    table_html += f'<tr style="background-color:{bg};">'

    # Rank
    table_html += (
        f'<td style="padding:6px 10px; text-align:center; '
        f'border-bottom:1px solid {GRID_LINES};">{rank}</td>'
    )

    # Team short name (bold)
    table_html += (
        f'<td style="padding:6px 10px; text-align:left; font-weight:700; '
        f'border-bottom:1px solid {GRID_LINES}; white-space:nowrap;">'
        f'{rec["team_short"]}</td>'
    )

    # Matches played
    table_html += (
        f'<td style="padding:6px 10px; text-align:center; '
        f'border-bottom:1px solid {GRID_LINES};">{rec["mp"]}</td>'
    )

    # Metric columns with heatmap
    reverse = mode == "Against"
    for display_name, _, _ in METRIC_COLS:
        val = rec[display_name]
        vmin, vmax = col_stats[display_name]
        bg_color = heatmap_color(val, vmin, vmax, reverse=reverse)
        table_html += (
            f'<td style="padding:6px 10px; text-align:center; '
            f'border-bottom:1px solid {GRID_LINES}; '
            f'background-color:{bg_color};">{val:.2f}</td>'
        )

    table_html += "</tr>"

table_html += "</tbody></table></div>"

st.markdown(table_html, unsafe_allow_html=True)
