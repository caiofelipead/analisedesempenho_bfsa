# 06 - Hooks e Gerenciamento de Estado

## Visao Geral

O frontend utiliza 4 hooks customizados para gerenciar estado compartilhado com o Supabase. Todos seguem o mesmo padrao:

1. Estado local via `useState`
2. Fetch inicial do Supabase
3. Operacoes CRUD com updates otimistas
4. Fallback automatico para `localStorage` quando Supabase indisponivel

---

## useTarefas

**Arquivo:** `src/useTarefas.js`
**Tabela Supabase:** `tarefas`

### Proposito
Gerenciamento completo de tarefas atribuidas aos analistas.

### Interface

```javascript
const { tarefas, loading, addTarefa, updateTarefa, removeTarefa, refresh } = useTarefas();
```

### Estado

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `tarefas` | Array | Lista de objetos tarefa |
| `loading` | Boolean | Indica se esta carregando |

### Metodos

#### `addTarefa(tarefa)`
Adiciona uma nova tarefa.

```javascript
addTarefa({
  titulo: "Compilar videos do jogo",
  analista: "Carlos",
  prazo: "2026-03-28",
  prio: "alta",
  tipo: "video",
  status: "pendente"
});
```

**Fluxo:**
1. Adiciona ao estado local (otimista)
2. Insere no Supabase async
3. Se falha, salva em localStorage

#### `updateTarefa(id, updates)`
Atualiza campos de uma tarefa existente.

```javascript
updateTarefa(42, { status: "concluida" });
```

#### `removeTarefa(id)`
Remove uma tarefa.

```javascript
removeTarefa(42);
```

#### `refresh()`
Forca refetch do Supabase.

### Estrutura do Objeto Tarefa

```javascript
{
  id: 42,
  titulo: "Compilar videos do jogo",
  analista: "Carlos",
  prazo: "2026-03-28",
  prio: "alta",         // alta | media | baixa
  tipo: "video",
  status: "pendente",   // pendente | em_andamento | concluida | atrasada
  created_at: "2026-03-25T10:00:00Z"
}
```

---

## useAdvChecklist

**Arquivo:** `src/useAdvChecklist.js`
**Tabela Supabase:** `adv_checklist`

### Proposito
Checklist de preparacao para analise do adversario. Inclui itens fixos (nao removiveis) e customizaveis.

### Interface

```javascript
const { checklist, loading, updateChecklist, refresh } = useAdvChecklist();
```

### Estado

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `checklist` | Array | Lista de itens do checklist |
| `loading` | Boolean | Indica se esta carregando |

### Metodos

#### `updateChecklist(items)`
Substitui todo o checklist e sincroniza com Supabase.

```javascript
updateChecklist([
  { id: 1, label: "Assistir ultimos 3 jogos", done: true, fixed: true },
  { id: 2, label: "Identificar jogadores-chave", done: false, fixed: true },
  { id: 3, label: "Verificar bolas paradas", done: false, fixed: false }
]);
```

**Fluxo de sincronizacao:**
1. Atualiza estado local
2. Deleta todos os registros existentes no Supabase
3. Insere os novos itens com posicao sequencial
4. Operacao atomica (delete + insert)

### Estrutura do Item

```javascript
{
  id: 1,
  label: "Assistir ultimos 3 jogos",
  done: false,       // Checkbox marcado?
  fixed: true,       // Item fixo (nao pode ser removido)
  position: 0        // Ordem de exibicao
}
```

---

## useAdvLinks

**Arquivo:** `src/useAdvLinks.js`
**Tabela Supabase:** `adv_links`

### Proposito
Armazenar links de video associados a cada tarefa de analise de adversario.

### Interface

```javascript
const { links, loading, updateLinks, refresh } = useAdvLinks();
```

### Estado

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `links` | Object | Mapa chave-valor `{ match_key: url }` |
| `loading` | Boolean | Indica se esta carregando |

### Metodos

#### `updateLinks(newLinks)`
Substitui todos os links e sincroniza.

```javascript
updateLinks({
  "Fortaleza_Paulistao_21_03": "https://youtube.com/watch?v=abc123",
  "Palmeiras_Brasileiro_05_04": "https://drive.google.com/file/xyz"
});
```

**Fluxo:**
1. Atualiza estado local
2. Filtra valores vazios
3. Deleta registros existentes no Supabase
4. Insere novos registros

### Formato da Chave (match_key)

```
{Adversario}_{Competicao}_{Dia}_{Mes}
```

Exemplo: `"Fortaleza_Paulistao_21_03"` = jogo contra Fortaleza pelo Paulistao em 21/03

---

## useIndicacoes

**Arquivo:** `src/useIndicacoes.js`
**Tabela Supabase:** `indicacoes`

### Proposito
Gerenciamento de indicacoes de jogadores para contratacao (scouting).

### Interface

```javascript
const {
  indicacoes, loading,
  addIndicacao, updateIndicacao, removeIndicacao,
  refresh
} = useIndicacoes();
```

### Metodos

#### `addIndicacao(indicacao)`
Registra uma nova indicacao de jogador.

```javascript
addIndicacao({
  nome: "Jogador Exemplo",
  posicao: "MEI",
  idade: 22,
  clube_atual: "Clube X",
  link: "https://wyscout.com/player/12345",
  foto_url: "https://...",
  escudo_url: "https://...",
  observacao: "Bom passe longo, visao de jogo",
  indicado_por: "Carlos",
  status: "novo",
  prioridade: "alta"
});
```

#### `updateIndicacao(id, updates)`
Atualiza status ou dados de uma indicacao.

```javascript
updateIndicacao(7, { status: "analisado", observacao: "Aprovado na analise tecnica" });
```

#### `removeIndicacao(id)`
Remove uma indicacao.

### Estrutura do Objeto

```javascript
{
  id: 7,
  nome: "Jogador Exemplo",
  posicao: "MEI",
  idade: 22,
  clube_atual: "Clube X",
  link: "https://wyscout.com/player/12345",
  foto_url: "https://...",
  escudo_url: "https://...",
  observacao: "Bom passe longo",
  indicado_por: "Carlos",
  status: "novo",          // novo | analisado | contratado
  prioridade: "alta",      // baixa | media | alta
  created_at: "2026-03-25T10:00:00Z"
}
```

---

## Padrao de Fallback (localStorage)

Todos os hooks implementam o mesmo padrao de fallback:

```javascript
// Pseudocodigo do padrao
async function fetchData() {
  try {
    const { data, error } = await supabase.from('tabela').select('*');
    if (error) throw error;
    setData(data);
    localStorage.setItem('tabela', JSON.stringify(data));  // Cache local
  } catch (err) {
    // Fallback: carregar do cache
    const cached = localStorage.getItem('tabela');
    if (cached) setData(JSON.parse(cached));
  }
}
```

### Hierarquia de Prioridade

```
1. Supabase (fonte primaria, realtime)
   └── Sucesso: atualiza estado + cache local
   └── Falha:
       2. localStorage (cache offline)
          └── Sucesso: usa dados em cache
          └── Falha:
              3. Estado vazio (array/objeto vazio)
```

---

## Configuracao do Cliente Supabase

**Arquivo:** `src/supabaseClient.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = (url && key) ? createClient(url, key) : null;
```

**Comportamento quando `supabase` e `null`:**
- Hooks detectam e usam localStorage diretamente
- Nenhum erro e lancado
- Funcionalidade completa em modo offline
