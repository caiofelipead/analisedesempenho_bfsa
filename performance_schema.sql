-- BFSA Performance Analysis System - PostgreSQL Schema
-- Botafogo de Ribeirão Preto Football Club

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Table: atletas
CREATE TABLE atletas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    posicao VARCHAR(10),
    numero INT,
    status VARCHAR(20) DEFAULT 'ativo',
    foto_url TEXT,
    categoria VARCHAR(20) DEFAULT 'profissional',
    tendencia VARCHAR(20) DEFAULT 'estavel',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: partidas_coletivas
CREATE TABLE partidas_coletivas (
    id SERIAL PRIMARY KEY,
    jogo VARCHAR(100) NOT NULL,
    competicao VARCHAR(50),
    data DATE,
    local VARCHAR(10) CHECK (local IN ('casa','fora')),
    resultado VARCHAR(5),
    gols_pro INT DEFAULT 0,
    gols_contra INT DEFAULT 0,
    xg DECIMAL(4,2),
    xg_contra DECIMAL(4,2),
    posse DECIMAL(4,1),
    passes INT,
    passes_pct DECIMAL(4,1),
    remates INT,
    remates_alvo INT,
    duelos INT,
    duelos_pct DECIMAL(4,1),
    recuperacoes INT,
    perdas INT,
    ppda DECIMAL(4,2),
    corners INT,
    faltas INT,
    cartoes_amarelos INT DEFAULT 0,
    cartoes_vermelhos INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: estatisticas_individuais
CREATE TABLE estatisticas_individuais (
    id SERIAL PRIMARY KEY,
    atleta_id INT REFERENCES atletas(id),
    partida_id INT REFERENCES partidas_coletivas(id),
    competicao VARCHAR(50),
    data DATE,
    posicao VARCHAR(10),
    minutos INT,
    acoes_totais INT,
    acoes_sucesso INT,
    gols INT,
    assistencias INT,
    remates INT,
    remates_baliza INT,
    xg DECIMAL(4,2),
    passes INT,
    passes_certos INT,
    passes_longos INT,
    passes_longos_certos INT,
    cruzamentos INT,
    cruzamentos_certos INT,
    dribles INT,
    dribles_sucesso INT,
    duelos INT,
    duelos_ganhos INT,
    duelos_aereos INT,
    duelos_aereos_ganhos INT,
    intercepcoes INT,
    perdas INT,
    perdas_meio_campo INT,
    recuperacoes INT,
    recuperacoes_campo_adv INT,
    cartao_amarelo INT DEFAULT 0,
    cartao_vermelho INT DEFAULT 0,
    duelos_defensivos INT,
    duelos_defensivos_ganhos INT,
    duelos_bola_livre INT,
    duelos_bola_livre_ganhos INT,
    carrinhos INT,
    carrinhos_sucesso INT,
    alivios INT,
    faltas INT,
    cartoes_amarelos INT DEFAULT 0,
    cartoes_vermelhos INT DEFAULT 0,
    assistencias_remate INT,
    duelos_ofensivos INT,
    duelos_ofensivos_ganhos INT,
    toques_area INT,
    fora_jogo INT,
    corridas_seguidas INT,
    faltas_sofridas INT,
    passes_profundidade INT,
    passes_profundidade_certos INT,
    xa DECIMAL(4,2),
    segundas_assistencias INT,
    passes_terco_final INT,
    passes_terco_final_certos INT,
    passes_grande_area INT,
    passes_grande_area_precisos INT,
    passes_recebidos INT,
    passes_frente INT,
    passes_frente_certos INT,
    passes_tras INT,
    passes_tras_certos INT,
    gols_sofridos_gk INT,
    xcg_gk DECIMAL(4,2),
    remates_sofridos_gk INT,
    defesas_gk INT,
    defesas_reflexo_gk INT,
    saidas_gk INT,
    carrinhos_gk INT,
    carrinhos_sucesso_gk INT,
    pontapes_baliza_gk INT,
    pontapes_baliza_curtos_gk INT,
    pontapes_baliza_longos_gk INT,
    UNIQUE(atleta_id, partida_id)
);

-- Table: videos
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    atleta_id INT REFERENCES atletas(id),
    titulo VARCHAR(200),
    url TEXT,
    tipo VARCHAR(30),
    tags TEXT[],
    data_criacao DATE DEFAULT CURRENT_DATE
);

