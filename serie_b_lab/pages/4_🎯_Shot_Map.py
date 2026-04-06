"""
Shot Map page - Interactive shot visualization for Série B Lab.
"""

from typing import Any

import numpy as np
import plotly.graph_objects as go
import streamlit as st

from utils.theme import (
    inject_css,
    get_plotly_layout,
    BG_CARD,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    ACCENT_RED,
    GRID_LINES,
)
from utils.data_loader import load_team_summary, load_shot_data, get_team_list
from utils.charts import create_strip_plot

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Shot Map - Série B Lab", layout="wide")
inject_css()

# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------
col1, col2, col3, col4 = st.columns(4)

with col1:
    selected_team: str = st.selectbox("Team", get_team_list())
with col2:
    mode: str = st.selectbox("Mode", ["Attack", "Defense"])
with col3:
    shot_type: str = st.selectbox(
        "Shot Type",
        ["All Shots", "Open Play", "Set Piece", "Counter Attack", "Free Kick", "Through Ball"],
    )
with col4:
    period: str = st.selectbox(
        "Period",
        ["Full Season", "First Half (1-45)", "Second Half (46-90)"],
    )

# ---------------------------------------------------------------------------
# Data loading & filtering
# ---------------------------------------------------------------------------
all_shots = load_shot_data()
summary_df = load_team_summary()

# Filter by mode
if mode == "Attack":
    shots = all_shots[all_shots["team"] == selected_team].copy()
else:
    # Defense: shots taken by opponents against selected team
    # In shot data, these are shots where the opposing team shot against the selected team
    # We need match data to determine opponents, but shot data has 'team' as the shooting team
    # For defense mode, we show all shots NOT by the selected team that occurred in their matches
    shots = all_shots[all_shots["team"] != selected_team].copy()
    # Filter to only shots from opponents of the selected team
    # Since we don't have an explicit 'opponent' column cross-referencing,
    # we approximate by loading match data to find opponent teams per matchday
    from utils.data_loader import load_match_data
    match_df = load_match_data(team=selected_team)
    if not match_df.empty:
        opponent_matchday = set(zip(match_df["opponent"], match_df["matchday"]))
        shots = shots[
            shots.apply(lambda r: (r["team"], r["matchday"]) in opponent_matchday, axis=1)
        ]

# Filter by situation
SITUATION_MAP: dict[str, str] = {
    "Open Play": "open_play",
    "Set Piece": "set_piece",
    "Counter Attack": "counter",
    "Free Kick": "free_kick",
    "Through Ball": "through_ball",
}
if shot_type != "All Shots":
    mapped: str = SITUATION_MAP.get(shot_type, "")
    if mapped:
        shots = shots[shots["situation"] == mapped]

# Filter by period
if period == "First Half (1-45)":
    shots = shots[shots["minute"] <= 45]
elif period == "Second Half (46-90)":
    shots = shots[shots["minute"] > 45]

shots = shots.reset_index(drop=True)

# ---------------------------------------------------------------------------
# Pitch dimensions (half pitch in meters)
# ---------------------------------------------------------------------------
PITCH_LENGTH: float = 105.0
PITCH_WIDTH: float = 68.0
HALF_LENGTH: float = PITCH_LENGTH / 2.0


def _build_half_pitch_shapes() -> list[dict[str, Any]]:
    """Build Plotly shapes for a half football pitch (attacking half)."""
    line_cfg: dict[str, Any] = {"color": TEXT_PRIMARY, "width": 1.5}
    w: float = PITCH_WIDTH
    hx: float = HALF_LENGTH

    pen_depth: float = 16.5
    pen_width: float = 40.3
    goal_area_depth: float = 5.5
    goal_area_width: float = 18.32
    goal_width: float = 7.32

    pa_y0 = (w - pen_width) / 2.0
    pa_y1 = pa_y0 + pen_width
    ga_y0 = (w - goal_area_width) / 2.0
    ga_y1 = ga_y0 + goal_area_width
    g_y0 = (w - goal_width) / 2.0
    g_y1 = g_y0 + goal_width

    shapes: list[dict[str, Any]] = [
        # Outer boundary
        dict(type="rect", x0=0, y0=0, x1=hx, y1=w, line=line_cfg, fillcolor="rgba(0,0,0,0)"),
        # Center line (bottom)
        dict(type="line", x0=0, y0=0, x1=0, y1=w, line=line_cfg),
        # Penalty area
        dict(
            type="rect", x0=hx - pen_depth, y0=pa_y0, x1=hx, y1=pa_y1,
            line=line_cfg, fillcolor="rgba(0,0,0,0)",
        ),
        # Goal area
        dict(
            type="rect", x0=hx - goal_area_depth, y0=ga_y0, x1=hx, y1=ga_y1,
            line=line_cfg, fillcolor="rgba(0,0,0,0)",
        ),
        # Goal posts
        dict(
            type="rect", x0=hx, y0=g_y0, x1=hx + 2.0, y1=g_y1,
            line=dict(color=TEXT_PRIMARY, width=2), fillcolor="rgba(255,255,255,0.08)",
        ),
        # Penalty spot
        dict(
            type="circle",
            x0=hx - 11.0 - 0.3, y0=w / 2.0 - 0.3,
            x1=hx - 11.0 + 0.3, y1=w / 2.0 + 0.3,
            line=line_cfg, fillcolor=TEXT_PRIMARY,
        ),
        # Center circle arc (semicircle at left edge)
        dict(
            type="circle",
            x0=-9.15, y0=w / 2.0 - 9.15,
            x1=9.15, y1=w / 2.0 + 9.15,
            line=line_cfg, fillcolor="rgba(0,0,0,0)",
        ),
    ]

    # Penalty arc
    cx = hx - 11.0
    cy = w / 2.0
    r = 9.15
    pen_x = hx - pen_depth
    angles = np.linspace(-np.pi / 2, np.pi / 2, 60)
    points: list[tuple[float, float]] = []
    for a in angles:
        px = cx + r * np.cos(a)
        py = cy + r * np.sin(a)
        if px < pen_x:
            points.append((px, py))

    if len(points) >= 2:
        path = f"M {points[0][0]:.2f},{points[0][1]:.2f}"
        for px, py in points[1:]:
            path += f" L {px:.2f},{py:.2f}"
        shapes.append(dict(type="path", path=path, line=line_cfg, fillcolor="rgba(0,0,0,0)"))

    return shapes


