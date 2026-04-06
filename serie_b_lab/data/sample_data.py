"""
Generate realistic sample data for Brazilian Serie B 2026 football analytics.

All data is generated with a fixed numpy seed (42) for full reproducibility.
"""

import numpy as np

# Fixed seed for reproducibility
RNG = np.random.default_rng(42)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TEAMS = [
    ("Santos", "SAN"),
    ("Sport", "SPO"),
    ("Ceará", "CEA"),
    ("Mirassol", "MIR"),
    ("Novorizontino", "NOV"),
    ("Vila Nova", "VIL"),
    ("Goiás", "GOI"),
    ("Amazonas", "AMA"),
    ("CRB", "CRB"),
    ("Avaí", "AVA"),
    ("Operário-PR", "OPE"),
    ("Coritiba", "CFC"),
    ("Ponte Preta", "PON"),
    ("Guarani", "GUA"),
    ("Ituano", "ITU"),
    ("Brusque", "BRU"),
    ("Chapecoense", "CHA"),
    ("Botafogo-SP", "BOT"),
    ("Paysandu", "PAY"),
    ("ABC", "ABC"),
]

FIRST_NAMES = [
    "Lucas", "Gabriel", "Matheus", "João Pedro", "Rafael", "Bruno", "Felipe",
    "Diego", "Thiago", "Gustavo", "Vinícius", "Caio", "Henrique", "Leonardo",
    "Pedro", "Marcos", "André", "Eduardo", "Guilherme", "Renan", "Wendel",
    "Carlos", "Yago", "Igor", "Léo", "Allan", "Danilo", "Luiz", "Fabrício",
    "Willian",
]

LAST_NAMES = [
    "Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa",
    "Rodrigues", "Almeida", "Nascimento", "Ferreira", "Ribeiro", "Carvalho",
    "Gomes", "Martins", "Araújo", "Barbosa", "Melo", "Cardoso", "Rocha",
]

# Team strength tiers  (0 = top, 1 = upper-mid, 2 = mid, 3 = lower-mid, 4 = bottom)
_TIER = {
    "SAN": 0, "SPO": 0, "CEA": 0, "MIR": 0,
    "NOV": 1, "VIL": 1, "GOI": 1, "AMA": 1,
    "CRB": 2, "AVA": 2, "OPE": 2, "CFC": 2,
    "PON": 3, "GUA": 3, "ITU": 3, "PAY": 3,
    "BRU": 4, "CHA": 4, "BOT": 4, "ABC": 4,
}

# Offensive / defensive strength multipliers per tier
_OFF_MULT = {0: 1.25, 1: 1.10, 2: 1.00, 3: 0.90, 4: 0.78}
_DEF_MULT = {0: 0.78, 1: 0.90, 2: 1.00, 3: 1.10, 4: 1.25}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _team_short(name: str) -> str:
    for full, short in TEAMS:
        if full == name:
            return short
    return name[:3].upper()


def _generate_player_names(n: int = 18) -> list[str]:
    """Generate *n* unique realistic Brazilian player names."""
    names: set[str] = set()
    while len(names) < n:
        first = RNG.choice(FIRST_NAMES)
        last = RNG.choice(LAST_NAMES)
        names.add(f"{first} {last}")
    return sorted(names)


def _clamp(val, lo, hi):
    return max(lo, min(hi, val))

# ---------------------------------------------------------------------------
# Pre-generate rosters (deterministic because RNG is module-level)
# ---------------------------------------------------------------------------

ROSTERS: dict[str, list[str]] = {
    short: _generate_player_names(18) for _, short in TEAMS
}

# ---------------------------------------------------------------------------
# 1.  Team summary
# ---------------------------------------------------------------------------

