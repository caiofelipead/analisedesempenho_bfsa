"""
Season Projections — Simulação Monte Carlo para projeção da temporada.
"""

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from utils.theme import (
    inject_css,
    get_plotly_layout,
    heatmap_color,
    BG_CARD,
    BG_SECONDARY,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    ACCENT_GREEN,
    ACCENT_RED,
    GRID_LINES,
)
from utils.data_loader import load_team_summary, get_team_list

st.set_page_config(page_title="Season Projections - Série B Lab", layout="wide")
inject_css()

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
st.markdown(
    f"""
    <p style="color:{TEXT_SECONDARY}; font-size:0.8rem; letter-spacing:3px;
       text-transform:uppercase; margin-bottom:0.2rem;">BRAZIL</p>
    <h2 style="color:{TEXT_PRIMARY}; margin-top:0;">Season Projections — Série B 2026</h2>
    <p style="color:{TEXT_SECONDARY}; font-size:0.85rem;">Monte Carlo Simulation &middot; 10.000 iterations</p>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
summary = load_team_summary()

TOTAL_MATCHES = 38


@st.cache_data
def run_simulation(_summary_hash: str, summary_records: list[dict]) -> dict:
    """Executa simulação Monte Carlo da temporada restante."""
    rng = np.random.default_rng(seed=42)
    n_sims = 10_000

    teams = []
    current_pts = []
    xg_for_avg = []
    xg_against_avg = []
    remaining = []

    for row in summary_records:
        mp = max(row["matches_played"], 1)
        pts = row["xpts"]
        teams.append(row["team"])
        current_pts.append(pts)
        xg_for_avg.append(row["xg_for"] / mp)
        xg_against_avg.append(row["xg_against"] / mp)
        remaining.append(TOTAL_MATCHES - row["matches_played"])

    n_teams = len(teams)
    projected = np.zeros((n_sims, n_teams))

    for i in range(n_teams):
        projected[:, i] = current_pts[i]
        rem = remaining[i]
        if rem <= 0:
            continue
        for _ in range(rem):
            goals_for = rng.poisson(lam=xg_for_avg[i], size=n_sims)
            goals_against = rng.poisson(lam=xg_against_avg[i], size=n_sims)
            pts_gain = np.where(
                goals_for > goals_against, 3,
                np.where(goals_for == goals_against, 1, 0)
            )
            projected[:, i] += pts_gain

    positions = np.zeros_like(projected)
    for s in range(n_sims):
        order = np.argsort(-projected[s])
        for rank, idx in enumerate(order):
            positions[s, idx] = rank + 1

    results = {}
    for i, team in enumerate(teams):
        pts_arr = projected[:, i]
        pos_arr = positions[:, i]
        results[team] = {
            "points": pts_arr.tolist(),
            "avg_points": float(np.mean(pts_arr)),
            "std_points": float(np.std(pts_arr)),
            "p5": float(np.percentile(pts_arr, 5)),
            "p95": float(np.percentile(pts_arr, 95)),
            "avg_position": float(np.mean(pos_arr)),
            "promotion_pct": float(np.mean(pos_arr <= 4) * 100),
            "relegation_pct": float(np.mean(pos_arr >= 17) * 100),
            "current_pts": current_pts[i],
        }

    return results


summary_records = summary.to_dict("records")
summary_hash = str(pd.util.hash_pandas_object(summary).sum())
with st.spinner("Simulando temporada..."):
    sim_results = run_simulation(summary_hash, summary_records)

# ---------------------------------------------------------------------------
# 1. Summary Table
# ---------------------------------------------------------------------------
st.markdown(
    f'<h3 style="color:{TEXT_PRIMARY}; margin-top:1.5rem;">Projection Table</h3>',
    unsafe_allow_html=True,
)

table_data = []
for team, data in sim_results.items():
    table_data.append({
        "team": team,
        "current_pts": data["current_pts"],
        "avg_points": data["avg_points"],
        "promotion_pct": data["promotion_pct"],
        "relegation_pct": data["relegation_pct"],
        "range": f'{data["p5"]:.0f} - {data["p95"]:.0f}',
    })

table_data.sort(key=lambda x: x["avg_points"], reverse=True)

promo_vals = [d["promotion_pct"] for d in table_data]
releg_vals = [d["relegation_pct"] for d in table_data]
pts_vals = [d["avg_points"] for d in table_data]

promo_min, promo_max = min(promo_vals), max(promo_vals)
releg_min, releg_max = min(releg_vals), max(releg_vals)
pts_min, pts_max = min(pts_vals), max(pts_vals)

rows_html = ""
for rank, d in enumerate(table_data, 1):
    promo_color = heatmap_color(d["promotion_pct"], promo_min, promo_max)
    releg_color = heatmap_color(d["relegation_pct"], releg_min, releg_max, reverse=True)
    pts_color = heatmap_color(d["avg_points"], pts_min, pts_max)

    row_bg = BG_CARD if rank % 2 == 0 else BG_SECONDARY
    rows_html += f"""
    <tr style="background:{row_bg};">
        <td style="padding:6px 10px; color:{TEXT_SECONDARY};">{rank}</td>
        <td style="padding:6px 10px; font-weight:600; color:{TEXT_PRIMARY};">{d['team']}</td>
        <td style="padding:6px 10px; text-align:center; color:{TEXT_PRIMARY};">{d['current_pts']:.0f}</td>
        <td style="padding:6px 10px; text-align:center; background:{pts_color}; color:{TEXT_PRIMARY}; font-weight:600;">{d['avg_points']:.1f}</td>
        <td style="padding:6px 10px; text-align:center; background:{promo_color}; color:{TEXT_PRIMARY}; font-weight:600;">{d['promotion_pct']:.1f}%</td>
        <td style="padding:6px 10px; text-align:center; background:{releg_color}; color:{TEXT_PRIMARY}; font-weight:600;">{d['relegation_pct']:.1f}%</td>
        <td style="padding:6px 10px; text-align:center; color:{TEXT_SECONDARY};">{d['range']}</td>
    </tr>
    """

table_html = f"""
<div style="overflow-x:auto; border-radius:10px; border:1px solid {GRID_LINES};">
<table style="width:100%; border-collapse:collapse; font-family:'Inter',sans-serif; font-size:0.85rem;">
    <thead>
        <tr style="background:{BG_SECONDARY}; border-bottom:2px solid {GRID_LINES};">
            <th style="padding:8px 10px; text-align:left; color:{TEXT_SECONDARY}; font-weight:500;">#</th>
            <th style="padding:8px 10px; text-align:left; color:{TEXT_SECONDARY}; font-weight:500;">Team</th>
            <th style="padding:8px 10px; text-align:center; color:{TEXT_SECONDARY}; font-weight:500;">Pts Atual</th>
            <th style="padding:8px 10px; text-align:center; color:{TEXT_SECONDARY}; font-weight:500;">Pts Proj.</th>
            <th style="padding:8px 10px; text-align:center; color:{TEXT_SECONDARY}; font-weight:500;">Acesso %</th>
            <th style="padding:8px 10px; text-align:center; color:{TEXT_SECONDARY}; font-weight:500;">Rebaixamento %</th>
            <th style="padding:8px 10px; text-align:center; color:{TEXT_SECONDARY}; font-weight:500;">5th-95th</th>
        </tr>
    </thead>
    <tbody>
        {rows_html}
    </tbody>
</table>
</div>
"""

st.markdown(table_html, unsafe_allow_html=True)

# ---------------------------------------------------------------------------
# 2. Points Distribution Chart
# ---------------------------------------------------------------------------
st.markdown(
    f'<h3 style="color:{TEXT_PRIMARY}; margin-top:2rem;">Points Distribution</h3>',
    unsafe_allow_html=True,
)

selected_team = st.selectbox("Team", get_team_list(), key="season_proj_team")

if selected_team in sim_results:
    data = sim_results[selected_team]
    pts_array = data["points"]

    fig = go.Figure()

    fig.add_trace(go.Histogram(
        x=pts_array,
        nbinsx=40,
        marker_color=ACCENT_GREEN,
        opacity=0.8,
        name="Projected Points",
    ))

    mean_pts = data["avg_points"]
    fig.add_vline(
        x=mean_pts, line_dash="solid", line_color=TEXT_PRIMARY, line_width=2,
        annotation_text=f"Mean: {mean_pts:.1f}", annotation_position="top",
        annotation_font_color=TEXT_PRIMARY,
    )
    fig.add_vline(
        x=data["p5"], line_dash="dash", line_color=ACCENT_RED, line_width=1.5,
        annotation_text=f'5th: {data["p5"]:.0f}', annotation_position="top left",
        annotation_font_color=ACCENT_RED,
    )
    fig.add_vline(
        x=data["p95"], line_dash="dash", line_color=ACCENT_GREEN, line_width=1.5,
        annotation_text=f'95th: {data["p95"]:.0f}', annotation_position="top right",
        annotation_font_color=ACCENT_GREEN,
    )
    fig.add_vrect(
        x0=data["p5"], x1=data["p95"],
        fillcolor=ACCENT_GREEN, opacity=0.08, line_width=0,
    )

    layout = get_plotly_layout(
        title=dict(text=f"{selected_team} — Projected Points Distribution", font=dict(size=14)),
        xaxis_title="Points", yaxis_title="Frequency",
        height=400, showlegend=False,
        margin=dict(l=50, r=30, t=50, b=50),
    )
    fig.update_layout(**layout)
    st.plotly_chart(fig, use_container_width=True)

# ---------------------------------------------------------------------------
# 3. Promotion / Relegation Race
# ---------------------------------------------------------------------------
st.markdown(
    f'<h3 style="color:{TEXT_PRIMARY}; margin-top:1.5rem;">Promotion &amp; Relegation Race</h3>',
    unsafe_allow_html=True,
)

race_data = sorted(table_data, key=lambda x: x["promotion_pct"])
teams_sorted = [d["team"] for d in race_data]
promo_sorted = [d["promotion_pct"] for d in race_data]
releg_sorted = [d["relegation_pct"] for d in race_data]

fig2 = go.Figure()

fig2.add_trace(go.Bar(
    y=teams_sorted, x=promo_sorted, orientation="h",
    name="Acesso %", marker_color=ACCENT_GREEN, opacity=0.85,
))

fig2.add_trace(go.Bar(
    y=teams_sorted, x=[-r for r in releg_sorted], orientation="h",
    name="Rebaixamento %", marker_color=ACCENT_RED, opacity=0.85,
))

layout2 = get_plotly_layout(
    title=dict(text="Promotion (right) vs Relegation (left)", font=dict(size=13)),
    xaxis=dict(
        title="Probability %", zeroline=True, zerolinecolor=TEXT_SECONDARY,
        zerolinewidth=1,
        tickvals=[-80, -60, -40, -20, 0, 20, 40, 60, 80, 100],
        ticktext=["80", "60", "40", "20", "0", "20", "40", "60", "80", "100"],
    ),
    yaxis=dict(title=""),
    barmode="overlay", height=650,
    margin=dict(l=120, r=30, t=50, b=50),
    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
)
fig2.update_layout(**layout2)
st.plotly_chart(fig2, use_container_width=True)
