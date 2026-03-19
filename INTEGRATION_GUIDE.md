# Integração: Módulo Adversário — analisedesempenho_bfsa

## Arquivos deste pacote

| Arquivo | Destino no projeto | O que faz |
|---|---|---|
| `wyscout_adversario_parser.py` | raiz do projeto | Parser de PDF Wyscout → dados estruturados |
| `adversario_schema.sql` | rodar no Supabase | 5 tabelas + 2 views + trigger |
| `backend_api_adversario_patch.py` | integrar no `backend_api.py` | 5 ORM models + schemas + 6 endpoints |

## Passo a passo para Claude Code

### 1. Copiar o parser para a raiz do projeto
```bash
cp wyscout_adversario_parser.py /caminho/para/analisedesempenho_bfsa/
```

### 2. Rodar o schema SQL no Supabase
```bash
psql $DATABASE_URL -f adversario_schema.sql
```
Ou colar no SQL Editor do Supabase Dashboard.

### 3. Integrar o patch no backend_api.py

O arquivo `backend_api_adversario_patch.py` contém código que deve ser inserido no `backend_api.py` existente:

- **ORM Models** (`AdversarioRelatorio`, `AdversarioResultado`, `AdversarioJogador`, `AdversarioFormacao`, `AdversarioTransicao`) → colar após a classe `ProximoAdversario` (linha ~275)
- **Pydantic Schemas** (`AdvRelatorioImportSchema`, etc.) → colar após `ProximoAdversarioOut` (linha ~420)
- **Endpoints** (`/api/adversario/*`) → colar antes da seção `# RUN` (antes de `if __name__ == "__main__":`)

### 4. Adicionar dependência pdfplumber
```
pip install pdfplumber
```
Ou adicionar ao requirements.txt.

### 5. Testar
```bash
# Parser standalone
python wyscout_adversario_parser.py "Fortaleza EC.pdf" --output json

# Via API
python wyscout_adversario_parser.py "Fortaleza EC.pdf" --post http://localhost:8000

# Upload direto
curl -X POST http://localhost:8000/api/adversario/importar-pdf \
  -F "file=@Fortaleza EC.pdf"

# Consultar
curl http://localhost:8000/api/adversario
curl http://localhost:8000/api/adversario/1/jogadores-chave
curl http://localhost:8000/api/adversario/1/vulnerabilidades
```

## Prompt sugerido para Claude Code

```
Integre o módulo de análise de adversários no projeto analisedesempenho_bfsa:

1. Copie wyscout_adversario_parser.py para a raiz do projeto
2. Execute adversario_schema.sql no banco de dados
3. No backend_api.py:
   - Adicione os ORM models de backend_api_adversario_patch.py após a classe ProximoAdversario
   - Adicione os Pydantic schemas após ProximoAdversarioOut
   - Adicione os endpoints antes da seção "# RUN"
4. Adicione pdfplumber ao requirements
5. Teste com: python wyscout_adversario_parser.py "Fortaleza EC.pdf"
```

## Endpoints criados

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/adversario` | Lista relatórios importados |
| GET | `/api/adversario/{id}` | Detalhe completo |
| GET | `/api/adversario/{id}/jogadores-chave` | Top jogadores por xG+xA |
| GET | `/api/adversario/{id}/vulnerabilidades` | Análise tática por formação |
| POST | `/api/adversario/importar` | Importa JSON do parser |
| POST | `/api/adversario/importar-pdf` | Upload direto de PDF |
