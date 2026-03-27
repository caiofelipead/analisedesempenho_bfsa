# 03 - Frontend

## Visao Geral

O frontend e uma Single Page Application (SPA) React, construida com Create React App. O componente principal `PantherPerformance.jsx` (~2857 linhas) contem todos os 12 modulos do dashboard.

## Arquivos do Frontend

| Arquivo | Linhas | Funcao |
|---------|--------|--------|
| `src/PantherPerformance.jsx` | ~2857 | Dashboard completo com 12 paginas |
| `src/App.js` | 4 | Wrapper que renderiza `<PantherPerformance />` |
| `src/index.js` | 5 | Mount do ReactDOM no `#root` |
| `src/supabaseClient.js` | ~15 | Instancia do cliente Supabase |
| `src/useTarefas.js` | ~80 | Hook de gerenciamento de tarefas |
| `src/useAdvChecklist.js` | ~60 | Hook de checklist do adversario |
| `src/useAdvLinks.js` | ~50 | Hook de links de video |
| `src/useIndicacoes.js` | ~90 | Hook de indicacoes de jogadores |

## Sistema de Design

### Paleta de Cores (Tema Escuro)

```javascript
const C = {
  bg:      "#090b0f",   // Fundo principal
  bgCard:  "#12151c",   // Fundo de cards
  border:  "#2a2d35",   // Bordas
  text:    "#e8e6e1",   // Texto principal
  textDim: "#a8a6a1",   // Texto secundario
  textMid: "#7a8a99",   // Texto terciario
  gold:    "#c9a227",   // Accent primario (identidade Panther)
  purple:  "#9370DB",   // Accent secundario
  green:   "#2ecc71",   // Sucesso
  yellow:  "#f39c12",   // Aviso
  blue:    "#3498db",   // Informacao
  red:     "#e74c3c",   // Erro
};
```

### Componentes Reutilizaveis

| Componente | Props | Descricao |
|-----------|-------|-----------|
| `Card` | `children, style` | Container com borda e padding |
| `Badge` | `text, bg, color` | Label colorido dinamico |
| `SH` (SectionHeader) | `title, count?` | Titulo de secao com contador opcional |
| `ProgressBar` | `pct, color` | Barra de progresso horizontal |
| `Escudo` | `src, size` | Escudo de time com fallback para icone |
| `ResBadge` | `resultado` | Badge de Vitoria/Empate/Derrota |
| `CompLogo` | `competicao` | Badge da competicao |
| `VideoRow` | `video` | Card de video com titulo, duracao e tipo |

### Graficos (Recharts)

| Tipo | Uso | Dados |
|------|-----|-------|
| `BarChart` | Estatisticas de partidas, bolas paradas, desempenho | Categorico |
| `RadarChart` | Perfil de habilidades do atleta (8 dimensoes) | Multi-eixo |
| `AreaChart` | Evolucao temporal do jogador | Serie temporal |

**Dimensoes do Radar Chart:**
1. Tecnica
2. Tatica
3. Fisica
4. Mental
5. Ofensiva
6. Defensiva
7. Posse
8. Transicao

## Paginas / Modulos

### 1. DASHBOARD
- **KPIs**: total de atletas, partidas, videos, tarefas pendentes
- **Resultados recentes**: ultimas 5 partidas com badges
- **Top performers**: ranking por nota media
- **Tarefas atrasadas**: painel com contagem e responsaveis

### 2. ELENCO (Jogadores)
- **Grid de jogadores**: cards com foto, posicao, numero e nota
- **Filtros**: posicao, status, busca por nome
- **Detalhe do jogador**: modal com:
  - Radar chart de habilidades
  - Historico de notas
  - Ultimas partidas
  - Videos vinculados
  - Tendencia (melhora/estavel/piora)

### 3. PARTIDAS
- **Lista cronologica**: cada partida com escudo adversario, resultado, competicao
- **Badge de resultado**: verde (V), amarelo (E), vermelho (D)
- **Contadores**: videos disponiveis, dados coletivos preenchidos
- **Detalhe**: estatisticas coletivas (posse, passes, remates, xG, PPDA)

