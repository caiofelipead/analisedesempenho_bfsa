"""
Módulo de tema visual para o Série B Lab.
Define cores, estilos CSS e constantes visuais para o dashboard.
"""

from typing import Any

import streamlit as st


# ---------------------------------------------------------------------------
# Constantes de cor
# ---------------------------------------------------------------------------
BG_PRIMARY: str = "#0E1117"
BG_SECONDARY: str = "#1A1D23"
BG_CARD: str = "#21252B"
TEXT_PRIMARY: str = "#FAFAFA"
TEXT_SECONDARY: str = "#A0A0A0"
ACCENT_GREEN: str = "#4CAF50"
ACCENT_RED: str = "#F44336"
ACCENT_PINK: str = "#FF69B4"
GRID_LINES: str = "#2A2D35"


# ---------------------------------------------------------------------------
# CSS injection
# ---------------------------------------------------------------------------
def inject_css() -> None:
    """Injeta estilos CSS globais no app Streamlit."""
    st.markdown(
        f"""
        <style>
            /* ---- Google Font ---- */
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

            /* ---- Global ---- */
            html, body, [class*="st-"] {{
                font-family: 'Inter', sans-serif;
            }}

            /* ---- Esconde menu hambúrguer e rodapé ---- */
            #MainMenu {{visibility: hidden;}}
            footer {{visibility: hidden;}}
            header {{visibility: hidden;}}

            /* ---- Sidebar ---- */
            [data-testid="stSidebar"] {{
                background-color: {BG_SECONDARY};
                border-right: 1px solid {GRID_LINES};
            }}
            [data-testid="stSidebar"] .block-container {{
                padding-top: 1rem;
            }}

            /* ---- Card styling ---- */
            .card {{
                background-color: {BG_CARD};
                border-radius: 10px;
                padding: 1.2rem;
                margin-bottom: 1rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }}
            .card h3 {{
                color: {TEXT_PRIMARY};
                margin-top: 0;
                font-weight: 600;
            }}
            .card p {{
                color: {TEXT_SECONDARY};
                margin-bottom: 0;
            }}

            /* ---- Heatmap table styling ---- */
            .heatmap-table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 0.85rem;
            }}
            .heatmap-table th {{
                background-color: {BG_SECONDARY};
                color: {TEXT_PRIMARY};
                padding: 8px 12px;
                text-align: center;
                font-weight: 600;
                border-bottom: 2px solid {GRID_LINES};
            }}
            .heatmap-table td {{
                padding: 6px 10px;
                text-align: center;
                color: {TEXT_PRIMARY};
                border-bottom: 1px solid {GRID_LINES};
            }}
            .heatmap-table tr:hover {{
                background-color: rgba(255, 255, 255, 0.04);
            }}

            /* ---- Scrollbar ---- */
            ::-webkit-scrollbar {{
                width: 8px;
                height: 8px;
            }}
            ::-webkit-scrollbar-track {{
                background: {BG_PRIMARY};
            }}
            ::-webkit-scrollbar-thumb {{
                background: {GRID_LINES};
                border-radius: 4px;
            }}
            ::-webkit-scrollbar-thumb:hover {{
                background: {TEXT_SECONDARY};
            }}

            /* ---- Misc ---- */
            .stMetric label {{
                color: {TEXT_SECONDARY} !important;
            }}
        </style>
        """,
        unsafe_allow_html=True,
    )


# ---------------------------------------------------------------------------
# Plotly layout padrão
# ---------------------------------------------------------------------------
def get_plotly_layout(**kwargs: Any) -> dict[str, Any]:
    """
    Retorna configuração de layout Plotly com tema escuro padrão.
    Quaisquer kwargs sobrescrevem os valores padrão.
    """
    base: dict[str, Any] = {
        "paper_bgcolor": BG_CARD,
        "plot_bgcolor": BG_CARD,
        "font": {
            "family": "Inter, sans-serif",
            "color": TEXT_PRIMARY,
            "size": 13,
        },
        "title": {
            "font": {"size": 16, "color": TEXT_PRIMARY},
            "x": 0.5,
            "xanchor": "center",
        },
        "xaxis": {
            "gridcolor": GRID_LINES,
            "zerolinecolor": GRID_LINES,
            "tickfont": {"color": TEXT_SECONDARY},
            "title_font": {"color": TEXT_SECONDARY},
        },
        "yaxis": {
            "gridcolor": GRID_LINES,
            "zerolinecolor": GRID_LINES,
            "tickfont": {"color": TEXT_SECONDARY},
            "title_font": {"color": TEXT_SECONDARY},
        },
        "legend": {
            "bgcolor": "rgba(0,0,0,0)",
            "font": {"color": TEXT_SECONDARY, "size": 11},
        },
        "margin": {"l": 50, "r": 30, "t": 50, "b": 50},
        "hoverlabel": {
            "bgcolor": BG_SECONDARY,
            "font_size": 12,
            "font_color": TEXT_PRIMARY,
        },
    }

    # Merge recursivo simples (1 nível de profundidade)
    for key, value in kwargs.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            base[key] = {**base[key], **value}
        else:
            base[key] = value

    return base


# ---------------------------------------------------------------------------
# Função de cor para heatmap
# ---------------------------------------------------------------------------
def heatmap_color(
    value: float,
    vmin: float,
    vmax: float,
    reverse: bool = False,
) -> str:
    """
    Retorna uma string CSS ``rgba(...)`` que interpola suavemente entre
    vermelho escuro (ruim) e verde escuro (bom).

    Parameters
    ----------
    value : float
        Valor a ser mapeado.
    vmin : float
        Limite inferior da escala.
    vmax : float
        Limite superior da escala.
    reverse : bool
        Se ``True``, inverte a escala (valores altos = ruim).
    """
    if vmax == vmin:
        return f"rgba({BG_CARD.lstrip('#')}, 1.0)"

    # Normaliza entre 0 e 1
    t: float = max(0.0, min(1.0, (value - vmin) / (vmax - vmin)))

    if reverse:
        t = 1.0 - t

    # Interpolação: vermelho escuro -> neutro escuro -> verde escuro
    if t <= 0.5:
        # Vermelho escuro (140,30,30) -> Neutro escuro (42,45,53)
        s = t / 0.5
        r = int(140 + (42 - 140) * s)
        g = int(30 + (45 - 30) * s)
        b = int(30 + (53 - 30) * s)
    else:
        # Neutro escuro (42,45,53) -> Verde escuro (30,120,50)
        s = (t - 0.5) / 0.5
        r = int(42 + (30 - 42) * s)
        g = int(45 + (120 - 45) * s)
        b = int(53 + (50 - 53) * s)

    return f"rgba({r}, {g}, {b}, 0.85)"