# ---------------------------------------------------------------------------
# Layout: Main column (3/4) + Sidebar panel (1/4)
# ---------------------------------------------------------------------------
main_col, side_col = st.columns([3, 1])

with main_col:
    st.markdown(
        f'<h3 style="color:{TEXT_PRIMARY}; margin-bottom:0.2rem;">'
        f'Shot Map &mdash; {selected_team}</h3>',
        unsafe_allow_html=True,
    )
    st.markdown(
        f'<p style="color:{TEXT_SECONDARY}; font-size:0.8rem; margin-top:0;">'
        f'{mode} &middot; {shot_type} &middot; {period}</p>',
        unsafe_allow_html=True,
    )

    # Build shot map figure
    fig = go.Figure()

    if not shots.empty:
        # Map shot coordinates: x (0-100) -> pitch x (0 to HALF_LENGTH)
        # y (0-100, 50=center) -> pitch y (0 to PITCH_WIDTH)
        pitch_x = shots["x"].values / 100.0 * HALF_LENGTH
        pitch_y = shots["y"].values / 100.0 * PITCH_WIDTH
        xg_vals = shots["xg"].values

        # Marker sizes proportional to xG (min 5, max 20)
        xg_min_val = float(xg_vals.min()) if len(xg_vals) > 0 else 0.0
        xg_max_val = float(xg_vals.max()) if len(xg_vals) > 0 else 1.0
        xg_range = max(xg_max_val - xg_min_val, 0.001)
        sizes = 5 + (xg_vals - xg_min_val) / xg_range * 15

        # Marker shapes: circle for foot, diamond for header
        symbols: list[str] = []
        for bp in shots["body_part"]:
            if bp == "header":
                symbols.append("diamond")
            else:
                symbols.append("circle")

        # Border for goals
        is_goal = shots["result"].str.lower() == "goal"
        border_widths = [2.5 if g else 0.5 for g in is_goal]
        border_colors = ["#000000" if g else "rgba(255,255,255,0.2)" for g in is_goal]

        # Hover text
        hover_texts: list[str] = []
        for _, row in shots.iterrows():
            hover_texts.append(
                f"{row['player']} &middot; Min {int(row['minute'])}' "
                f"&middot; xG: {row['xg']:.2f} &middot; {row['result']}"
            )

        fig.add_trace(
            go.Scatter(
                x=pitch_x,
                y=pitch_y,
                mode="markers",
                marker=dict(
                    size=sizes,
                    color=xg_vals,
                    colorscale=[
                        [0, "#4FC3F7"],
                        [0.5, "#FF9800"],
                        [1, "#D32F2F"],
                    ],
                    cmin=0,
                    cmax=max(xg_max_val, 0.05),
                    colorbar=dict(
                        title="xG",
                        titleside="right",
                        tickfont=dict(color=TEXT_SECONDARY, size=10),
                        titlefont=dict(color=TEXT_SECONDARY, size=11),
                        bgcolor="rgba(0,0,0,0)",
                        len=0.6,
                    ),
                    symbol=symbols,
                    line=dict(width=border_widths, color=border_colors),
                    opacity=0.9,
                ),
                hovertext=hover_texts,
                hoverinfo="text",
                showlegend=False,
            )
        )

    # Draw pitch
    pitch_shapes = _build_half_pitch_shapes()
    layout = get_plotly_layout(
        xaxis={
            "range": [-2, HALF_LENGTH + 4],
            "showgrid": False,
            "zeroline": False,
            "showticklabels": False,
            "title": "",
            "scaleanchor": "y",
            "scaleratio": 1,
        },
        yaxis={
            "range": [-2, PITCH_WIDTH + 2],
            "showgrid": False,
            "zeroline": False,
            "showticklabels": False,
            "title": "",
        },
        shapes=pitch_shapes,
        height=600,
        margin={"l": 20, "r": 20, "t": 30, "b": 20},
        showlegend=False,
    )
    fig.update_layout(**layout)

    st.plotly_chart(fig, use_container_width=True)

    # Legend row below the chart
    n_foot: int = int((shots["body_part"] != "header").sum()) if not shots.empty else 0
    n_header: int = int((shots["body_part"] == "header").sum()) if not shots.empty else 0
    n_goals: int = int((shots["result"].str.lower() == "goal").sum()) if not shots.empty else 0
    n_total: int = len(shots)

    st.markdown(
        f'<div style="text-align:center; color:{TEXT_SECONDARY}; font-size:0.85rem; '
        f'margin-top:-0.5rem;">'
        f'<span style="color:{TEXT_PRIMARY}; font-weight:600;">&#9679; Foot ({n_foot})</span>'
        f' &middot; '
        f'<span style="color:{TEXT_PRIMARY}; font-weight:600;">&#9670; Header ({n_header})</span>'
        f' &middot; '
        f'<span style="color:{TEXT_PRIMARY}; font-weight:600;">Goals ({n_goals})</span>'
        f' &middot; '
        f'<span style="color:{TEXT_SECONDARY};">Total Shots ({n_total})</span>'
        f'</div>',
        unsafe_allow_html=True,
    )

