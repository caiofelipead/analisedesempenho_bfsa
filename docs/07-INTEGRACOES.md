# 07 - Integracoes

## Visao Geral

O sistema integra com 4 servicos externos:

| Servico | Funcao | Protocolo |
|---------|--------|-----------|
| Google Sheets | Fonte de dados operacionais | CSV via API REST |
| Supabase | Sincronizacao em tempo real | SDK JavaScript |
| Wyscout | Estatisticas de jogadores | PDF parsing |
| Vercel | Hosting + serverless proxy | Serverless Functions |

---

## 1. Google Sheets

### Arquitetura

```
Google Sheets (privada)
    │
    ├── Via Vercel Proxy (producao)
    │   └── /api/sheets/[gid].js
    │       ├── Auth: Service Account
    │       ├── Output: CSV
    │       └── Cache: 60s + 300s stale
    │
    └── Via Export Publico (fallback)
        └── https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&gid={GID}
```

### Vercel Serverless Function

**Arquivo:** `api/sheets/[gid].js`

**Endpoint:** `GET /api/sheets/{gid}`

**Parametros:**
| Param | Tipo | Descricao |
|-------|------|-----------|
| `gid` | String (path) | ID numerico da aba na planilha |

**Variaveis de ambiente necessarias:**
```env
GOOGLE_SPREADSHEET_ID=1234567890abcdef
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

**Fluxo:**
1. Recebe requisicao com `gid`
2. Parseia credenciais do Service Account
3. Autentica com Google Sheets API v4
4. Busca metadados da planilha para encontrar aba pelo `gid`
5. Faz download de todos os valores da aba
6. Converte para CSV com tratamento de aspas
7. Retorna com headers CORS e cache

**Headers de resposta:**
```
Content-Type: text/csv; charset=utf-8
Access-Control-Allow-Origin: *
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

### Consumo no Frontend

```javascript
// PantherPerformance.jsx
async function fetchSheet(gid) {
  // Tenta proxy privado primeiro
  const apiUrl = process.env.REACT_APP_SHEETS_API_URL;
  if (apiUrl) {
    const res = await fetch(`${apiUrl}/api/sheets/${gid}`);
    if (res.ok) return parseCSV(await res.text());
  }

  // Fallback: export publico
  const publicUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const res = await fetch(publicUrl);
  return parseCSV(await res.text());
}
```

### Abas da Planilha

Cada aba da planilha tem um `gid` unico. O frontend carrega os dados conforme a pagina ativa:

| Aba | Dados | Quando carrega |
|-----|-------|---------------|
| Elenco | Jogadores, posicoes, fotos | Pagina Elenco |
| Partidas | Resultados, estatisticas coletivas | Pagina Partidas |
| Individuais | Metricas por jogador/partida | Detalhe do jogador |
| Videos | Links de video | Pagina Videos |
| Analistas | Entregas e qualidade | Pagina Analistas |
| Calendario | Agenda de jogos | Pagina Calendario |
| Bolas Paradas | Playbook e estatisticas | Pagina Bolas Paradas |

---

## 2. Supabase

### Configuracao

**Arquivo:** `src/supabaseClient.js`

```env
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Tabelas Utilizadas

| Tabela | Hook | Operacoes |
|--------|------|-----------|
| `tarefas` | `useTarefas` | CRUD completo |
| `adv_checklist` | `useAdvChecklist` | Read + Replace All |
| `adv_links` | `useAdvLinks` | Read + Replace All |
| `indicacoes` | `useIndicacoes` | CRUD completo |

### Operacoes Comuns

```javascript
// SELECT
const { data, error } = await supabase
  .from('tarefas')
  .select('*')
  .order('created_at', { ascending: false });

// INSERT
const { data, error } = await supabase
  .from('tarefas')
  .insert([{ titulo, analista, prazo, prio, tipo, status }])
  .select();

// UPDATE
const { error } = await supabase
  .from('tarefas')
  .update({ status: 'concluida' })
  .eq('id', 42);

// DELETE
const { error } = await supabase
  .from('tarefas')
  .delete()
  .eq('id', 42);

// DELETE ALL (para replace)
const { error } = await supabase
  .from('adv_checklist')
  .delete()
  .neq('id', 0);  // Deleta tudo
