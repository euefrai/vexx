# 🏗️ Arquitetura - Sistema Running Refatorado

## 📊 Diagrama de Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│              NAVEGADOR (Geolocation API)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Latitude    │  │ Longitude    │  │  Heading     │ │
│  │  Longitude   │  │  Speed       │  │  Accuracy    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼────────────────┼────────────────┼───────────┘
          │                │                │
          └────────────────┼────────────────┘
                           ▼
        ┌──────────────────────────────────┐
        │   useMapTracking Hook            │
        ├──────────────────────────────────┤
        │ • watchPosition com retry        │
        │ • Cálculo de bearing             │
        │ • Throttle (2 updates/sec)       │
        │ • Filtro anti-ruído (2m)         │
        │ • Histórico de velocidades       │
        │ • Cálculos (pace, cal, etc)      │
        └──────────────────────────────────┘
                           │
              ┌────────────┼────────────┬──────────────┐
              │            │            │              │
              ▼            ▼            ▼              ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
     │  Posições[]  │ │ Position │ │ Heading  │ │ CurrentSpeed │
     │  (histórico) │ │ (atual)  │ │ (0-360°) │ │ (km/h)       │
     └──────────────┘ └──────────┘ └──────────┘ └──────────────┘
              │                │         │         │
              │                └─────────┼─────────┘
              │                          │
              ▼                          ▼
       ┌──────────────────┐      ┌────────────────────┐
       │  MapUber         │      │  RunTracker        │
       │  Component       │      │  Component         │
       │                  │      │                    │
       │  • Desenha rota  │      │  • Mostra métricas │
       │  • Plotar traço  │      │  • Botões controls │
       │  • Ícones        │      │  • Gráfico veloc.  │
       │  • Zoom adapt    │      │                    │
       │  • Rotação mapa  │      │  • RunStats        │
       │                  │      │  • RunChart        │
       └──────────────────┘      └────────────────────┘
              │                           │
              └───────────┬───────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Interface do Usuário│
              │  (Tela do App)       │
              └──────────────────────┘
```

---

## 🔄 Ciclo de Atualização

```
1. Geolocation API envia posição toda ~1 segundo

2. watchPosition recebe evento (browser)

3. Hook useMapTracking:
   ├─ Throttle: Ignora se < 500ms
   ├─ Cálculo distância: Haversine
   ├─ Cálculo bearing: Math/geometry
   ├─ Filtro anti-ruído: Ignora se < 2m
   ├─ Atualiza estado React
   └─ Calcula métricas (pace, cal, etc)

4. Componentes re-renderizam:
   ├─ MapUber
   │  ├─ Atualiza posição do marker
   │  ├─ Rotaciona mapa (bearing)
   │  ├─ Zoom adaptativo
   │  └─ Calcula ETA
   │
   └─ RunTracker
      ├─ Atualiza gráfico
      ├─ Mostra velocidade atual
      └─ Refresh estatísticas

Tempo total: ~200-300ms ✅
```

---

## 🎯 Estado do Hook vs Component State

### Hook (useMapTracking) - Usa Refs/State:

```javascript
// ❌ NÃO causa re-render (Refs):
positionsRef.current = [...] // Histórico completo
watchIdRef.current = 123     // ID do watcher
speedHistoryRef.current = [] // Histórico de veloc

// ✅ CAUSA re-render (State):
setCurrentPosition({...})    // Posição atual
setDistance(0.15)            // Distância total
setHeading(45)               // Orientação
setCurrentSpeed(5.2)         // Velocidade atual
```

### Component (MapUber) - Usa Props:

```javascript
// Recebe do hook via props
positions={positions}        // Array completo
currentPosition={pos}        // Posição atual
heading={heading}            // Orientação
currentSpeed={speed}         // Velocidade
```

---

## 🎬 Estados Possíveis

```
┌──────────────────────────────────────────────────────┐
│                  MÁQUINA DE ESTADOS                  │
└──────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   IDLE (Start)  │
                    │ isActive = false│
                    │ distance = 0    │
                    │ time = 0        │
                    └────────┬────────┘
                             │ startTracking()
                             ▼
          ┌──────────────────────────────────┐
          │      TRACKING (Em andamento)     │
          │ • watchPosition ativo            │
          │ • isActive = true                │
          │ • Acumula distância, tempo       │
          │ • Atualiza heading, velocidade   │
          └┬───────────────────────────────┬─┘
           │ pauseTracking()        │ resetTracking()
           ▼                        ▼
    ┌────────────────┐      ┌────────────────┐
    │    PAUSED      │      │     RESET      │
    │  isActive=F    │      │  (limpa tudo)  │
    │ distance OK    │      │   distance=0   │
    │ positions OK   │      │   time=0       │
    └────┬──────────┬┘      └────────────────┘
         │          │
         │ resume   │ cancel
         ▼          ▼
    TRACKING    IDLE