-- Table: calendario
CREATE TABLE calendario (
    id SERIAL PRIMARY KEY,
    rodada VARCHAR(20),
    competicao VARCHAR(50),
    adversario VARCHAR(100),
    local VARCHAR(10),
    data DATE,
    resultado VARCHAR(10),
    status VARCHAR(20) DEFAULT 'pendente',
    adv_analise BOOLEAN DEFAULT FALSE,
    prelecao BOOLEAN DEFAULT FALSE,
    pos_jogo BOOLEAN DEFAULT FALSE,
    wyscout_ok BOOLEAN DEFAULT FALSE,
    treino_ok BOOLEAN DEFAULT FALSE,
    bola_parada_ok BOOLEAN DEFAULT FALSE,
    individual_ok BOOLEAN DEFAULT FALSE
);

-- Table: modelo_jogo
CREATE TABLE modelo_jogo (
    id SERIAL PRIMARY KEY,
    fase VARCHAR(30),
    principio VARCHAR(100),
    sub_principio VARCHAR(100),
    descricao TEXT,
    video_ref TEXT
);

-- Table: analistas
CREATE TABLE analistas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    funcao VARCHAR(50),
    qualidade DECIMAL(3,1),
    entregas_pendentes INT DEFAULT 0
);

-- Table: entregas_soutto
CREATE TABLE entregas_soutto (
    id SERIAL PRIMARY KEY,
    analista_id INT REFERENCES analistas(id),
    tipo VARCHAR(50),
    descricao TEXT,
    data_limite DATE,
    status VARCHAR(20) DEFAULT 'pendente'
);

-- Table: protocolos
CREATE TABLE protocolos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200),
    categoria VARCHAR(50),
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'ativo'
);

-- Table: proximo_adversario
CREATE TABLE proximo_adversario (
    id SERIAL PRIMARY KEY,
    adversario VARCHAR(100),
    competicao VARCHAR(50),
    rodada VARCHAR(20),
    data DATE,
    progresso_pct INT DEFAULT 0,
    analise_tatica TEXT,
    jogadores_chave TEXT,
    pontos_fortes TEXT,
    pontos_fracos TEXT
);

-- Indexes
CREATE INDEX idx_estatisticas_atleta_id ON estatisticas_individuais(atleta_id);
CREATE INDEX idx_estatisticas_partida_id ON estatisticas_individuais(partida_id);
CREATE INDEX idx_calendario_competicao_data ON calendario(competicao, data);
CREATE INDEX idx_videos_atleta_id ON videos(atleta_id);
CREATE INDEX idx_atletas_nome_trgm ON atletas USING GIN (nome gin_trgm_ops);

-- View: vw_resumo_atleta
CREATE VIEW vw_resumo_atleta AS
SELECT
    a.id,
    a.nome,
    a.posicao,
    a.numero,
    a.status,
    a.categoria,
    COUNT(DISTINCT ei.partida_id) AS partidas,
    ROUND(AVG(ei.minutos)::numeric, 1) AS avg_minutos,
    COALESCE(SUM(ei.gols), 0) AS total_gols,
    COALESCE(SUM(ei.assistencias), 0) AS total_assistencias,
    ROUND(AVG(ei.passes_pct)::numeric, 1) AS avg_passes_pct,
    ROUND(
        CASE
            WHEN SUM(ei.duelos) > 0 THEN (SUM(ei.duelos_ganhos)::numeric / SUM(ei.duelos) * 100)
            ELSE 0
        END, 1) AS duelos_ganhos_pct
FROM atletas a
LEFT JOIN estatisticas_individuais ei ON a.id = ei.atleta_id
GROUP BY a.id, a.nome, a.posicao, a.numero, a.status, a.categoria;

-- View: vw_desempenho_coletivo
CREATE VIEW vw_desempenho_coletivo AS
SELECT
    pc.id,
    pc.jogo,
    pc.competicao,
    pc.data,
    pc.local,
    pc.resultado,
    pc.gols_pro,
    pc.gols_contra,
    CASE
        WHEN pc.gols_pro > pc.gols_contra THEN 3
        WHEN pc.gols_pro = pc.gols_contra THEN 1
        ELSE 0
    END AS pontos,
    pc.xg,
    pc.xg_contra,
    pc.posse,
    pc.passes,
    pc.passes_pct,
    pc.remates,
    pc.remates_alvo,
    pc.duelos,
    pc.duelos_pct,
    pc.recuperacoes,
    pc.perdas,
    pc.ppda,
    SUM(CASE
        WHEN pc.gols_pro > pc.gols_contra THEN 3
        WHEN pc.gols_pro = pc.gols_contra THEN 1
        ELSE 0
    END) OVER (ORDER BY pc.data) AS pts_acumulados,
    COUNT(*) OVER (ORDER BY pc.data) AS jogos_acumulados
