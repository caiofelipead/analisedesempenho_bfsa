# 10 - Analise Tecnica e Melhorias

Documento de analise tecnica do projeto Panther Performance, com identificacao de problemas criticos, dividas tecnicas e plano de acao priorizado.

---

## 1. Monolito Frontend (Critico)

**Problema:** `PantherPerformance.jsx` possui ~2.857 linhas em um unico componente com 40+ `useState`. Dificulta manutencao, testes e performance.

**Impacto:** Qualquer alteracao em um modulo afeta o arquivo inteiro. Re-renders desnecessarios em todos os modulos a cada mudanca de estado.

**Acao recomendada:**
1. Decompor em 12 componentes (um por modulo): `src/modules/Dashboard.jsx`, `src/modules/Elenco.jsx`, etc.
2. Usar `React.lazy()` + `Suspense` para code splitting
3. Aplicar `useCallback`/`useMemo` em handlers e dados computados
4. Extrair componentes reutilizaveis (`Card`, `Badge`, `SH`) para `src/components/`

**Estrutura alvo:**
```
src/
├── components/           # Componentes reutilizaveis
│   ├── Card.jsx
│   ├── Badge.jsx
│   ├── SectionHeader.jsx
│   ├── ProgressBar.jsx
│   └── VideoRow.jsx
├── modules/              # Paginas do dashboard
│   ├── Dashboard.jsx
│   ├── Elenco.jsx
│   ├── Partidas.jsx
│   ├── Videos.jsx
│   ├── Analistas.jsx
│   ├── Tarefas.jsx
│   ├── Adversario.jsx
│   ├── BolasParadas.jsx
│   ├── Calendario.jsx
│   └── Configuracoes.jsx
├── hooks/                # Hooks customizados
├── utils/                # Utilitarios (parseCSV, colNorm, etc.)
├── constants/            # Cores, configuracoes
└── PantherPerformance.jsx  # Shell com sidebar + router
```

---

## 2. Ausencia de Testes (Critico)

**Problema:** Nenhum arquivo de teste no repositorio. Sem Jest, Pytest ou CI/CD configurado.

**Impacto:** Qualquer refatoracao (especialmente a decomposicao do monolito) tem alto risco de regressao. Bugs so sao detectados manualmente em producao.

**Acao recomendada:**
1. Configurar Jest + React Testing Library para o frontend
2. Configurar Pytest + httpx para o backend FastAPI
3. Priorizar testes nos hooks customizados (logica de negocio isolavel)
4. Criar GitHub Actions para rodar testes em cada PR

**Prioridade de testes:**
| Componente | Tipo | Justificativa |
|-----------|------|---------------|
| `useTarefas` | Unit | CRUD + fallback localStorage |
| `useAdvChecklist` | Unit | Sincronizacao atomica |
| `useIndicacoes` | Unit | CRUD com status/prioridade |
| `parseCSV` / `colNorm` / `findCol` | Unit | Parsing critico para dados |
| `ptNum` / `parseDateBR` | Unit | Conversao de formatos BR |
| Endpoints FastAPI | Integration | CRUD + validacao |
| Wyscout Parser | Integration | Extracao de PDF |

---

## 3. Seguranca (Critico)

**Problema:** Tres vetores de exposicao abertos:

| Vetor | Risco | Estado Atual |
|-------|-------|-------------|
| RLS Supabase | Qualquer pessoa com a anonKey le/escreve tudo | Politicas publicas |
| FastAPI | Endpoints sem autenticacao | Sem JWT/Bearer |
| Credenciais | Dependem apenas do `.gitignore` | Sem secrets manager |

**Acao recomendada:**
1. Implementar Supabase Auth com RLS por `auth.uid()`
2. Adicionar middleware JWT no FastAPI (validar token Supabase)
3. Auditar historico git por credenciais vazadas: `git log --all --full-history -- '*.json'`
4. Migrar credenciais para secrets manager (Vercel Environment Variables, AWS Secrets Manager)

**Exemplo de RLS restritivo:**
```sql
-- Substituir politicas publicas por:
CREATE POLICY "Authenticated users only"
  ON tarefas FOR ALL
  USING (auth.role() = 'authenticated');
```

---

## 4. Performance (Alto)

**Problema:**
- Sem paginacao em nenhum endpoint ou lista do frontend
- CSV do Google Sheets carregado inteiro em memoria a cada render
- Fuzzy matching de colunas (`colNorm()`) com complexidade O(n^2) por render
- Sem debounce em filtros/buscas

**Impacto:** Degrada progressivamente conforme volume de dados cresce. Com 100+ partidas e 37 atletas com 67 metricas cada, o parsing de CSV sozinho pode travar a UI.

