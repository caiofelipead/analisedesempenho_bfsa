"""
Módulo de gráficos reutilizáveis para o Série B Lab.
Todas as funções retornam objetos ``plotly.graph_objects.Figure``
com estilo dark consistente.
"""

from typing import Any, Optional

import numpy as np
import pandas as pd
import plotly.graph_objects as go

from utils.theme import (
    ACCENT_GREEN,
    ACCENT_PINK,
    ACCENT_RED,
    BG_CARD,
    BG_SECONDARY,
    GRID_LINES,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    get_plotly_layout,
)


# ---------------------------------------------------------------------------
# Trend chart (duplo eixo com médias móveis)
# ---------------------------------------------------------------------------
def create_trend_chart(
    match_data: pd.DataFrame,
    metric_for: str,
    metric_against: str,
    window: int,
    team_name: str,
) -> go.Figure:
    """
    Gráfico de tendência com média móvel dupla.

    Exibe barras de diferencial em cinza, linha verde para a métrica
    ofensiva e linha rosa para a defensiva, além de médias de temporada
    tracejadas.

    Parameters
    ----------
    match_data : pd.DataFrame
        Dados jogo-a-jogo com uma coluna de índice sequencial.
    metric_for : str
        Nome da coluna da métrica ofensiva.
    metric_against : str
        Nome da coluna da métrica defensiva.
    window : int
        Janela da média móvel.
    team_name : str
        Nome do time (para título).
    """
    df = match_data.copy().reset_index(drop=True)
    df["match_num"] = df.index + 1

    roll_for = df[metric_for].rolling(window=window, min_periods=1).mean()
    roll_against = df[metric_against].rolling(window=window, min_periods=1).mean()
    differential = roll_for - roll_against

    avg_for: float = float(df[metric_for].mean())
    avg_against: float = float(df[metric_against].mean())

    fig = go.Figure()

    # Barras de diferencial
    fig.add_trace(
        go.Bar(
            x=df["match_num"],
            y=differential,
            name="Diferencial",
            marker_color=[
                "rgba(76, 175, 80, 0.35)" if v >= 0 else "rgba(244, 67, 54, 0.35)"
                for v in differential
            ],
            hovertemplate="Rodada %{x}<br>Diferencial: %{y:.2f}<extra></extra>",
        )
    )

    # Linha ofensiva (verde)
    fig.add_trace(
        go.Scatter(
            x=df["match_num"],
            y=roll_for,
            mode="lines",
            name=f"{metric_for} (MM{window})",
            line=dict(color=ACCENT_GREEN, width=2.5),
            hovertemplate="Rodada %{x}<br>%{y:.2f}<extra></extra>",
        )
    )

    # Linha defensiva (rosa)
    fig.add_trace(
        go.Scatter(
            x=df["match_num"],
            y=roll_against,
            mode="lines",
            name=f"{metric_against} (MM{window})",
            line=dict(color=ACCENT_PINK, width=2.5),
            hovertemplate="Rodada %{x}<br>%{y:.2f}<extra></extra>",
        )
    )

    # Média de temporada – ofensiva
    fig.add_hline(
        y=avg_for,
        line_dash="dash",
        line_color=ACCENT_GREEN,
        line_width=1,
        opacity=0.5,
        annotation_text=f"Média {metric_for}: {avg_for:.2f}",
        annotation_position="top left",
        annotation_font_color=ACCENT_GREEN,
        annotation_font_size=10,
    )

    # Média de temporada – defensiva
    fig.add_hline(
        y=avg_against,
        line_dash="dash",
        line_color=ACCENT_PINK,
        line_width=1,
        opacity=0.5,
        annotation_text=f"Média {metric_against}: {avg_against:.2f}",
        annotation_position="bottom left",
        annotation_font_color=ACCENT_PINK,
        annotation_font_size=10,
    )

    layout = get_plotly_layout(
        title={"text": f"{team_name} — Tendência ({metric_for} vs {metric_against})"},
        xaxis={"title": "Rodada"},
        yaxis={"title": "Valor"},
        barmode="relative",
        height=420,
    )
    fig.update_layout(**layout)

    return fig


