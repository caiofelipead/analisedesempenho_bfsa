# 05 - Banco de Dados

## Visao Geral

O sistema utiliza tres camadas de armazenamento:

1. **PostgreSQL** - Banco principal com schema relacional completo
2. **Supabase** - Tabelas colaborativas com RLS e realtime
3. **localStorage** - Cache offline como fallback

## Schemas SQL

| Arquivo | Tabelas | Descricao |
|---------|---------|-----------|
| `performance_schema.sql` | 10 | Schema principal (atletas, partidas, videos, etc.) |
| `adversario_schema.sql` | 4 + 2 views | Analise de adversarios (import Wyscout) |
| `supabase_setup.sql` | 4 | Tabelas colaborativas com RLS |

---

## Schema Principal (`performance_schema.sql`)

### Diagrama de Relacionamentos

```
atletas (1) ──────< (N) estatisticas_individuais
atletas (1) ──────< (N) videos

partidas_coletivas (1) ──────< (N) estatisticas_individuais

analistas (1) ──────< (N) entregas_soutto

adversario_relatorios (1) ──────< (N) adversario_jogadores
adversario_relatorios (1) ──────< (N) adversario_formacoes
adversario_relatorios (1) ──────< (N) adversario_transicoes
adversario_relatorios (1) ──────< (N) adversario_resultados
```

### Tabela: atletas

```sql
CREATE TABLE atletas (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(200) NOT NULL,
    posicao     VARCHAR(50),
    numero      INTEGER,
    status      VARCHAR(50),        -- ativo, lesionado, emprestado
    foto_url    TEXT,
    categoria   VARCHAR(50),        -- Profissional, Sub-20, Sub-17
    tendencia   VARCHAR(20),        -- melhora, estavel, piora
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### Tabela: partidas_coletivas

```sql
CREATE TABLE partidas_coletivas (
    id                SERIAL PRIMARY KEY,
    jogo              VARCHAR(200),
    competicao        VARCHAR(100),
    data              DATE,
    local             VARCHAR(10) CHECK (local IN ('casa', 'fora')),
    resultado         VARCHAR(5),       -- V, E, D
    gols_pro          INTEGER,
    gols_contra       INTEGER,
    xG                NUMERIC(5,2),
    xG_contra         NUMERIC(5,2),
    posse             NUMERIC(5,2),     -- %
    passes            INTEGER,
    passes_pct        NUMERIC(5,2),     -- %
    remates           INTEGER,
    remates_alvo      INTEGER,
    duelos            INTEGER,
    duelos_pct        NUMERIC(5,2),     -- %
    recuperacoes      INTEGER,
    perdas            INTEGER,
    ppda              NUMERIC(5,2),
    corners           INTEGER,
    faltas            INTEGER,
    cartoes_amarelos  INTEGER,
    cartoes_vermelhos INTEGER,
    created_at        TIMESTAMP DEFAULT NOW()
);
```

### Tabela: estatisticas_individuais

```sql
CREATE TABLE estatisticas_individuais (
    id            SERIAL PRIMARY KEY,
    atleta_id     INTEGER REFERENCES atletas(id) ON DELETE CASCADE,
    partida_id    INTEGER REFERENCES partidas_coletivas(id) ON DELETE CASCADE,
    competicao    VARCHAR(100),
    data          DATE,
    posicao       VARCHAR(50),
    minutos       INTEGER,
    -- 67 campos de metricas (resumo abaixo)
    acoes_totais  INTEGER,
    gols          INTEGER,
    assistencias  INTEGER,
    xG            NUMERIC(5,2),
    -- ... passes, cruzamentos, dribles, duelos, intercepcoes, etc.
    UNIQUE(atleta_id, partida_id)
);

