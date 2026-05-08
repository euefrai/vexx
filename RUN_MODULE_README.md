# 🏃 Módulo de Rastreamento de Corrida - PROFESSIONAL GRADE

## 🎯 Visão Geral

O módulo de corrida foi completamente reformulado para oferecer recursos profissionais ao nível de aplicativos como **Strava**, **Garmin**, **Uber**, e **99**. Inclui:

- ✅ Rastreamento GPS em tempo real
- ✅ Busca de destinos com Nominatim API
- ✅ Seleção de destino no mapa com clique
- ✅ Gráficos interativos de velocidade
- ✅ Estatísticas detalhadas em tempo real
- ✅ Cálculo automático de calorias
- ✅ Resumo profissional pós-corrida
- ✅ Interface responsiva (mobile/desktop)
- ✅ Animações neon e glassmorphism

---

## 📁 Estrutura de Componentes

### **Page: `/app/run/page.jsx`**
Página principal que orquestra todos os componentes.

**Funcionalidades:**
- Gerenciamento de estado (destination, showDestinationModal, showSummary)
- Layout responsivo com mapa (65%) e painel (35%)
- Integração com hooks de rastreamento
- Modal para busca de destinos
- Toggle entre Tracker e Summary

**States:**
```javascript
destination          // { lat, lng, name, address }
showDestinationModal // boolean
showSummary         // boolean
```

---

### **Componente: `RunTracker.jsx`**
O painel de controle principal (horizontal, otimizado para o painel lateral).

**Funcionalidades:**
- Grid de 6 estatísticas em tempo real (grid 2-3 no desktop)
- Gráfico interativo de velocidade com tooltip
- Exibição de velocidade média
- Botões de controle (Reset, Start/Pause)
- Responsivo para mobile e desktop

**Props:**
```javascript
{
  isActive,           // boolean
  distance,           // number (km)
  time,              // number (segundos)
  pace,              // string ("0:00")
  positions,         // array de { lat, lng, speed }
  startTracking,     // function
  pauseTracking,     // function
  resetTracking,     // function
}
```

---

### **Componente: `RunStats.jsx`** (NOVO)
Grid visual com 6 cards de estatísticas coloridas.

**Estatísticas Exibidas:**
1. **Distância** - em km (cor: Emerald)
2. **Queimadas** - em kcal (cor: Orange)
3. **Vel. Atual** - em km/h (cor: Blue)
4. **Vel. Máxima** - em km/h (cor: Purple)
5. **Vel. Média** - em km/h (cor: Cyan)
6. **Tempo** - em min (cor: Indigo)

**Cálculos:**
```javascript
calories = distance * 63       // Aproximação
calories = Math.round(distance * 63)
maxSpeed = Math.max(...positions.map(p => p.speed))
avgSpeed = distance / (time / 3600)
```

---

### **Componente: `RunChart.jsx`**
Gráfico de área com velocidade em tempo real.

**Funcionalidades:**
- Área preenchida com gradiente (emerald → cyan)
- Tooltip customizado com velocidade e ponto número
- Exibição de Min/Max/Pontos no hover
- Suporte para dados vazios com loading spinner

**Props:**
```javascript
{
  positions,  // array de { lat, lng, speed }
}
```

---

### **Componente: `Map.jsx`**
Mapa interativo com Leaflet.

**Funcionalidades:**
- Mapa escuro (CartoDB dark tiles)
- Marcador de usuário com rotação (seta verde)
- Marcador de destino (pulsando, vermelho)
- Rastro da corrida (linha verde)
- Rota até destino (linha cyan tracejada)
- Controles de zoom/center (buttons profissionais)
- Clique no mapa para set destino
- Status GPS online
- Informações de destino

**Controles:**
- 🧭 Navigation - Centraliza no usuário
- 🔍 Zoom In/Out - Aumenta/diminui zoom
- 👆 Clique no mapa para destino

---

### **Componente: `LocationSearch.jsx`**
Busca de endereços com Nominatim API.

**Funcionalidades:**
- Input com debounce (500ms)
- Busca por endereço (filtro Brasil)
- Botão "Usar Minha Localização" (geolocation API)
- Locais conhecidos (Casa, Trabalho, Academia)
- Resultados em tempo real
- Scroll customizado

**API:**
```
https://nominatim.openstreetmap.org/search
?q={query}&format=json&limit=8&countrycodes=br
```

---

### **Componente: `RunSummary.jsx`**
Dashboard pós-corrida com estatísticas completas.

**Exibe:**
- Grid de 6 cards com métricas
- Informação de segmento (velocidade início/fim)
- Cores vibrantes por métrica
- Dimensões responsivas

**Cálculos Especiais:**
```javascript
elevation = distance * 5  // Simulado
segments = positions slice em intervalos
```

---

### **Componente: `RunStatus.jsx`** (NOVO - Badge flutuante)
Widget flutuante que mostra status da corrida.

**Funcionalidades:**
- Aparece quando isActive=true ou distance > 0
- Mostra distância em tempo real
- Indica pausada/em andamento
- Animação slide-up
- Posicionado bottom-left

---

## 🪝 Hooks

### **`useTracker.jsx`**
Hook principal de rastreamento GPS.

