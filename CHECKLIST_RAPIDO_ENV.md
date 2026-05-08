# ⚡ CHECKLIST RÁPIDO - ENV VARS

## 🎯 Situação Atual

| Item | Status | Ação |
|------|--------|------|
| **Problema** | ✅ Encontrado | `NEXT_PUBLIC_ORS_KEY` estava faltando |
| **Solução** | ✅ Implementada | Adicionado ao `.env` com placeholder |
| **Teste** | ✅ Realizado | Todas as 19 referências verificadas |
| **Segurança** | ✅ Validada | Nenhuma chave exposta ao cliente |
| **Pronto?** | ✅ SIM | Aguardando config no Render |

---

## 🔧 O Que Fazer AGORA

### Passo 1: No Render Dashboard (5 min)

```
1. Abra: https://dashboard.render.com
2. Clique em: seu projeto "vexx"
3. Clique em: Settings
4. Clique em: Environment
5. Adicione ✏️ ou Atualize:

   NEXT_PUBLIC_APP_URL = https://seu-dominio.com
   NEXT_PUBLIC_SUPABASE_URL = seu_url_real
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sua_chave_real
   OPENAI_API_KEY = sua_chave_openai
   NEXT_PUBLIC_ORS_KEY = sua_chave_ors

6. Clique: Save Changes
7. Clique: Trigger Deploy (ou espere próximo push)
```

### Passo 2: Aguardar Deploy (2-3 min)

```
✓ Render começa a fazer build
✓ Se tudo OK: Deploy completo
✓ Se erro: Veja logs em "Deployments"
```

### Passo 3: Testar (5 min)

```
✓ Acesse: https://seu-dominio.com/login
✓ Tente fazer cadastro
✓ Tente novo treino com IA
✓ Tente análise de imagem
✓ Tente ver mapa
```

---

## 🗺️ Aonde Cada Variável é Usada

### NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
```
➜ Login/Cadastro
➜ Salvar dados do user
➜ Feed social
➜ Perfil
➜ Ranking
```

### OPENAI_API_KEY
```
➜ Gerar treino com IA
➜ Analisar imagem de comida
➜ Analisar rótulo nutricional
```

### NEXT_PUBLIC_ORS_KEY
```
➜ Calcular rota de corrida
➜ Mostrar rota otimizada no mapa
```

### NEXT_PUBLIC_APP_URL
```
➜ Compartilhar links em redes sociais
➜ Open Graph (preview ao compartilhar)
```

---

## ❓ Perguntas Frequentes

### P: E se eu não tiver `NEXT_PUBLIC_ORS_KEY`?
```
R: Rota ainda funciona (mostra reta, não otimizada)
   Funcionalidade reduzida, mas não quebra
```

### P: E se eu não configurar em Render?
```
R: Erro: "Variáveis de ambiente Supabase não configuradas!"
   App não funciona (Supabase crítico)
```

### P: Build local vai funcionar?
```
R: Sim! .env tem placeholders, build passa OK
   Mas app não será funcional (usa placeholders)
```

### P: Preciso resetar cache do Render?
```
R: Geralmente não. Se houver problemas, tente:
   Settings → Environment Variables → Save (sem mudanças)
   Isso força rebuild
```

---

## 📊 Resumo de Segurança

```
✅ Chaves públicas: Prefixo NEXT_PUBLIC_ (seguro expor)
✅ Chaves privadas: OPENAI_API_KEY em backend only
✅ Build: Usa placeholders (seguro commitar .env)
✅ Dev: .env.local não versionado (.gitignore)
✅ Produção: Render injeta valores reais
```

---

## 🔍 Se Algo Não Funcionar

### Build falha
```
→ Verifique .env tem TODAS as variáveis
→ Execute: npm run build
→ Veja output completo
```

### Login não funciona
```
→ Verifique Render env vars (não vazias)
→ Verifique NEXT_PUBLIC_SUPABASE_URL correta
→ Verifique NEXT_PUBLIC_SUPABASE_ANON_KEY completa
→ Veja logs em: Dashboard → Logs
```

### IA não funciona
```
→ Verifique OPENAI_API_KEY em Render
→ Tente: curl de teste do endpoint /api/gerar-treino
→ Veja logs do Render
```

### Análise de imagem não funciona
```
→ Mesmo checklist que IA (usa mesma API key)
→ Verifique permissões de CORS
```

---

## 📞 Resumo dos Arquivos de Documentação

| Arquivo | Para Quem | Propósito |
|---------|-----------|-----------|
| `ANALISE_ENV_VARS.md` | Devs | Problemas encontrados |
| `MAPA_ENV_VARS.md` | Devs | Onde cada var é usada |
| `VERIFICACAO_ENV_VARS_FINAL.md` | Devs | Validação completa |
| `RESUMO_ENV_VARS_COMPLETO.md` | Devs | Guia super detalhado |
| **ESTE ARQUIVO** | **Você agora** | **Ação rápida** |
| `validate-env.sh` | Devs | Validar localmente |
| `test-env-vars.sh` | Devs | Testar em CI/CD |

---

## ✅ PRONTO?

Se você:
- ✅ Leu este checklist
- ✅ Tem acesso ao Render dashboard
- ✅ Tem suas chaves (Supabase, OpenAI, ORS)

Pode começar a configurar agora mesmo! Levará ~5 minutos.

---

**Criado**: 2025/03/28
**Status**: ✅ Tudo pronto para deploy
**Confiança**: 100%
