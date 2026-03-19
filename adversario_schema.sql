-- ============================================================
-- EXTENSÃO: Análise de Adversários
-- Adicionar ao performance_schema.sql / supabase_setup.sql
-- ============================================================

-- Relatório principal do adversário
CREATE TABLE IF NOT EXISTS adversario_relatorios (
    id SERIAL PRIMARY KEY,
    equipe VARCHAR(100) NOT NULL,
    jogos_analisados INTEGER DEFAULT 0,
    data_analise DATE DEFAULT CURRENT_DATE,
    remates_total INTEGER,
    remates_no_alvo INTEGER,
    precisao_remates_pct DECIMAL(5,2),
    xg_total DECIMAL(5,2),
    gols_total INTEGER,
    fonte VARCHAR(50) DEFAULT 'wyscout_pdf',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Resultados recentes
CREATE TABLE IF NOT EXISTS adversario_resultados (
    id SERIAL PRIMARY KEY,
    relatorio_id INTEGER REFERENCES adversario_relatorios(id) ON DELETE CASCADE,
    data_jogo DATE,
    competicao VARCHAR(100),
    adversario_do_adversario VARCHAR(100),
    gols_favor INTEGER,
    gols_contra INTEGER,
    mandante BOOLEAN DEFAULT TRUE
);

-- Jogadores do adversário (60+ métricas Wyscout)
CREATE TABLE IF NOT EXISTS adversario_jogadores (
    id SERIAL PRIMARY KEY,
    relatorio_id INTEGER REFERENCES adversario_relatorios(id) ON DELETE CASCADE,
    numero INTEGER,
    nome VARCHAR(100) NOT NULL,
    posicao VARCHAR(10),
    idade INTEGER,
    altura INTEGER,
    jogos INTEGER,
    minutos INTEGER,
    gols INTEGER DEFAULT 0,
    xg DECIMAL(5,2),
    assistencias INTEGER DEFAULT 0,
    xa DECIMAL(5,2),
    remates_total INTEGER,
    remates_no_alvo INTEGER,
    remates_precisao DECIMAL(5,2),
    passes_total INTEGER,
    passes_certos INTEGER,
    passes_precisao DECIMAL(5,2),
    passes_frente VARCHAR(30),
    passes_tras VARCHAR(30),
    passes_laterais VARCHAR(30),
    passes_curtos_medios VARCHAR(30),
    passes_longos VARCHAR(30),
    passes_progressivos VARCHAR(30),
    passes_terco_final VARCHAR(30),
    passes_diagonal VARCHAR(30),
    deep_completions INTEGER,
    passes_decisivos INTEGER,
    shot_assists INTEGER,
    cruzamentos_total INTEGER,
    cruzamentos_certos INTEGER,
    dribles_total INTEGER,
    dribles_certos INTEGER,
    duelos_total INTEGER,
    duelos_ganhos INTEGER,
    duelos_precisao DECIMAL(5,2),
    duelos_def_total INTEGER,
    duelos_def_ganhos INTEGER,
    duelos_of_total INTEGER,
    duelos_of_ganhos INTEGER,
    duelos_aereos_total INTEGER,
    duelos_aereos_ganhos INTEGER,
    interceptacoes VARCHAR(20),
    cortes_carrinho VARCHAR(20),
    perdas_meio_campo VARCHAR(20),
    recuperacoes VARCHAR(20),
    touches_area INTEGER,
    faltas_sofridas VARCHAR(20),
    cartoes_amarelos INTEGER DEFAULT 0,
    cartoes_vermelhos INTEGER DEFAULT 0
);

-- Formações com KPIs por sistema
CREATE TABLE IF NOT EXISTS adversario_formacoes (
    id SERIAL PRIMARY KEY,
    relatorio_id INTEGER REFERENCES adversario_relatorios(id) ON DELETE CASCADE,
    sistema VARCHAR(15) NOT NULL,
    frequencia_pct DECIMAL(5,2),
    gols_favor INTEGER,
    gols_contra INTEGER,
    xg DECIMAL(5,2),
    xg_contra DECIMAL(5,2),
    posse_pct DECIMAL(5,2),
    posse_adversario_pct DECIMAL(5,2),
    precisao_passe_pct DECIMAL(5,2),
    precisao_passe_adv_pct DECIMAL(5,2),
    intensidade_jogo DECIMAL(5,2),
    intensidade_jogo_adv DECIMAL(5,2),
    passe_profundidade_pct DECIMAL(5,2),
    passe_profundidade_adv_pct DECIMAL(5,2),
    ppda DECIMAL(5,2),
    ppda_adv DECIMAL(5,2)
);

-- Transições (recuperações, perdas, faltas por jogador)
CREATE TABLE IF NOT EXISTS adversario_transicoes (
    id SERIAL PRIMARY KEY,
    relatorio_id INTEGER REFERENCES adversario_relatorios(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('recuperacao','perda','falta')),
    jogador_numero INTEGER,
    jogador_nome VARCHAR(100),
    minutos INTEGER,
    total INTEGER,
    media_90 DECIMAL(5,2)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_adv_rel_equipe ON adversario_relatorios(equipe);
CREATE INDEX IF NOT EXISTS idx_adv_jog_rel ON adversario_jogadores(relatorio_id);
CREATE INDEX IF NOT EXISTS idx_adv_jog_nome ON adversario_jogadores(nome);
CREATE INDEX IF NOT EXISTS idx_adv_form_rel ON adversario_formacoes(relatorio_id);
CREATE INDEX IF NOT EXISTS idx_adv_trans_rel ON adversario_transicoes(relatorio_id);

-- View: jogadores-chave ordenados por xG+xA
CREATE OR REPLACE VIEW vw_adversario_jogadores_chave AS
SELECT
    r.equipe, j.nome, j.posicao, j.minutos, j.gols, j.xg,
    j.assistencias, j.xa,
    COALESCE(j.xg,0) + COALESCE(j.xa,0) AS xg_xa_total,
    j.passes_precisao, j.duelos_precisao, j.passes_decisivos, j.shot_assists
FROM adversario_jogadores j
JOIN adversario_relatorios r ON r.id = j.relatorio_id
WHERE j.minutos > 0
ORDER BY COALESCE(j.xg,0) + COALESCE(j.xa,0) DESC;

-- View: vulnerabilidade por formação
CREATE OR REPLACE VIEW vw_adversario_vulnerabilidade AS
SELECT
    r.equipe, f.sistema, f.frequencia_pct, f.posse_pct,
    f.precisao_passe_pct, f.ppda,
    f.xg AS xg_favor, f.xg_contra,
    COALESCE(f.xg,0) - COALESCE(f.xg_contra,0) AS xg_diferencial,
    f.gols_favor, f.gols_contra
FROM adversario_formacoes f
JOIN adversario_relatorios r ON r.id = f.relatorio_id
ORDER BY r.equipe, f.frequencia_pct DESC;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_adversario_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_adversario_updated ON adversario_relatorios;
CREATE TRIGGER trg_adversario_updated
    BEFORE UPDATE ON adversario_relatorios
    FOR EACH ROW EXECUTE FUNCTION update_adversario_timestamp();
