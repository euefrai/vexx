# 🏃 Refatoração Completa - Sistema de Rastreamento Running (Tipo Uber)

## 📋 Resumo das Mudanças

### ✨ Novos Arquivos Criados

#### 1. **`hooks/useMapTracking.jsx`** - Hook Unificado
Novo hook que centraliza toda a lógica de rastreamento de corrida:

- ✅ **Rastreamento GPS com Retry Automático** - Se perder sinal, reconecta automaticamente
- ✅ **Cálculo de Bearing/Orientação** - Sabe para qual direção o usuário está correndo
- ✅ **Throttle de Posição** - Evita processamento excessivo (máx 2 atualizações/seg)
- ✅ **Filtro anti-ruído** - Ignora movimentos menores que 2 metros
- ✅ **Histórico de velocidades** - Mantém histórico dos últimos 60 segundos
- ✅ **Métricas completas** - Distância, tempo, velocidade (atual, média, máxima), ritmo, calorias

**Vantagens vs `useTracker` antigo:**
- Retry automático quando GPS falha
- Cálculo permanente de bearing (não apenas em mudança de direção)
- Throttle inteligente para melhor performance
- Estado unificado e mais previsível
- Logs detalhados para debugging

#### 2. **`components/MapUber.jsx`** - Mapa Estilo Uber
Novo componente de mapa que implementa UX similar ao Uber:

- 🗺️ **Mapa Sempre Segue o Usuário** - Câmera centralizada no usuário, não em local aleatório
- 🔄 **Rotação Dinâmica** - Mapa rotaciona com a orientação do usuário (bearing)
- 📍 **Zoom Adaptativo** - Zoom automático baseado em velocidade (mais rápido = mais zoom out)
- 🎯 **Marcador de Destino com Pulsante** - Ícone animado tipo Uber
- 🛣️ **Rota com Cache** - Mostra rota até destino e reutiliza cálculo se não muda
- ⏱️ **ETA Dinâmica** - Calcula tempo estimado até destino
- 📊 **Info de Destino** - Mostra distância e ETA no topo do mapa
- 🎨 **UI Moderna** - Ícones customizados, animações fluidas
- 🖱️ **Clique para Destino** - Pode clicar no mapa para selecionar novo destino

**Vantagens vs `Map` antigo:**
- Mapa não "pula" para locais aleatórios
- Sempre segue o usuário (como Uber/Waze)
- Rotaciona com heading do usuário
- UI mais intuitiva e responsiva
- Menos bugs relacionados a posição de câmera

### 🔄 Arquivos Modificados

#### `app/run/page.jsx`
```javascript
// ❌ Antigo
import { useTracker } from "@/hooks/useTracker";
import Map from "@/components/Map";

// ✅ Novo
import { useMapTracking } from "@/hooks/useMapTracking";
import MapUber from "@/components/MapUber";
```

**Mudanças:**
- Hook agora retorna: `heading`, `currentSpeed`, `avgSpeed`, `isGPSConnected`
- MapUber recebe mais props: `heading`, `currentSpeed`, `showRouteInfo`
- Adicionado indicador de status GPS no rodapé
- Adicionado display de velocidade atual

---

## 🎯 Funcionalidades Implementadas

### 1. **Rastreamento Tipo Uber** ⚡
- Mapa sempre centralizado no usuário
- Sem saltos ou atualizações aleatórias
- Segue suavemente a cada atualização

### 2. **Rotação do Mapa com Bearing** 🔄
- Mapa rotaciona conforme usuário se move
- Seta no topo aponta para a direção
- Interpolação suave entre rotações

### 3. **Zoom Adaptativo** 📏
- Velocidade < 2 km/h → Zoom 18x (máximo)
- Velocidade 2-8 km/h → Zoom 18x
- Velocidade 8-15 km/h → Zoom 17x
- Velocidade > 15 km/h → Zoom 16x (mais visão geral)

### 4. **ETA Dinâmica** ⏱️
- Calcula distância até destino em tempo real
- Estima tempo baseado na velocidade atual
- Atualiza a cada atualização de posição

### 5. **Rota com Cache** 🗺️
- Primeira vez: calcula rota com API OpenRouteService
- Próximas vezes: usa cache (evita requisições desnecessárias)
- Só recalcula se mudar o destino

### 6. **Retry Automático de GPS** 🔄
- Máximo 3 tentativas se perder conexão
- Espera 2-3 segundos entre tentativas
- Log detalhado no console

### 7. **Throttle de Posição** ⚡
- Máximo 2 atualizações por segundo
- Evita sobrecarga de renderização
- Lógica inteligente de anti-ruído (mín 2 metros de movimento)

---

## 📊 Comparação: Antes vs Depois

| Feature | Antes | Depois |
|---------|-------|--------|
| Mapa segue usuário | ❌ Aleatório | ✅ Sempre |
| Rotação do mapa | ❌ Não | ✅ Com bearing |
| Zoom adaptativo | ❌ Fixo | ✅ Automático |
| ETA | ❌ Não | ✅ Sim |
| Retry GPS | ❌ Não | ✅ Automático |
| Cache de rota | ❌ Recalcula sempre | ✅ Usa cache |
| Performance | ⚠️ Bugs ocasionais | ✅ Otimizado |
| UX | ❌ Confusa | ✅ Tipo Uber |

---

## 🚀 Como Usar

### No seu componente:

