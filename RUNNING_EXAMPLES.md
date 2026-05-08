# 💡 Exemplos de Uso - useMapTracking + MapUber

## 1️⃣ Exemplo Básico (O que tem na página run atual)

```javascript
"use client";

import { useState } from "react";
import { useMapTracking } from "@/hooks/useMapTracking";
import MapUber from "@/components/MapUber";

export default function RunPage() {
  const tracker = useMapTracking();
  const [destination, setDestination] = useState(null);

  return (
    <div className="flex h-screen">
      {/* Mapa */}
      <div className="flex-1">
        <MapUber
          positions={tracker.positions}
          currentPosition={tracker.currentPosition}
          heading={tracker.heading}
          currentSpeed={tracker.currentSpeed}
          destination={destination}
          onDestinationSelect={setDestination}
        />
      </div>

      {/* Painel de controle */}
      <div className="w-96 p-4 bg-gray-900">
        {/* Métricas */}
        <div className="mb-4">
          <p>Distância: {tracker.distance.toFixed(2)} km</p>
          <p>Velocidade: {tracker.currentSpeed.toFixed(1)} km/h</p>
          <p>Ritmo: {tracker.pace}</p>
          <p>Tempo: {tracker.time}s</p>
        </div>

        {/* Status GPS */}
        <div className={tracker.isGPSConnected ? "text-green-500" : "text-red-500"}>
          {tracker.isGPSConnected ? "✅ GPS Online" : "❌ GPS Offline"}
        </div>

        {/* Botões */}
        <div className="flex gap-2 mt-4">
          {!tracker.isActive ? (
            <button 
              onClick={tracker.startTracking}
              disabled={!tracker.isGPSConnected}
              className="flex-1 bg-green-500 p-2 rounded"
            >
              Iniciar
            </button>
          ) : (
            <button 
              onClick={tracker.pauseTracking}
              className="flex-1 bg-yellow-500 p-2 rounded"
            >
              Pausar
            </button>
          )}
          <button 
            onClick={tracker.resetTracking}
            className="flex-1 bg-red-500 p-2 rounded"
          >
            Resetar
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 2️⃣ Exemplo com Hooks Customizados

Se você quer mais controle, crie um hook wrapper:

```javascript
"use client";

import { useMapTracking } from "@/hooks/useMapTracking";
import { useEffect, useState } from "react";

export function useRunWithRouteSaving() {
  const tracker = useMapTracking();
  const [routeId, setRouteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Salvar rota quando terminar
  const saveRoute = async () => {
    if (!tracker.isActive || tracker.distance === 0) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/save-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distance: tracker.distance,
          time: tracker.time,
          pace: tracker.pace,
          positions: tracker.positions,
          maxSpeed: tracker.maxSpeed,
          calories: tracker.calories,
        }),
      });

      const data = await response.json();
      setRouteId(data.id);
      console.log("Rota salva:", data.id);
    } catch (error) {
      console.error("Erro ao salvar rota:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    ...tracker,
    saveRoute,
    isSaving,
    routeId,
  };
}
```

Usar assim:

```javascript
export default function RunPageAdvanced() {
  const { 
    positions, 
    currentPosition, 
    heading, 
    startTracking, 
    pauseTracking,
    saveRoute,
    routeId 
  } = useRunWithRouteSaving();

  return (
    <div>
      <MapUber 
        positions={positions}
        currentPosition={currentPosition}
        heading={heading}
      />
      <button onClick={startTracking}>Iniciar</button>
      <button onClick={pauseTracking}>Pausar</button>
      <button onClick={saveRoute}>Salvar Rota</button>
      {routeId && <p>✅ Salvo: {routeId}</p>}
    </div>
  );
}
```

---

## 3️⃣ Exemplo com Notificações

Adicionar notificações de milestone:

```javascript
"use client";

import { useMapTracking } from "@/hooks/useMapTracking";
import { useEffect, useRef } from "react";

export function useRunWithNotifications() {
  const tracker = useMapTracking();
  const milestoneRef = useRef(0);

  useEffect(() => {
    // Notificar a cada 1 km
    const nextMilestone = Math.floor(tracker.distance) + 1;
    
    if (nextMilestone > milestoneRef.current) {
      milestoneRef.current = nextMilestone;
      
      // Mostrar toast/notificação
      if (Notification.permission === "granted") {
        new Notification(`🎉 Você atingiu ${nextMilestone}km!`, {
          body: `Parabéns! Você já correu ${nextMilestone}km`,
          icon: "🏃",
        });
      }

      // Ou som
      playSound();
    }
  }, [tracker.distance]);

  return tracker;
}

function playSound() {
  const audio = new Audio("/sounds/milestone.mp3");
  audio.play();
}
```

---

## 4️⃣ Exemplo com Geofence (Alertas de Zona)

```javascript
"use client";

import { useMapTracking } from "@/hooks/useMapTracking";
import { useEffect, useRef } from "react";
import { getDistance } from "@/utils/haversine";

const DANGER_ZONES = [
  { lat: -15.789, lng: -47.879, radius: 0.5, name: "Zona de Obra" },
  { lat: -15.805, lng: -47.900, radius: 0.3, name: "Trânsito Pesado" },
];

