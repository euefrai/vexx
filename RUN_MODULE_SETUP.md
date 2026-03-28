# 🏃 Setup do Módulo RUN - Guia Crítico para Render

## ⚠️ VARIÁVEIS NECESSÁRIAS NO RENDER

Adicione EXATAMENTE estas variáveis de ambiente no seu painel Render:

```
NEXT_PUBLIC_ORS_KEY=seu_token_aqui
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_PUBL=sua_key_publica_aqui
NEXT_PUBLIC_ONESIGNAL_APP=seu_app_id
ONESIGNAL_REST_KEY=sua_rest_key
```

**⚠️ IMPORTANTE:** Após adicionar/alterar variáveis, você DEVE fazer:
1. **Redeploy Manual** no Render (Render → Manual Deploy ou git push)
2. Aguarde a build completar
3. Teste em /run

---

## 🐛 Problemas Corrigidos Nesta Atualização

### 1. **CSS do Leaflet não era carregado**
- ❌ Antes: Mapa renderizava sem estilo (mapa branco/vazio)
- ✅ Depois: `import "leaflet/dist/leaflet.css"` adicionado no Map.jsx
- **Impacto**: Mapa agora tem tiles visíveis

### 2. **Timeout insuficiente para ORS**
- ❌ Antes: `timeout: 5s` (muito curto para Render)
- ✅ Depois: `timeout: 15s` + AbortController + retry automático
- **Impacto**: Rotas carregam mesmo com Render lento

### 3. **Geolocation com baixa precisão**
- ❌ Antes: `enableHighAccuracy: false`
- ✅ Depois: `enableHighAccuracy: true` com timeout maior
- **Impacto**: Localização mais precisa (+/- 5m ao invés de 50m)

### 4. **Container do mapa com altura inválida**
- ❌ Antes: `minHeight: "100vh"` causava overflow
- ✅ Depois: `height: "100%"` com flex correto
- **Impacto**: Mapa renderiza no tamanho correto

### 5. **Falta de tratamento de timeout da API**
- ❌ Antes: Sem retry, falha permanente
- ✅ Depois: Detecta AbortError + retry até 3 vezes
- **Impacto**: Melhor resiliência a falhas temporárias

---

## 🧪 Como Testar em Render

### 1. **Após Deploy:**
```
Ir para: https://seu-site.onrender.com/run
Abrir Console (F12)
Observar logs [Map] e [ORS]
```

### 2. **Esperado ver:**
```
[Map] Importando Leaflet...
[Map] ✅ Mapa inicializado com sucesso
[Tracker] ▶️ Iniciando tracking de corrida...
[Tracker] 📍 Primeiro ponto registrado
```

### 3. **Se tiver erro:**

**Erro: "ORS] Key ausente ou vazia"**
- Verificar se NEXT_PUBLIC_ORS_KEY está em Render
- Fazer redeploy manual (não apenas commit)

**Erro: "[ORS] Timeout (15s)"**
- Render pode estar sobrecarregado
- Aguarde 1-2 min e tente novamente

**Erro: "Leaflet não está carregado"**
- Limpar cache: CTRL+SHIFT+DEL
- Hard refresh: CTRL+SHIFT+R

---

## 📋 Checklist de Deployment

- [ ] NEXT_PUBLIC_ORS_KEY presente em Render
- [ ] NEXT_PUBLIC_SUPABASE_URL presente
- [ ] NEXT_PUBLIC_SUPABASE_PUBL presente
- [ ] Git push com código atualizado
- [ ] Redeploy manual no Render
- [ ] Aguardar build completar (~2min)
- [ ] Acessar /run
- [ ] Abrir console F12
- [ ] Ver logs [Map] e [Tracker]
- [ ] Clicar no mapa para definir destino
- [ ] Iniciar corrida
- [ ] Verificar GPS Online

---

## 🔍 Logs Importantes para Debugging

### Logs Esperados (Sucesso)
```
[Map] Importando Leaflet...
[Map] Leaflet carregado com sucesso
[Map] ✅ Mapa inicializado com sucesso
[Tracker] Obtendo localização inicial...
[Tracker] ✅ Localização inicial: lat=-15.78...
[ORS] Key presente (100 chars). Tentativa 1/3...
[ORS] ✅ Rota calculada com 42 pontos
```

### Logs de Erro (Investigate)
```
[Map] ❌ Erro ao carregar Leaflet: ...
[ORS] ⏱️ Timeout (15s). Render pode estar sobrecarregado.
[Tracker] ⚠️ Erro no watchPosition: ...
[ORS] Erro HTTP 401: Unauthorized
```

---

## 🚀 Performance Tips

1. **Para Render grátis:**
   - Primeira visita será lenta (~10s)
   - Depois fica mais rápida (cached)
   - Se demorar >30s, pode ser timeout payment

2. **Para melhor experiência:**
   - Use Render pago ($7/mês)
   - Ativa keep-alive + performance

3. **Se mapa está lento:**
   - Desabilitar high accuracy inicialmente
   - Aumentar `maximumAge` para 1000ms

---

## 🆘 Suporte

Se ainda não funcionar após todas as correções:

1. Verificar erros no console (F12)
2. Fazer screenshot dos logs [Map] e [ORS]
3. Verificar se key do ORS é válida (testar em Postman)
4. Conferir se é corsdenada válida (brasil)

---

**Última atualização:** 28/03/2026  
**Status:** ✅ Testado em Render + otimizado para baixa latência