# ---------------------------------------------------------------------------
# Scatter plot de times
# ---------------------------------------------------------------------------
def create_scatter_plot(
    teams_df: pd.DataFrame,
    x_col: str,
    y_col: str,
    x_label: str,
    y_label: str,
    invert_y: bool = False,
) -> go.Figure:
    """
    Scatter plot com rótulos de abreviação por time e linhas de referência
    representando a média da liga.

    Parameters
    ----------
    teams_df : pd.DataFrame
        Deve conter ``x_col``, ``y_col`` e uma coluna ``short_name``
        com abreviação de 3 letras.
    invert_y : bool
        Se ``True``, inverte o eixo Y (útil para métricas onde menor = melhor).
    """
    fig = go.Figure()

    avg_x: float = float(teams_df[x_col].mean())
    avg_y: float = float(teams_df[y_col].mean())

    fig.add_trace(
        go.Scatter(
            x=teams_df[x_col],
            y=teams_df[y_col],
            mode="markers+text",
            text=teams_df.get("short_name", teams_df.index.astype(str)),
            textposition="top center",
            textfont=dict(color=TEXT_PRIMARY, size=10),
            marker=dict(
                size=10,
                color=ACCENT_GREEN,
                opacity=0.85,
                line=dict(width=1, color=TEXT_PRIMARY),
            ),
            hovertemplate=(
                "<b>%{text}</b><br>"
                f"{x_label}: %{{x:.2f}}<br>"
                f"{y_label}: %{{y:.2f}}<extra></extra>"
            ),
        )
    )

    # Linhas de média da liga
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

    layout = get_plotly_layout(
        xaxis={"title": x_label},
        yaxis={"title": y_label, "autorange": "reversed" if invert_y else True},
        showlegend=False,
        height=500,
    )
    fig.update_layout(**layout)

    return fig


# ---------------------------------------------------------------------------
# Shot map (meio campo)
# ---------------------------------------------------------------------------
_PITCH_LENGTH: float = 105.0
_PITCH_WIDTH: float = 68.0
_HALF_LENGTH: float = _PITCH_LENGTH / 2.0


def _half_pitch_shapes() -> list[dict[str, Any]]:
    """Retorna shapes Plotly para desenhar meio campo (ataque da esquerda p/ direita)."""
    line_cfg: dict[str, Any] = {"color": TEXT_PRIMARY, "width": 1.5}

    # Coordenadas (x: 0 -> 52.5 m, y: 0 -> 68 m)
    half_x: float = _HALF_LENGTH
    w: float = _PITCH_WIDTH

    # Áreas
    pen_area_depth: float = 16.5
    pen_area_width: float = 40.3
    goal_area_depth: float = 5.5
    goal_area_width: float = 18.32
    goal_width: float = 7.32

    pa_y0 = (w - pen_area_width) / 2.0
    pa_y1 = pa_y0 + pen_area_width
    ga_y0 = (w - goal_area_width) / 2.0
    ga_y1 = ga_y0 + goal_area_width
    g_y0 = (w - goal_width) / 2.0
    g_y1 = g_y0 + goal_width

    shapes: list[dict[str, Any]] = [
        # Contorno meio campo
        dict(
            type="rect", x0=0, y0=0, x1=half_x, y1=w,
            line=line_cfg, fillcolor="rgba(0,0,0,0)",
        ),
        # Linha central (borda esquerda)
        dict(
            type="line", x0=0, y0=0, x1=0, y1=w,
            line=line_cfg,
        ),
        # Área penal
        dict(
            type="rect",
            x0=half_x - pen_area_depth, y0=pa_y0,
            x1=half_x, y1=pa_y1,
            line=line_cfg, fillcolor="rgba(0,0,0,0)",
        ),
        # Pequena área
        dict(
            type="rect",
            x0=half_x - goal_area_depth, y0=ga_y0,
            x1=half_x, y1=ga_y1,
            line=line_cfg, fillcolor="rgba(0,0,0,0)",
        ),
        # Gol
        dict(
            type="rect",
            x0=half_x, y0=g_y0,
            x1=half_x + 2.0, y1=g_y1,
            line=dict(color=TEXT_PRIMARY, width=2),
            fillcolor="rgba(255,255,255,0.08)",
        ),
        # Marca do pênalti
        dict(
            type="circle",
            x0=half_x - 11.0 - 0.3, y0=w / 2.0 - 0.3,
            x1=half_x - 11.0 + 0.3, y1=w / 2.0 + 0.3,
            line=line_cfg, fillcolor=TEXT_PRIMARY,
        ),
        # Arco do centro (semicírculo)
        dict(
            type="circle",
            x0=-9.15, y0=w / 2.0 - 9.15,
            x1=9.15, y1=w / 2.0 + 9.15,
            line=line_cfg, fillcolor="rgba(0,0,0,0)",
        ),
    ]

    # Arco da grande área (meia-lua fora da área penal)
    arc_points = _penalty_arc_points(half_x, w)
    if arc_points:
        shapes.append(
            dict(
                type="path",
                path=arc_points,
                line=line_cfg,
                fillcolor="rgba(0,0,0,0)",
            )
        )

    return shapes


