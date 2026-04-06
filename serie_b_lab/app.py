"""
Série B Lab — Análise de Desempenho da Série B do Brasileirão 2026.

Entry point principal do aplicativo Streamlit multi-page.
"""
import streamlit as st

st.set_page_config(
    page_title="Série B Lab",
    page_icon="⚽",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --- CSS e tema global ---
from utils.theme import inject_css

inject_css()

# --- Sidebar ---
st.sidebar.markdown(
    """
    <div style="text-align: center; padding: 1rem 0 0.5rem 0;">
        <h1 style="margin: 0; font-size: 1.8rem; letter-spacing: 2px;">
            ⚽ Série B Lab
        </h1>
        <p style="color: #A0A0A0; font-size: 0.85rem; margin-top: 4px; letter-spacing: 1px;">
            BRAZIL · 2026
        </p>
    </div>
    <hr style="border-color: #2A2D35; margin: 0.5rem 0 1rem 0;">
    """,
    unsafe_allow_html=True,
)

st.sidebar.markdown(
    """
    <div style="color: #A0A0A0; font-size: 0.78rem; padding: 0 0.5rem;">
        <p><b style="color: #FAFAFA;">Navegação</b></p>
        <p>Use o menu lateral para navegar entre as páginas de análise.</p>
        <hr style="border-color: #2A2D35; margin: 1rem 0;">
        <p><b style="color: #FAFAFA;">Sobre</b></p>
        <p>Dashboard de análise de desempenho dos times da Série B do Brasileirão 2026,
        inspirado no TeamsLab.</p>
        <p style="margin-top: 1rem;">
            <b style="color: #4CAF50;">Dados:</b> Sample data (demonstração)
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

# --- Página principal (Home) ---
st.markdown(
    """
    <div style="text-align: center; padding: 3rem 0 1rem 0;">
        <p style="color: #A0A0A0; font-size: 0.9rem; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 0.5rem;">
            BRAZIL
        </p>
        <h1 style="font-size: 3rem; font-weight: 700; margin: 0;">
            Série B Lab
        </h1>
        <p style="color: #A0A0A0; font-size: 1.1rem; margin-top: 0.5rem;">
            Análise de desempenho · Temporada 2026
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

st.markdown("<br>", unsafe_allow_html=True)

# Cards de navegação
col1, col2, col3 = st.columns(3)

card_style = """
    background: #21252B;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid #2A2D35;
    height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: center;
"""

with col1:
    st.markdown(
        f"""
        <div style="{card_style}">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
            <h3 style="margin: 0; font-size: 1.1rem;">Summary</h3>
            <p style="color: #A0A0A0; font-size: 0.8rem; margin-top: 0.3rem;">
                Tabela ranking com heatmap de métricas
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col2:
    st.markdown(
        f"""
        <div style="{card_style}">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📈</div>
            <h3 style="margin: 0; font-size: 1.1rem;">Trends</h3>
            <p style="color: #A0A0A0; font-size: 0.8rem; margin-top: 0.3rem;">
                Médias móveis e evolução por time
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col3:
    st.markdown(
        f"""
        <div style="{card_style}">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔵</div>
            <h3 style="margin: 0; font-size: 1.1rem;">Scatter Plots</h3>
            <p style="color: #A0A0A0; font-size: 0.8rem; margin-top: 0.3rem;">
                Comparação entre times em duas dimensões
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

col4, col5, col6 = st.columns(3)

with col4:
    st.markdown(
        f"""
        <div style="{card_style}">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎯</div>
            <h3 style="margin: 0; font-size: 1.1rem;">Shot Map</h3>
            <p style="color: #A0A0A0; font-size: 0.8rem; margin-top: 0.3rem;">
                Mapa de chutes e distribuições
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col5:
    st.markdown(
        f"""
        <div style="{card_style}">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚽</div>
            <h3 style="margin: 0; font-size: 1.1rem;">Match Projections</h3>
            <p style="color: #A0A0A0; font-size: 0.8rem; margin-top: 0.3rem;">
                Projeções por jogo via Poisson
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col6:
    st.markdown(
        f"""
        <div style="{card_style}">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏆</div>
            <h3 style="margin: 0; font-size: 1.1rem;">Season Projections</h3>
            <p style="color: #A0A0A0; font-size: 0.8rem; margin-top: 0.3rem;">
                Simulação Monte Carlo da temporada
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown(
    """
    <div style="text-align: center; color: #A0A0A0; font-size: 0.75rem; margin-top: 3rem; padding-bottom: 1rem;">
        Série B Lab · Dados de demonstração · 2026
    </div>
    """,
    unsafe_allow_html=True,
)
