# 🚀 Guia de Upload para Render - Passo a Passo

## ⚠️ PRÉ-REQUISITOS

Você já teve os erros:
- ❌ Mapa branco na página /run
- ❌ Rota não calcula
- ❌ Localização não funciona

**Agora está corrigido! Vamos fazer deploy!**

---

## 📋 PASSO 1: Preparar seu código local

### 1.1 Confirme que você tem todos os arquivos

Rode:
```bash
cd /workspaces/vexx
git status
```

Você deve ver as alterações:
```
modified:   components/Map.jsx
modified:   utils/getRoute.js
modified:   hooks/useTracker.jsx
modified:   components/LocationSearch.jsx
new file:   RUN_MODULE_SETUP.md
new file:   ANALISE_RUN_COMPLETA.md
```

### 1.2 Adicione e commit as mudanças

```bash
git add .
git commit -m "feat: Corrigir módulo RUN - CSS Leaflet, timeout ORS, geolocation alta precisão"
```

### 1.3 Push para GitHub

```bash
git push origin main
```

---

## 🖥️ PASSO 2: Acessar Render Dashboard

1. Acesse: https://dashboard.render.com
2. Login com sua conta
3. Encontre seu serviço (deve aparecer na lista) - procure por "vexx" ou URL do seu site

---

## ⚙️ PASSO 3: Verificar Variáveis de Ambiente

**CRÍTICO:** As keys precisam estar lá ANTES do deploy!

### 3.1 Acesse Environment

No dashboard:
1. Clique no seu serviço
2. Menu à esquerda → **Environment**
3. Você verá todas as variáveis

### 3.2 Confirme que estão presentes

```
NEXT_PUBLIC_ORS_KEY=seu_token_aqui
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_PUBL=sua_key
NEXT_PUBLIC_ONESIGNAL_APP=seu_app_id
ONESIGNAL_REST_KEY=sua_rest_key
```

❌ **Se faltar alguma, adicione agora antes de fazer deploy!**

---

## 🔄 PASSO 4: Forçar Redeploy (Importante!)

Mesmo que você fez `git push`, o Render pode not ter detectado ainda ou usar build cache.

### 4.1 Redeploy Manual

1. No dashboard do seu serviço
2. Botão azul superior direito: **Redeploy** (ou "Manual Deploy")
3. Clique nele
4. Aguarde a build completar (pode levar 2-5 min)

### 4.2 Acompanhe a Build

Você verá logs como:
```
Building Docker image...
npm install
npm run build
Starting Next.js production...
✅ Service live at https://seu-site.onrender.com
```

**Aguarde até ver ✅ (não interrompa!)**

---

## 🧪 PASSO 5: Testar a Correção

### 5.1 Acesse a página /run

No seu navegador:
```
https://seu-site.onrender.com/run
```

### 5.2 Abra o Console (F12)

- Pressione `F12`
- Clique em **Console**
- Limpe com `CTRL+L`

### 5.3 Procure pelos logs esperados

Você DEVE ver:
```
[Map] Importando Leaflet...
[Map] ✅ Mapa inicializado com sucesso
[Tracker] ✅ Localização inicial: lat=-15.78, lng=-47.92, accuracy=5m
```

❌ **Se ver erro vermelho, copie e compartilhe!**

### 5.4 Teste o mapa

1. **Espere o mapa carregar** (tile layer aparecer com mapa escuro)
2. **Clique em um ponto** no mapa
3. **Veja o console** - deve aparecer:
   ```
   [ORS] Key presente (100 chars). Tentativa 1/3...
   [ORS] ✅ Rota calculada com 42 pontos
   ```

4. **Clique "Iniciar"**
5. **Caminhe/dirija** e veja o rastro verde aparecer

---

## ⚠️ PASSO 6: Possíveis Problemas + Soluções

### Problema: "Mapa branco (não vejo tiles)"

**Solução:**
```
1. CTRL+SHIFT+DEL (limpar cache)
2. CTRL+SHIFT+R (hard refresh)
3. Se persistir, fazer redeploy novamente
```

### Problema: "[ORS] Key ausente ou vazia"

**Solução:**
```
1. Verificar em Environment se NEXT_PUBLIC_ORS_KEY existe
2. Se existe, fazer redeploy (env vars precisam rebuild)
3. Se não existe, adicionar e fazer redeploy
```

### Problema: "[ORS] Timeout (15s). Render pode estar sobrecarregado"

**Solução:**
```
1. Aguardar 1-2 minutos
2. Tentar novamente
3. Se persistir, Render grátis pode estar overloaded
   → Considerar upgrade para pago ($7/mês)
```

### Problema: "[Tracker] Geolocation não disponível ou timeout"

**Solução:**
```
1. Mobile: Verificar se GPS está ativado
2. Navegador: Permitir acesso à localização
3. Site precisa de HTTPS (Render usa HTTPS ✅)
4. Alguns ISPs bloqueiam GPS (3G/4G deve funcionar)
```

### Problema: "Rota não aparece / linha reta no lugar da rota"

**Solução:**
```
1. Verificar console [ORS] logs
2. Se for fallback de 2 pontos = ORS falhou
3. Verificar se key é válida (testar em postman)
4. Verificar quóta da account ORS
```

---

## 🎉 PASSO 7: Confirmar que Funcionou!

Checklist final:

- [ ] Mapa carrega com tiles (não está branco)
- [ ] Vejo "GPS Online" no canto superior direito
- [ ] Clico no mapa e aparecem logs [ORS] no console
- [ ] Rota calcula (linha tracejada azul aparece)
- [ ] Clico "Iniciar" e começo a rastrear
- [ ] Rastro verde aparece enquanto caminho
- [ ] Posição, tempo e distância atualizam

✅ **Se TODOS esses itens são verdadeiros: SUCESSO!**

---

## 📞 Debug Avançado (Se ainda não funcionar)

### Ativar modo verbose

No console do navegador, rode:
```javascript
localStorage.debug = "*";
window.location.reload();
```

Você verá MUITO mais logging.

### Testar a ORS key com curl

```bash
curl -X POST "https://api.openrouteservice.org/v2/directions/foot-walking" \
  -H "Authorization: YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "coordinates": [[-47.88, -15.78], [-47.87, -15.79]],
    "locale": "pt"
  }'
```

Se retornar erro 401/403 = key inválida
Se retornar JSON com "features" = key funciona!

---

## 🔗 Referências Úteis

- ORS Status: https://api.openrouteservice.org/
- Render Health: https://status.render.com
- Leaflet Docs: https://leafletjs.com/reference.html
- Nominatim (Busca de Local): https://nominatim.org/

---

## ✅ Você Finalizou!

Se tudo funcionando:
- Mapa carrega
- Rotas calculam
- Corridas rastreiam
- Posição precise

**Parabéns! O módulo RUN está 100% funcional em produção!** 🎉

---

**Dúvidas?**
Compartilhe os logs do console (F12) e a URL do seu site.

**Data Updated:** 28/03/2026  
**Status:** ✅ Production Ready
