"""
BFSA Performance Analysis — FastAPI Backend
Botafogo de Ribeirão Preto | Departamento de Análise de Desempenho
"""
import os
import io
import csv
import json
import logging
from datetime import date, datetime
from typing import Optional
from decimal import Decimal

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Date, DateTime,
    Numeric, Boolean, ForeignKey, UniqueConstraint, Index, func, desc, asc,
    ARRAY, CheckConstraint, event,
)
from sqlalchemy.orm import (
    declarative_base, sessionmaker, relationship, Session, joinedload,
)
import pandas as pd

# ─────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bfsa:bfsa@localhost:5432/bfsa_performance")

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────────
# ORM MODELS
# ─────────────────────────────────────────────
class Atleta(Base):
    __tablename__ = "atletas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    posicao = Column(String(10))
    numero = Column(Integer)
    status = Column(String(20), default="ativo")
    foto_url = Column(Text)
    categoria = Column(String(20), default="profissional")
    tendencia = Column(String(20), default="estavel")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    estatisticas = relationship("EstatisticaIndividual", back_populates="atleta", cascade="all,delete-orphan")
    videos = relationship("Video", back_populates="atleta", cascade="all,delete-orphan")


class PartidaColetiva(Base):
    __tablename__ = "partidas_coletivas"
    id = Column(Integer, primary_key=True, index=True)
    jogo = Column(String(100), nullable=False)
    competicao = Column(String(50))
    data = Column(Date)
    local = Column(String(10))
    resultado = Column(String(5))
    gols_pro = Column(Integer, default=0)
    gols_contra = Column(Integer, default=0)
    xg = Column(Numeric(4, 2))
    xg_contra = Column(Numeric(4, 2))
    posse = Column(Numeric(4, 1))
    passes = Column(Integer)
    passes_pct = Column(Numeric(4, 1))
    remates = Column(Integer)
    remates_alvo = Column(Integer)
    duelos = Column(Integer)
    duelos_pct = Column(Numeric(4, 1))
    recuperacoes = Column(Integer)
    perdas = Column(Integer)
    ppda = Column(Numeric(4, 2))
    corners = Column(Integer)
    faltas = Column(Integer)
    cartoes_amarelos = Column(Integer, default=0)
    cartoes_vermelhos = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

    estatisticas = relationship("EstatisticaIndividual", back_populates="partida", cascade="all,delete-orphan")


class EstatisticaIndividual(Base):
    __tablename__ = "estatisticas_individuais"
    id = Column(Integer, primary_key=True, index=True)
    atleta_id = Column(Integer, ForeignKey("atletas.id", ondelete="CASCADE"), nullable=False, index=True)
    partida_id = Column(Integer, ForeignKey("partidas_coletivas.id", ondelete="CASCADE"), index=True)
    competicao = Column(String(50))
    data = Column(Date)
    posicao = Column(String(10))
    minutos = Column(Integer)
    # Wyscout Player Stats — 67 metric columns
    acoes_totais = Column(Integer)
    acoes_sucesso = Column(Integer)
    gols = Column(Integer, default=0)
    assistencias = Column(Integer, default=0)
    remates = Column(Integer)
    remates_baliza = Column(Integer)
    xg = Column(Numeric(4, 2))
    passes = Column(Integer)
    passes_certos = Column(Integer)
    passes_longos = Column(Integer)
    passes_longos_certos = Column(Integer)
    cruzamentos = Column(Integer)
    cruzamentos_certos = Column(Integer)
    dribles = Column(Integer)
    dribles_sucesso = Column(Integer)
    duelos = Column(Integer)
    duelos_ganhos = Column(Integer)
    duelos_aereos = Column(Integer)
    duelos_aereos_ganhos = Column(Integer)
    intercepcoes = Column(Integer)
    perdas = Column(Integer)
    perdas_meio_campo = Column(Integer)
    recuperacoes = Column(Integer)
    recuperacoes_campo_adv = Column(Integer)
    cartao_amarelo = Column(Integer, default=0)
    cartao_vermelho = Column(Integer, default=0)
    duelos_defensivos = Column(Integer)
    duelos_defensivos_ganhos = Column(Integer)
    duelos_bola_livre = Column(Integer)
    duelos_bola_livre_ganhos = Column(Integer)
    carrinhos = Column(Integer)
    carrinhos_sucesso = Column(Integer)
    alivios = Column(Integer)
    faltas = Column(Integer)
    cartoes_amarelos = Column(Integer, default=0)
    cartoes_vermelhos = Column(Integer, default=0)
    assistencias_remate = Column(Integer)
    duelos_ofensivos = Column(Integer)
    duelos_ofensivos_ganhos = Column(Integer)
    toques_area = Column(Integer)
    fora_jogo = Column(Integer)
    corridas_seguidas = Column(Integer)
    faltas_sofridas = Column(Integer)
    passes_profundidade = Column(Integer)
    passes_profundidade_certos = Column(Integer)
    xa = Column(Numeric(4, 2))
    segundas_assistencias = Column(Integer)
    passes_terco_final = Column(Integer)
    passes_terco_final_certos = Column(Integer)
    passes_grande_area = Column(Integer)
    passes_grande_area_precisos = Column(Integer)
    passes_recebidos = Column(Integer)
    passes_frente = Column(Integer)
    passes_frente_certos = Column(Integer)
    passes_tras = Column(Integer)
    passes_tras_certos = Column(Integer)
    # GK-specific
    gols_sofridos_gk = Column(Integer)
    xcg_gk = Column(Numeric(4, 2))
    remates_sofridos_gk = Column(Integer)
    defesas_gk = Column(Integer)
    defesas_reflexo_gk = Column(Integer)
    saidas_gk = Column(Integer)
    carrinhos_gk = Column(Integer)
    carrinhos_sucesso_gk = Column(Integer)
    pontapes_baliza_gk = Column(Integer)
    pontapes_baliza_curtos_gk = Column(Integer)
    pontapes_baliza_longos_gk = Column(Integer)

    __table_args__ = (
        UniqueConstraint("atleta_id", "partida_id", name="uq_atleta_partida"),
    )

    atleta = relationship("Atleta", back_populates="estatisticas")
    partida = relationship("PartidaColetiva", back_populates="estatisticas")


class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True, index=True)
    atleta_id = Column(Integer, ForeignKey("atletas.id", ondelete="CASCADE"), index=True)
    titulo = Column(String(200))
    url = Column(Text)
    tipo = Column(String(30))
    tags = Column(ARRAY(Text))
    data_criacao = Column(Date, default=func.current_date())

    atleta = relationship("Atleta", back_populates="videos")


class Calendario(Base):
    __tablename__ = "calendario"
    id = Column(Integer, primary_key=True, index=True)
    rodada = Column(String(20))
    competicao = Column(String(50))
    adversario = Column(String(100))
    local = Column(String(10))
    data = Column(Date)
    resultado = Column(String(10))
    status = Column(String(20), default="pendente")
    adv_analise = Column(Boolean, default=False)
    prelecao = Column(Boolean, default=False)
    pos_jogo = Column(Boolean, default=False)
    wyscout_ok = Column(Boolean, default=False)
    treino_ok = Column(Boolean, default=False)
    bola_parada_ok = Column(Boolean, default=False)
    individual_ok = Column(Boolean, default=False)

    __table_args__ = (
        Index("ix_calendario_comp_data", "competicao", "data"),
    )