def _penalty_arc_points(half_x: float, w: float) -> str:
    """Gera o path SVG para o arco fora da grande área."""
    cx = half_x - 11.0
    cy = w / 2.0
    r = 9.15
    pen_x = half_x - 16.5

    # Pontos do arco que ficam fora da grande área
    angles = np.linspace(-np.pi / 2, np.pi / 2, 60)
    points: list[tuple[float, float]] = []
    for a in angles:
        px = cx + r * np.cos(a)
        py = cy + r * np.sin(a)
        if px < pen_x:
            points.append((px, py))

    if len(points) < 2:
        return ""

    path = f"M {points[0][0]:.2f},{points[0][1]:.2f}"
    for px, py in points[1:]:
        path += f" L {px:.2f},{py:.2f}"

    return path


# Mapeamento de parte do corpo / situação para símbolos
_BODY_PART_SYMBOL: dict[str, str] = {
    "right_foot": "circle",
    "left_foot": "circle",
    "head": "diamond",
    "other": "square",
}

_SITUATION_SYMBOL: dict[str, str] = {
    "open_play": "circle",
    "set_piece": "triangle-up",
    "corner": "star",
    "free_kick": "hexagon",
    "penalty": "cross",
}


def create_shot_map(
    shots_df: pd.DataFrame,
    team_name: str,
) -> go.Figure:
    """
    Mapa de chutes em meio campo.

    Parameters
    ----------
    shots_df : pd.DataFrame
        Deve conter colunas: ``x``, ``y``, ``xg``, ``result``,
        e opcionalmente ``body_part``, ``situation``.
    team_name : str
        Nome do time para título.
    """
    fig = go.Figure()

    df = shots_df.copy()

    # Escala de cores: azul (baixo xG) -> vermelho (alto xG)
    xg_vals = df["xg"].values
    xg_min = float(xg_vals.min()) if len(xg_vals) > 0 else 0.0
    xg_max = float(xg_vals.max()) if len(xg_vals) > 0 else 1.0

    # Símbolo por situação (ou body_part)
    if "situation" in df.columns:
        symbols = df["situation"].map(_SITUATION_SYMBOL).fillna("circle")
    elif "body_part" in df.columns:
        symbols = df["body_part"].map(_BODY_PART_SYMBOL).fillna("circle")
    else:
        symbols = ["circle"] * len(df)

    # Marcador de resultado
    is_goal = df.get("result", pd.Series(["no_goal"] * len(df))).str.lower() == "goal"

    fig.add_trace(
        go.Scatter(
            x=df["x"],
            y=df["y"],
            mode="markers",
            marker=dict(
                size=df["xg"].clip(lower=0.02) * 60 + 5,
                color=df["xg"],
                colorscale=[[0, "#1565C0"], [0.5, "#FFC107"], [1, "#D32F2F"]],
                cmin=xg_min,
                cmax=max(xg_max, 0.01),
                colorbar=dict(
                    title="xG",
                    titleside="right",
                    tickfont=dict(color=TEXT_SECONDARY, size=10),
                    titlefont=dict(color=TEXT_SECONDARY, size=11),
                    bgcolor="rgba(0,0,0,0)",
                    len=0.6,
                ),
                symbol=symbols,
                line=dict(
                    width=[2 if g else 0.5 for g in is_goal],
                    color=[TEXT_PRIMARY if g else "rgba(255,255,255,0.3)" for g in is_goal],
                ),
                opacity=0.9,
            ),
            hovertemplate=(
                "xG: %{marker.color:.3f}<br>"
                "x: %{x:.1f}, y: %{y:.1f}<extra></extra>"
            ),
            showlegend=False,
        )
    )

    # Shapes do campo
    pitch_shapes = _half_pitch_shapes()

    layout = get_plotly_layout(
        title={"text": f"{team_name} — Mapa de Chutes"},
        xaxis={
            "range": [-2, _HALF_LENGTH + 4],
            "showgrid": False,
            "zeroline": False,
            "showticklabels": False,
            "title": "",
            "scaleanchor": "y",
            "scaleratio": 1,
        },
        yaxis={
            "range": [-2, _PITCH_WIDTH + 2],
            "showgrid": False,
            "zeroline": False,
            "showticklabels": False,
            "title": "",
        },
        shapes=pitch_shapes,
        height=500,
        width=620,
    )
    fig.update_layout(**layout)

    return fig


