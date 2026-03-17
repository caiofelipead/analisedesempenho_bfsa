# Panther Performance Analytics — Documento de Arquitetura

**Versão:** 1.0
**Data:** 17/03/2026
**Responsável:** Caio Felipe — Head Scout, Dept. Análise de Desempenho
**Clube:** Botafogo de Ribeirão Preto (BFSA)

---

## 1. Visão Geral

Sistema integrado de análise de desempenho que centraliza: vídeos de atletas/jogos/treinos, dados de performance por jogo (técnicos, táticos, físicos), evolução individual dos atletas, e monitoramento de produtividade dos analistas.

**Stack:**
- Frontend: React + Recharts + Tailwind/CSS-in-JS
- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Infraestrutura: Docker (opcional), deploy local ou VPS

## 2. Arquitetura de Sistema

```
┌──────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │Dashboard │ │ Atletas  │ │  Vídeos  │ │ Analistas  │  │
│  │          │ │+ Fichas  │ │Biblioteca│ │ Cobrança   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       └─────────────┴────────────┴─────────────┘         │
│                         │ HTTP/REST                       │
└─────────────────────────┼────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────┐
│                    FASTAPI BACKEND                        │
│  ┌──────────────────────┴──────────────────────────────┐ │
│  │               API Router Layer                       │ │
│  │  /api/atletas  /api/partidas  /api/videos           │ │
│  │  /api/desempenhos  /api/analistas  /api/tarefas     │ │
│  │  /api/evolucoes  /api/treinos  /api/dashboard       │ │
│  └──────────────────────┬──────────────────────────────┘ │
│  ┌──────────────────────┴──────────────────────────────┐ │
│  │           SQLAlchemy ORM + Connection Pool           │ │
│  └──────────────────────┬──────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────┐
│                    POSTGRESQL                             │
│  ┌───────────┐ ┌───────────────┐ ┌────────────────────┐ │
│  │  atletas   │ │desempenho_    │ │ tarefas_analista   │ │
│  │  partidas  │ │  partida      │ │ analistas          │ │
│  │  treinos   │ │desempenho_    │ │ evolucao_atleta    │ │
│  │  videos    │ │  treino       │ │ log_atividades     │ │
│  └───────────┘ └───────────────┘ └────────────────────┘ │
│                                                           │
│  VIEWS: vw_performance_recente | vw_dashboard_analistas  │
│         vw_tarefas_atrasadas                              │
└──────────────────────────────────────────────────────────┘
```

## 3. Modelagem de Dados

### 3.1 Tabelas Core

| Tabela | Propósito | Relações |
|--------|-----------|----------|
| `atletas` | Cadastro completo dos jogadores | → desempenho_partida, evolucao_atleta, videos |
| `partidas` | Jogos da equipe com metadata | → desempenho_partida, videos |
| `sessoes_treino` | Sessões de treinamento | → desempenho_treino, videos |
| `videos` | Biblioteca multi-plataforma | → atletas, partidas, treinos |

### 3.2 Tabelas de Performance

| Tabela | Propósito |
|--------|-----------|
| `desempenho_partida` | Dados individuais por jogo: 13 stats técnicos, 5 táticos, 6 físicos, xG/xA |
| `desempenho_treino` | Notas e dados físicos por sessão de treino |
| `evolucao_atleta` | Avaliação periódica em 13 dimensões (técnica, tática, física, mental) |

### 3.3 Tabelas de Gestão

| Tabela | Propósito |
|--------|-----------|
| `analistas` | Cadastro da equipe de análise |
| `tarefas_analista` | Assignments com prazo, prioridade, status, nota de qualidade |
| `log_atividades` | Auditoria de todas ações no sistema |

### 3.4 Views Analíticas

- **vw_performance_recente**: Média dos últimos 60 dias por atleta
- **vw_dashboard_analistas**: Produtividade mensal (taxa conclusão, qualidade, atrasos)
- **vw_tarefas_atrasadas**: Lista detalhada para cobrança direta

## 4. Módulos do Frontend

### 4.1 Dashboard
- KPIs: atletas ativos, jogos, vídeos, tarefas atrasadas
- Gráfico de resultados recentes
- Top 5 performers por nota média
- Painel de cobrança (tarefas atrasadas em destaque)

### 4.2 Atletas
- Grid com cards: posição, nota média, tendência, status
- Filtro por posição + busca por nome
- **Ficha Individual (detalhe)**:
  - Header com dados do atleta + nota geral
  - Radar chart (perfil técnico em 8 dimensões)
  - Gráfico de evolução temporal (técnica/tática/física)
  - Tabela de performance por jogo (nota, gols, assists, passes, km, sprints)
  - Vídeos associados ao atleta

### 4.3 Partidas
- Lista cronológica com resultado, placar, competição, formação
- Contagem de vídeos associados
- Drill-down para desempenhos individuais da partida

