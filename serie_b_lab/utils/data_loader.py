"""
Módulo de carregamento de dados com cache para o Série B Lab.
Utiliza ``@st.cache_data`` para evitar recarregamentos desnecessários.
"""

from typing import Optional

import pandas as pd
import streamlit as st

from data.sample_data import (
    get_fixtures_data,
    get_match_data,
    get_shot_data,
    get_team_summary_data,
)


@st.cache_data(ttl=3600)
def load_team_summary() -> pd.DataFrame:
    """Carrega resumo agregado de todos os times."""
    return get_team_summary_data()


@st.cache_data(ttl=3600)
def load_match_data(team: Optional[str] = None) -> pd.DataFrame:
    """
    Carrega dados jogo-a-jogo.

    Parameters
    ----------
    team : str, optional
        Se informado, filtra apenas os jogos do time especificado.
    """
    df: pd.DataFrame = get_match_data()
    if team is not None:
        df = df[df["team"] == team].reset_index(drop=True)
    return df


@st.cache_data(ttl=3600)
def load_shot_data(team: Optional[str] = None) -> pd.DataFrame:
    """
    Carrega dados de chutes individuais.

    Parameters
    ----------
    team : str, optional
        Se informado, filtra apenas os chutes do time especificado.
    """
    df: pd.DataFrame = get_shot_data()
    if team is not None:
        df = df[df["team"] == team].reset_index(drop=True)
    return df


@st.cache_data(ttl=3600)
def load_fixtures() -> pd.DataFrame:
    """Carrega jogos futuros / calendário restante."""
    return get_fixtures_data()


@st.cache_data(ttl=3600)
def get_team_list() -> list[str]:
    """Retorna lista ordenada com nomes de todos os times."""
    df: pd.DataFrame = load_team_summary()
    return sorted(df["team"].unique().tolist())


@st.cache_data(ttl=3600)
def get_team_short_names() -> dict[str, str]:
    """
    Retorna dicionário mapeando nome completo do time para abreviação
    de 3 letras.
    """
    df: pd.DataFrame = load_team_summary()
    if "short_name" in df.columns:
        return dict(zip(df["team"], df["short_name"]))

    # Fallback: gera abreviação a partir das 3 primeiras letras
    return {name: name[:3].upper() for name in df["team"].unique()}