# ---------------------------------------------------------------------------
# Strip / beeswarm plot
# ---------------------------------------------------------------------------
def create_strip_plot(
    values: list[float] | np.ndarray,
    highlighted_value: float,
    label: str,
    league_avg: float,
) -> go.Figure:
    """
    Strip plot horizontal mostrando a distribuição da liga, com destaque
    para o time selecionado.

    Parameters
    ----------
    values : list/array
        Valores de todos os times da liga.
    highlighted_value : float
        Valor do time destacado.
    label : str
        Rótulo da métrica.
    league_avg : float
        Média da liga.
    """
    fig = go.Figure()

    # Pequeno jitter vertical para evitar sobreposição
    jitter = np.random.default_rng(42).uniform(-0.15, 0.15, size=len(values))

    # Pontos da liga (cinza)
    fig.add_trace(
        go.Scatter(
            x=list(values),
            y=jitter.tolist(),
            mode="markers",
            marker=dict(size=9, color=TEXT_SECONDARY, opacity=0.5),
            hovertemplate="%{x:.2f}<extra></extra>",
            showlegend=False,
        )
    )

    # Ponto destacado (azul)
    fig.add_trace(
        go.Scatter(
            x=[highlighted_value],
            y=[0],
            mode="markers",
            marker=dict(
                size=14,
                color="#42A5F5",
                line=dict(width=2, color=TEXT_PRIMARY),
            ),
            hovertemplate=f"<b>{label}</b><br>%{{x:.2f}}<extra></extra>",
            showlegend=False,
        )
    )

    # Linha de média da liga (vermelha tracejada)
    fig.add_vline(
        x=league_avg,
        line_dash="dash",
        line_color=ACCENT_RED,
        line_width=1.5,
        annotation_text=f"Média: {league_avg:.2f}",
        annotation_position="top right",
        annotation_font_color=ACCENT_RED,
        annotation_font_size=10,
    )

    layout = get_plotly_layout(
        xaxis={"title": label},
        yaxis={
            "showticklabels": False,
            "showgrid": False,
            "zeroline": False,
            "range": [-0.5, 0.5],
            "title": "",
        },
        height=160,
        margin={"l": 40, "r": 40, "t": 30, "b": 40},
        showlegend=False,
    )
    fig.update_layout(**layout)

    return fig


