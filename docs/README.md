# Panther Performance - Documentacao do Projeto

Sistema integrado de analise de desempenho do Botafogo de Futebol S/A (BFSA).

## Indice da Documentacao

| Documento | Descricao |
|-----------|-----------|
| [01 - Visao Geral](./01-VISAO-GERAL.md) | Objetivo, escopo, funcionalidades principais e stack tecnologico |
| [02 - Arquitetura](./02-ARQUITETURA.md) | Fluxo de dados, camadas do sistema e padroes de projeto |
| [03 - Frontend](./03-FRONTEND.md) | Componentes React, paginas, sistema de design e utilitarios |
| [04 - Backend API](./04-BACKEND-API.md) | Endpoints FastAPI, modelos ORM e configuracao do servidor |
| [05 - Banco de Dados](./05-BANCO-DE-DADOS.md) | Schemas PostgreSQL, tabelas Supabase, views e indices |
| [06 - Hooks e Estado](./06-HOOKS-E-ESTADO.md) | Custom hooks React, gerenciamento de estado e sincronizacao |
| [07 - Integracoes](./07-INTEGRACOES.md) | Google Sheets, Supabase, Wyscout parser e Vercel serverless |
| [08 - Deploy e Configuracao](./08-DEPLOY.md) | Instalacao, variaveis de ambiente, deploy frontend/backend |
| [09 - Guia de Contribuicao](./09-GUIA-CONTRIBUICAO.md) | Padroes de codigo, fluxo de trabalho e convencoes |
| [10 - Analise Tecnica](./10-ANALISE-TECNICA.md) | Dividas tecnicas, problemas criticos e plano de melhorias |

## Estrutura do Repositorio

```
analisedesempenho_bfsa/
├── src/                          # Frontend React
│   ├── PantherPerformance.jsx    # Dashboard principal (12 modulos)
│   ├── App.js                    # Wrapper de entrada
│   ├── index.js                  # Mount ReactDOM
│   ├── supabaseClient.js         # Configuracao Supabase
│   ├── useTarefas.js             # Hook de tarefas
│   ├── useAdvChecklist.js        # Hook checklist adversario
│   ├── useAdvLinks.js            # Hook links de video
│   └── useIndicacoes.js          # Hook indicacoes de jogadores
├── api/sheets/                   # Vercel serverless function
│   └── [gid].js                  # Proxy Google Sheets
├── public/                       # Assets estaticos
├── backend_api.py                # API FastAPI (Python)
├── wyscout_adversario_parser.py  # Parser de PDFs Wyscout
├── performance_schema.sql        # Schema principal PostgreSQL
├── adversario_schema.sql         # Schema analise de adversarios
├── supabase_setup.sql            # Tabelas Supabase com RLS
├── requirements.txt              # Dependencias Python
├── package.json                  # Dependencias Node.js
├── .env.example                  # Template de variaveis de ambiente
└── docs/                         # Esta documentacao
```

## Inicio Rapido

```bash
# 1. Instalar dependencias do frontend
npm install

# 2. Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 3. Iniciar o frontend
npm start

# 4. (Opcional) Iniciar o backend
pip install -r requirements.txt
python backend_api.py
```

Para instrucoes detalhadas, consulte [08 - Deploy e Configuracao](./08-DEPLOY.md).