class ModeloJogo(Base):
    __tablename__ = "modelo_jogo"
    id = Column(Integer, primary_key=True, index=True)
    fase = Column(String(30))
    principio = Column(String(100))
    sub_principio = Column(String(100))
    descricao = Column(Text)
    video_ref = Column(Text)


class Analista(Base):
    __tablename__ = "analistas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100))
    funcao = Column(String(50))
    qualidade = Column(Numeric(3, 1))
    entregas_pendentes = Column(Integer, default=0)

    entregas = relationship("EntregaSoutto", back_populates="analista", cascade="all,delete-orphan")


class EntregaSoutto(Base):
    __tablename__ = "entregas_soutto"
    id = Column(Integer, primary_key=True, index=True)
    analista_id = Column(Integer, ForeignKey("analistas.id", ondelete="CASCADE"))
    tipo = Column(String(50))
    descricao = Column(Text)
    data_limite = Column(Date)
    status = Column(String(20), default="pendente")

    analista = relationship("Analista", back_populates="entregas")


class Protocolo(Base):
    __tablename__ = "protocolos"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200))
    categoria = Column(String(50))
    descricao = Column(Text)
    status = Column(String(20), default="ativo")


class ProximoAdversario(Base):
    __tablename__ = "proximo_adversario"
    id = Column(Integer, primary_key=True, index=True)
    adversario = Column(String(100))
    competicao = Column(String(50))
    rodada = Column(String(20))
    data = Column(Date)
    progresso_pct = Column(Integer, default=0)
    analise_tatica = Column(Text)
    jogadores_chave = Column(Text)
    pontos_fortes = Column(Text)
    pontos_fracos = Column(Text)


class AdversarioRelatorio(Base):
    __tablename__ = 'adversario_relatorios'
    id = Column(Integer, primary_key=True, index=True)
    equipe = Column(String(100), nullable=False)
    jogos_analisados = Column(Integer, default=0)
    data_analise = Column(Date, default=date.today)
    remates_total = Column(Integer)
    remates_no_alvo = Column(Integer)
    precisao_remates_pct = Column(Numeric(5, 2))
    xg_total = Column(Numeric(5, 2))
    gols_total = Column(Integer)
    fonte = Column(String(50), default='wyscout_pdf')
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    adv_jogadores = relationship("AdversarioJogador", back_populates="relatorio", cascade="all,delete-orphan")
    adv_formacoes = relationship("AdversarioFormacao", back_populates="relatorio", cascade="all,delete-orphan")
    adv_resultados = relationship("AdversarioResultado", back_populates="relatorio", cascade="all,delete-orphan")
    adv_transicoes = relationship("AdversarioTransicao", back_populates="relatorio", cascade="all,delete-orphan")


class AdversarioResultado(Base):
    __tablename__ = 'adversario_resultados'
    id = Column(Integer, primary_key=True, index=True)
    relatorio_id = Column(Integer, ForeignKey('adversario_relatorios.id', ondelete='CASCADE'))
    data_jogo = Column(Date)
    competicao = Column(String(100))
    adversario_do_adversario = Column(String(100))
    gols_favor = Column(Integer)
    gols_contra = Column(Integer)
    mandante = Column(Boolean, default=True)

    relatorio = relationship("AdversarioRelatorio", back_populates="adv_resultados")


class AdversarioJogador(Base):
    __tablename__ = 'adversario_jogadores'
    id = Column(Integer, primary_key=True, index=True)
    relatorio_id = Column(Integer, ForeignKey('adversario_relatorios.id', ondelete='CASCADE'))
    numero = Column(Integer)
    nome = Column(String(100), nullable=False)
    posicao = Column(String(10))
    idade = Column(Integer)
    altura = Column(Integer)
    jogos = Column(Integer)
    minutos = Column(Integer)
    gols = Column(Integer, default=0)
    xg = Column(Numeric(5, 2))
    assistencias = Column(Integer, default=0)
    xa = Column(Numeric(5, 2))
    remates_total = Column(Integer)
    remates_no_alvo = Column(Integer)
    remates_precisao = Column(Numeric(5, 2))
    passes_total = Column(Integer)
    passes_certos = Column(Integer)
    passes_precisao = Column(Numeric(5, 2))
    passes_frente = Column(String(30))
    passes_tras = Column(String(30))
    passes_laterais = Column(String(30))
    passes_curtos_medios = Column(String(30))
    passes_longos = Column(String(30))
    passes_progressivos = Column(String(30))
    passes_terco_final = Column(String(30))
    passes_diagonal = Column(String(30))
    deep_completions = Column(Integer)
    passes_decisivos = Column(Integer)
    shot_assists = Column(Integer)
    cruzamentos_total = Column(Integer)
    cruzamentos_certos = Column(Integer)
    dribles_total = Column(Integer)
    dribles_certos = Column(Integer)
    duelos_total = Column(Integer)
    duelos_ganhos = Column(Integer)
    duelos_precisao = Column(Numeric(5, 2))
    duelos_def_total = Column(Integer)
    duelos_def_ganhos = Column(Integer)
    duelos_of_total = Column(Integer)
    duelos_of_ganhos = Column(Integer)
    duelos_aereos_total = Column(Integer)
    duelos_aereos_ganhos = Column(Integer)
    interceptacoes = Column(String(20))
    cortes_carrinho = Column(String(20))
    perdas_meio_campo = Column(String(20))
    recuperacoes = Column(String(20))
    touches_area = Column(Integer)
    faltas_sofridas = Column(String(20))
    cartoes_amarelos = Column(Integer, default=0)
    cartoes_vermelhos = Column(Integer, default=0)

    relatorio = relationship("AdversarioRelatorio", back_populates="adv_jogadores")


class AdversarioFormacao(Base):
    __tablename__ = 'adversario_formacoes'
    id = Column(Integer, primary_key=True, index=True)
    relatorio_id = Column(Integer, ForeignKey('adversario_relatorios.id', ondelete='CASCADE'))
    sistema = Column(String(15), nullable=False)
    frequencia_pct = Column(Numeric(5, 2))
    gols_favor = Column(Integer)
    gols_contra = Column(Integer)
    xg = Column(Numeric(5, 2))
    xg_contra = Column(Numeric(5, 2))
    posse_pct = Column(Numeric(5, 2))
    posse_adversario_pct = Column(Numeric(5, 2))
    precisao_passe_pct = Column(Numeric(5, 2))
    precisao_passe_adv_pct = Column(Numeric(5, 2))
    intensidade_jogo = Column(Numeric(5, 2))
    intensidade_jogo_adv = Column(Numeric(5, 2))
    passe_profundidade_pct = Column(Numeric(5, 2))
    passe_profundidade_adv_pct = Column(Numeric(5, 2))
    ppda = Column(Numeric(5, 2))
    ppda_adv = Column(Numeric(5, 2))

    relatorio = relationship("AdversarioRelatorio", back_populates="adv_formacoes")