```javascript
import { useMapTracking } from "@/hooks/useMapTracking";
import MapUber from "@/components/MapUber";

export default function MyRunPage() {
  const {
    isActive,
    distance,
    time,
    currentPosition,
    heading,
    currentSpeed,
    startTracking,
    pauseTracking,
    resetTracking,
    pace,
    calories,
    positions,
  } = useMapTracking();

  return (
    <div>
      {/* Mapa Uber */}
      <MapUber
        positions={positions}
        currentPosition={currentPosition}
        heading={heading} // Novo!
        currentSpeed={currentSpeed} // Novo!
        destination={destination}
        onDestinationSelect={handleDestination}
      />

      {/* Seus controles */}
      <button onClick={startTracking}>Iniciar</button>
      <button onClick={pauseTracking}>Pausar</button>
      <button onClick={resetTracking}>Resetar</button>

      {/* Suas métricas */}
      <p>Distância: {distance.toFixed(2)} km</p>
      <p>Velocidade: {currentSpeed.toFixed(1)} km/h</p>
      <p>Ritmo: {pace}</p>
    </div>
  );
}
```

---

## 🔧 API do Hook `useMapTracking`

```javascript
const {
  // Estado
  isActive,                // boolean - Se rastreamento está ativo
  distance,               // number - Distância em km
  time,                   // number - Tempo em segundos
  currentPosition,        // {lat, lng, heading, speed, timestamp}
  heading,                // number - Orientação em graus (0-360)
  currentSpeed,           // number - Velocidade atual em km/h
  avgSpeed,               // number - Velocidade média em km/h
  isGPSConnected,         // boolean - Se GPS está conectado
  gpsAccuracy,            // number - Precisão do GPS em metros
  positions,              // array - Histórico de todas as posições

  // Métodos
  startTracking,          // () => void
  pauseTracking,          // () => void
  resetTracking,          // () => void

  // Cálculos
  pace,                   // string - "min:seg" por km
  calories,               // number - Calorias queimadas
  maxSpeed,               // number - Velocidade máxima registrada

  // Debug
  positionCount,          // number - Total de pontos registrados
} = useMapTracking();
```

---

## 🔗 API do Componente `MapUber`

```javascript
<MapUber
  // Props obrigatórios
  positions={positions}           // array de posições
  currentPosition={currentPosition}  // posição atual
  heading={heading}               // orientação (0-360)
  currentSpeed={currentSpeed}      // velocidade em km/h
  
  // Props opcionais
  destination={destination}       // {lat, lng, name}
  onDestinationSelect={fn}        // callback ao clicar no mapa
  showRouteInfo={true}            // mostra ETA e distância
/>
```

---

## 🐛 Debugging e Logs

O hook e componente possuem logs detalhados no console:

```javascript
// Hook logs
[MapTracking] ✅ Posição inicial: ...
[MapTracking] 📍 10 pontos | dist=0.150km | vel=5.2km/h
[MapTracking] Retry 1/3...

// Map logs
[MapUber] Importando Leaflet...
[MapUber] ✅ Mapa inicializado
[MapUber] ✅ Rota com 42 pontos
```

**Para aumentar logging:**
```javascript
// Altere `console.debug` para `console.log` nos arquivos
```

---

## ⚡ Otimizações Implementadas

1. **Throttle de Posição** - Máx 2 updates/seg
2. **Filtro anti-ruído** - Ignora < 2 metros
3. **Cache de rota** - Evita cálculos repetidos
4. **Animação de rotação** - Interpolação suave (300ms)
5. **Refs para estado não-visualmente-crítico** - Evita re-renders
6. **useCallback para callbacks** - Evita dependencies infinitas
7. **Lazy loading de Leaflet** - Importado apenas quando needed

---

## 📱 Compatibilidade

- ✅ Desktop (Chrome, Firefox, Safari)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablet
- ✅ Mode Incógnito/Private
- ✅ HTTPS (requerido para Geolocation)

**Nota:** Geolocation requer conexão segura (HTTPS) ou localhost

---

## 🚨 Possíveis Problemas e Soluções

### Problema: "Mapa não segue o usuário"
**Solução:** Verifique se `currentPosition` está sendo atualizado no console

### Problema: "GPS não conecta"
**Solução:** Verifique se site está em HTTPS ou localhost

### Problema: "Rota não aparece"
**Solução:** Verifique se API key do OpenRouteService está configurada em `.env.local`

### Problema: "Mapa não rotaciona"
**Solução:** Sua versão do Leaflet pode não suportar bearing. Atualize para Leaflet 1.9+

---

## 🎨 Customizações

### Mudar cor da seta do usuário:
```javascript
// Em MapUber.jsx, mude a cor em `createUserIcon`
border-bottom: ${arrowSize}px solid #00ff9f; // ← Mude para sua cor
```

### Mudar cor da rota:
```javascript
// Em MapUber.jsx, mude a cor em `drawRoute`
color: "#00e0ff", // ← Route color
```

### Mudar velocidade de animação:
```javascript
// Em MapUber.jsx, mude `animationDuration`
const animationDuration = 300; // ← Em ms
```

---

## 📖 Referências

- [Leaflet Docs](https://leafletjs.com)
- [OpenRouteService API](https://openrouteservice.org/api)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [Web Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

---

## ✅ Checklist de Implementação

- [x] Criar `useMapTracking.jsx`
- [x] Criar `MapUber.jsx`
- [x] Atualizar `run/page.jsx` para usar novos componentes
- [x] Adicionar suporte a heading/bearing
- [x] Implementar ETA e distância até destino
- [x] Adicionar retry automático de GPS
- [x] Implementar cache de rota
- [x] Adicionar throttle de posição
- [x] Adicionar indicador de status GPS
- [x] Testar em mobile

---

## 🎉 Resultado Final

Agora seu app de corrida funciona como Uber/Waze:
- Mapa sempre segue o usuário
- Sem saltos ou atualizações confusas
- Rotação automática com bearing
- ETA dinâmica até destino
- Retry automático de GPS
- Performance otimizada

**Bora raiar?** 🏃‍♂️⚡
