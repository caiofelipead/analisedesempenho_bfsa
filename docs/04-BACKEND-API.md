# 04 - Backend API

## Visao Geral

O backend e uma API RESTful construida com FastAPI e SQLAlchemy, servindo como camada de persistencia e processamento de dados do sistema.

**Arquivo principal:** `backend_api.py` (~1619 linhas)

## Configuracao do Servidor

```python
DATABASE_URL = "postgresql://bfsa:bfsa@localhost:5432/bfsa_performance"

# Connection Pool
pool_size = 10          # Conexoes base
max_overflow = 20       # Conexoes extras sob demanda
pool_recycle = 3600     # Reciclar conexoes a cada 1 hora
```

**Execucao:**
```bash
# Desenvolvimento
python backend_api.py

# Producao
uvicorn backend_api:app --host 0.0.0.0 --port 8000 --reload
```

## Modelos ORM (SQLAlchemy)

### 1. Atleta
Registro mestre de cada jogador do elenco.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | Integer (PK) | Identificador unico |
| nome | String (NOT NULL) | Nome completo |
| posicao | String | Posicao em campo (GOL, ZAG, LAT, VOL, MEI, ATA) |
| numero | Integer | Numero da camisa |
| status | String | ativo, lesionado, emprestado, etc. |
| foto_url | String | URL da foto do jogador |
| categoria | String | Profissional, Sub-20, Sub-17 |
| tendencia | String | melhora, estavel, piora |
| created_at | DateTime | Data de criacao |
| updated_at | DateTime | Ultima atualizacao |

**Relacionamentos:**
- `estatisticas` -> EstatisticaIndividual (1:N, CASCADE)
- `videos` -> Video (1:N, CASCADE)

---

### 2. PartidaColetiva
Dados coletivos de cada partida.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| jogo | String | Descricao (ex: "BFSA 2x1 Fortaleza") |
| competicao | String | Nome da competicao |
| data | Date | Data da partida |
| local | String | casa / fora (com CHECK) |
| resultado | String | V / E / D |
| gols_pro | Integer | Gols marcados |
| gols_contra | Integer | Gols sofridos |
| xG | Float | Expected Goals |
| xG_contra | Float | xG do adversario |
| posse | Float | Posse de bola (%) |
| passes | Integer | Total de passes |
| passes_pct | Float | Precisao de passes (%) |
| remates | Integer | Total de finalizacoes |
| remates_alvo | Integer | Finalizacoes no gol |
| duelos | Integer | Total de duelos |
| duelos_pct | Float | Duelos ganhos (%) |
| recuperacoes | Integer | Bolas recuperadas |
| perdas | Integer | Bolas perdidas |
| ppda | Float | Passes Per Defensive Action |
| corners | Integer | Escanteios |
| faltas | Integer | Faltas cometidas |
| cartoes_amarelos | Integer | Cartoes amarelos |
| cartoes_vermelhos | Integer | Cartoes vermelhos |
| created_at | DateTime | Data de criacao |

**Relacionamentos:**
- `desempenhos` -> EstatisticaIndividual (1:N, CASCADE)

---

### 3. EstatisticaIndividual
Estatisticas individuais por atleta por partida (67 metricas Wyscout).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| atleta_id | Integer (FK) | Referencia ao atleta |
| partida_id | Integer (FK) | Referencia a partida |
| competicao | String | Competicao |
| data | Date | Data |
| posicao | String | Posicao na partida |
| minutos | Integer | Minutos jogados |
| acoes_totais | Integer | Total de acoes |
| gols | Integer | Gols marcados |
| assistencias | Integer | Assistencias |
| xG | Float | Expected Goals |
| passes | Integer | Passes tentados |
| passes_pct | Float | Precisao de passes |
| cruzamentos | Integer | Cruzamentos |
| dribles | Integer | Dribles tentados |
| duelos | Integer | Duelos disputados |
| intercepcoes | Integer | Intercepcoes |
| ... | ... | (67 campos no total) |

**Constraint:** UNIQUE(atleta_id, partida_id)

---

### 4. Video
Links de video vinculados a atletas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| atleta_id | Integer (FK) | Atleta vinculado |
| titulo | String | Titulo do video |
| url | String | Link externo |
| tipo | String | coletivo, individual, adversario, bola_parada |
| tags | ARRAY(String) | Tags para busca |
| data_criacao | DateTime | Data de criacao |

---

### 5. Calendario
Agenda de jogos com controle de processos.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| rodada | Integer | Numero da rodada |
| competicao | String | Competicao |
| adversario | String | Time adversario |
| local | String | casa / fora |
| data | Date | Data do jogo |
| resultado | String | Resultado final |
| status | String | Status geral |
| adv_analise | Boolean | Analise do adversario feita |
| prelecao | Boolean | Prelecao preparada |
| pos_jogo | Boolean | Pos-jogo concluido |
| wyscout_ok | Boolean | Dados Wyscout importados |
| treino_ok | Boolean | Dados de treino inseridos |
| bola_parada_ok | Boolean | Bolas paradas preparadas |
| individual_ok | Boolean | Individuais preenchidos |

---

### 6. ModeloJogo
Biblioteca de principios taticos.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| fase | String | Fase do jogo (ataque, defesa, transicao) |
| principio | String | Principio tatico |
| sub_principio | String | Sub-principio |
| descricao | Text | Descricao detalhada |
| video_ref | String | Link de video referencia |

---