class AdversarioTransicao(Base):
    __tablename__ = 'adversario_transicoes'
    id = Column(Integer, primary_key=True, index=True)
    relatorio_id = Column(Integer, ForeignKey('adversario_relatorios.id', ondelete='CASCADE'))
    tipo = Column(String(20), nullable=False)
    jogador_numero = Column(Integer)
    jogador_nome = Column(String(100))
    minutos = Column(Integer)
    total = Column(Integer)
    media_90 = Column(Numeric(5, 2))

    relatorio = relationship("AdversarioRelatorio", back_populates="adv_transicoes")


# ─────────────────────────────────────────────
# PYDANTIC SCHEMAS
# ─────────────────────────────────────────────
class AtletaBase(BaseModel):
    nome: str
    posicao: Optional[str] = None
    numero: Optional[int] = None
    status: str = "ativo"
    foto_url: Optional[str] = None
    categoria: str = "profissional"
    tendencia: str = "estavel"

class AtletaOut(AtletaBase):
    id: int
    class Config:
        from_attributes = True

class PartidaColetivaBase(BaseModel):
    jogo: str
    competicao: Optional[str] = None
    data: Optional[date] = None
    local: Optional[str] = None
    resultado: Optional[str] = None
    gols_pro: int = 0
    gols_contra: int = 0
    xg: Optional[float] = None
    xg_contra: Optional[float] = None
    posse: Optional[float] = None
    passes: Optional[int] = None
    passes_pct: Optional[float] = None
    remates: Optional[int] = None
    remates_alvo: Optional[int] = None
    duelos: Optional[int] = None
    duelos_pct: Optional[float] = None
    recuperacoes: Optional[int] = None
    perdas: Optional[int] = None
    ppda: Optional[float] = None
    corners: Optional[int] = None
    faltas: Optional[int] = None
    cartoes_amarelos: int = 0
    cartoes_vermelhos: int = 0

class PartidaColetivaOut(PartidaColetivaBase):
    id: int
    class Config:
        from_attributes = True

class VideoBase(BaseModel):
    atleta_id: Optional[int] = None
    titulo: Optional[str] = None
    url: Optional[str] = None
    tipo: Optional[str] = None
    tags: Optional[list[str]] = None

class VideoOut(VideoBase):
    id: int
    data_criacao: Optional[date] = None
    class Config:
        from_attributes = True

class CalendarioBase(BaseModel):
    rodada: Optional[str] = None
    competicao: Optional[str] = None
    adversario: Optional[str] = None
    local: Optional[str] = None
    data: Optional[date] = None
    resultado: Optional[str] = None
    status: str = "pendente"
    adv_analise: bool = False
    prelecao: bool = False
    pos_jogo: bool = False
    wyscout_ok: bool = False
    treino_ok: bool = False
    bola_parada_ok: bool = False
    individual_ok: bool = False

class CalendarioOut(CalendarioBase):
    id: int
    class Config:
        from_attributes = True

class ModeloJogoBase(BaseModel):
    fase: Optional[str] = None
    principio: Optional[str] = None
    sub_principio: Optional[str] = None
    descricao: Optional[str] = None
    video_ref: Optional[str] = None

class ModeloJogoOut(ModeloJogoBase):
    id: int
    class Config:
        from_attributes = True

class AnalistaBase(BaseModel):
    nome: Optional[str] = None
    funcao: Optional[str] = None
    qualidade: Optional[float] = None

class AnalistaOut(AnalistaBase):
    id: int
    entregas_pendentes: int = 0
    class Config:
        from_attributes = True

class EntregaSouttoBase(BaseModel):
    analista_id: Optional[int] = None
    tipo: Optional[str] = None
    descricao: Optional[str] = None
    data_limite: Optional[date] = None
    status: str = "pendente"

class EntregaSouttoOut(EntregaSouttoBase):
    id: int
    class Config:
        from_attributes = True

class ProtocoloBase(BaseModel):
    titulo: Optional[str] = None
    categoria: Optional[str] = None
    descricao: Optional[str] = None
    status: str = "ativo"

class ProtocoloOut(ProtocoloBase):
    id: int
    class Config:
        from_attributes = True

class ProximoAdversarioBase(BaseModel):
    adversario: Optional[str] = None
    competicao: Optional[str] = None
    rodada: Optional[str] = None
    data: Optional[date] = None
    progresso_pct: int = 0
    analise_tatica: Optional[str] = None
    jogadores_chave: Optional[str] = None
    pontos_fortes: Optional[str] = None
    pontos_fracos: Optional[str] = None

class ProximoAdversarioOut(ProximoAdversarioBase):
    id: int
    class Config:
        from_attributes = True


class AdvResultadoSchema(BaseModel):
    data: Optional[str] = None
    competicao: Optional[str] = None
    adversario: Optional[str] = None
    gols_favor: Optional[int] = None
    gols_contra: Optional[int] = None
    mandante: Optional[bool] = True

class AdvJogadorSchema(BaseModel):
    numero: Optional[int] = None
    nome: str
    posicao: Optional[str] = None
    idade: Optional[int] = None
    altura: Optional[int] = None
    jogos: Optional[int] = None
    minutos: Optional[int] = None
    gols: Optional[int] = 0
    xg: Optional[float] = None
    assistencias: Optional[int] = 0
    xa: Optional[float] = None
    remates_total: Optional[int] = None
    remates_no_alvo: Optional[int] = None
    remates_precisao: Optional[float] = None
    passes_total: Optional[int] = None
    passes_certos: Optional[int] = None
    passes_precisao: Optional[float] = None
    duelos_total: Optional[int] = None
    duelos_ganhos: Optional[int] = None
    duelos_precisao: Optional[float] = None
    duelos_def_total: Optional[int] = None
    duelos_def_ganhos: Optional[int] = None
    duelos_of_total: Optional[int] = None
    duelos_of_ganhos: Optional[int] = None
    duelos_aereos_total: Optional[int] = None
    duelos_aereos_ganhos: Optional[int] = None
    passes_decisivos: Optional[int] = None
    shot_assists: Optional[int] = None
    cartoes_amarelos: Optional[int] = 0
    cartoes_vermelhos: Optional[int] = 0
    class Config:
        extra = "allow"

class AdvFormacaoSchema(BaseModel):
    sistema: str
    frequencia_pct: Optional[float] = None
    gols_favor: Optional[int] = None
    gols_contra: Optional[int] = None
    xg: Optional[float] = None
    xg_contra: Optional[float] = None
    posse_pct: Optional[float] = None
    posse_adversario_pct: Optional[float] = None
    precisao_passe_pct: Optional[float] = None
    precisao_passe_adv_pct: Optional[float] = None
    intensidade_jogo: Optional[float] = None
    ppda: Optional[float] = None
    ppda_adv: Optional[float] = None
    class Config:
        extra = "allow"

class AdvFinalizacaoSchema(BaseModel):
    remates_total: Optional[int] = 0
    remates_no_alvo: Optional[int] = 0
    precisao_remates_pct: Optional[float] = 0.0
    xg_total: Optional[float] = 0.0
    gols_total: Optional[int] = 0
    class Config:
        extra = "allow"

