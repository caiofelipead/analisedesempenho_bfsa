-- Execute este SQL no Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Tabela de tarefas
CREATE TABLE tarefas (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  analista VARCHAR(50),
  prazo VARCHAR(10),
  prio VARCHAR(20) DEFAULT 'media',
  tipo VARCHAR(50) DEFAULT 'analise_adversario',
  status VARCHAR(20) DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) com acesso público para leitura/escrita
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público tarefas" ON tarefas
  FOR ALL USING (true) WITH CHECK (true);

-- Index para performance
CREATE INDEX idx_tarefas_status ON tarefas(status);
CREATE INDEX idx_tarefas_created ON tarefas(created_at DESC);

-- ═══════════════════════════════════════════════
-- Tabela de checklist do adversário (sincronizado entre todos)
-- ═══════════════════════════════════════════════
CREATE TABLE adv_checklist (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  fixed BOOLEAN DEFAULT FALSE,
  position INT DEFAULT 0
);

ALTER TABLE adv_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público adv_checklist" ON adv_checklist
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_adv_checklist_position ON adv_checklist(position);

-- ═══════════════════════════════════════════════
-- Tabela de links de jogos do adversário
-- ═══════════════════════════════════════════════
CREATE TABLE adv_links (
  id BIGSERIAL PRIMARY KEY,
  match_key VARCHAR(200) UNIQUE NOT NULL,
  url TEXT NOT NULL
);

ALTER TABLE adv_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público adv_links" ON adv_links
  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════
-- Tabela de indicação de jogadores
-- ═══════════════════════════════════════════════
CREATE TABLE indicacoes (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  posicao VARCHAR(50),
  idade VARCHAR(10),
  clube_atual VARCHAR(100),
  link VARCHAR(500),
  foto_url VARCHAR(500),
  escudo_url VARCHAR(500),
  observacao TEXT,
  indicado_por VARCHAR(50),
  status VARCHAR(20) DEFAULT 'novo',
  prioridade VARCHAR(20) DEFAULT 'media',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público indicacoes" ON indicacoes
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_indicacoes_status ON indicacoes(status);
CREATE INDEX idx_indicacoes_created ON indicacoes(created_at DESC);