def generate_team_summary() -> list[dict]:
    """
    Aggregate stats for all 20 teams after ~15 matchdays.

    Top teams have clearly better stats; bottom teams worse; middle tightly
    packed.  Data is internally coherent (high xG correlates with more shots,
    box touches, possession, etc.).
    """
    rng = np.random.default_rng(42)
    summaries: list[dict] = []

    for full_name, short in TEAMS:
        tier = _TIER[short]
        off = _OFF_MULT[tier]
        defe = _DEF_MULT[tier]

        matches = int(rng.integers(14, 17))

        # xG-based core  (per-match baseline ~1.1 xG Serie B average)
        xg_for = round(float(rng.uniform(10, 25) * off), 2)
        xg_for = _clamp(xg_for, 10.0, 25.0)
        xg_against = round(float(rng.uniform(10, 25) * defe), 2)
        xg_against = _clamp(xg_against, 10.0, 25.0)

        # Goals: some variance around xG
        goals_for = int(_clamp(round(xg_for + rng.normal(0, 2)), 8, 25))
        goals_against = int(_clamp(round(xg_against + rng.normal(0, 2)), 8, 25))

        # npxG slightly lower
        npxg_for = round(xg_for - float(rng.uniform(0.5, 2.0)), 2)
        npxg_against = round(xg_against - float(rng.uniform(0.5, 2.0)), 2)

        # xGOT between npxG and goals
        xgot_for = round((npxg_for + goals_for) / 2 + float(rng.normal(0, 0.5)), 2)
        xgot_against = round((npxg_against + goals_against) / 2 + float(rng.normal(0, 0.5)), 2)

        # Shots scale with xG
        shots_for = int(_clamp(round(xg_for * 9 + rng.normal(0, 10)), 80, 220))
        shots_against = int(_clamp(round(xg_against * 9 + rng.normal(0, 10)), 80, 220))

        # Open-play xG ~75-85 % of total
        op_frac_for = float(rng.uniform(0.75, 0.85))
        op_frac_ag = float(rng.uniform(0.75, 0.85))
        op_xg_for = round(xg_for * op_frac_for, 2)
        op_xg_against = round(xg_against * op_frac_ag, 2)

        # Box touches scale with shots
        box_touches_for = int(_clamp(round(shots_for * 1.8 + rng.normal(0, 20)), 200, 500))
        box_touches_against = int(_clamp(round(shots_against * 1.8 + rng.normal(0, 20)), 200, 500))

        # Big chances ~xG * 1.3
        big_chances_for = int(_clamp(round(xg_for * 1.3 + rng.normal(0, 2)), 8, 30))
        big_chances_against = int(_clamp(round(xg_against * 1.3 + rng.normal(0, 2)), 8, 30))

        # Possession & PPDA correlate with tier
        possession_avg = round(float(_clamp(
            53 - tier * 2.5 + rng.normal(0, 1.5), 42, 58
        )), 1)
        ppda = round(float(_clamp(
            8.5 + tier * 1.2 + rng.normal(0, 0.8), 7, 14
        )), 1)

        # xPts: better teams -> higher
        xpts = round(float(_clamp(
            27 - tier * 3 + rng.normal(0, 1.5), 15, 30
        )), 1)

        summaries.append({
            "team": full_name,
            "team_short": short,
            "matches_played": matches,
            "goals_for": goals_for,
            "goals_against": goals_against,
            "xg_for": xg_for,
            "xg_against": xg_against,
            "npxg_for": npxg_for,
            "npxg_against": npxg_against,
            "xgot_for": xgot_for,
            "xgot_against": xgot_against,
            "shots_for": shots_for,
            "shots_against": shots_against,
            "op_xg_for": op_xg_for,
            "op_xg_against": op_xg_against,
            "box_touches_for": box_touches_for,
            "box_touches_against": box_touches_against,
            "big_chances_for": big_chances_for,
            "big_chances_against": big_chances_against,
            "xpts": xpts,
            "possession_avg": possession_avg,
            "ppda": ppda,
        })

    return summaries

# ---------------------------------------------------------------------------
# 2.  Match data
# ---------------------------------------------------------------------------