```

### Row Level Security

Todas as tabelas tem RLS habilitado com politicas publicas. Em producao, recomenda-se restringir:

```sql
-- Exemplo de politica restrita
CREATE POLICY "Authenticated users only"
  ON tarefas FOR ALL
  USING (auth.role() = 'authenticated');
```

---

## 3. Wyscout (Parser de PDF)

### Visao Geral

O arquivo `wyscout_adversario_parser.py` extrai dados estruturados de relatorios PDF do Wyscout.

### Fluxo de Importacao

```
PDF Wyscout          Parser Python         FastAPI            PostgreSQL
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌────────────┐
│ Team     │────>│ pdfplumber   │────>│ POST      │────>│ adversario │
│ Report   │     │ + regex      │     │ /importar │     │ _relatorios│
│ .pdf     │     │ extraction   │     │           │     │ _jogadores │
└──────────┘     └──────────────┘     └───────────┘     │ _formacoes │
                                                         └────────────┘
```

### Uso Standalone

```bash
# JSON (padrao)
python wyscout_adversario_parser.py "Fortaleza EC.pdf"
# Gera: Fortaleza EC_parsed.json

# Excel
python wyscout_adversario_parser.py "Fortaleza EC.pdf" --output xlsx
# Gera: Fortaleza EC_parsed.xlsx

# Enviar para API
python wyscout_adversario_parser.py "Fortaleza EC.pdf" --post http://localhost:8000
# POST para /api/adversario/importar
```

### Uso como Modulo

```python
from wyscout_adversario_parser import parse_wyscout_team_report

relatorio = parse_wyscout_team_report("Fortaleza EC.pdf")

# Estrutura retornada:
{
    "equipe": "Fortaleza EC",
    "jogos_analisados": 5,
    "remates_total": 67,
    "xg_total": 8.42,
    "jogadores": [...],      # Lista de JogadorAdversario
    "formacoes": [...],      # Lista de FormacaoAdversario
    "transicoes": [...],     # Lista de TransicaoAdversario
    "resultados": [...]      # Lista de ResultadoAdversario
}
```

### Metricas Extraidas por Jogador (82 campos)

| Categoria | Exemplos de Campos |
|-----------|--------------------|
| Identificacao | numero, nome, posicao, idade, altura, pe |
| Participacao | jogos, minutos, media_minutos |
| Gols/Assist | gols, xG, assistencias, xA, shot_assists |
| Finalizacao | remates_total, remates_alvo, remates_fora, remates_bloqueados |
| Passes | passes_total, precisao, frente, tras, laterais, longos, progressivos, terco_final, diagonal, deep_completions |
| Cruzamentos | cruzamentos, cruzamentos_precisao |
| Dribles | dribles_tentados, dribles_sucesso |
| Duelos | duelos_total, duelos_ganhos, def, of, aereos |
| Defensivo | intercepcoes, cortes, cortes_carrinho, bloqueios, recuperacoes |
| Disciplina | faltas, faltas_sofridas, cartoes_amarelos, cartoes_vermelhos |
| Posse | touches_area, perdas_meio_campo |

---

## 4. Google Service Account

### Setup

1. Criar Service Account no Google Cloud Console
2. Habilitar Google Sheets API
3. Gerar chave JSON
4. Compartilhar planilha com o email do Service Account
5. Configurar credenciais no ambiente

### Configuracao

**Opcao 1: JSON inline (Vercel/producao)**
```env
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
```

**Opcao 2: Arquivo local (desenvolvimento)**
```env
GOOGLE_SERVICE_ACCOUNT_FILE=./service-account.json
```

> **Seguranca:** O arquivo `service-account.json` esta no `.gitignore`. Nunca commitar credenciais.

---

## 5. Deteccao de Plataforma de Video

O frontend detecta automaticamente a plataforma do video pela URL:

```javascript
function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('drive.google.com')) return 'Google Drive';
  if (url.includes('wyscout.com')) return 'Wyscout';
  if (url.includes('instatscout.com')) return 'InStat';
  return 'Outro';
}
```

| Plataforma | Dominio | Icone |
|-----------|---------|-------|
| YouTube | youtube.com, youtu.be | Play vermelho |
| Google Drive | drive.google.com | Triangulo colorido |
| Wyscout | wyscout.com | W verde |
| InStat | instatscout.com | I azul |