**Acao recomendada:**
1. Paginacao no backend: `GET /api/atletas?page=1&limit=20`
2. Cachear CSV parseado em estado (nao re-parsear a cada render)
3. Memoizar resultado de `colNorm()` com `useMemo`
4. Debounce de 300ms nos inputs de busca
5. Virtualizar listas longas com `react-window` ou `react-virtualized`

---

## 5. Estado Global (Medio)

**Problema:** Props drilling no componente monolitico. localStorage como fallback nao sincronizado com Supabase. Sem estrategia offline-first.

**Acao recomendada:**
1. Implementar React Context ou Zustand para estado global
2. Criar sync layer com timestamp de ultima atualizacao:
   ```javascript
   // Pseudocodigo
   const lastSync = localStorage.getItem('lastSync');
   const { data } = await supabase.from('tarefas').select('*').gt('updated_at', lastSync);
   ```
3. Resolver conflitos por "last write wins" com timestamp

---

## 6. Banco de Dados (Medio)

**Problema:**
- Indices insuficientes para queries frequentes (atletas x partidas x metricas)
- Sem estrategia de retencao/arquivamento de dados historicos
- Migrations manuais via scripts SQL

**Acao recomendada:**
1. Criar indices compostos para queries frequentes:
   ```sql
   CREATE INDEX idx_estat_atleta_data ON estatisticas_individuais(atleta_id, data DESC);
   CREATE INDEX idx_partidas_comp_data ON partidas_coletivas(competicao, data DESC);
   ```
2. Definir politica de arquivamento (ex: partidas > 2 temporadas para tabela historica)
3. Migrar para Alembic para versionamento de migrations
4. Auditar constraints e foreign keys

---

## 7. API Design (Medio)

**Problema:**
- Sem versionamento de API (`/api/v1/...`)
- Over-fetching: endpoints retornam objetos completos sem field selection
- Import Wyscout hardcoded para 72 colunas
- Sem rate limiting

**Acao recomendada:**
1. Versionar: `/api/v1/atletas`
2. Field selection: `GET /api/atletas?fields=nome,posicao,numero`
3. Tornar mapeamento Wyscout configuravel (JSON externo)
4. Adicionar `slowapi` para rate limiting:
   ```python
   from slowapi import Limiter
   limiter = Limiter(key_func=get_remote_address)

   @app.get("/api/atletas")
   @limiter.limit("100/minute")
   async def list_atletas(...):
   ```

---

## 8. Deployment e Observabilidade (Medio)

**Problema:**
- Sem Dockerfile no repositorio
- Sem Docker Compose para ambiente de desenvolvimento
- Sem health check endpoint
- Sem monitoramento/logging estruturado

**Acao recomendada:**
1. Criar `Dockerfile` para o backend:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY backend_api.py wyscout_adversario_parser.py ./
   EXPOSE 8000
   CMD ["uvicorn", "backend_api:app", "--host", "0.0.0.0", "--port", "8000"]
   ```
2. Criar `docker-compose.yml` (FastAPI + PostgreSQL)
3. Adicionar endpoint `/health`:
   ```python
   @app.get("/health")
   async def health():
       return {"status": "ok", "db": check_db_connection()}
   ```
4. Integrar Sentry (free tier) para error tracking
5. Adicionar logging estruturado com `structlog`

---

## 9. Dados Hardcoded (Baixo)

**Problema:** ~40 atletas com URLs de fotos do GitHub hardcoded no JSX. Qualquer transferencia/contratacao exige deploy.

**Acao recomendada:**
1. Mover roster para tabela `atletas` no Supabase
2. Servir fotos via Supabase Storage
3. Criar CRUD de atletas no painel de Configuracoes
4. Manter fallback para dados hardcoded durante migracao

---

## Priorizacao Recomendada

| Ordem | Item | Esforco | Risco se ignorado |
|-------|------|---------|--------------------|
| 1 | Testes basicos | Medio | Regressoes em qualquer refatoracao |
| 2 | Seguranca (RLS + JWT) | Medio | Dados expostos em producao |
| 3 | Decomposicao do monolito | Alto | Bloqueia evolucao futura |
| 4 | Paginacao + cache | Baixo | Performance degrada com volume |
| 5 | Docker + CI/CD | Baixo | Deploy manual e propenso a erros |
| 6 | Estado global | Medio | Conflitos de dados offline |
| 7 | API versionamento | Baixo | Breaking changes em clients |
| 8 | Observabilidade | Baixo | Bugs silenciosos em producao |
| 9 | Dados hardcoded | Baixo | Atrito operacional |

---

## Dependencias entre Itens

```
[1] Testes ──────────────> [3] Decomposicao monolito
                                     │
[2] Seguranca                        ▼
                           [5] Docker + CI/CD
[4] Paginacao                        │
                                     ▼
[6] Estado global          [8] Observabilidade

[7] API versionamento      [9] Dados hardcoded
```

Os itens 1 e 2 sao pre-requisitos independentes. O item 3 depende do item 1. Os demais podem ser paralelizados.