# ---------------------------------------------------------------------------
# Probability bar (projeção de resultado)
# ---------------------------------------------------------------------------
def create_probability_bar(
    home_pct: float,
    draw_pct: float,
    away_pct: float,
    home_team: str,
    away_team: str,
) -> go.Figure:
    """
    Barra horizontal empilhada com probabilidades de resultado.

    Os valores devem estar em escala 0-100 (percentual).
    """
    fig = go.Figure()

    fig.add_trace(
        go.Bar(
            y=["Resultado"],
            x=[home_pct],
            orientation="h",
            name=home_team,
            marker_color=ACCENT_GREEN,
            text=f"{home_pct:.1f}%",
            textposition="inside",
            textfont=dict(color=TEXT_PRIMARY, size=13, family="Inter"),
            hovertemplate=f"{home_team}: %{{x:.1f}}%<extra></extra>",
        )
    )

    fig.add_trace(
        go.Bar(
            y=["Resultado"],
            x=[draw_pct],
            orientation="h",
            name="Empate",
            marker_color=TEXT_SECONDARY,
            text=f"{draw_pct:.1f}%",
            textposition="inside",
            textfont=dict(color=TEXT_PRIMARY, size=13, family="Inter"),
            hovertemplate=f"Empate: %{{x:.1f}}%<extra></extra>",
        )
    )

    fig.add_trace(
        go.Bar(
            y=["Resultado"],
            x=[away_pct],
            orientation="h",
            name=away_team,
            marker_color=ACCENT_RED,
            text=f"{away_pct:.1f}%",
            textposition="inside",
            textfont=dict(color=TEXT_PRIMARY, size=13, family="Inter"),
            hovertemplate=f"{away_team}: %{{x:.1f}}%<extra></extra>",
        )
    )

    layout = get_plotly_layout(
        title={"text": f"{home_team} vs {away_team}"},
        barmode="stack",
        xaxis={
            "showticklabels": False,
            "showgrid": False,
            "zeroline": False,
            "range": [0, 100],
            "title": "",
        },
        yaxis={
            "showticklabels": False,
            "showgrid": False,
            "title": "",
        },
        height=140,
        margin={"l": 10, "r": 10, "t": 50, "b": 10},
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.6,
            xanchor="center",
            x=0.5,
        ),
    )
    fig.update_layout(**layout)

    return fig


# ---------------------------------------------------------------------------
# Points distribution (histograma de projeção)
# ---------------------------------------------------------------------------
def create_points_distribution(
    team_name: str,
    points_array: np.ndarray,
) -> go.Figure:
    """
    Histograma de pontos projetados com intervalo de confiança sombreado.

    Parameters
    ----------
    team_name : str
        Nome do time.
    points_array : np.ndarray
        Array com pontuações simuladas.
    """
    fig = go.Figure()

    mean_pts: float = float(np.mean(points_array))
    p5: float = float(np.percentile(points_array, 5))
    p95: float = float(np.percentile(points_array, 95))

    fig.add_trace(
        go.Histogram(
            x=points_array,
            nbinsx=40,
            marker_color=ACCENT_GREEN,
            marker_line=dict(color=BG_CARD, width=0.5),
            opacity=0.8,
            hovertemplate="Pontos: %{x}<br>Frequência: %{y}<extra></extra>",
            showlegend=False,
        )
    )

    # Intervalo de confiança (sombreamento)
    y_max: float = float(np.histogram(points_array, bins=40)[0].max()) * 1.05
    fig.add_vrect(
        x0=p5,
        x1=p95,
        fillcolor="rgba(76, 175, 80, 0.12)",
        line_width=0,
        annotation_text=f"IC 90%: {p5:.0f}–{p95:.0f}",
        annotation_position="top left",
        annotation_font_color=ACCENT_GREEN,
        annotation_font_size=10,
    )

    # Linha da média
    fig.add_vline(
        x=mean_pts,
        line_dash="solid",
        line_color=TEXT_PRIMARY,
        line_width=2,
        annotation_text=f"Média: {mean_pts:.1f}",
        annotation_position="top right",
        annotation_font_color=TEXT_PRIMARY,
        annotation_font_size=11,
    )

    layout = get_plotly_layout(
        title={"text": f"{team_name} — Projeção de Pontos"},
        xaxis={"title": "Pontos"},
        yaxis={"title": "Frequência"},
        height=380,
    )
    fig.update_layout(**layout)

    return fig