### 4. VIDEOS
- **Filtros**: tipo (coletivo, individual, adversario, bola parada), plataforma, busca
- **Deteccao de plataforma**: icone automatico baseado na URL
  - YouTube: `youtube.com` ou `youtu.be`
  - Google Drive: `drive.google.com`
  - Wyscout: `wyscout.com`
  - InStat: `instatscout.com`
- **Card de video**: titulo, duracao, tipo, atleta vinculado, link externo

### 5. ANALISTAS
- **Scorecards individuais**:
  - Taxa de conclusao (%)
  - Entregas no prazo vs atrasadas
  - Media de qualidade (0-10)
  - Volume de entregas no periodo
- **Ranking comparativo**: chart horizontal com metricas

### 6. TAREFAS
- **Lista com filtros**: status, analista, prioridade, tipo
- **Estados**: pendente, em andamento, concluida, atrasada
- **Criacao inline**: formulario rapido com atribuicao
- **Sincronizacao**: Supabase realtime com fallback localStorage

### 7. ADVERSARIO
- **Analise pre-jogo**: informacoes taticas do proximo adversario
- **Checklist de preparacao**: itens fixos + customizaveis com toggle
- **Links de video**: vinculacao de videos por tarefa
- **Indicadores**: jogadores-chave, pontos fortes/fracos
- **Importacao Wyscout**: dados do parser integrados

### 8. BOLAS PARADAS
- **Playbook**: 17 jogadas pre-configuradas
  - Escanteios (ofensivos/defensivos)
  - Faltas laterais
  - Faltas frontais
  - Laterais (arremessos)
- **Clips de video**: compilacao por tipo de jogada
- **Estatisticas**: contagem de gols/oportunidades por tipo

### 9. CALENDARIO
- **Agenda por competicao**: rodadas com data, adversario, local
- **Status de processo**: flags booleanos para cada etapa:
  - Analise do adversario
  - Prelecao tatica
  - Pos-jogo
  - Wyscout OK
  - Treino OK
  - Bola parada OK
  - Individual OK

### 10. CONFIGURACOES
- Gatilhos de sincronizacao manual (Google Sheets)
- Preferencias de exibicao

### 11. DOCUMENTACAO
- Showcase de componentes do sistema
- Referencia de uso interno

### 12. SOBRE
- Informacoes do projeto
- Versao e creditos

## Utilitarios de Parsing

### parseCSV(text)
Parser de CSV robusto que:
1. Detecta automaticamente o delimitador (`,`, `;`, `\t`)
2. Trata campos entre aspas corretamente
3. Identifica a linha de cabecalho automaticamente

### colNorm(s)
Normaliza nomes de colunas:
- Converte para minusculas
- Remove acentos e caracteres especiais
- Remove espacos extras

### findCol(row, ...candidates)
Busca fuzzy de colunas em 3 etapas:
1. Match exato
2. Match normalizado (colNorm)
3. Match por substring

### ptNum(s)
Converte numeros em formato brasileiro:
- `"1.234,56"` -> `1234.56`
- `"1,5"` -> `1.5`
- Trata valores vazios e invalidos

### parseDateBR(dateStr)
Converte datas brasileiras:
- `"25/03/2026"` -> objeto Date

### calculateTendencia(notas)
Calcula tendencia de um atleta baseado nas ultimas notas:
- `"melhora"`: media recente > media anterior
- `"piora"`: media recente < media anterior
- `"estavel"`: diferenca insignificante

## Dependencias

```json
{
  "@supabase/supabase-js": "^2.99.2",
  "googleapis": "^144.0.0",
  "lucide-react": "^0.383.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-scripts": "5.0.1",
  "recharts": "^2.15.3"
}
```

## Scripts NPM

| Comando | Descricao |
|---------|-----------|
| `npm start` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Build de producao (com `DISABLE_ESLINT_PLUGIN=true`) |
| `npm test` | Executa testes (React Scripts) |
