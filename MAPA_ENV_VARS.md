# Mapa de Uso de Variáveis de Ambiente

## 📍 Localização do Uso de Cada Variável

### 1. **NEXT_PUBLIC_SUPABASE_URL** e **NEXT_PUBLIC_SUPABASE_ANON_KEY**

#### Inicialização
- **Arquivo**: [`lib/supabase.js`](lib/supabase.js)
- **Momento**: Module load (ao importar)
- **Código**:
  ```javascript
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ```
- **Validação**: Apenas no cliente (`if (typeof window !== "undefined")`)
- **Comportamento**:
  - ✅ Build (sem window): não valida, apenas exporta
  - ✅ Produção (no cliente): valida e lança erro se vazio

#### Uso nas Páginas (21 páginas com `export const dynamic = 'force-dynamic'`)
1. `/app/login/page.jsx` - Autenticação
2. `/app/cadastro/page.jsx` - Registro
3. `/app/feed/page.jsx` - Feed social
4. `/app/admin/page.jsx` - Painel admin
5. `/app/novo-treino/page.jsx` - Criar treino
6. `/app/explorar/page.jsx` - Explorar
7. `/app/perfil/page.jsx` - Perfil do user
8. `/app/perfil/[id]/page.jsx` - Perfil outros
9. `/app/forum/page.jsx` - Fórum
10. `/app/forum/[id]/page.jsx` - Detalhes fórum
... (e mais 11)

**Impacto se vazio**: ❌ "Variáveis de ambiente Supabase não configuradas!"

---

### 2. **OPENAI_API_KEY** (Secreta - nunca no cliente!)

#### Localização - API Routes ONLY (Backend)
- **Arquivo**: [`app/api/analisar-imagem/route.js`](app/api/analisar-imagem/route.js) (linha 5)
  ```javascript
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  ```

- **Arquivo**: [`app/api/inteligencia-campo/route.js`](app/api/inteligencia-campo/route.js) (linha 4)
  ```javascript
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  ```

- **Arquivo**: [`app/api/gerar-treino/route.js`](app/api/gerar-treino/route.js) (linha 7)
  ```javascript
  if (!process.env.OPENAI_API_KEY) {
    return { error: "Chave OpenAI não configurada" }
  }
  ```

#### Endpoints Afetados
1. `POST /api/analisar-imagem` - Analisa fotos de comida/rótulos
2. `POST /api/inteligencia-campo` - Inteligência de campo (futuro)
3. `POST /api/gerar-treino` - Gera treinos com IA

**Impacto se vazio**: ❌ Endpoints retornam erro 500
**Segurança**: ✅ Never exposed to client (backend only)

---

### 3. **NEXT_PUBLIC_ORS_KEY** (Pública - pode estar no cliente)

#### Localização
- **Arquivo**: [`utils/getRoute.js`](utils/getRoute.js) (linha 2)
  ```javascript
  const key = (process.env.NEXT_PUBLIC_ORS_KEY || "").trim()
  if (!key) {
    console.warn("API key ausente, usando rota simples")
  }
  ```

- **Arquivo**: [`components/SearchBox.jsx`](components/SearchBox.jsx) (linha 23)
  ```javascript
  headers: {
    Authorization: process.env.NEXT_PUBLIC_ORS_KEY,
  }
  ```

#### Endpoints Afetados
- `https://api.openrouteservice.org/v2/directions/foot-walking` - Calcular rotas
- `https://api.openrouteservice.org/geocode/autocomplete` - Sugerir endereços

**Impacto se vazio**: ⚠️ Funciona com fallback (rota simples sem otimização)
**Funcionalidade reduzida**: Mapa mostra linha reta, não rota otimizada

---

### 4. **NEXT_PUBLIC_APP_URL**

#### Localização
- **Arquivo**: [`app/layout.tsx`](app/layout.tsx) (linha 30)
  ```typescript
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  ```

