"""
Match Projections page - Poisson-based match outcome predictions for Série B Lab.
"""

from typing import Any

import streamlit as st

from utils.theme import (
    inject_css,
    get_plotly_layout,
    BG_CARD,
    BG_SECONDARY,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    ACCENT_GREEN,
    ACCENT_RED,
    GRID_LINES,
)
from utils.data_loader import load_team_summary, load_fixtures
from utils.metrics import poisson_probability, match_probabilities

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Match Projections - Série B Lab", layout="wide")
inject_css()

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
st.markdown(
    f'<h2 style="color:{TEXT_PRIMARY}; margin-bottom:0;">Match Projections &ndash; '
    f'S\u00e9rie B 2026</h2>',
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------
filter_col1, filter_col2, _ = st.columns([1, 1, 4])

with filter_col1:
    matchday: int = int(st.number_input("Matchday", min_value=1, max_value=38, value=16))
with filter_col2:
    model_type: str = st.selectbox("Model", ["Poisson", "Blend"])

st.markdown(
    f'<p style="color:{TEXT_SECONDARY}; font-size:0.85rem; margin-top:-0.3rem;">'
    f'Rodada {matchday}</p>',
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
summary_df = load_team_summary()
fixtures_df = load_fixtures()

# Filter fixtures for selected matchday
round_fixtures = fixtures_df[fixtures_df["matchday"] == matchday].reset_index(drop=True)

# Build lookup: team -> stats
team_stats: dict[str, dict[str, float]] = {}
for _, row in summary_df.iterrows():
    mp: int = int(row["matches_played"])
    if mp > 0:
        team_stats[row["team"]] = {
            "xg_for_avg": float(row["xg_for"]) / mp,
            "xg_against_avg": float(row["xg_against"]) / mp,
        }

# League average xG per match
league_avg_xg: float = float(summary_df["xg_for"].sum()) / max(
    float(summary_df["matches_played"].sum()), 1
)


def _project_match(
    home_team: str, away_team: str
) -> dict[str, Any]:
    """Calculate projected xG and probabilities for a single match."""
    home = team_stats.get(home_team)
    away = team_stats.get(away_team)

    if home is None or away is None:
        return {
            "home_xg": 1.0,
            "away_xg": 1.0,
            "home_win": 33.3,
            "draw": 33.3,
            "away_win": 33.3,
            "best_score": "1-0",
        }

    # Adjusted xG: team's attack strength * opponent's defensive weakness / league avg
    safe_league = max(league_avg_xg, 0.01)
    home_xg: float = home["xg_for_avg"] * away["xg_against_avg"] / safe_league
    away_xg: float = away["xg_for_avg"] * home["xg_against_avg"] / safe_league

    # Home advantage
    home_xg *= 1.1
    away_xg *= 0.9

    # Blend: add small random noise
    if model_type == "Blend":
        import random
        random.seed(hash(f"{home_team}{away_team}{matchday}"))
        home_xg *= random.uniform(0.92, 1.08)
        away_xg *= random.uniform(0.92, 1.08)

    # Probabilities
    probs = match_probabilities(home_xg, away_xg)

    # Most likely score: find (i, j) with highest joint probability
    max_goals: int = 6
    best_prob: float = 0.0
    best_h: int = 0
    best_a: int = 0
    for i in range(max_goals + 1):
        p_h = poisson_probability(home_xg, i)
        for j in range(max_goals + 1):
            p_a = poisson_probability(away_xg, j)
            joint = p_h * p_a
            if joint > best_prob:
                best_prob = joint
                best_h = i
                best_a = j

    return {
        "home_xg": home_xg,
        "away_xg": away_xg,
        "home_win": probs["home_win"] * 100,
        "draw": probs["draw"] * 100,
        "away_win": probs["away_win"] * 100,
        "best_score": f"{best_h}-{best_a}",
    }


def _render_match_card(home_team: str, away_team: str, proj: dict[str, Any]) -> str:
    """Return HTML string for a single match card."""
    hw = proj["home_win"]
    dr = proj["draw"]
    aw = proj["away_win"]

    # Probability bar sections
    prob_bar = (
        f'<div style="display:flex; height:28px; border-radius:6px; overflow:hidden; '
        f'font-size:0.75rem; font-weight:600; margin:0.4rem 0;">'
        f'<div style="width:{hw:.1f}%; background:{ACCENT_GREEN}; display:flex; '
        f'align-items:center; justify-content:center; color:{TEXT_PRIMARY};">'
        f'{hw:.0f}%</div>'
        f'<div style="width:{dr:.1f}%; background:{TEXT_SECONDARY}; display:flex; '
        f'align-items:center; justify-content:center; color:{TEXT_PRIMARY};">'
        f'{dr:.0f}%</div>'
        f'<div style="width:{aw:.1f}%; background:{ACCENT_RED}; display:flex; '
        f'align-items:center; justify-content:center; color:{TEXT_PRIMARY};">'
        f'{aw:.0f}%</div>'
        f'</div>'
    )

    card_html = f"""
    <div style="background-color:{BG_CARD}; border-radius:10px; padding:1rem 1.2rem;
                margin-bottom:0.8rem; border:1px solid {GRID_LINES};">
        <div style="display:flex; align-items:center; justify-content:space-between;
                    margin-bottom:0.3rem;">
            <span style="color:{TEXT_PRIMARY}; font-weight:700; font-size:0.95rem;
                         flex:1; text-align:left;">{home_team}</span>
            <span style="color:{TEXT_SECONDARY}; font-size:0.75rem; flex:0 0 auto;
                         margin:0 0.5rem;">vs</span>
            <span style="color:{TEXT_PRIMARY}; font-weight:700; font-size:0.95rem;
                         flex:1; text-align:right;">{away_team}</span>
        </div>
        {prob_bar}
        <div style="display:flex; justify-content:space-between; color:{TEXT_SECONDARY};
                    font-size:0.75rem; margin-top:0.2rem;">
            <span>Projected: {proj['home_xg']:.1f} &ndash; {proj['away_xg']:.1f}</span>
            <span>Most likely: {proj['best_score']}</span>
        </div>
    </div>
    """
    return card_html


# ---------------------------------------------------------------------------
# Render match cards in 2 columns
# ---------------------------------------------------------------------------
if round_fixtures.empty:
    st.info(f"No fixtures found for matchday {matchday}.")
else:
    left_col, right_col = st.columns(2)
    matches = list(round_fixtures.iterrows())
    mid = (len(matches) + 1) // 2

    for idx, (_, match) in enumerate(matches):
        home: str = match["home_team"]
        away: str = match["away_team"]
        projection = _project_match(home, away)
        card_html = _render_match_card(home, away, projection)

        if idx < mid:
            with left_col:
                st.markdown(card_html, unsafe_allow_html=True)
        else:
            with right_col:
                st.markdown(card_html, unsafe_allow_html=True)