FROM partidas_coletivas pc
ORDER BY pc.data;

-- View: vw_calendario_completo
CREATE VIEW vw_calendario_completo AS
SELECT
    c.id,
    c.rodada,
    c.competicao,
    c.adversario,
    c.local,
    c.data,
    c.resultado,
    c.status,
    ROUND(
        (CAST(
            (CASE WHEN c.adv_analise THEN 1 ELSE 0 END) +
            (CASE WHEN c.prelecao THEN 1 ELSE 0 END) +
            (CASE WHEN c.pos_jogo THEN 1 ELSE 0 END) +
            (CASE WHEN c.wyscout_ok THEN 1 ELSE 0 END) +
            (CASE WHEN c.treino_ok THEN 1 ELSE 0 END) +
            (CASE WHEN c.bola_parada_ok THEN 1 ELSE 0 END) +
            (CASE WHEN c.individual_ok THEN 1 ELSE 0 END)
        AS numeric) / 7 * 100), 1) AS conclusao_pct
FROM calendario c;

-- Trigger: updated_at on atletas
CREATE OR REPLACE FUNCTION update_atleta_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atleta_updated_at
BEFORE UPDATE ON atletas
FOR EACH ROW
EXECUTE FUNCTION update_atleta_timestamp();

-- Trigger: Update analistas.entregas_pendentes
CREATE OR REPLACE FUNCTION update_analista_pendentes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE analistas
        SET entregas_pendentes = entregas_pendentes + 1
        WHERE id = NEW.analista_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status != OLD.status THEN
            IF NEW.status = 'pendente' AND OLD.status != 'pendente' THEN
                UPDATE analistas
                SET entregas_pendentes = entregas_pendentes + 1
                WHERE id = NEW.analista_id;
            ELSIF NEW.status != 'pendente' AND OLD.status = 'pendente' THEN
                UPDATE analistas
                SET entregas_pendentes = GREATEST(entregas_pendentes - 1, 0)
                WHERE id = NEW.analista_id;
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'pendente' THEN
            UPDATE analistas
            SET entregas_pendentes = GREATEST(entregas_pendentes - 1, 0)
            WHERE id = OLD.analista_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entregas_pendentes
AFTER INSERT OR UPDATE OR DELETE ON entregas_soutto
FOR EACH ROW
EXECUTE FUNCTION update_analista_pendentes();

-- Seed Data: Atletas (37 players)
INSERT INTO atletas (nome, posicao, numero, status, categoria) VALUES
('Victor Souza', 'GK', 1, 'ativo', 'profissional'),
('Jonathan Lemos', 'RB', 2, 'ativo', 'profissional'),
('Éricson', 'CB', 3, 'ativo', 'profissional'),
('Gustavo Vilar', 'CB', 4, 'ativo', 'profissional'),
('Leandro Maciel', 'CDM', 5, 'ativo', 'profissional'),
('Patrick Brey', 'LB', 6, 'ativo', 'profissional'),
('Kelvin Giacobe', 'RW', 7, 'ativo', 'profissional'),
('Éverton Morelli', 'CDM', 8, 'ativo', 'profissional'),
('Hygor Cléber', 'ST', 9, 'ativo', 'profissional'),
('Rafael Gava', 'CAM', 10, 'ativo', 'profissional'),
('Carlão', 'CB', 13, 'ativo', 'profissional'),
('Diego Cardoso', 'ST', 14, 'ativo', 'profissional'),
('Luís Otávio', 'CB', 15, 'ativo', 'profissional'),
('Alex Sandro', 'LB', 16, 'ativo', 'profissional'),
('Toró', 'RW', 17, 'ativo', 'profissional'),
('Jean Mangabeira', 'CM', 18, 'ativo', 'profissional'),
('Hugo Sanches', 'CM', 19, 'ativo', 'profissional'),
('Felipe Augusto', 'LW', 20, 'ativo', 'profissional'),
('Alexandre Jesus', 'ST', 21, 'ativo', 'profissional'),
('Bruno Rodrigues', 'LW', 22, 'ativo', 'profissional'),
('Daniel Jr', 'CM', 23, 'ativo', 'profissional'),
('Fabiano', 'CAM', 24, 'ativo', 'profissional'),
('Emerson Ramon', 'RW', 25, 'ativo', 'profissional'),
('Alef', 'CB', 26, 'ativo', 'profissional'),
('Cauê Gomes', 'ST', 27, 'ativo', 'profissional'),
('Miguel Angelo', 'GK', 30, 'ativo', 'profissional'),
('Lucas Arcanjo', 'GK', 32, 'ativo', 'profissional'),
('Robert', 'LB', 33, 'ativo', 'profissional'),
('Wellisson', 'RB', 34, 'ativo', 'profissional'),
('Luan Carioca', 'CDM', 35, 'ativo', 'profissional'),
('Danrlei', 'CM', 37, 'ativo', 'profissional'),
('Ênio', 'LW', 38, 'ativo', 'profissional'),
('Douglas Baggio', 'CAM', 39, 'ativo', 'profissional'),
('Kauã', 'RW', 40, 'ativo', 'profissional'),
('Dudu Vieira', 'CAM', 41, 'ativo', 'profissional'),
('Thalys', 'RB', 43, 'ativo', 'profissional'),
('Edson', 'GK', 44, 'ativo', 'profissional');