export function useRunWithGeofence() {
  const tracker = useMapTracking();
  const alertedZonesRef = useRef(new Set());

  useEffect(() => {
    if (!tracker.currentPosition) return;

    DANGER_ZONES.forEach((zone) => {
      const dist = getDistance(
        tracker.currentPosition.lat,
        tracker.currentPosition.lng,
        zone.lat,
        zone.lng
      );

      // Se entrou na zona de perigo
      if (dist < zone.radius && !alertedZonesRef.current.has(zone.name)) {
        alertedZonesRef.current.add(zone.name);
        
        // Mostrar aviso
        alert(`⚠️ ${zone.name} próximo! Cuidado!`);
      }

      // Se saiu da zona
      if (dist > zone.radius) {
        alertedZonesRef.current.delete(zone.name);
      }
    });
  }, [tracker.currentPosition]);

  return tracker;
}
```

---

## 5️⃣ Exemplo com Análise de Performance

```javascript
"use client";

import { useMapTracking } from "@/hooks/useMapTracking";
import { useMemo } from "react";

export function useRunAnalytics() {
  const tracker = useMapTracking();

  const analytics = useMemo(() => {
    const positions = tracker.positions;
    if (positions.length < 2) return null;

    // Segmentos rápidos
    const fastSegments = positions.filter((p) => p.speed > 10);

    // Segmentos lentos
    const slowSegments = positions.filter((p) => p.speed < 5);

    // Velocidades
    const speeds = positions.map((p) => p.speed).filter((s) => s > 0);
    const stdDev =
      Math.sqrt(
        speeds.reduce((sq, n) => sq + Math.pow(n - tracker.avgSpeed, 2), 0) /
          speeds.length
      ) || 0;

    // Tempo parado
    const pausedTime = tracker.time - positions.length;

    return {
      fastSegments: fastSegments.length,
      slowSegments: slowSegments.length,
      consistencyScore: Math.max(0, 100 - stdDev * 5),
      pausedTime,
      avgHeartRate: 120 + Math.random() * 40, // Mock
    };
  }, [tracker]);

  return {
    ...tracker,
    analytics,
  };
}
```

Usar assim:

```javascript
export default function AnalyticsPage() {
  const { analytics, distance, pace } = useRunAnalytics();

  if (!analytics) return <p>Carregando...</p>;

  return (
    <div>
      <h2>Análise da Corrida</h2>
      <div>
        <p>Consistency Score: {analytics.consistencyScore.toFixed(0)}%</p>
        <p>Segmentos Rápidos: {analytics.fastSegments}</p>
        <p>Segmentos Lentos: {analytics.slowSegments}</p>
        <p>Pausa Total: {analytics.pausedTime}s</p>
        <p>HR Médio: {analytics.avgHeartRate.toFixed(0)} bpm</p>
      </div>
    </div>
  );
}
```

---

## 6️⃣ Exemplo com Modo "Training"

```javascript
"use client";

import { useMapTracking } from "@/hooks/useMapTracking";
import { useEffect, useState } from "react";

export function useTrainingMode() {
  const tracker = useMapTracking();
  const [mode, setMode] = useState("free"); // 'free' | '5k' | '10k' | 'half-marathon'
  const [targetDistance] = useState({
    "5k": 5,
    "10k": 10,
    "half-marathon": 21.1,
  });
  const [targetTime] = useState({
    "5k": 1800, // 30 min
    "10k": 3600, // 60 min
    "half-marathon": 9000, // 150 min
  });

  const target = mode === "free" ? null : {
    distance: targetDistance[mode],
    time: targetTime[mode],
  };

  const progress = target ? {
    distance: (tracker.distance / target.distance) * 100,
    time: (tracker.time / target.time) * 100,
  } : null;

  // Auto-parar quando atingir goal
  useEffect(() => {
    if (!target) return;

    if (tracker.distance >= target.distance || tracker.time >= target.time) {
      tracker.pauseTracking();
      console.log("🏁 Meta atingida!");
    }
  }, [tracker.distance, tracker.time, target]);

  return {
    ...tracker,
    mode,
    setMode,
    target,
    progress,
  };
}
```

---

## 7️⃣ Exemplo com Share (Compartilhar Rota)

```javascript
"use client";

import { useMapTracking } from "@/hooks/useMapTracking";

export function useRunSharing() {
  const tracker = useMapTracking();

  const shareRun = async () => {
    if (!navigator.share) {
      alert("Seu navegador não suporta compartilhamento");
      return;
    }

    try {
      await navigator.share({
        title: "Minha Corrida",
        text: `Corri ${tracker.distance.toFixed(2)} km em ${tracker.pace}/km`,
        url: window.location.href,
      });
    } catch (error) {
      console.log("Compartilhamento cancelado:", error);
    }
  };

  const generateShareImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");

    // Fundo gradiente
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#1e1b4b");
    gradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Texto
    ctx.font = "bold 72px Arial";
    ctx.fillStyle = "#00ff9f";
    ctx.textAlign = "center";
    ctx.fillText(`${tracker.distance.toFixed(2)} km`, 600, 200);

    ctx.font = "48px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(tracker.pace, 600, 300);
    ctx.fillText(`${tracker.calories} kcal`, 600, 400);

    return canvas.toDataURL();
  };

  return {
    ...tracker,
    shareRun,
    generateShareImage,
  };
}
```

---

## 🚀 Qual Exemplo Usar?

- **Básico**: Use o exemplo 1 (já está implementado)
- **Com Salvamento**: Use exemplo 2
- **Com Notificações**: Use exemplo 3
- **Com Segurança**: Use exemplo 4
- **Premium**: Use exemplo 5 (analytics)
- **Competitivo**: Use exemplo 6 (training)
- **Social**: Use exemplo 7 (sharing)

Combine quantos precisar! 🎉