### 4.4 Vídeos
- Biblioteca com filtro por tipo (jogo completo, individual, tática, treino, compilação, bola parada)
- Filtro por plataforma (YouTube, Drive, Wyscout, InStat)
- Busca por título
- Cards com thumbnail, duração, badges de plataforma

### 4.5 Analistas (Monitoramento + Cobrança)
- Card por analista: taxa de conclusão (barra visual), concluídas/total, atrasadas, nota de qualidade, tempo médio
- Seção destacada "Tarefas Atrasadas — Ação Necessária" com dias de atraso por tarefa
- Badge visual de atrasos no menu lateral

## 5. API Endpoints

### Atletas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/atletas` | Lista com filtros (status, posição, categoria, search) |
| POST | `/api/atletas` | Cadastro |
| GET | `/api/atletas/{id}` | Ficha completa |
| GET | `/api/atletas/{id}/desempenhos` | Últimos desempenhos |
| GET | `/api/atletas/{id}/evolucao` | Histórico de evolução |
| GET | `/api/atletas/{id}/videos` | Vídeos do atleta |

### Partidas e Treinos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/partidas` | CRUD partidas |
| GET | `/api/partidas/{id}/desempenhos` | Performance da equipe no jogo |
| GET | `/api/treinos` | Lista treinos |

### Vídeos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/videos` | Lista com filtros (tipo, plataforma, search) |
| POST | `/api/videos` | Upload de link |

### Desempenho e Evolução
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/desempenhos` | Registra performance por jogo |
| POST | `/api/evolucoes` | Registra avaliação periódica |

### Analistas e Tarefas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/analistas` | Lista analistas ativos |
| GET | `/api/analistas/{id}/dashboard` | Dashboard de produtividade |
| GET | `/api/tarefas` | Lista com filtros |
| GET | `/api/tarefas/atrasadas` | **Endpoint de cobrança** |
| POST | `/api/tarefas` | Criar tarefa |
| PATCH | `/api/tarefas/{id}` | Atualizar status/nota/feedback |

### Dashboard
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard` | Números gerais do departamento |

## 6. Fluxo de Trabalho (Workflow do Departamento)

```
PÓS-JOGO (D+0 a D+2):
  1. Head Scout cria tarefas no sistema (análise jogo, vídeos, dados físicos)
  2. Analistas recebem assignments com prazos
  3. Dados de performance são inseridos (manual ou import Wyscout/InStat)
  4. Vídeos são linkados (YouTube, Drive, Wyscout)

SEMANAL:
  5. Analista de dados físicos envia relatório semanal
  6. Compilações de vídeo individuais são geradas
  7. Head Scout revisa tarefas concluídas, atribui nota de qualidade
  8. Dashboard de analistas atualiza automaticamente

MENSAL:
  9. Avaliação de evolução de cada atleta (13 dimensões)
  10. Review de produtividade dos analistas
  11. Relatório consolidado para diretoria

PRÉ-JOGO:
  12. Scout de adversário (tarefa atribuída com prioridade URGENTE)
  13. Análise tática compartilhada com comissão técnica
```

## 7. Integração com Plataformas de Vídeo

| Plataforma | Tipo de Link | Uso |
|------------|-------------|-----|
| YouTube (unlisted) | `youtube.com/watch?v=...` | Compilações, clips públicos internos |
| Google Drive | `drive.google.com/file/d/...` | Jogos completos, treinos filmados |
| Wyscout | Link direto do clip | Análises táticas, clips individuais |
| InStat | Link direto do clip | Análises individuais, highlights |

## 8. Sistema de Cobrança dos Analistas

O módulo de monitoramento implementa accountability em 3 camadas:

1. **Visibilidade**: Dashboard com taxa de conclusão, atrasos e nota de qualidade visível a todos
2. **Alertas automáticos**: Tarefas são auto-marcadas como "atrasada" via trigger no banco quando o prazo é ultrapassado
3. **Feedback loop**: Head Scout avalia cada tarefa concluída (nota 0-10 + feedback textual), alimentando o histórico do analista

Métricas acompanhadas por analista:
- Taxa de conclusão (%)
- Número de tarefas atrasadas
- Média de qualidade
- Tempo médio por tarefa (minutos)

## 9. Setup & Deploy

```bash
# Backend
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic
python backend_api.py

# Frontend (React com Vite)
npm create vite@latest panther-performance -- --template react
cd panther-performance
npm install recharts lucide-react
# Copiar panther_performance.jsx como componente principal
npm run dev

# Banco de dados
psql -U postgres -c "CREATE DATABASE panther_performance;"
psql -U postgres -d panther_performance -f performance_schema.sql
```

## 10. Roadmap Futuro

- [ ] Import automático de dados Wyscout/InStat via API
- [ ] Notificações push para tarefas atrasadas (Telegram/WhatsApp)
- [ ] Módulo de comparação entre atletas (radar overlay)
- [ ] Export de relatórios em PDF para diretoria
- [ ] Integração com módulo de scouting do Scout Pro
- [ ] GPS tracking data import (Catapult/STATSports)
- [ ] Machine learning: predição de lesão baseada em carga de treino