CREATE INDEX idx_estat_atleta ON estatisticas_individuais(atleta_id);
CREATE INDEX idx_estat_partida ON estatisticas_individuais(partida_id);
```

**Campos de metricas (67 no total):**

| Categoria | Campos |
|-----------|--------|
| Ofensivo | gols, assistencias, xG, xA, remates, remates_alvo, shot_assists, deep_completions |
| Passes | passes, passes_pct, passes_frente, passes_tras, passes_laterais, passes_longos, passes_progressivos, passes_terco_final, passes_decisivos |
| Cruzamentos | cruzamentos, cruzamentos_pct |
| Dribles | dribles, dribles_pct |
| Duelos | duelos, duelos_pct, duelos_def, duelos_of, duelos_aereos |
| Defensivo | intercepcoes, cortes, cortes_carrinho, bloqueios, recuperacoes |
| Disciplina | faltas, faltas_sofridas, cartao_amarelo, cartao_vermelho |
| Goleiro | defesas_gk, defesas_pct_gk, xcg_gk, gols_sofridos_gk |
| Fisico | aceleracoes, sprints, distancia_total |

### Tabela: videos

```sql
CREATE TABLE videos (
    id           SERIAL PRIMARY KEY,
    atleta_id    INTEGER REFERENCES atletas(id) ON DELETE CASCADE,
    titulo       VARCHAR(300),
    url          TEXT,
    tipo         VARCHAR(50),        -- coletivo, individual, adversario, bola_parada
    tags         TEXT[],             -- Array de tags para busca
    data_criacao TIMESTAMP DEFAULT NOW()
);
```

### Tabela: calendario

```sql
CREATE TABLE calendario (
    id              SERIAL PRIMARY KEY,
    rodada          INTEGER,
    competicao      VARCHAR(100),
    adversario      VARCHAR(200),
    local           VARCHAR(10),
    data            DATE,
    resultado       VARCHAR(20),
    status          VARCHAR(50),
    -- Flags de processo (Boolean)
    adv_analise     BOOLEAN DEFAULT FALSE,
    prelecao        BOOLEAN DEFAULT FALSE,
    pos_jogo        BOOLEAN DEFAULT FALSE,
    wyscout_ok      BOOLEAN DEFAULT FALSE,
    treino_ok       BOOLEAN DEFAULT FALSE,
    bola_parada_ok  BOOLEAN DEFAULT FALSE,
    individual_ok   BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_calendario_comp_data ON calendario(competicao, data);
```

### Tabela: modelo_jogo

```sql
CREATE TABLE modelo_jogo (
    id             SERIAL PRIMARY KEY,
    fase           VARCHAR(50),       -- ataque, defesa, transicao_of, transicao_def
    principio      VARCHAR(200),
    sub_principio  VARCHAR(200),
    descricao      TEXT,
    video_ref      TEXT
);
```

### Tabela: analistas

```sql
CREATE TABLE analistas (
    id                  SERIAL PRIMARY KEY,
    nome                VARCHAR(200),
    funcao              VARCHAR(100),
    qualidade           NUMERIC(3,1),   -- Media 0.0 a 10.0
    entregas_pendentes  INTEGER DEFAULT 0
);
```

### Tabela: entregas_soutto

```sql
CREATE TABLE entregas_soutto (
    id           SERIAL PRIMARY KEY,
    analista_id  INTEGER REFERENCES analistas(id) ON DELETE CASCADE,
    tipo         VARCHAR(100),
    descricao    TEXT,
    data_limite  DATE,
    status       VARCHAR(50) DEFAULT 'pendente'  -- pendente, concluida, atrasada
);
```

### Tabela: protocolos

```sql
CREATE TABLE protocolos (
    id         SERIAL PRIMARY KEY,
    titulo     VARCHAR(300),
    categoria  VARCHAR(100),
    descricao  TEXT,
    status     VARCHAR(50) DEFAULT 'ativo'
);
```

### Tabela: proximo_adversario

```sql
CREATE TABLE proximo_adversario (
    id              SERIAL PRIMARY KEY,
    adversario      VARCHAR(200),
    competicao      VARCHAR(100),
    rodada          INTEGER,
    data            DATE,
    progresso_pct   INTEGER DEFAULT 0,
    analise_tatica  TEXT,
    jogadores_chave TEXT,
    pontos_fortes   TEXT,
    pontos_fracos   TEXT
);
```

---

## Schema de Adversario (`adversario_schema.sql`)

### Tabela: adversario_relatorios

```sql
CREATE TABLE adversario_relatorios (
    id                   SERIAL PRIMARY KEY,
    equipe               VARCHAR(200) NOT NULL,
    jogos_analisados     INTEGER,
    data_analise         DATE DEFAULT CURRENT_DATE,
    remates_total        INTEGER,
    remates_no_alvo      INTEGER,
    precisao_remates_pct NUMERIC(5,2),
    xg_total             NUMERIC(6,2),
    gols_total           INTEGER,
    fonte                VARCHAR(50),
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_adv_rel_equipe ON adversario_relatorios(equipe);
-- Trigger: atualiza updated_at automaticamente
```

### Tabela: adversario_jogadores

```sql
CREATE TABLE adversario_jogadores (
    id            SERIAL PRIMARY KEY,
    relatorio_id  INTEGER REFERENCES adversario_relatorios(id) ON DELETE CASCADE,
    numero        INTEGER,
    nome          VARCHAR(200),
    posicao       VARCHAR(50),
    idade         INTEGER,
    altura        NUMERIC(4,2),
    jogos         INTEGER,
    minutos       INTEGER,
    -- 60+ campos de estatisticas (mesmas categorias de estatisticas_individuais)
    gols          INTEGER,
    xG            NUMERIC(5,2),
    assistencias  INTEGER,
    xA            NUMERIC(5,2),
    -- ... (passes, dribles, duelos, defensivo, etc.)
);

CREATE INDEX idx_adv_jog_relatorio ON adversario_jogadores(relatorio_id);
CREATE INDEX idx_adv_jog_nome ON adversario_jogadores(nome);
```

### Tabela: adversario_formacoes

```sql
CREATE TABLE adversario_formacoes (
    id                      SERIAL PRIMARY KEY,
    relatorio_id            INTEGER REFERENCES adversario_relatorios(id) ON DELETE CASCADE,
    sistema                 VARCHAR(20) NOT NULL,  -- "4-3-3", "4-4-2", etc.
    frequencia_pct          NUMERIC(5,2),
    gols_favor              INTEGER,
    gols_contra             INTEGER,
    xG                      NUMERIC(5,2),
    xG_contra               NUMERIC(5,2),
    posse_pct               NUMERIC(5,2),
    posse_adversario_pct    NUMERIC(5,2),
    precisao_passe_pct      NUMERIC(5,2),
    precisao_passe_adv_pct  NUMERIC(5,2),
    intensidade_jogo        NUMERIC(5,2),
    intensidade_jogo_adv    NUMERIC(5,2),
    passe_profundidade_pct  NUMERIC(5,2),
    passe_profundidade_adv_pct NUMERIC(5,2),
    ppda                    NUMERIC(5,2),
    ppda_adv                NUMERIC(5,2)
);

CREATE INDEX idx_adv_form_relatorio ON adversario_formacoes(relatorio_id);
```

### Tabela: adversario_transicoes

```sql
CREATE TABLE adversario_transicoes (
    id              SERIAL PRIMARY KEY,
    relatorio_id    INTEGER REFERENCES adversario_relatorios(id) ON DELETE CASCADE,
    tipo            VARCHAR(20) CHECK (tipo IN ('recuperacao', 'perda', 'falta')),
    jogador_numero  INTEGER,
    jogador_nome    VARCHAR(200),
    minutos         INTEGER,
    total           INTEGER,
    media_90        NUMERIC(5,2)
);

CREATE INDEX idx_adv_trans_relatorio ON adversario_transicoes(relatorio_id);
```

### Views

**vw_adversario_jogadores_chave** - Ranking de jogadores-chave por xG + xA:
```sql
CREATE VIEW vw_adversario_jogadores_chave AS
SELECT relatorio_id, nome, posicao, numero,
       gols, xG, assistencias, xA,
       (COALESCE(xG, 0) + COALESCE(xA, 0)) AS contribuicao_ofensiva
FROM adversario_jogadores
ORDER BY contribuicao_ofensiva DESC;
```

**vw_adversario_vulnerabilidade** - Vulnerabilidades por formacao (diferencial de xG):
```sql
CREATE VIEW vw_adversario_vulnerabilidade AS
SELECT relatorio_id, sistema, frequencia_pct,
       gols_favor, gols_contra,
       xG, xG_contra,
       (COALESCE(xG_contra, 0) - COALESCE(xG, 0)) AS vulnerabilidade_xG
FROM adversario_formacoes
ORDER BY vulnerabilidade_xG DESC;
```

---

## Tabelas Supabase (`supabase_setup.sql`)

Todas as tabelas Supabase possuem **Row Level Security (RLS)** habilitado com politicas publicas de leitura e escrita.

### Tabela: tarefas

```sql
CREATE TABLE tarefas (
    id         BIGSERIAL PRIMARY KEY,
    titulo     TEXT,
    analista   TEXT,
    prazo      TEXT,
    prio       TEXT,          -- alta, media, baixa
    tipo       TEXT,
    status     TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tarefas_status ON tarefas(status, created_at DESC);
```

### Tabela: adv_checklist

```sql
CREATE TABLE adv_checklist (
    id       BIGSERIAL PRIMARY KEY,
    label    TEXT,
    done     BOOLEAN DEFAULT FALSE,
    fixed    BOOLEAN DEFAULT FALSE,   -- Itens fixos nao podem ser removidos
    position INTEGER DEFAULT 0        -- Ordem de exibicao
);

CREATE INDEX idx_adv_checklist_pos ON adv_checklist(position);
```

### Tabela: adv_links

```sql
CREATE TABLE adv_links (
    id        BIGSERIAL PRIMARY KEY,
    match_key VARCHAR(200) UNIQUE,   -- Ex: "Fortaleza_Paulistao_21_03"
    url       TEXT
);
```

### Tabela: indicacoes

```sql
CREATE TABLE indicacoes (
    id           BIGSERIAL PRIMARY KEY,
    nome         TEXT,
    posicao      TEXT,
    idade        INTEGER,
    clube_atual  TEXT,
    link         TEXT,
    foto_url     TEXT,
    escudo_url   TEXT,
    observacao   TEXT,
    indicado_por TEXT,
    status       TEXT DEFAULT 'novo',     -- novo, analisado, contratado
    prioridade   TEXT DEFAULT 'media',    -- baixa, media, alta
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_indicacoes_status ON indicacoes(status, created_at DESC);
```

### Politicas RLS

Todas as tabelas Supabase usam politicas identicas:
```sql
ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"  ON <tabela> FOR SELECT USING (true);
CREATE POLICY "Allow public write" ON <tabela> FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON <tabela> FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON <tabela> FOR DELETE USING (true);
```

> **Nota de seguranca:** Essas politicas permitem acesso total. Em producao, devem ser restritas por role/usuario.

---

## Setup do Banco de Dados

### PostgreSQL Local

```bash
# Criar banco
psql -U postgres -c "CREATE DATABASE bfsa_performance;"

# Executar schemas
psql -U postgres -d bfsa_performance -f performance_schema.sql
psql -U postgres -d bfsa_performance -f adversario_schema.sql
```

### Supabase (Cloud)

1. Criar projeto no Supabase Dashboard
2. Abrir SQL Editor
3. Executar o conteudo de `supabase_setup.sql`
4. Copiar a URL e anonKey para o `.env`

### Migracao / Seed

O backend FastAPI cria as tabelas automaticamente via SQLAlchemy se elas nao existirem:
```python
Base.metadata.create_all(bind=engine)
```