class AdvTransicaoItemSchema(BaseModel):
    numero: Optional[int] = None
    nome: Optional[str] = None
    minutos: Optional[int] = None
    total: Optional[int] = None
    media_90: Optional[float] = None

class AdvTransicoesSchema(BaseModel):
    recuperacoes: list[AdvTransicaoItemSchema] = []
    perdas: list[AdvTransicaoItemSchema] = []
    faltas: list[AdvTransicaoItemSchema] = []

class AdvRelatorioImportSchema(BaseModel):
    equipe: str
    jogos_analisados: Optional[int] = 0
    resultados: list[AdvResultadoSchema] = []
    jogadores: list[AdvJogadorSchema] = []
    formacoes: list[AdvFormacaoSchema] = []
    finalizacao: Optional[AdvFinalizacaoSchema] = None
    transicoes: Optional[AdvTransicoesSchema] = None

class AdvRelatorioOut(BaseModel):
    id: int
    equipe: str
    jogos_analisados: int
    data_analise: Optional[date] = None
    xg_total: Optional[float] = None
    gols_total: Optional[int] = None
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────
app = FastAPI(
    title="BFSA Performance API",
    description="Departamento de Análise de Desempenho — Botafogo de Ribeirão Preto",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "bfsa-performance", "version": "1.0.0"}


# ─────────────────────────────────────────────
# ATLETAS
# ─────────────────────────────────────────────
@app.get("/api/atletas", response_model=list[AtletaOut])
def list_atletas(
    posicao: Optional[str] = None,
    status: Optional[str] = None,
    categoria: Optional[str] = None,
    tendencia: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Atleta)
    if posicao:
        q = q.filter(Atleta.posicao == posicao)
    if status:
        q = q.filter(Atleta.status == status)
    if categoria:
        q = q.filter(Atleta.categoria == categoria)
    if tendencia:
        q = q.filter(Atleta.tendencia == tendencia)
    return q.order_by(Atleta.numero).offset(skip).limit(limit).all()


@app.get("/api/atletas/{atleta_id}", response_model=AtletaOut)
def get_atleta(atleta_id: int, db: Session = Depends(get_db)):
    a = db.query(Atleta).get(atleta_id)
    if not a:
        raise HTTPException(404, "Atleta não encontrado")
    return a