def generate_match_data() -> list[dict]:
    """
    Match-by-match data for 15 matchdays (10 games each, 300 entries total).

    Home advantage is baked in.  Results correlate with xG but include
    realistic variance.
    """
    rng = np.random.default_rng(42)
    records: list[dict] = []

    team_names = [full for full, _ in TEAMS]
    team_shorts = {full: short for full, short in TEAMS}

    for matchday in range(1, 16):
        # Shuffle & pair teams for this matchday
        shuffled = list(range(20))
        rng.shuffle(shuffled)
        pairings = [(shuffled[i], shuffled[i + 1]) for i in range(0, 20, 2)]

        for home_idx, away_idx in pairings:
            home = team_names[home_idx]
            away = team_names[away_idx]
            home_s = team_shorts[home]
            away_s = team_shorts[away]

            h_tier = _TIER[home_s]
            a_tier = _TIER[away_s]

            # Expected goals per match (home gets ~+0.15 boost)
            h_lambda_xg = _clamp(1.1 * _OFF_MULT[h_tier] * _DEF_MULT[a_tier] + 0.15, 0.3, 3.5)
            a_lambda_xg = _clamp(1.1 * _OFF_MULT[a_tier] * _DEF_MULT[h_tier] - 0.05, 0.3, 3.5)

            h_xg = round(float(_clamp(rng.gamma(3, h_lambda_xg / 3), 0.3, 3.5)), 2)
            a_xg = round(float(_clamp(rng.gamma(3, a_lambda_xg / 3), 0.3, 3.5)), 2)

            # Actual goals (Poisson, correlated with xG but with variance)
            h_goals = int(_clamp(rng.poisson(h_xg), 0, 4))
            a_goals = int(_clamp(rng.poisson(a_xg), 0, 4))

            # Shots proportional to xG
            h_shots = int(_clamp(round(h_xg * 8 + rng.normal(2, 2)), 3, 20))
            a_shots = int(_clamp(round(a_xg * 8 + rng.normal(0, 2)), 3, 20))

            # Possession (home slight advantage)
            h_poss = round(float(_clamp(50 + (a_tier - h_tier) * 2 + rng.normal(1, 4), 35, 65)), 1)
            a_poss = round(100 - h_poss, 1)

            # Home entry
            records.append({
                "team": home,
                "opponent": away,
                "matchday": matchday,
                "venue": "home",
                "goals_scored": h_goals,
                "goals_conceded": a_goals,
                "xg": h_xg,
                "xga": a_xg,
                "shots": h_shots,
                "shots_against": a_shots,
                "possession": h_poss,
            })
            # Away entry
            records.append({
                "team": away,
                "opponent": home,
                "matchday": matchday,
                "venue": "away",
                "goals_scored": a_goals,
                "goals_conceded": h_goals,
                "xg": a_xg,
                "xga": h_xg,
                "shots": a_shots,
                "shots_against": h_shots,
                "possession": a_poss,
            })

    return records

# ---------------------------------------------------------------------------
# 3.  Shot data
# ---------------------------------------------------------------------------

