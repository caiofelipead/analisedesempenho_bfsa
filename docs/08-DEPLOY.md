# 08 - Deploy e Configuracao

## Pre-requisitos

| Ferramenta | Versao Minima | Uso |
|-----------|---------------|-----|
| Node.js | 18+ | Frontend React |
| npm | 9+ | Gerenciador de pacotes |
| Python | 3.10+ | Backend API |
| PostgreSQL | 14+ | Banco de dados |
| Git | 2.30+ | Controle de versao |

---

## 1. Setup do Frontend

### Instalacao

```bash
# Clonar repositorio
git clone https://github.com/caiofelipead/analisedesempenho_bfsa.git
cd analisedesempenho_bfsa

# Instalar dependencias
npm install
```

### Variaveis de Ambiente

```bash
cp .env.example .env
```

Editar `.env`:
```env
# Supabase (obrigatorio para funcionalidades colaborativas)
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# API de Planilhas (opcional - usa export publico como fallback)
REACT_APP_SHEETS_API_URL=http://localhost:8000

# Google Sheets (para Vercel serverless proxy)
GOOGLE_SPREADSHEET_ID=1234567890abcdef
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Desenvolvimento Local

```bash
npm start
# Abre em http://localhost:3000
```

### Build de Producao

```bash
npm run build
# Gera pasta build/ com arquivos otimizados
```

---

## 2. Setup do Backend

### Instalacao

```bash
# Criar ambiente virtual (recomendado)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt
```

### Configuracao do Banco

Editar `DATABASE_URL` em `backend_api.py`:
```python
DATABASE_URL = "postgresql://usuario:senha@host:5432/bfsa_performance"
```

### Iniciar Servidor

```bash
# Desenvolvimento (com auto-reload)
python backend_api.py

# Producao
uvicorn backend_api:app --host 0.0.0.0 --port 8000
```

O servidor cria as tabelas automaticamente na primeira execucao via `Base.metadata.create_all()`.

---

## 3. Setup do Banco de Dados

### PostgreSQL

```bash
# Criar banco de dados
psql -U postgres -c "CREATE DATABASE bfsa_performance;"
psql -U postgres -c "CREATE USER bfsa WITH PASSWORD 'bfsa';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE bfsa_performance TO bfsa;"

# Executar schemas
psql -U bfsa -d bfsa_performance -f performance_schema.sql
psql -U bfsa -d bfsa_performance -f adversario_schema.sql
```

### Supabase

1. Acessar [supabase.com](https://supabase.com) e criar um projeto
2. Ir em **SQL Editor**
3. Colar e executar o conteudo de `supabase_setup.sql`
4. Ir em **Settings > API** e copiar:
   - Project URL -> `REACT_APP_SUPABASE_URL`
   - anon public key -> `REACT_APP_SUPABASE_ANON_KEY`

---

## 4. Deploy em Producao

### Frontend (Vercel)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variaveis de ambiente no dashboard do Vercel:
# - REACT_APP_SUPABASE_URL
# - REACT_APP_SUPABASE_ANON_KEY
# - GOOGLE_SPREADSHEET_ID
# - GOOGLE_SERVICE_ACCOUNT_JSON
```

A funcao serverless `/api/sheets/[gid].js` e detectada automaticamente pelo Vercel.

### Backend (VPS / Docker)

**Opcao 1: Direto no servidor**
```bash
# No servidor
git clone https://github.com/caiofelipead/analisedesempenho_bfsa.git
cd analisedesempenho_bfsa
pip install -r requirements.txt

# Com systemd ou supervisor
uvicorn backend_api:app --host 0.0.0.0 --port 8000
```

**Opcao 2: Docker (exemplo)**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend_api.py .
EXPOSE 8000
CMD ["uvicorn", "backend_api:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 5. Google Service Account

### Passo a Passo

1. Acessar [Google Cloud Console](https://console.cloud.google.com)
2. Criar um projeto (ou selecionar existente)
3. Habilitar **Google Sheets API**
4. Ir em **IAM & Admin > Service Accounts**
5. Criar Service Account
6. Gerar chave JSON (Actions > Manage Keys > Add Key)
7. Download do arquivo JSON
8. Compartilhar a planilha Google com o email do Service Account (ex: `bfsa@projeto.iam.gserviceaccount.com`)
9. Configurar no ambiente:

```env
# Inline (Vercel)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"bfsa","private_key_id":"..."}

# Ou arquivo local
GOOGLE_SERVICE_ACCOUNT_FILE=./service-account.json
```

---

## 6. Checklist de Deploy

### Frontend
- [ ] `npm install` executado sem erros
- [ ] `.env` configurado com URLs do Supabase
- [ ] `npm run build` gera a pasta `build/` sem erros
- [ ] Vercel configurado com variaveis de ambiente
- [ ] Serverless function `/api/sheets/[gid]` respondendo

### Backend
- [ ] Python 3.10+ instalado
- [ ] `pip install -r requirements.txt` sem erros
- [ ] PostgreSQL rodando e acessivel
- [ ] `DATABASE_URL` configurada corretamente
- [ ] Servidor inicia sem erros (`python backend_api.py`)
- [ ] Tabelas criadas automaticamente

### Banco de Dados
- [ ] PostgreSQL criado com schemas executados
- [ ] Supabase projeto criado com tabelas e RLS
- [ ] Conexao testada (psql + frontend)

### Integracoes
- [ ] Google Service Account criado e configurado
- [ ] Planilha compartilhada com o Service Account
- [ ] Proxy retornando CSV corretamente

---

## 7. Troubleshooting

### Erro: "Failed to fetch" no dashboard
- Verificar se a planilha Google esta compartilhada com o Service Account
- Verificar se `GOOGLE_SPREADSHEET_ID` esta correto
- Testar acesso publico da planilha via URL de export

### Erro: "supabase is null"
- Verificar se `REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_ANON_KEY` estao no `.env`
- Reiniciar o servidor de desenvolvimento (`npm start`)
- Variaveis `REACT_APP_*` precisam de restart para serem lidas

### Erro: "connection refused" no backend
- Verificar se PostgreSQL esta rodando: `pg_isready`
- Verificar `DATABASE_URL` em `backend_api.py`
- Verificar credenciais do banco (usuario/senha)

### Build falha com erros de lint
- O build usa `DISABLE_ESLINT_PLUGIN=true` para ignorar warnings
- Se mesmo assim falhar, verificar erros de sintaxe no codigo

### Parser Wyscout nao extrai dados
- Verificar se o PDF e um relatorio de equipe do Wyscout (nao individual)
- Testar com `pdfplumber` isolado: `python -c "import pdfplumber; print(pdfplumber.open('arquivo.pdf').pages[0].extract_text()[:200])"`
- Verificar se o formato do PDF nao mudou (Wyscout atualiza layouts periodicamente)
