# Análise Completa das Variáveis de Ambiente

## ❌ PROBLEMAS IDENTIFICADOS

### 1. **NEXT_PUBLIC_ORS_KEY - FALTANDO NO .env**
   - **Localização**: `utils/getRoute.js`, `components/SearchBox.jsx`
   - **Uso**: API do OpenRouteService para calcular rotas a pé
   - **Status**: ❌ NÃO está em `.env` (erro crítico!)
   - **Funcionamento atual**: Com fallback para rota simples (lon/lat)
   - **Necessário para**: Calcular rotas reais entre pontos no mapa
   
### 2. **OPENAI_API_KEY - PRESENTE MAS INCOMPLETO**
   - **Localização**: `app/api/analisar-imagem/route.js`, `app/api/inteligencia-campo/route.js`, `app/api/gerar-treino/route.js`
   - **Uso**: API do OpenAI para análise de imagens e geração de treinos
   - **Status**: ⚠️ Tem placeholder em `.env` (OK para build, mas não funciona em produção)
   - **Problema**: Em produção, PRECISA ser a chave real

### 3. **NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY - CORRETOS**
   - **Status**: ✅ Bem configurados no `.env` com placeholders
   - **Comportamento**: 
     - Durante build: usa placeholders (permite build passar)
     - Em produção: Render usará valores reais das env vars
     - No cliente: `lib/supabase.js` faz validação defensiva

## ✅ VARIÁVEIS CORRETAS

| Variável | Local | Status | Produção |
|----------|-------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env` | ✅ Placeholder | Render env var |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env` | ✅ Placeholder | Render env var |
| `OPENAI_API_KEY` | `.env` | ✅ Placeholder | Render env var |
| `GOOGLE_API_KEY` | `.env` | ✅ Placeholder | Render env var (não usado) |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | `.env` | ✅ Placeholder | Pode estar vazio |
| `NEXT_PUBLIC_APP_URL` | `.env` | ✅ http://localhost:3000 | Render env var |
| **`NEXT_PUBLIC_ORS_KEY`** | **❌ FALTA** | ❌ NÃO EXISTE | Render env var |

## 🔧 SOLUÇÃO NECESSÁRIA

### Passo 1: Adicione ao `.env`
```bash
# OpenRouteService - para calcular rotas de corrida
# Obtenha em: https://openrouteservice.org/dev/#/login
NEXT_PUBLIC_ORS_KEY=placeholder
```

### Passo 2: No Render (Produção)
Configure as seguintes variáveis de ambiente:
```
NEXT_PUBLIC_ORS_KEY=sua_chave_openrouteservice_aqui
OPENAI_API_KEY=sua_chave_openai_aqui
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_supabase
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

## 📋 CHECKLIST DE CONFIGURAÇÃO

### Desenvolvimento Local (.env.local)
- [ ] NEXT_PUBLIC_SUPABASE_URL = seu-projeto.supabase.co
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY = sua chave pública
- [ ] OPENAI_API_KEY = sua chave OpenAI
- [ ] NEXT_PUBLIC_ORS_KEY = sua chave OpenRouteService
- [ ] NEXT_PUBLIC_APP_URL = http://localhost:3000

### Produção (Render Dashboard)
- [ ] Todos os 5 valores acima (sem NEXT_PUBLIC_APP_URL ou com domínio real)
- [ ] Fazer deploy APÓS configurar variáveis
- [ ] Testar login/cadastro/novo-treino após deploy

## 🚨 IMPACTO POR RECURSO

| Recurso | Env Var | Impacto sem Config |
|---------|---------|-------------------|
| Rotineiro/Corrida | `NEXT_PUBLIC_ORS_KEY` | Sem rotas detalhadas, usa rota simples |
| Análise de Imagens | `OPENAI_API_KEY` | Não funciona análise de comida/rótulo |
| Geração de Treinos IA | `OPENAI_API_KEY` | Não funciona criação automática de treinos |
| Autenticação | `NEXT_PUBLIC_SUPABASE_*` | Erro "Variáveis não configuradas" |

## ✅ COMO TESTAR LOCALMENTE

```bash
# 1. Configure .env.local com valores reais
cp .env.local.example .env.local
# Adicione seus valores reais

# 2. Inicie desenvolvimento
npm run dev

# 3. Teste cada feature:
# - Login/Cadastro (Supabase)
# - Novo Treino > Gerar com IA (OpenAI)
# - Run > Mapa deve mostrar rota (ORS)
# - Analisar Imagem (OpenAI)
```

## 🔐 SEGURANÇA

✅ CORRETO:
- Chaves públicas uses `NEXT_PUBLIC_` (expostas ao cliente)
- Chaves secretas (OPENAI_API_KEY) NO backend routes (`.js` em `/app/api/`)
- Build usa placeholders, não chaves reais

❌ EVITAR:
- Adicionar env vars secretas em `.env` (está no Git!)
- Usar `process.env.OPENAI_API_KEY` no cliente
- Commitar `.env.local` com valores reais
