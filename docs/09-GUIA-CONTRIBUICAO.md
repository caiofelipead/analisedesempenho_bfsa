# 09 - Guia de Contribuicao

## Estrutura de Codigo

### Frontend

O frontend esta concentrado em `src/PantherPerformance.jsx`. Ao adicionar funcionalidades:

1. **Novos modulos/paginas**: Adicionar como secao dentro do componente principal, controlado pelo estado `page`
2. **Novos hooks**: Criar arquivo separado em `src/use<Nome>.js` seguindo o padrao dos hooks existentes
3. **Componentes reutilizaveis**: Definir dentro de `PantherPerformance.jsx` junto aos existentes (`Card`, `Badge`, `SH`, etc.)

### Backend

O backend esta em `backend_api.py`. Ao adicionar funcionalidades:

1. **Novos modelos**: Definir classe SQLAlchemy no topo do arquivo, junto aos existentes
2. **Novos endpoints**: Adicionar decorators FastAPI agrupados por dominio
3. **Novos parsers**: Criar arquivo separado (como `wyscout_adversario_parser.py`)

---

## Convencoes de Codigo

### JavaScript/React

- **Estilo**: CSS-in-JS (inline styles) com constantes de cor do objeto `C`
- **Estado**: `useState` + hooks customizados para dados persistentes
- **Nomes**: camelCase para variaveis/funcoes, PascalCase para componentes
- **Imports**: React no topo, depois bibliotecas, depois hooks locais

### Python

- **Framework**: FastAPI com type hints
- **ORM**: SQLAlchemy declarativo (Base.metadata)
- **Nomes**: snake_case para variaveis/funcoes, PascalCase para classes
- **Docstrings**: Em portugues, seguindo o padrao do projeto

### SQL

- **Tabelas**: snake_case, plural (ex: `atletas`, `partidas_coletivas`)
- **Colunas**: snake_case (ex: `gols_pro`, `xG_contra`)
- **Indices**: prefixo `idx_` (ex: `idx_estat_atleta`)
- **Views**: prefixo `vw_` (ex: `vw_adversario_jogadores_chave`)
- **Constraints**: `CHECK` para valores enum, `UNIQUE` para compostas

---

## Paleta de Cores

Ao criar novos componentes visuais, usar sempre as constantes do objeto `C`:

```javascript
// Correto
<div style={{ background: C.bgCard, color: C.text }}>

// Incorreto - nao usar cores hardcoded
<div style={{ background: "#12151c", color: "#e8e6e1" }}>
```

---

## Fluxo de Dados

### Para adicionar uma nova fonte de dados (Google Sheets)

1. Adicionar nova aba na planilha Google
2. Anotar o `gid` da aba (visivel na URL)
3. No frontend, usar `fetchSheet(gid)` para carregar
4. Usar `findCol()` para mapear colunas de forma robusta

### Para adicionar uma nova tabela Supabase

1. Criar tabela no SQL Editor do Supabase
2. Habilitar RLS e criar politicas
3. Criar hook em `src/use<Nome>.js`
4. Seguir o padrao de fallback com localStorage

### Para adicionar um novo endpoint no backend

1. Definir modelo SQLAlchemy (se necessario)
2. Criar endpoint com decorator FastAPI
3. Usar `SessionLocal()` para acesso ao banco
4. Documentar no formato dos endpoints existentes

---

## Adicionar Novo Modulo ao Dashboard

1. Definir constante da pagina:
```javascript
// Em PantherPerformance.jsx
const PAGES = {
  // ... existentes
  NOVO_MODULO: 'novo_modulo',
};
```

2. Adicionar item na sidebar:
```javascript
{ icon: IconComponent, label: 'Novo Modulo', page: PAGES.NOVO_MODULO }
```

3. Adicionar renderizacao condicional:
```javascript
{page === PAGES.NOVO_MODULO && (
  <div>
    <SH title="Novo Modulo" />
    {/* Conteudo aqui */}
  </div>
)}
```

---

## Testes

O projeto atualmente nao possui testes automatizados. Ao contribuir:

- **Frontend**: React Scripts suporta Jest (`npm test`)
- **Backend**: Usar pytest com httpx para testar endpoints FastAPI
- **SQL**: Testar migrations em banco local antes de aplicar em producao

---

## Commits

Mensagens de commit devem ser claras e em portugues ou ingles:

```
feat: adicionar modulo de treinos ao dashboard
fix: corrigir parsing de datas no formato BR
refactor: extrair hook useCalendario
docs: atualizar documentacao do backend
```

---

## Seguranca

- **Nunca** commitar arquivos `.env` ou `service-account.json`
- Verificar que `.gitignore` inclui credenciais antes de commitar
- Ao adicionar novas variaveis de ambiente, atualizar `.env.example`
- Ao criar tabelas Supabase, revisar politicas RLS

---

## Roadmap (Funcionalidades Planejadas)

1. Sistema de autenticacao (Supabase Auth)
2. Modulo de treinos com metricas fisicas
3. Notificacoes push para tarefas atrasadas
4. Exportacao de relatorios em PDF
5. Dashboard mobile responsivo
6. Integracao com API do InStat
7. Cache inteligente com Service Worker
8. Testes automatizados (Jest + pytest)
9. Modularizacao do componente principal (code splitting)
10. Historico de alteracoes (audit log)