#### Uso
- Open Graph (redes sociais) - quando compartilham links
- Twitter Cards - preview em tweets
- Canonical URLs - indexação Google

**Impacto se vazio**: ✅ Usa fallback `http://localhost:3000`
**Em produção**: Deve ser domínio real para funcionar corretamente

---

### 5. **Outras Variáveis**

#### GOOGLE_API_KEY
- **Status**: Placeholder em `.env`
- **Uso**: Nenhum atualmente (não implementado)
- **Localização**: Aparece apenas na documentação

#### NEXT_PUBLIC_ONESIGNAL_APP_ID
- **Status**: Placeholder em `.env`
- **Uso**: Push notifications (não implementado)
- **Localização**: Registrado em `public/manifest.json`

#### NODE_ENV
- **Uso**: Validação de desenvolvimento (`errorHandler.js`, `next.config.ts`)
- **Automático**: Next.js define automaticamente

---

## 🔄 Fluxo de Carregamento de ENV Vars

```
┌─────────────────────────────────────────────────────────────┐
│                   npm run build                              │
│                                                              │
│  1. .env é lido (contém placeholders)                       │
│  2. next.config.ts é compilado                              │
│  3. Pages são pré-renderizadas (estáticas)                  │
│     - import { supabase } de lib/supabase.js               │
│     - process.env.NEXT_PUBLIC_SUPABASE_URL é acessado     │
│     - Sem window: não valida, apenas lê                   │
│     - Supabase não é criado (null)                        │
│  4. Export const dynamic = 'force-dynamic' previne pré-render
│  5. Build sucesso ✅                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               Render Deploy (Produção)                       │
│                                                              │
│  1. Render injeta env vars reais (suas chaves)            │
│  2. User acessa https://seu-dominio.com/login             │
│  3. Next.js renderiza página dinamicamente (não cached)   │
│     - import { supabase } de lib/supabase.js              │
│     - process.env.NEXT_PUBLIC_SUPABASE_URL AGORA tem valor│
│     - window existe (cliente)                             │
│     - Cria cliente Supabase com chaves reais ✅          │
│  4. Página funciona normalmente                           │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Validação Completa

### Build Local
- [ ] `.env` tem TODOS os placeholders
- [ ] Nenhuma chave secreta em `.env` (está em .gitignore mas seguro usar .env.local)
- [ ] `npm run build` passa sem erros
- [ ] Não há warnings sobre env vars faltando

### Desenvolvimento Local
- [ ] `.env.local` criado (não commitado)
- [ ] `.env.local` tem valores reais da sua conta
- [ ] `npm run dev` funciona
- [ ] Supabase autentica corretamente
- [ ] API routes funcionam (OpenAI, etc)

### Produção (Render)
- [ ] Render dashboard tem 5 env vars configuradas:
  1. `NEXT_PUBLIC_SUPABASE_URL` = seu URL real
  2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave real
  3. `OPENAI_API_KEY` = sua chave real
  4. `NEXT_PUBLIC_ORS_KEY` = sua chave real
  5. `NEXT_PUBLIC_APP_URL` = seu domínio (https://seu-dominio.com)
- [ ] Deploy feito APÓS configurar env vars
- [ ] Teste login em produção
- [ ] Teste criação de treino com IA
- [ ] Teste análise de imagem

---

## 🚨 Sinais de Alerta

| Sintoma | Causa | Solução |
|---------|-------|---------|
| "Variáveis Supabase não configuradas" | `NEXT_PUBLIC_SUPABASE_*` vazio em produção | Adicionar no Render env vars |
| Endpoint de IA retorna erro 500 | `OPENAI_API_KEY` placeholder em produção | Configurar no Render |
| Mapa mostra reta, não rota otimizada | `NEXT_PUBLIC_ORS_KEY` vazio | Adicionar ao Render (opcional) |
| Build falha - env não encontrada | Variável não em `.env` | Adicionar ao `.env` com placeholder |
| Dados localStorage vazios | Supabase não inicializando | Verificar auth (useAuth hook) |