-- Seed Data: Partidas Coletivas (Paulistão matches)
INSERT INTO partidas_coletivas (jogo, competicao, data, local, resultado, gols_pro, gols_contra, xg, xg_contra, posse, passes, passes_pct, remates, remates_alvo, duelos, duelos_pct, recuperacoes, perdas, ppda, corners, faltas) VALUES
('Botafogo 2-1 Santacruzes', 'Paulistão', '2026-01-15', 'casa', '2-1', 2, 1, 1.8, 0.9, 58.2, 487, 81.3, 12, 6, 156, 62.3, 68, 42, 8.5, 4, 14),
('Botafogo 1-0 Comercial', 'Paulistão', '2026-01-22', 'casa', '1-0', 1, 0, 1.2, 0.4, 62.1, 512, 82.7, 10, 5, 142, 64.1, 71, 39, 7.8, 3, 12),
('São Bento 2-2 Botafogo', 'Paulistão', '2026-02-01', 'fora', '2-2', 2, 2, 1.5, 1.1, 51.3, 421, 79.2, 11, 4, 168, 58.9, 59, 48, 9.2, 2, 16),
('Botafogo 3-0 Itapirense', 'Paulistão', '2026-02-08', 'casa', '3-0', 3, 0, 2.6, 0.3, 65.8, 534, 83.1, 14, 8, 139, 68.5, 74, 36, 6.9, 5, 11),
('Inter de Limeira 1-1 Botafogo', 'Paulistão', '2026-02-15', 'fora', '1-1', 1, 1, 0.8, 0.9, 48.7, 398, 77.8, 9, 3, 172, 56.4, 54, 52, 10.1, 1, 18),
('Botafogo 2-0 Itu', 'Paulistão', '2026-02-22', 'casa', '2-0', 2, 0, 1.9, 0.5, 61.2, 501, 81.8, 11, 6, 151, 63.2, 69, 41, 8.1, 4, 13),
('Ponte Preta 0-1 Botafogo', 'Paulistão', '2026-03-01', 'fora', '0-1', 1, 0, 1.1, 0.6, 47.5, 387, 78.5, 8, 4, 165, 59.7, 62, 45, 9.4, 2, 15),
('Botafogo 4-1 Ferroviária', 'Paulistão', '2026-03-08', 'casa', '4-1', 4, 1, 3.2, 0.7, 63.9, 527, 82.3, 15, 9, 148, 65.1, 73, 38, 7.6, 6, 12);

-- Seed Data: Calendario
INSERT INTO calendario (rodada, competicao, adversario, local, data, resultado, status, adv_analise, prelecao, pos_jogo, wyscout_ok, treino_ok, bola_parada_ok, individual_ok) VALUES
('1', 'Paulistão', 'Santacruzes', 'casa', '2026-01-15', '2-1', 'finalizado', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('2', 'Paulistão', 'Comercial', 'casa', '2026-01-22', '1-0', 'finalizado', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('3', 'Paulistão', 'São Bento', 'fora', '2026-02-01', '2-2', 'finalizado', TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, TRUE),
('4', 'Paulistão', 'Itapirense', 'casa', '2026-02-08', '3-0', 'finalizado', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('5', 'Paulistão', 'Inter de Limeira', 'fora', '2026-02-15', '1-1', 'finalizado', TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE),
('6', 'Paulistão', 'Itu', 'casa', '2026-02-22', '2-0', 'finalizado', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('7', 'Paulistão', 'Ponte Preta', 'fora', '2026-03-01', '0-1', 'finalizado', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('8', 'Paulistão', 'Ferroviária', 'casa', '2026-03-08', '4-1', 'finalizado', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE);
