"""
Módulo de cálculos e métricas estatísticas para o Série B Lab.
"""

import math
from typing import Any

import numpy as np
import pandas as pd


def calculate_per90(value: float, matches: int) -> float:
    """Calcula a métrica por 90 minutos (por jogo)."""
    if matches <= 0:
        return 0.0
    return value / matches


def calculate_differential(for_val: float, against_val: float) -> float:
    """Calcula o diferencial (a favor - contra)."""
    return for_val - against_val


def calculate_xpts_per_game(xpts: float, matches: int) -> float:
    """Calcula pontos esperados (xPts) por jogo."""
    if matches <= 0:
        return 0.0
    return xpts / matches


def rolling_average(series: pd.Series, window: int) -> pd.Series:
    """Calcula a média móvel de uma série pandas."""
    return series.rolling(window=window, min_periods=1).mean()


def poisson_probability(lam: float, k: int) -> float:
    """
    Calcula P(X = k) para uma distribuição de Poisson.

    Parameters
    ----------
    lam : float
        Taxa média (lambda).
    k : int
        Número de ocorrências.
    """
    if lam < 0 or k < 0:
        return 0.0
    return (lam ** k) * math.exp(-lam) / math.factorial(k)


def match_probabilities(
    xg_home: float,
    xg_away: float,
    max_goals: int = 6,
) -> dict[str, float]:
    """
    Calcula probabilidades de resultado usando distribuição de Poisson.

    Parameters
    ----------
    xg_home : float
        Expected goals do time mandante.
    xg_away : float
        Expected goals do time visitante.
    max_goals : int
        Número máximo de gols a considerar na grade.

    Returns
    -------
    dict com chaves ``home_win``, ``draw``, ``away_win`` (valores 0-1).
    """
    home_win: float = 0.0
    draw: float = 0.0
    away_win: float = 0.0

    for i in range(max_goals + 1):
        p_home: float = poisson_probability(xg_home, i)
        for j in range(max_goals + 1):
            p_away: float = poisson_probability(xg_away, j)
            prob: float = p_home * p_away
            if i > j:
                home_win += prob
            elif i == j:
                draw += prob
            else:
                away_win += prob

    return {
        "home_win": home_win,
        "draw": draw,
        "away_win": away_win,
    }


def simulate_season(
    teams_data: pd.DataFrame,
    remaining_matches: pd.DataFrame,
    n_simulations: int = 10_000,
) -> dict[str, np.ndarray]:
    """
    Simulação Monte Carlo da temporada restante.

    Parameters
    ----------
    teams_data : pd.DataFrame
        DataFrame com colunas ``team``, ``points``, ``xg_for_avg``, ``xg_against_avg``.
    remaining_matches : pd.DataFrame
        DataFrame com colunas ``home_team``, ``away_team``.
    n_simulations : int
        Número de simulações.

    Returns
    -------
    Dicionário mapeando nome do time -> array numpy com pontuação final
    projetada em cada simulação.
    """
    rng = np.random.default_rng(seed=42)

    # Indexar dados por time
    team_stats: dict[str, dict[str, float]] = {}
    for _, row in teams_data.iterrows():
        team_stats[row["team"]] = {
            "points": float(row["points"]),
            "xg_for_avg": float(row["xg_for_avg"]),
            "xg_against_avg": float(row["xg_against_avg"]),
        }

    teams: list[str] = list(team_stats.keys())
    results: dict[str, np.ndarray] = {
        team: np.full(n_simulations, team_stats[team]["points"], dtype=np.float64)
        for team in teams
    }

    for _, match in remaining_matches.iterrows():
        home: str = match["home_team"]
        away: str = match["away_team"]

        if home not in team_stats or away not in team_stats:
            continue

        xg_h: float = team_stats[home]["xg_for_avg"]
        xg_a: float = team_stats[away]["xg_for_avg"]

        # Ajuste de mando de campo (+10%)
        xg_h *= 1.10

        # Simular gols
        goals_h: np.ndarray = rng.poisson(lam=xg_h, size=n_simulations)
        goals_a: np.ndarray = rng.poisson(lam=xg_a, size=n_simulations)

        home_wins = goals_h > goals_a
        draws = goals_h == goals_a
        away_wins = goals_h < goals_a

        results[home] += np.where(home_wins, 3, np.where(draws, 1, 0))
        results[away] += np.where(away_wins, 3, np.where(draws, 1, 0))

    return results