# ---------------------------------------------------------------------------
# Right sidebar panel - 4 strip plots
# ---------------------------------------------------------------------------
with side_col:
    st.markdown(
        f'<h4 style="color:{TEXT_PRIMARY}; margin-bottom:0.5rem;">League Context</h4>',
        unsafe_allow_html=True,
    )

    # Compute per-90 stats for all teams
    df_summary = summary_df.copy()
    df_summary["shots_p90"] = df_summary.apply(
        lambda r: r["shots_for"] / r["matches_played"] if r["matches_played"] > 0 else 0,
        axis=1,
    )
    df_summary["shots_against_p90"] = df_summary.apply(
        lambda r: r["shots_against"] / r["matches_played"] if r["matches_played"] > 0 else 0,
        axis=1,
    )
    df_summary["xg_per_shot"] = df_summary.apply(
        lambda r: r["xg_for"] / r["shots_for"] if r["shots_for"] > 0 else 0,
        axis=1,
    )
    df_summary["xga_per_shot"] = df_summary.apply(
        lambda r: r["xg_against"] / r["shots_against"] if r["shots_against"] > 0 else 0,
        axis=1,
    )
    df_summary["xg_p90"] = df_summary.apply(
        lambda r: r["xg_for"] / r["matches_played"] if r["matches_played"] > 0 else 0,
        axis=1,
    )
    df_summary["xga_p90"] = df_summary.apply(
        lambda r: r["xg_against"] / r["matches_played"] if r["matches_played"] > 0 else 0,
        axis=1,
    )
    df_summary["goals_p90"] = df_summary.apply(
        lambda r: r["goals_for"] / r["matches_played"] if r["matches_played"] > 0 else 0,
        axis=1,
    )
    df_summary["goals_against_p90"] = df_summary.apply(
        lambda r: r["goals_against"] / r["matches_played"] if r["matches_played"] > 0 else 0,
        axis=1,
    )

    team_row = df_summary[df_summary["team"] == selected_team]

    # Define metrics based on mode
    if mode == "Attack":
        metrics: list[tuple[str, str]] = [
            ("Shots P90", "shots_p90"),
            ("xG per Shot", "xg_per_shot"),
            ("xG P90", "xg_p90"),
            ("Goals P90", "goals_p90"),
        ]
    else:
        metrics = [
            ("Shots Against P90", "shots_against_p90"),
            ("xGA per Shot", "xga_per_shot"),
            ("xGA P90", "xga_p90"),
            ("Goals Against P90", "goals_against_p90"),
        ]

    for label, col_name in metrics:
        all_values = df_summary[col_name].values
        league_avg = float(np.mean(all_values))
        team_val = float(team_row[col_name].values[0]) if not team_row.empty else 0.0

        strip_fig = create_strip_plot(
            values=all_values,
            highlighted_value=team_val,
            label=label,
            league_avg=league_avg,
        )
        # Make strip plots more compact
        strip_fig.update_layout(height=120, margin=dict(l=30, r=30, t=25, b=30))
        st.plotly_chart(strip_fig, use_container_width=True)