### 7. Analista
Membros da equipe de analise.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| nome | String | Nome do analista |
| funcao | String | Funcao na equipe |
| qualidade | Numeric(3,1) | Nota media de qualidade (0-10) |
| entregas_pendentes | Integer | Contagem de entregas pendentes |

**Relacionamentos:**
- `entregas` -> EntregaSoutto (1:N, CASCADE)

---

### 8. EntregaSoutto
Tarefas atribuidas aos analistas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| analista_id | Integer (FK) | Analista responsavel |
| tipo | String | Tipo de entrega |
| descricao | String | Descricao da tarefa |
| data_limite | Date | Prazo de entrega |
| status | String | pendente, concluida, atrasada |

---

### 9. Protocolo
Templates de procedimentos padrao.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| titulo | String | Titulo do protocolo |
| categoria | String | Categoria |
| descricao | Text | Descricao completa |
| status | String | ativo, inativo |

---

### 10. ProximoAdversario
Ficha do proximo adversario a ser enfrentado.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| adversario | String | Nome do time |
| competicao | String | Competicao |
| rodada | Integer | Rodada |
| data | Date | Data do jogo |
| progresso_pct | Integer | Progresso da analise (%) |
| analise_tatica | Text | Resumo tatico |
| jogadores_chave | Text | Jogadores destaque |
| pontos_fortes | Text | Pontos fortes identificados |
| pontos_fracos | Text | Vulnerabilidades |

---

### 11-14. Modelos de Adversario (Wyscout Import)

**AdversarioRelatorio** - Container principal do relatorio importado

| Campo | Tipo | Descricao |
|-------|------|-----------|
| equipe | String (NOT NULL) | Nome da equipe analisada |
| jogos_analisados | Integer | Quantidade de jogos no relatorio |
| remates_total | Integer | Total de finalizacoes |
| remates_no_alvo | Integer | Finalizacoes no gol |
| xg_total | Float | xG acumulado |
| gols_total | Integer | Gols marcados |
| fonte | String | Fonte dos dados (Wyscout) |

**AdversarioJogador** - Perfil individual (60+ campos estatisticos)

**AdversarioFormacao** - Eficacia por sistema tatico (4-3-3, 4-4-2, etc.)

**AdversarioResultado** - Historico de resultados recentes

## Endpoints da API

### Atletas

```
GET    /api/atletas                    # Listar (filtros: status, posicao, categoria, search)
POST   /api/atletas                    # Criar jogador
GET    /api/atletas/{id}               # Perfil completo
GET    /api/atletas/{id}/desempenhos   # Desempenhos recentes
GET    /api/atletas/{id}/evolucao      # Historico de evolucao
GET    /api/atletas/{id}/videos        # Videos vinculados
```

### Partidas

```
GET    /api/partidas                   # Listar partidas
POST   /api/partidas                   # Registrar partida
GET    /api/partidas/{id}/desempenhos  # Desempenho coletivo da partida
```

### Videos

```
GET    /api/videos                     # Listar (filtros: tipo, plataforma, search)
POST   /api/videos                     # Adicionar video
```

### Desempenho e Evolucao

```
POST   /api/desempenhos                # Registrar desempenho individual
POST   /api/evolucoes                  # Registrar avaliacao periodica
```

### Analistas e Tarefas

```
GET    /api/analistas                  # Listar analistas ativos
GET    /api/analistas/{id}/dashboard   # Dashboard de produtividade
GET    /api/tarefas                    # Listar (filtros: status, analista, tipo)
GET    /api/tarefas/atrasadas          # Tarefas atrasadas
POST   /api/tarefas                    # Criar tarefa
PATCH  /api/tarefas/{id}              # Atualizar (status, notas, qualidade)
```

### Dashboard

```
GET    /api/dashboard                  # KPIs departamentais agregados
```

### Adversario (Import Wyscout)

```
POST   /api/adversario/importar        # Importar relatorio do parser
GET    /api/adversario/{equipe}         # Consultar analise de adversario
```

## Wyscout Parser

**Arquivo:** `wyscout_adversario_parser.py` (~615 linhas)

### Uso

```bash
# Gerar JSON
python wyscout_adversario_parser.py "Fortaleza EC.pdf"

# Gerar XLSX
python wyscout_adversario_parser.py "Fortaleza EC.pdf" --output xlsx

# Enviar direto para API
python wyscout_adversario_parser.py "Fortaleza EC.pdf" --post http://localhost:8000
```

### Como modulo Python

```python
from wyscout_adversario_parser import parse_wyscout_team_report

relatorio = parse_wyscout_team_report("Fortaleza EC.pdf")
# relatorio contém: equipe, jogadores, formacoes, transicoes, resultados
```

### Dados Extraidos

| Secao | Campos | Descricao |
|-------|--------|-----------|
| Jogadores | 82 campos | Perfil completo com metricas ofensivas, defensivas, passes, etc. |
| Formacoes | 16 campos | KPIs por sistema tatico (xG, posse, PPDA, intensidade) |
| Transicoes | 7 campos | Eventos de recuperacao/perda/falta por jogador |
| Resultados | 6 campos | Historico de partidas recentes |
| Relatorio | 8 campos | Agregados gerais (remates, xG, gols) |

### Formatos de Saida

| Formato | Flag | Descricao |
|---------|------|-----------|
| JSON | (padrao) | Dicionario com todas as secoes |
| XLSX | `--output xlsx` | Excel com abas separadas por secao |
| HTTP POST | `--post URL` | Envia JSON para o endpoint da API |
