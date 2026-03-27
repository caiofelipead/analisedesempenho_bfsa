# 01 - Visao Geral

## Sobre o Projeto

O **Panther Performance** e o sistema integrado de analise de desempenho do Botafogo de Futebol S/A (BFSA - Botafogo de Ribeirao Preto). Ele centraliza o monitoramento de atletas, partidas, treinos, videos e produtividade dos analistas em uma unica plataforma.

## Objetivo

Fornecer ao departamento de analise de desempenho uma ferramenta completa para:

1. **Monitorar atletas** - Acompanhar 37+ jogadores em 13 dimensoes de desempenho (tecnica, tatica, fisica, mental)
2. **Analisar partidas** - Agregar dados individuais e coletivos de plataformas como Wyscout e InStat (67+ metricas por jogador)
3. **Gerenciar videos** - Biblioteca multi-plataforma (YouTube, Google Drive, Wyscout, InStat)
4. **Preparar adversarios** - Relatorios de inteligencia pre-jogo com analise tatica e jogadores-chave
5. **Acompanhar analistas** - Monitorar produtividade com notas de qualidade, cumprimento de prazos e volume de entregas
6. **Organizar bolas paradas** - Sistema de playbook com compilacao de videos para escanteios, faltas e laterais

## Funcionalidades Principais

### 12 Modulos do Dashboard

| Modulo | Descricao |
|--------|-----------|
| **Dashboard** | KPIs departamentais, resultados recentes, top performers, tarefas atrasadas |
| **Elenco** | Grid de jogadores com filtros, cards individuais com graficos radar |
| **Partidas** | Lista cronologica com badges de resultado, contagem de videos |
| **Videos** | Biblioteca com filtros multi-criterio (tipo, plataforma, busca textual) |
| **Analistas** | Scorecards de produtividade: taxa de conclusao, atrasos, media de qualidade |
| **Tarefas** | Tracker de atribuicoes com sincronizacao Supabase em tempo real |
| **Adversario** | Analise pre-jogo, checklist de preparacao, indicadores de jogadores |
| **Bolas Paradas** | Playbook, clips de video, estatisticas de jogadas ensaiadas |
| **Calendario** | Agenda de competicoes com acompanhamento de status |
| **Configuracoes** | Gatilhos de sincronizacao, toggles de tema |
| **Documentacao** | Showcase de componentes e referencia interna |
| **Sobre** | Informacoes do projeto e creditos |

### Fluxos de Trabalho

| Periodo | Atividades |
|---------|-----------|
| **Pos-Jogo (D+0 a D+2)** | Entrada de dados, vinculacao de videos, tagueamento de desempenho |
| **Semanal** | Relatorios de dados fisicos, compilacao de videos, revisao de qualidade |
| **Mensal** | Avaliacoes de evolucao dos atletas, dashboard de produtividade dos analistas |
| **Pre-Jogo** | Analise do adversario, preparacao de prelecao tatica |

## Stack Tecnologico

### Frontend
| Tecnologia | Versao | Funcao |
|-----------|--------|--------|
| React | 18.3.1 | Framework UI |
| Recharts | 2.15.3 | Graficos (Bar, Radar, Area) |
| Lucide React | 0.383.0 | Icones |
| Supabase JS | 2.99.2 | Sincronizacao em tempo real |
| React Scripts | 5.0.1 | Build toolchain |

### Backend
| Tecnologia | Versao | Funcao |
|-----------|--------|--------|
| FastAPI | 0.104.0+ | Framework API |
| Uvicorn | 0.24.0+ | Servidor ASGI |
| SQLAlchemy | 2.0.0+ | ORM |
| Pandas | 2.0.0+ | Processamento de dados |
| pdfplumber | - | Parsing de PDFs Wyscout |

### Infraestrutura
| Tecnologia | Funcao |
|-----------|--------|
| PostgreSQL | Banco de dados principal |
| Supabase | Sincronizacao colaborativa em tempo real |
| Vercel | Hospedagem frontend + serverless functions |
| Google Sheets API | Fonte de dados operacionais |

## Metricas do Projeto

| Metrica | Valor |
|---------|-------|
| Linhas de codigo JSX | ~2.857 |
| Linhas de codigo Python | ~2.234 |
| Modulos do dashboard | 12 |
| Metricas por jogador (Wyscout) | 67+ |
| Tabelas no banco de dados | 14+ |
| Hooks customizados | 4 |

## Glossario

| Termo | Significado |
|-------|-------------|
| **BFSA** | Botafogo de Futebol S/A (Ribeirao Preto) |
| **Wyscout** | Plataforma profissional de analise de futebol |
| **InStat** | Plataforma de estatisticas esportivas |
| **xG** | Expected Goals (gols esperados) |
| **xA** | Expected Assists (assistencias esperadas) |
| **PPDA** | Passes Per Defensive Action (pressao) |
| **RLS** | Row Level Security (politica de acesso Supabase) |
| **D+0** | Dia do jogo |
| **Prelecao** | Reuniao tatica pre-jogo |
| **Bola parada** | Jogada ensaiada (escanteio, falta, lateral) |