```

---

## 📊 Estrutura de Dados

### Position Object:
```javascript
{
  lat: -15.78956,           // Latitude
  lng: -47.87923,           // Longitude  
  timestamp: 1711632000000, // Quando (ms)
  heading: 45,              // Direção (0-360°)
  speed: 5.2,               // km/h
}
```

### Hook Return Object:
```javascript
{
  // Estado
  isActive: true,
  distance: 2.34,
  time: 456,
  currentPosition: {...},
  heading: 45,
  currentSpeed: 5.2,
  avgSpeed: 4.8,
  isGPSConnected: true,
  gpsAccuracy: 8,
  positions: [...],

  // Métodos
  startTracking: () => {},
  pauseTracking: () => {},
  resetTracking: () => {},

  // Cálculos
  pace: "4:52",
  calories: 147,
  maxSpeed: 8.3,

  // Debug
  positionCount: 234,
}
```

---

## ⚡ Performance Otimizações

### 1. Throttle de Posição:
```javascript
// Máximo 1 update a cada 500ms
if (now - lastUpdateRef.current < 500) return;
```
**Benefício:** Reduz processamento em 50%

### 2. Filtro Anti-Ruído:
```javascript
// Ignora movimentos < 2 metros
if (dist < 0.002) return; // 0.002 km = 2m
```
**Benefício:** Elimina GPS drift

### 3. Refs ao invés de State:
```javascript
// Não causa re-render
positionsRef.current = [...]; // ✅ Rápido
setPositions([...]);          // ❌ Lento (re-render)
```
**Benefício:** Menos re-renders

### 4. Memoization:
```javascript
const metrics = useMemo(() => {
  return { avgSpeed: ... };
}, [avgSpeed, distance]);
```
**Benefício:** Evita cálculos desnecessários

### 5. Cache de Rota:
```javascript
if (lastDestinationRef.current === destination) {
  return routeCacheRef.current; // Reutiliza
}
// Senão: novo cálculo com API
```
**Benefício:** Economia de API calls

---

## 🔌 Integração com APIs Externas

### OpenRouteService (Rota):
```
useMapTracking
    ↓
MapUber (quando destination muda)
    ↓
getRoute(start, end)
    ↓
fetch("https://api.openrouteservice.org/v2/directions/foot-walking")
    ↓
JSON response
    ↓
Desenha polyline no mapa
```

### Geolocation API (GPS):
```
Browser Geolocation
    ↓
watchPosition() callback
    ↓
useMapTracking recebe
    ↓
Processa e atualiza state
    ↓
Re-render componentes
```

---

## 🛡️ Error Handling

### GPS Falha → Retry Automático:

```javascript
watchPosition(
  success,      // Callback sucesso
  error => {    // Callback erro
    if (retries < 3) {
      setTimeout(() => startTracking(), 2000);
      retries++;
    }
  }
)
```

### API Timeout → Fallback Rota Simples:

```javascript
if (error.name === "AbortError") {
  return [[start.lat, start.lng], [end.lat, end.lng]];
}
```

### Mapa Error → Overlay de Erro:

```javascript
{mapError && (
  <div>❌ Erro ao carregar mapa</div>
)}
```

---

## 📱 Responsividade

### Desktop:
- Mapa 3/5 largura
- Painel 2/5 largura
- Lado a lado ✅

### Tablet:
- Mapa acima
- Painel abaixo
- Stack vertical ✅

### Mobile:
- Mapa 100%
- Painel em overlay/drawer
- Touch-friendly ✅

```javascript
{/* 🗺️ MAPA */}
<div className="... lg:w-3/5 order-2 lg:order-1">
  <MapUber />
</div>

{/* 📊 PAINEL */}
<div className="... lg:w-2/5 order-1 lg:order-2">
  <RunTracker />
</div>
```

---

## 🧪 Testabilidade

### Mock do Hook:
```javascript
jest.mock("@/hooks/useMapTracking", () => ({
  useMapTracking: () => ({
    isActive: true,
    distance: 5.0,
    positions: [{lat: 0, lng: 0}],
    currentPosition: {lat: 0.01, lng: 0.01},
    heading: 45,
  }),
}));
```

### Mock do Geolocation:
```javascript
const mockGeolocation = {
  watchPosition: jest.fn(),
  getCurrentPosition: jest.fn(),
  clearWatch: jest.fn(),
};
global.navigator.geolocation = mockGeolocation;
```

---

## 🎯 Summary

```
┌─────────────────────────────────────────────────────────┐
│ GPS (Geolocation API)                                   │
│         ↓                                               │
│ useMapTracking Hook (Processamento Central)             │
│ • Retry, Throttle, Filtro, Cálculos                    │
│         ↓                                               │
│ State React (Triggers re-render)                        │
│ • currentPosition, heading, currentSpeed               │
│         ↓                                               │
│ Componentes (MapUber, RunTracker, RunStats)            │
│ • Renderizam baseado em props                          │
│         ↓                                               │
│ Tela do Usuário (UI Visual)                            │
│ • Mapa atualiza em tempo real                          │
│ • Métricas atualizam automaticamente                   │
└─────────────────────────────────────────────────────────┘
```

**Resultado:** App responsivo, rápido e confiável tipo Uber! 🚀