def generate_shot_data() -> list[dict]:
    """
    Individual shot-level data across 15 matchdays.

    Spatial coordinates, xG, result, body part, and situation are all
    internally consistent.
    """
    rng = np.random.default_rng(42)
    shots: list[dict] = []

    team_names = [full for full, _ in TEAMS]
    team_shorts = {full: short for full, short in TEAMS}

    for matchday in range(1, 16):
        shuffled = list(range(20))
        rng.shuffle(shuffled)
        pairings = [(shuffled[i], shuffled[i + 1]) for i in range(0, 20, 2)]

        for home_idx, away_idx in pairings:
            home = team_names[home_idx]
            away = team_names[away_idx]
            h_short = team_shorts[home]
            a_short = team_shorts[away]

            # Total shots in the match (10-15)
            total_shots = int(rng.integers(10, 16))
            # Distribute between teams weighted by offensive strength
            h_off = _OFF_MULT[_TIER[h_short]]
            a_off = _OFF_MULT[_TIER[a_short]]
            h_share = h_off / (h_off + a_off)
            h_n_shots = int(_clamp(round(total_shots * h_share + rng.normal(0, 1)), 2, total_shots - 2))
            a_n_shots = total_shots - h_n_shots

            for team_name, short, n in [
                (home, h_short, h_n_shots),
                (away, a_short, a_n_shots),
            ]:
                roster = ROSTERS[short]
                for _ in range(n):
                    # Minute: more shots in second half
                    minute = int(_clamp(
                        rng.choice(
                            [rng.integers(1, 46), rng.integers(46, 91)],
                            p=[0.4, 0.6],
                        ),
                        1, 93,
                    ))
                    # Add occasional stoppage time
                    if minute == 45 and float(rng.random()) < 0.3:
                        minute = 45 + int(rng.integers(1, 5))
                    elif minute == 90 and float(rng.random()) < 0.4:
                        minute = 90 + int(rng.integers(1, 6))

                    # Spatial coordinates
                    x = round(float(rng.uniform(75, 100)), 1)
                    y = round(float(_clamp(rng.normal(50, 12), 20, 80)), 1)

                    # xG: higher when closer to goal center
                    dist_to_goal = np.sqrt((100 - x) ** 2 + (50 - y) ** 2)
                    base_xg = float(np.exp(-dist_to_goal / 12) * 0.6)
                    shot_xg = round(float(_clamp(
                        base_xg + rng.exponential(0.03), 0.02, 0.80
                    )), 2)

                    # Result
                    r = float(rng.random())
                    if r < shot_xg * 1.1:
                        result = "goal"
                    elif r < shot_xg * 1.1 + 0.30:
                        result = "saved"
                    elif r < shot_xg * 1.1 + 0.55:
                        result = "blocked"
                    else:
                        result = "off_target"

                    # Body part
                    body_part = "header" if float(rng.random()) < 0.15 else "foot"

                    # Situation
                    sit_r = float(rng.random())
                    if sit_r < 0.70:
                        situation = "open_play"
                    elif sit_r < 0.85:
                        situation = "set_piece"
                    elif sit_r < 0.93:
                        situation = "counter"
                    elif sit_r < 0.98:
                        situation = "free_kick"
                    else:
                        situation = "through_ball"

                    player = str(rng.choice(roster))

                    shots.append({
                        "team": team_name,
                        "player": player,
                        "minute": minute,
                        "x": x,
                        "y": y,
                        "xg": shot_xg,
                        "result": result,
                        "body_part": body_part,
                        "situation": situation,
                        "matchday": matchday,
                    })

    return shots

# ---------------------------------------------------------------------------
# 4.  Fixtures (matchday 16)
# ---------------------------------------------------------------------------

def generate_fixtures() -> list[dict]:
    """
    Upcoming fixtures for matchday 16 with realistic pairings.
    """
    pairings = [
        ("Santos", "Goiás"),
        ("Sport", "Coritiba"),
        ("Ceará", "Paysandu"),
        ("Mirassol", "ABC"),
        ("Novorizontino", "Chapecoense"),
        ("Vila Nova", "Brusque"),
        ("Amazonas", "Guarani"),
        ("CRB", "Botafogo-SP"),
        ("Avaí", "Ituano"),
        ("Operário-PR", "Ponte Preta"),
    ]
    return [
        {"home_team": home, "away_team": away, "matchday": 16}
        for home, away in pairings
    ]


# ---------------------------------------------------------------------------
# Public accessor functions (return DataFrames)
# ---------------------------------------------------------------------------
import pandas as pd  # noqa: E402


def get_team_summary_data() -> pd.DataFrame:
    """Return team summary as a DataFrame."""
    return pd.DataFrame(generate_team_summary())


def get_match_data() -> pd.DataFrame:
    """Return match-by-match data as a DataFrame."""
    return pd.DataFrame(generate_match_data())


def get_shot_data() -> pd.DataFrame:
    """Return individual shot data as a DataFrame."""
    return pd.DataFrame(generate_shot_data())


def get_fixtures_data() -> pd.DataFrame:
    """Return upcoming fixtures as a DataFrame."""
    return pd.DataFrame(generate_fixtures())