@app.post("/api/atletas", response_model=AtletaOut, status_code=201)
def create_atleta(payload: AtletaBase, db: Session = Depends(get_db)):
    a = Atleta(**payload.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@app.put("/api/atletas/{atleta_id}", response_model=AtletaOut)
def update_atleta(atleta_id: int, payload: AtletaBase, db: Session = Depends(get_db)):
    a = db.query(Atleta).get(atleta_id)
    if not a:
        raise HTTPException(404, "Atleta não encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return a


@app.delete("/api/atletas/{atleta_id}", status_code=204)
def delete_atleta(atleta_id: int, db: Session = Depends(get_db)):
    a = db.query(Atleta).get(atleta_id)
    if not a:
        raise HTTPException(404, "Atleta não encontrado")
    db.delete(a)
    db.commit()


@app.get("/api/atletas/{atleta_id}/stats")
def get_atleta_stats(atleta_id: int, db: Session = Depends(get_db)):
    a = db.query(Atleta).get(atleta_id)
    if not a:
        raise HTTPException(404, "Atleta não encontrado")
    stats = db.query(
        func.count(EstatisticaIndividual.id).label("partidas"),
        func.sum(EstatisticaIndividual.minutos).label("minutos_total"),
        func.avg(EstatisticaIndividual.minutos).label("minutos_avg"),
        func.sum(EstatisticaIndividual.gols).label("gols"),
        func.sum(EstatisticaIndividual.assistencias).label("assistencias"),
        func.sum(EstatisticaIndividual.remates).label("remates"),
        func.sum(EstatisticaIndividual.remates_baliza).label("remates_baliza"),
        func.avg(EstatisticaIndividual.xg).label("xg_avg"),
        func.sum(EstatisticaIndividual.passes).label("passes"),
        func.sum(EstatisticaIndividual.passes_certos).label("passes_certos"),
        func.sum(EstatisticaIndividual.duelos).label("duelos"),
        func.sum(EstatisticaIndividual.duelos_ganhos).label("duelos_ganhos"),
        func.sum(EstatisticaIndividual.intercepcoes).label("intercepcoes"),
        func.sum(EstatisticaIndividual.recuperacoes).label("recuperacoes"),
        func.sum(EstatisticaIndividual.perdas).label("perdas"),
        func.sum(EstatisticaIndividual.dribles).label("dribles"),
        func.sum(EstatisticaIndividual.dribles_sucesso).label("dribles_sucesso"),
        func.sum(EstatisticaIndividual.cartao_amarelo).label("amarelos"),
        func.sum(EstatisticaIndividual.cartao_vermelho).label("vermelhos"),
    ).filter(EstatisticaIndividual.atleta_id == atleta_id).first()

    passes_total = float(stats.passes or 0)
    passes_ok = float(stats.passes_certos or 0)
    duelos_total = float(stats.duelos or 0)
    duelos_ok = float(stats.duelos_ganhos or 0)

    return {
        "atleta": AtletaOut.model_validate(a),
        "stats": {
            "partidas": stats.partidas or 0,
            "minutos_total": stats.minutos_total or 0,
            "minutos_avg": round(float(stats.minutos_avg or 0), 1),
            "gols": stats.gols or 0,
            "assistencias": stats.assistencias or 0,
            "remates": stats.remates or 0,
            "remates_baliza": stats.remates_baliza or 0,
            "xg_avg": round(float(stats.xg_avg or 0), 2),
            "passes": int(passes_total),
            "passes_certos": int(passes_ok),
            "passes_pct": round(passes_ok / passes_total * 100, 1) if passes_total > 0 else 0,
            "duelos": int(duelos_total),
            "duelos_ganhos": int(duelos_ok),
            "duelos_pct": round(duelos_ok / duelos_total * 100, 1) if duelos_total > 0 else 0,
            "intercepcoes": stats.intercepcoes or 0,
            "recuperacoes": stats.recuperacoes or 0,
            "perdas": stats.perdas or 0,
            "dribles": stats.dribles or 0,
            "dribles_sucesso": stats.dribles_sucesso or 0,
            "amarelos": stats.amarelos or 0,
            "vermelhos": stats.vermelhos or 0,
        },
    }


# ─────────────────────────────────────────────
# PARTIDAS COLETIVAS
# ─────────────────────────────────────────────
@app.get("/api/partidas", response_model=list[PartidaColetivaOut])
def list_partidas(
    competicao: Optional[str] = None,
    resultado: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(PartidaColetiva)
    if competicao:
        q = q.filter(PartidaColetiva.competicao == competicao)
    if resultado:
        q = q.filter(PartidaColetiva.resultado == resultado)
    return q.order_by(PartidaColetiva.data.desc()).offset(skip).limit(limit).all()


@app.get("/api/partidas/{partida_id}")
def get_partida_detalhes(partida_id: int, db: Session = Depends(get_db)):
    p = db.query(PartidaColetiva).get(partida_id)
    if not p:
        raise HTTPException(404, "Partida não encontrada")
    stats = (
        db.query(EstatisticaIndividual)
        .filter(EstatisticaIndividual.partida_id == partida_id)
        .options(joinedload(EstatisticaIndividual.atleta))
        .all()
    )
    return {
        "partida": PartidaColetivaOut.model_validate(p),
        "estatisticas_individuais": [
            {
                "atleta": s.atleta.nome if s.atleta else None,
                "posicao": s.posicao,
                "minutos": s.minutos,
                "gols": s.gols,
                "assistencias": s.assistencias,
                "passes": s.passes,
                "passes_certos": s.passes_certos,
                "duelos": s.duelos,
                "duelos_ganhos": s.duelos_ganhos,
                "xg": float(s.xg) if s.xg else None,
            }
            for s in stats
        ],
    }


@app.post("/api/partidas", response_model=PartidaColetivaOut, status_code=201)
def create_partida(payload: PartidaColetivaBase, db: Session = Depends(get_db)):
    p = PartidaColetiva(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@app.put("/api/partidas/{partida_id}", response_model=PartidaColetivaOut)
def update_partida(partida_id: int, payload: PartidaColetivaBase, db: Session = Depends(get_db)):
    p = db.query(PartidaColetiva).get(partida_id)
    if not p:
        raise HTTPException(404, "Partida não encontrada")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@app.delete("/api/partidas/{partida_id}", status_code=204)
def delete_partida(partida_id: int, db: Session = Depends(get_db)):
    p = db.query(PartidaColetiva).get(partida_id)
    if not p:
        raise HTTPException(404, "Partida não encontrada")
    db.delete(p)
    db.commit()


# ─────────────────────────────────────────────
# ESTATÍSTICAS INDIVIDUAIS
# ─────────────────────────────────────────────
@app.get("/api/estatisticas/individuais")
def list_estatisticas(
    atleta_id: Optional[int] = None,
    competicao: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(EstatisticaIndividual).options(
        joinedload(EstatisticaIndividual.atleta),
        joinedload(EstatisticaIndividual.partida),
    )
    if atleta_id:
        q = q.filter(EstatisticaIndividual.atleta_id == atleta_id)
    if competicao:
        q = q.filter(EstatisticaIndividual.competicao == competicao)
    results = q.order_by(EstatisticaIndividual.data.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": r.id,
            "atleta": r.atleta.nome if r.atleta else None,
            "atleta_id": r.atleta_id,
            "partida": r.partida.jogo if r.partida else None,
            "competicao": r.competicao,
            "data": r.data,
            "posicao": r.posicao,
            "minutos": r.minutos,
            "gols": r.gols,
            "assistencias": r.assistencias,
            "passes": r.passes,
            "passes_certos": r.passes_certos,
            "duelos": r.duelos,
            "duelos_ganhos": r.duelos_ganhos,
            "xg": float(r.xg) if r.xg else None,
            "xa": float(r.xa) if r.xa else None,
        }
        for r in results
    ]


@app.get("/api/estatisticas/ranking")
def ranking(
    metrica: str = Query(..., description="Column name to rank by"),
    competicao: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    col = getattr(EstatisticaIndividual, metrica, None)
    if col is None:
        raise HTTPException(400, f"Métrica '{metrica}' inválida")
    q = (
        db.query(
            Atleta.nome,
            Atleta.posicao,
            func.sum(col).label("total"),
            func.count(EstatisticaIndividual.id).label("partidas"),
        )
        .join(EstatisticaIndividual, EstatisticaIndividual.atleta_id == Atleta.id)
    )
    if competicao:
        q = q.filter(EstatisticaIndividual.competicao == competicao)
    results = q.group_by(Atleta.id).order_by(desc("total")).limit(limit).all()
    return [
        {"nome": r.nome, "posicao": r.posicao, "total": r.total or 0, "partidas": r.partidas}
        for r in results
    ]


# ─────────────────────────────────────────────
# CALENDÁRIO
# ─────────────────────────────────────────────
@app.get("/api/calendario", response_model=list[CalendarioOut])
def list_calendario(
    competicao: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Calendario)
    if competicao:
        q = q.filter(Calendario.competicao == competicao)
    if status:
        q = q.filter(Calendario.status == status)
    return q.order_by(Calendario.data).offset(skip).limit(limit).all()


@app.post("/api/calendario", response_model=CalendarioOut, status_code=201)
def create_calendario(payload: CalendarioBase, db: Session = Depends(get_db)):
    c = Calendario(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@app.put("/api/calendario/{cal_id}", response_model=CalendarioOut)
def update_calendario(cal_id: int, payload: CalendarioBase, db: Session = Depends(get_db)):
    c = db.query(Calendario).get(cal_id)
    if not c:
        raise HTTPException(404, "Calendário não encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


# ─────────────────────────────────────────────
# VÍDEOS
# ─────────────────────────────────────────────
@app.get("/api/videos", response_model=list[VideoOut])
def list_videos(
    atleta_id: Optional[int] = None,
    tipo: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Video)
    if atleta_id:
        q = q.filter(Video.atleta_id == atleta_id)
    if tipo:
        q = q.filter(Video.tipo == tipo)
    return q.order_by(Video.data_criacao.desc()).offset(skip).limit(limit).all()


@app.post("/api/videos", response_model=VideoOut, status_code=201)
def create_video(payload: VideoBase, db: Session = Depends(get_db)):
    v = Video(**payload.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@app.delete("/api/videos/{video_id}", status_code=204)
def delete_video(video_id: int, db: Session = Depends(get_db)):
    v = db.query(Video).get(video_id)
    if not v:
        raise HTTPException(404, "Vídeo não encontrado")
    db.delete(v)
    db.commit()


# ─────────────────────────────────────────────
# MODELO DE JOGO
# ─────────────────────────────────────────────
@app.get("/api/modelo-jogo", response_model=list[ModeloJogoOut])
def list_modelo_jogo(
    fase: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(ModeloJogo)
    if fase:
        q = q.filter(ModeloJogo.fase == fase)
    return q.all()


@app.post("/api/modelo-jogo", response_model=ModeloJogoOut, status_code=201)
def create_modelo_jogo(payload: ModeloJogoBase, db: Session = Depends(get_db)):
    m = ModeloJogo(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


# ─────────────────────────────────────────────
# ANALISTAS
# ─────────────────────────────────────────────
@app.get("/api/analistas", response_model=list[AnalistaOut])
def list_analistas(db: Session = Depends(get_db)):
    return db.query(Analista).all()


@app.post("/api/analistas", response_model=AnalistaOut, status_code=201)
def create_analista(payload: AnalistaBase, db: Session = Depends(get_db)):
    a = Analista(**payload.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


# ─────────────────────────────────────────────
# ENTREGAS SOUTTO
# ─────────────────────────────────────────────
@app.get("/api/entregas", response_model=list[EntregaSouttoOut])
def list_entregas(
    analista_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(EntregaSoutto)
    if analista_id:
        q = q.filter(EntregaSoutto.analista_id == analista_id)
    if status:
        q = q.filter(EntregaSoutto.status == status)
    return q.order_by(EntregaSoutto.data_limite).all()


@app.post("/api/entregas", response_model=EntregaSouttoOut, status_code=201)
def create_entrega(payload: EntregaSouttoBase, db: Session = Depends(get_db)):
    e = EntregaSoutto(**payload.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    # Update analista pending count
    if e.analista_id:
        count = db.query(func.count(EntregaSoutto.id)).filter(
            EntregaSoutto.analista_id == e.analista_id,
            EntregaSoutto.status == "pendente",
        ).scalar()
        db.query(Analista).filter(Analista.id == e.analista_id).update(
            {"entregas_pendentes": count}
        )
        db.commit()
    return e


@app.put("/api/entregas/{entrega_id}", response_model=EntregaSouttoOut)
def update_entrega(entrega_id: int, payload: EntregaSouttoBase, db: Session = Depends(get_db)):
    e = db.query(EntregaSoutto).get(entrega_id)
    if not e:
        raise HTTPException(404, "Entrega não encontrada")
    old_analista = e.analista_id
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(e, k, v)
    db.commit()
    db.refresh(e)
    # Recalc pending for affected analysts
    for aid in {old_analista, e.analista_id}:
        if aid:
            count = db.query(func.count(EntregaSoutto.id)).filter(
                EntregaSoutto.analista_id == aid,
                EntregaSoutto.status == "pendente",
            ).scalar()
            db.query(Analista).filter(Analista.id == aid).update(
                {"entregas_pendentes": count}
            )
    db.commit()
    return e


# ─────────────────────────────────────────────
# PROTOCOLOS
# ─────────────────────────────────────────────
@app.get("/api/protocolos", response_model=list[ProtocoloOut])
def list_protocolos(db: Session = Depends(get_db)):
    return db.query(Protocolo).all()


@app.post("/api/protocolos", response_model=ProtocoloOut, status_code=201)
def create_protocolo(payload: ProtocoloBase, db: Session = Depends(get_db)):
    p = Protocolo(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# ─────────────────────────────────────────────
# PRÓXIMO ADVERSÁRIO
# ─────────────────────────────────────────────
@app.get("/api/proximo-adversario", response_model=list[ProximoAdversarioOut])
def list_proximo_adversario(db: Session = Depends(get_db)):
    return db.query(ProximoAdversario).order_by(ProximoAdversario.data).all()


@app.post("/api/proximo-adversario", response_model=ProximoAdversarioOut, status_code=201)
def create_proximo_adversario(payload: ProximoAdversarioBase, db: Session = Depends(get_db)):
    pa = ProximoAdversario(**payload.model_dump())
    db.add(pa)
    db.commit()
    db.refresh(pa)
    return pa


@app.put("/api/proximo-adversario/{pa_id}", response_model=ProximoAdversarioOut)
def update_proximo_adversario(pa_id: int, payload: ProximoAdversarioBase, db: Session = Depends(get_db)):
    pa = db.query(ProximoAdversario).get(pa_id)
    if not pa:
        raise HTTPException(404, "Próximo adversário não encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(pa, k, v)
    db.commit()
    db.refresh(pa)
    return pa


# ─────────────────────────────────────────────
# DASHBOARD RESUMO
# ─────────────────────────────────────────────
@app.get("/api/dashboard/resumo")
def dashboard_resumo(db: Session = Depends(get_db)):
    total_atletas = db.query(func.count(Atleta.id)).scalar()
    ativos = db.query(func.count(Atleta.id)).filter(Atleta.status == "ativo").scalar()
    lesionados = db.query(func.count(Atleta.id)).filter(Atleta.status == "lesionado").scalar()
    total_partidas = db.query(func.count(PartidaColetiva.id)).scalar()
    vitorias = db.query(func.count(PartidaColetiva.id)).filter(PartidaColetiva.resultado.like("V%")).scalar()
    empates = db.query(func.count(PartidaColetiva.id)).filter(PartidaColetiva.resultado.like("E%")).scalar()
    derrotas = db.query(func.count(PartidaColetiva.id)).filter(PartidaColetiva.resultado.like("D%")).scalar()

    entregas_pendentes = db.query(func.count(EntregaSoutto.id)).filter(
        EntregaSoutto.status == "pendente"
    ).scalar()

    prox = db.query(ProximoAdversario).order_by(ProximoAdversario.data).first()

    return {
        "elenco": {
            "total": total_atletas,
            "ativos": ativos,
            "lesionados": lesionados,
        },
        "desempenho": {
            "partidas": total_partidas,
            "vitorias": vitorias,
            "empates": empates,
            "derrotas": derrotas,
            "pontos": (vitorias * 3) + empates,
            "aproveitamento": round(((vitorias * 3 + empates) / (total_partidas * 3)) * 100, 1) if total_partidas > 0 else 0,
        },
        "entregas_pendentes": entregas_pendentes,
        "proximo_adversario": ProximoAdversarioOut.model_validate(prox) if prox else None,
    }


# ─────────────────────────────────────────────
# IMPORTAR XLSX
# ─────────────────────────────────────────────
WYSCOUT_COL_MAP = {
    0: "atleta_nome", 1: "jogo", 2: "competicao", 3: "data", 4: "posicao", 5: "minutos",
    6: "acoes_totais", 7: "acoes_sucesso", 8: "gols", 9: "assistencias",
    10: "remates", 11: "remates_baliza", 12: "xg",
    13: "passes", 14: "passes_certos", 15: "passes_longos", 16: "passes_longos_certos",
    17: "cruzamentos", 18: "cruzamentos_certos", 19: "dribles", 20: "dribles_sucesso",
    21: "duelos", 22: "duelos_ganhos", 23: "duelos_aereos", 24: "duelos_aereos_ganhos",
    25: "intercepcoes", 26: "perdas", 27: "perdas_meio_campo",
    28: "recuperacoes", 29: "recuperacoes_campo_adv",
    30: "cartao_amarelo", 31: "cartao_vermelho",
    32: "duelos_defensivos", 33: "duelos_defensivos_ganhos",
    34: "duelos_bola_livre", 35: "duelos_bola_livre_ganhos",
    36: "carrinhos", 37: "carrinhos_sucesso", 38: "alivios",
    39: "faltas", 40: "cartoes_amarelos", 41: "cartoes_vermelhos",
    42: "assistencias_remate", 43: "duelos_ofensivos", 44: "duelos_ofensivos_ganhos",
    45: "toques_area", 46: "fora_jogo", 47: "corridas_seguidas", 48: "faltas_sofridas",
    49: "passes_profundidade", 50: "passes_profundidade_certos",
    51: "xa", 52: "segundas_assistencias",
    53: "passes_terco_final", 54: "passes_terco_final_certos",
    55: "passes_grande_area", 56: "passes_grande_area_precisos",
    57: "passes_recebidos", 58: "passes_frente", 59: "passes_frente_certos",
    60: "passes_tras", 61: "passes_tras_certos",
    62: "gols_sofridos_gk", 63: "xcg_gk", 64: "remates_sofridos_gk",
    65: "defesas_gk", 66: "defesas_reflexo_gk", 67: "saidas_gk",
    68: "carrinhos_gk", 69: "carrinhos_sucesso_gk",
    70: "pontapes_baliza_gk", 71: "pontapes_baliza_curtos_gk", 72: "pontapes_baliza_longos_gk",
}


@app.post("/api/importar/xlsx")
async def importar_xlsx(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Formato inválido. Envie .xlsx")

    content = await file.read()
    import io
    xls = pd.ExcelFile(io.BytesIO(content))
    imported = {"individual": 0, "coletivo": 0, "calendario": 0}

    # --- Individual ---
    if "Individual" in xls.sheet_names:
        df = pd.read_excel(xls, "Individual", header=None, skiprows=5)
        for _, row in df.iterrows():
            nome = row.iloc[0]
            if pd.isna(nome) or str(nome).strip() == "":
                continue
            atleta = db.query(Atleta).filter(Atleta.nome == str(nome).strip()).first()
            if not atleta:
                continue
            data_val = {}
            for col_idx, field in WYSCOUT_COL_MAP.items():
                if field in ("atleta_nome", "jogo"):
                    continue
                val = row.iloc[col_idx] if col_idx < len(row) else None
                if pd.notna(val):
                    if field in ("xg", "xa", "xcg_gk"):
                        data_val[field] = float(val)
                    elif field == "data":
                        data_val[field] = pd.to_datetime(val).date() if not isinstance(val, date) else val
                    elif field in ("competicao", "posicao"):
                        data_val[field] = str(val)
                    else:
                        try:
                            data_val[field] = int(val)
                        except (ValueError, TypeError):
                            data_val[field] = None
            data_val["atleta_id"] = atleta.id
            stat = EstatisticaIndividual(**data_val)
            db.add(stat)
            imported["individual"] += 1

    # --- Coletivo ---
    if "Coletivo" in xls.sheet_names:
        df = pd.read_excel(xls, "Coletivo", skiprows=3)
        for _, row in df.iterrows():
            jogo = row.get("Jogo") or row.iloc[0]
            if pd.isna(jogo) or str(jogo).strip() == "":
                continue
            existing = db.query(PartidaColetiva).filter(PartidaColetiva.jogo == str(jogo).strip()).first()
            if existing:
                continue
            p = PartidaColetiva(jogo=str(jogo).strip())
            for attr in ["competicao", "resultado", "local"]:
                val = row.get(attr.capitalize())
                if pd.notna(val):
                    setattr(p, attr, str(val))
            for attr in ["xg", "xg_contra", "posse", "passes_pct", "duelos_pct", "ppda"]:
                val = row.get(attr)
                if pd.notna(val):
                    setattr(p, attr, float(val))
            for attr in ["gols_pro", "gols_contra", "passes", "remates", "remates_alvo",
                         "duelos", "recuperacoes", "perdas", "corners", "faltas",
                         "cartoes_amarelos", "cartoes_vermelhos"]:
                val = row.get(attr)
                if pd.notna(val):
                    setattr(p, attr, int(val))
            db.add(p)
            imported["coletivo"] += 1

    db.commit()
    return {"status": "ok", "imported": imported}


# ─────────────────────────────────────────────
# ADVERSÁRIO — ENDPOINTS
# ─────────────────────────────────────────────
@app.get("/api/adversario", response_model=list[AdvRelatorioOut])
def listar_relatorios_adversario(db: Session = Depends(get_db)):
    """Lista todos os relatórios de adversários importados."""
    return db.query(AdversarioRelatorio).order_by(
        AdversarioRelatorio.data_analise.desc()
    ).all()


@app.get("/api/adversario/{relatorio_id}")
def detalhe_adversario(relatorio_id: int, db: Session = Depends(get_db)):
    """Relatório completo de um adversário."""
    r = db.query(AdversarioRelatorio).filter_by(id=relatorio_id).first()
    if not r:
        raise HTTPException(404, "Relatório não encontrado")

    return {
        "equipe": r.equipe,
        "jogos_analisados": r.jogos_analisados,
        "data_analise": str(r.data_analise) if r.data_analise else None,
        "finalizacao": {
            "remates_total": r.remates_total,
            "remates_no_alvo": r.remates_no_alvo,
            "xg_total": float(r.xg_total) if r.xg_total else None,
            "gols_total": r.gols_total,
        },
        "resultados": [{
            "data": str(res.data_jogo) if res.data_jogo else None,
            "competicao": res.competicao,
            "adversario": res.adversario_do_adversario,
            "placar": f"{res.gols_favor}-{res.gols_contra}",
        } for res in r.adv_resultados],
        "jogadores": [{
            "numero": j.numero, "nome": j.nome, "posicao": j.posicao,
            "minutos": j.minutos, "gols": j.gols,
            "xg": float(j.xg) if j.xg else None,
            "assistencias": j.assistencias,
            "xa": float(j.xa) if j.xa else None,
            "passes_precisao": float(j.passes_precisao) if j.passes_precisao else None,
            "duelos_precisao": float(j.duelos_precisao) if j.duelos_precisao else None,
            "passes_decisivos": j.passes_decisivos,
            "cartoes_amarelos": j.cartoes_amarelos,
        } for j in r.adv_jogadores],
        "formacoes": [{
            "sistema": f.sistema,
            "frequencia_pct": float(f.frequencia_pct) if f.frequencia_pct else None,
            "posse_pct": float(f.posse_pct) if f.posse_pct else None,
            "precisao_passe_pct": float(f.precisao_passe_pct) if f.precisao_passe_pct else None,
            "ppda": float(f.ppda) if f.ppda else None,
            "xg": float(f.xg) if f.xg else None,
            "xg_contra": float(f.xg_contra) if f.xg_contra else None,
        } for f in r.adv_formacoes],
        "transicoes": {
            "recuperacoes": [
                {"nome": t.jogador_nome, "total": t.total, "media_90": float(t.media_90) if t.media_90 else None}
                for t in r.adv_transicoes if t.tipo == 'recuperacao'
            ],
            "perdas": [
                {"nome": t.jogador_nome, "total": t.total, "media_90": float(t.media_90) if t.media_90 else None}
                for t in r.adv_transicoes if t.tipo == 'perda'
            ],
        }
    }


@app.get("/api/adversario/{relatorio_id}/jogadores-chave")
def jogadores_chave_adversario(relatorio_id: int, db: Session = Depends(get_db)):
    """Top jogadores do adversário por xG+xA."""
    jogadores = db.query(AdversarioJogador).filter_by(
        relatorio_id=relatorio_id
    ).filter(AdversarioJogador.minutos > 0).all()

    ranked = sorted(jogadores, key=lambda j: float(j.xg or 0) + float(j.xa or 0), reverse=True)

    return [{
        "nome": j.nome, "posicao": j.posicao, "minutos": j.minutos,
        "xg_xa": round(float(j.xg or 0) + float(j.xa or 0), 2),
        "gols": j.gols, "assistencias": j.assistencias,
        "passes_decisivos": j.passes_decisivos, "shot_assists": j.shot_assists,
        "duelos_precisao": float(j.duelos_precisao) if j.duelos_precisao else None,
        "ameaca": "alta" if (float(j.xg or 0) + float(j.xa or 0)) > 0.8 else
                  "média" if (float(j.xg or 0) + float(j.xa or 0)) > 0.3 else "baixa",
    } for j in ranked[:8]]


@app.get("/api/adversario/{relatorio_id}/vulnerabilidades")
def vulnerabilidades_adversario(relatorio_id: int, db: Session = Depends(get_db)):
    """Análise de vulnerabilidade tática por formação."""
    formacoes = db.query(AdversarioFormacao).filter_by(relatorio_id=relatorio_id).all()
    if not formacoes:
        return {"message": "Sem dados de formação"}

    vulns = []
    for f in formacoes:
        score = 0
        ppda_val = float(f.ppda) if f.ppda else 0
        posse_val = float(f.posse_pct) if f.posse_pct else 50
        xg_val = float(f.xg) if f.xg else 0
        xgc_val = float(f.xg_contra) if f.xg_contra else 0

        score += ppda_val * 2
        score += (100 - posse_val)
        score += (xgc_val - xg_val) * 10

        vulns.append({
            "sistema": f.sistema,
            "frequencia_pct": float(f.frequencia_pct) if f.frequencia_pct else None,
            "posse_pct": posse_val,
            "ppda": ppda_val,
            "xg_diferencial": round(xg_val - xgc_val, 2),
            "score_vulnerabilidade": round(score, 2),
        })

    vulns.sort(key=lambda x: x['score_vulnerabilidade'], reverse=True)
    return {
        "formacao_mais_vulneravel": vulns[0] if vulns else None,
        "formacao_mais_forte": vulns[-1] if vulns else None,
        "todas": vulns,
    }


@app.post("/api/adversario/importar")
def importar_relatorio_adversario(payload: AdvRelatorioImportSchema, db: Session = Depends(get_db)):
    """Importa relatório JSON gerado pelo wyscout_adversario_parser.py."""
    rel = AdversarioRelatorio(
        equipe=payload.equipe,
        jogos_analisados=payload.jogos_analisados,
    )
    if payload.finalizacao:
        rel.remates_total = payload.finalizacao.remates_total
        rel.remates_no_alvo = payload.finalizacao.remates_no_alvo
        rel.precisao_remates_pct = payload.finalizacao.precisao_remates_pct
        rel.xg_total = payload.finalizacao.xg_total
        rel.gols_total = payload.finalizacao.gols_total

    db.add(rel)
    db.flush()

    for r in payload.resultados:
        db.add(AdversarioResultado(
            relatorio_id=rel.id,
            competicao=r.competicao,
            adversario_do_adversario=r.adversario,
            gols_favor=r.gols_favor,
            gols_contra=r.gols_contra,
            mandante=r.mandante,
        ))

    jogador_fields = {c.name for c in AdversarioJogador.__table__.columns} - {'id', 'relatorio_id'}
    for j in payload.jogadores:
        data = j.model_dump(exclude_unset=False)
        filtered = {k: v for k, v in data.items() if k in jogador_fields and v is not None}
        db.add(AdversarioJogador(relatorio_id=rel.id, **filtered))

    formacao_fields = {c.name for c in AdversarioFormacao.__table__.columns} - {'id', 'relatorio_id'}
    for f in payload.formacoes:
        data = f.model_dump(exclude_unset=False)
        filtered = {k: v for k, v in data.items() if k in formacao_fields and v is not None}
        db.add(AdversarioFormacao(relatorio_id=rel.id, **filtered))

    if payload.transicoes:
        for tipo, items in [
            ('recuperacao', payload.transicoes.recuperacoes),
            ('perda', payload.transicoes.perdas),
            ('falta', payload.transicoes.faltas),
        ]:
            for t in items:
                db.add(AdversarioTransicao(
                    relatorio_id=rel.id, tipo=tipo,
                    jogador_numero=t.numero, jogador_nome=t.nome,
                    minutos=t.minutos, total=t.total, media_90=t.media_90,
                ))

    db.commit()
    return {
        "status": "ok", "relatorio_id": rel.id, "equipe": rel.equipe,
        "jogadores_importados": len(payload.jogadores),
        "formacoes_importadas": len(payload.formacoes),
    }


@app.post("/api/adversario/importar-pdf")
async def importar_pdf_adversario(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload direto de PDF Wyscout → parse → banco."""
    import tempfile, os
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Arquivo deve ser PDF")

    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        from wyscout_adversario_parser import parse_wyscout_team_report, to_api_payload
        relatorio = parse_wyscout_team_report(tmp_path)
        payload = to_api_payload(relatorio)
        schema = AdvRelatorioImportSchema(**payload)
        return importar_relatorio_adversario(schema, db)
    finally:
        os.unlink(tmp_path)


# ─────────────────────────────────────────────
# GOOGLE SHEETS PROXY (private spreadsheet access)
# ─────────────────────────────────────────────
_sheets_service = None
GOOGLE_SPREADSHEET_ID = os.getenv("GOOGLE_SPREADSHEET_ID", "")
GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "")

logger = logging.getLogger("bfsa")


def _get_sheets_service():
    """Lazy-init Google Sheets API service using a service account."""
    global _sheets_service
    if _sheets_service is not None:
        return _sheets_service
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="google-api-python-client and google-auth are not installed. "
                   "Run: pip install google-api-python-client google-auth",
        )
    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    if GOOGLE_SERVICE_ACCOUNT_JSON:
        info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
        creds = service_account.Credentials.from_service_account_info(info, scopes=scopes)
    elif GOOGLE_SERVICE_ACCOUNT_FILE:
        creds = service_account.Credentials.from_service_account_file(
            GOOGLE_SERVICE_ACCOUNT_FILE, scopes=scopes,
        )
    else:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_FILE must be set.",
        )
    _sheets_service = build("sheets", "v4", credentials=creds)
    return _sheets_service


@app.get("/api/sheets/{gid}", response_class=PlainTextResponse)
def get_sheet_csv(gid: int):
    """Fetch a sheet by GID from the private spreadsheet and return as CSV."""
    if not GOOGLE_SPREADSHEET_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_SPREADSHEET_ID is not configured.")
    service = _get_sheets_service()
    try:
        # First, get spreadsheet metadata to resolve GID → sheet title
        meta = service.spreadsheets().get(
            spreadsheetId=GOOGLE_SPREADSHEET_ID,
            fields="sheets.properties",
        ).execute()
        sheet_title = None
        for s in meta.get("sheets", []):
            props = s.get("properties", {})
            if props.get("sheetId") == gid:
                sheet_title = props.get("title")
                break
        if not sheet_title:
            raise HTTPException(status_code=404, detail=f"Sheet with gid={gid} not found.")
        # Fetch all data from the sheet
        result = service.spreadsheets().values().get(
            spreadsheetId=GOOGLE_SPREADSHEET_ID,
            range=sheet_title,
        ).execute()
        rows = result.get("values", [])
        # Convert to CSV
        buf = io.StringIO()
        writer = csv.writer(buf, delimiter=";")
        for row in rows:
            writer.writerow(row)
        return PlainTextResponse(buf.getvalue(), media_type="text/csv; charset=utf-8")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching Google Sheet gid=%s", gid)
        raise HTTPException(status_code=502, detail=f"Google Sheets API error: {e}")


# ─────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
