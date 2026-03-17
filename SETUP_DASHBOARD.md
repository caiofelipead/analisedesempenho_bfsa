# Guia de Setup - Panther Performance React Dashboard

## 1. Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conhecimento básico de React

## 2. Setup do Projeto

```bash
npx create-react-app panther-performance
cd panther-performance
npm install recharts lucide-react
```

## 3. Configuração de Fonts

Adicione o link do Google Fonts ao arquivo `public/index.html`, dentro da tag `<head>`:

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## 4. CSS Global

Substitua o conteúdo de `src/index.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #090b0f;
  color: #ffffff;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.6;
}

html, body, #root {
  width: 100%;
  height: 100%;
}
```

## 5. Integração do Componente

Copie o arquivo `panther_performance.jsx` para `src/PantherPerformance.jsx`.

Substitua o conteúdo de `src/App.js`:

```javascript
import React from 'react';
import PantherPerformance from './PantherPerformance';

function App() {
  return <PantherPerformance />;
}

export default App;
```

## 6. Estrutura do Projeto

Após setup, a estrutura deve ser:

```
panther-performance/
├── public/
│   ├── index.html (com Google Fonts link)
│   └── favicon.ico
├── src/
│   ├── PantherPerformance.jsx (componente principal)
│   ├── App.js (wrapper)
│   ├── index.css (tema dark)
│   └── index.js
├── package.json
├── .gitignore
└── README.md
```

## 7. Executar em Desenvolvimento

```bash
npm start
```

A aplicação abrirá automaticamente em `http://localhost:3000`.

## 8. Build para Produção

```bash
npm run build
```

Gera pasta `build/` otimizada para deploy.

## 9. Conexão com Backend (Futuro)

Atualmente o dashboard utiliza dados hardcoded nos arrays `ATLETAS` e `PARTIDAS`. Para integração com FastAPI:

### 9.1 Variáveis de Ambiente

Crie arquivo `.env` na raiz do projeto:

```
REACT_APP_API_URL=http://localhost:8000
```

### 9.2 Padrão de Fetch

Substitua arrays hardcoded com chamadas HTTP. Exemplo para dados de atletas:

```javascript
const [atletas, setAtletas] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchAtletas = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/atletas`);
      if (!response.ok) throw new Error('Erro ao buscar atletas');
      const data = await response.json();
      setAtletas(data);
    } catch (error) {
      console.error(error);
      setAtletas([]); // fallback
    } finally {
      setLoading(false);
    }
  };

  fetchAtletas();
}, []);
```

### 9.3 CORS

Garanta que FastAPI está configurado com CORS:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 10. Deploy

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

Env vars configuráveis no dashboard Vercel.

### Netlify

```bash
npm run build
netlify deploy --prod --dir=build
```

### Nginx/Servidor Próprio

```bash
npm run build
# Servir pasta build/ via nginx ou http-server
npx http-server build -p 3000
```

## 11. Validação

- Componente renderiza sem erros no console
- Tema dark (#090b0f) aplicado corretamente
- Fonts JetBrains Mono e Oswald carregadas (verificar Network tab)
- Charts (BarChart, RadarChart, AreaChart) exibindo dados
- Interações responsivas (filtros, seleções)

## 12. Troubleshooting

| Problema | Solução |
|----------|---------|
| Ports indisponíveis | `lsof -i :3000` (Linux/Mac) ou `netstat -ano` (Windows) |
| Fonts não carregam | Verificar internet, limpar cache, atualizar link Google Fonts |
| Charts vazios | Validar estrutura de dados em `ATLETAS` e `PARTIDAS` |
| Build falha | Limpar `node_modules` e `package-lock.json`, reinstalar |

---

**Status**: Pronto para desenvolvimento e deploy  
**Versão**: React 18+, Recharts 2.x, Lucide React 0.x