**Retorna:**
```javascript
{
  isActive,        // boolean
  distance,        // number (km)
  time,           // number (segundos)
  pace,           // string ("0:00/km")
  positions,      // array completo de dados
  currentPosition, // { lat, lng, speed, heading }
  startTracking,  // function () -> void
  pauseTracking,  // function () -> void
  resetTracking,  // function () -> void
}
```

**Lógica:**
- Usa Geolocation API para GPS
- Calcula haversine distance entre pontos
- Filtra ruído (< 3m)
- Calcula velocidade via diferença de posição
- Atualiza a cada 1-2 segundos

---

## 🎨 Design System

### **Cores Profissionais**
- **Primária (Emerald)**: #00ff9f / #10b981
- **Secundária (Cyan)**: #00e0ff / #06b6d4
- **Destaque (Vermelho)**: #ff6b6b / #ff0000
- **Fundo (Slate)**: #0f172a / #1e293b

### **Efeitos**
- Glassmorphism com `backdrop-blur-xl`
- Gradientes lineares/radiais
- Sombras neon `shadow-[0_0_20px_rgba(...)]`
- Animações smooth (0.3s ease)
- Border glow on hover

### **Tipografia**
- Títulos: Font-black (900 weight)
- Descrições: Font-medium (500 weight)
- Labels: Font-bold + uppercase + letter-spacing

---

## 📊 Fluxo de Dados

```
Map (posição + destino)
    ↓
useTracker (captura GPS)
    ↓
RunTracker (exibe stats)
    ├→ RunStats (grid 6 cards)
    ├→ RunChart (gráfico de velocidade)
    └→ Controles (Start/Pause/Reset)

LocationSearch
    ↓
Map (atualiza destino)
    ↓
Rota calculada via getRoute()
    ↓
Renderizada no mapa

RunSummary (após conclusão)
    ↓
Exibe métricas finais
```

---

## 🔧 Customizações Possíveis

### 1. **Mudar Cores de Estatísticas**
Em `RunStats.jsx`, ajuste os `colors` de cada card:
```javascript
color: "from-emerald-500 to-green-500",   // Gradiente
bgColor: "from-emerald-900/20 to-emerald-900/10", // Fundo
borderColor: "emerald-500/30",             // Borda
```

### 2. **Ajustar Fórmula de Calorias**
Em `RunStats.jsx`:
```javascript
const calories = Math.round(distance * 63); // Padrão
// Mudar para: Math.round(distance * 75); // Mais intenso
```

### 3. **Adicionar Mais Locais Conhecidos**
Em `LocationSearch.jsx`:
```javascript
const recentLocations = [
  { id: "home", name: "Casa", address: "...", icon: "🏠" },
  // Adicione mais...
];
```

### 4. **Modificar Intervalo de Atualização**
Em `useTracker.jsx`, procure por `setInterval`:
```javascript
setInterval(capturePosition, 2000); // 2 segundos
// Mudar para: 1000 (1s) ou 3000 (3s)
```

---

## 🚀 Como Usar

### **Iniciar uma Corrida**
1. Clique no botão "Adicionar Destino" (ou clique no mapa)
2. (Opcional) Busque um endereço ou use sua localização
3. Selecione um destino
4. Clique em "Iniciar" no painel
5. As estatísticas começam a atualizar em tempo real

### **Pausar/Retomar**
- Clique em "Pausar" para parar o rastreamento
- Clique em "Iniciar" para retomar

### **Ver Resumo**
- Clique em "Ver Resumo Detalhado" para ver dashboard final
- Clique em "Voltar ao Tracker" para retornar

### **Reiniciar**
- Clique no botão 🔄 (Reset) para limpar tudo

---

## 📱 Responsividade

| Breakpoint | Comportamento |
|-----------|---|
| **Mobile (< 640px)** | Mapa 100%, Painel debaixo (scrollável) |
| **Tablet (640-1024px)** | Transição fluida |
| **Desktop (> 1024px)** | Mapa 65%, Painel 35% (lado) |

---

## 🐛 Troubleshooting

### **Mapa não está trabalhando**
- Verifique se Leaflet.js está carregado
- Inspecione se `mapContainerRef.current` existe

### **GPS não captura localização**
- Verifique permissões na página (HTTPS requerido)
- Teste em um navegador moderno (Chrome, Firefox, Safari)

### **Nominatim não retorna resultados**
- Confirme que a query tem ≥ 3 caracteres
- Teste manualmente: `nominatim.openstreetmap.org/search?q=brasilia`

### **Gráfico não aparece**
- Verifique se `positions` tem dados (length > 0)
- Confirme que `positions[i].speed` está sendo calculado

---

## 📝 Notas de Desenvolvimento

- Todos os componentes são **"use client"** (Client Components)
- Usa **Tailwind CSS** para styling
- Integra **Recharts** para visualização
- Integra **Lucide React** para ícones
- Suporta **Nominatim API** (gratuito, sem API key)
- Calcula distância com **haversine formula**

---

## 🎁 Funcionalidades Futuras

- [ ] Salvar histórico de corridas
- [ ] Compartilhar corridas em redes sociais
- [ ] Comparar com corridas anteriores
- [ ] Leaderboard de usuários
- [ ] Desafios e medallas
- [ ] Integração com smartwatches
- [ ] Exportar como GPX/CSV
- [ ] Chat em tempo real durante corridas de grupo

---

**Versão**: 2.0 (Professional Grade)  
**Última Atualização**: 2024  
**Status**: ✅ Pronto para Produção
