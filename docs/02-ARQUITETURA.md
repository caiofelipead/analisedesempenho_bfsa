# 02 - Arquitetura

## Diagrama de Fluxo de Dados

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Google Sheets   │     │   Wyscout PDF    │     │     InStat       │
│  (dados operar.) │     │  (relatorios)    │     │  (estatisticas)  │
└────────┬────────┘     └────────┬─────────┘     └──────────────────┘
         │                       │
         │ CSV / API             │ Parser Python
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Vercel Proxy    │     │  wyscout_parser  │
│  /api/sheets/    │     │  .py             │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         │ CSV                   │ JSON / HTTP POST
         ▼                       ▼
┌─────────────────────────────────────────────┐
│           FastAPI Backend                    │
│           (backend_api.py)                   │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Atletas  │  │ Partidas │  │ Adversario │ │
│  │ CRUD     │  │ CRUD     │  │ Import     │ │
│  └─────────┘  └──────────┘  └────────────┘ │
└────────────────────┬────────────────────────┘
                     │ SQLAlchemy
                     ▼
┌─────────────────────────────────────────────┐
│              PostgreSQL                      │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Core Tables   │  │ Adversario Tables  │  │
│  │ (performance  │  │ (adversario        │  │
│  │  _schema.sql) │  │  _schema.sql)      │  │
│  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        React Dashboard (SPA)                 │
│        PantherPerformance.jsx                │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ 12 Pages │  │ Charts   │  │ Hooks     │ │
│  │ Modules  │  │ Recharts │  │ Custom x4 │ │
│  └──────────┘  └──────────┘  └─────┬─────┘ │
└────────────────────────────────────┬────────┘
                                     │
                     ┌───────────────┼───────────────┐
                     ▼               ▼               ▼
              ┌────────────┐  ┌───────────┐  ┌──────────────┐
              │ Supabase   │  │ Google    │  │ localStorage │
              │ (realtime) │  │ Sheets    │  │ (fallback)   │
              └────────────┘  └───────────┘  └──────────────┘
```

## Camadas do Sistema

### 1. Camada de Dados (Data Layer)

**Fontes externas:**
- Google Sheets: dados operacionais do dia a dia (planilhas de controle)
- Wyscout: relatorios PDF com estatisticas detalhadas por jogador
- InStat: estatisticas complementares

**Armazenamento:**
- PostgreSQL: persistencia principal com schema relacional completo
- Supabase: sincronizacao em tempo real para funcionalidades colaborativas
- localStorage: cache offline como fallback

### 2. Camada de Servico (Service Layer)

**FastAPI (`backend_api.py`):**
- API RESTful com 14 modelos ORM (SQLAlchemy)
- Connection pooling: 10 conexoes base, 20 overflow, reciclagem a cada 3600s
- Importacao de dados do parser Wyscout via HTTP POST

**Vercel Serverless (`api/sheets/[gid].js`):**
- Proxy para Google Sheets privadas
- Autenticacao via Service Account
- Cache: 60s max-age, 300s stale-while-revalidate

**Wyscout Parser (`wyscout_adversario_parser.py`):**
- Extrai 80+ metricas de PDFs Wyscout
- Exporta para JSON, XLSX ou HTTP POST direto para a API

### 3. Camada de Apresentacao (Presentation Layer)

**React SPA (`PantherPerformance.jsx`):**
- Componente monolitico com 12 modulos de pagina
- Navegacao por sidebar com estado local
- Tema escuro com palette gold/purple
- Graficos interativos via Recharts

### 4. Camada de Estado (State Layer)

**Hooks customizados:**
- `useTarefas`: tarefas com Supabase + localStorage fallback
- `useAdvChecklist`: checklist de adversario com ordenacao posicional
- `useAdvLinks`: links de video por partida
- `useIndicacoes`: indicacoes de jogadores com status/prioridade

**Estrategia de sincronizacao:**
- Updates otimistas: UI atualiza imediatamente, sincroniza async com backend
- Fallback automatico: se Supabase indisponivel, usa localStorage
- Fonte de verdade: Google Sheets para dados operacionais, Supabase para colaboracao

## Padroes de Projeto

### Monolito Frontend
O dashboard inteiro reside em `PantherPerformance.jsx` (~2857 linhas). A navegacao entre modulos e feita por estado interno (`page`), sem roteamento SPA. Isso simplifica o deploy mas dificulta a manutencao em escala.

### Hooks como Service Layer
Cada hook customizado encapsula:
- Estado local (useState)
- Logica de fetch (Supabase client)
- Operacoes CRUD com updates otimistas
- Fallback para localStorage

### CSV como Interface
O frontend consome dados do Google Sheets via CSV, usando parsing robusto com:
- Deteccao automatica de delimitador (`,`, `;`, `\t`)
- Busca fuzzy de colunas (exato -> normalizado -> substring)
- Parsing de numeros em formato brasileiro ("1,5" -> 1.5)

### Cascade Delete
Relacionamentos no banco usam `CASCADE` para manter integridade:
- Deletar um atleta remove suas estatisticas e videos
- Deletar um relatorio de adversario remove jogadores, formacoes e resultados associados

## Seguranca

| Aspecto | Estado Atual | Recomendacao |
|---------|-------------|--------------|
| Autenticacao | Sem login (uso interno) | Implementar auth Supabase |
| RLS Supabase | Politicas publicas (read/write) | Restringir por role |
| Service Account | JSON em variavel de ambiente | Manter em secrets manager |
| Supabase anonKey | Exposta no cliente | Aceitavel com RLS configurado |
| API Backend | Sem autenticacao | Adicionar middleware de auth |
| CORS | Configurado no Vercel proxy | Manter restrito a dominio |

## Decisoes Arquiteturais

| Decisao | Justificativa |
|---------|---------------|
| React sem framework (CRA) | Simplicidade de setup, equipe pequena |
| Componente monolitico | Rapido para prototipar, unico desenvolvedor |
| Google Sheets como fonte | Equipe ja usa planilhas no dia a dia |
| Supabase para realtime | SDK simples, sem necessidade de WebSocket manual |
| FastAPI + SQLAlchemy | Performance async, ORM maduro, tipagem Python |
| PostgreSQL | Suporte a arrays, JSON, views materializadas |
| Vercel | Deploy automatico, serverless functions integradas |
