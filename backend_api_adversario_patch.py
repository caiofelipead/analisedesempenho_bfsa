"""
PATCH para backend_api.py — Módulo Adversário
==============================================
Adiciona ao backend_api.py existente:
  - 5 ORM Models (adversario_*)
  - Pydantic Schemas
  - 6 Endpoints REST
  - Endpoint de upload PDF direto

INTEGRAÇÃO:
  Cole este código ANTES da seção "# RUN" no backend_api.py
  (antes de `if __name__ == "__main__":`)

  Ou use Claude Code:
    "Integre o conteúdo de backend_api_adversario_patch.py
     no backend_api.py, antes da seção RUN"
"""

# ─────────────────────────────────────────────
# ORM MODELS — ADVERSÁRIO
# (adicionar após os models existentes)
# ─────────────────────────────────────────────

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
# PYDANTIC SCHEMAS — ADVERSÁRIO
# (adicionar após os schemas existentes)
# ─────────────────────────────────────────────

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
# ENDPOINTS — ADVERSÁRIO
# (adicionar após os endpoints existentes)
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
