"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ZoomIn, ZoomOut, Navigation, Compass } from "lucide-react";
import { getRoute } from "@/utils/getRoute";
import "leaflet/dist/leaflet.css";

/**
 * MapUber - Componente de mapa premium de corrida
 * Características:
 * - Mapa sempre centralizado no usuário com bearing suave
 * - Linha de corrida com efeito neon duplo (glow + brilho ciano)
 * - Indicador de usuário com múltiplos anéis de radar pulsante de satélite
 * - Overlays e filtros de clima dinâmicos (Dia, Noite, Chuva, Nublado)
 * - Modo replay progressivo pós-corrida
 */
const MapUber = ({ 
  positions = [], 
  currentPosition, 
  destination, 
  heading = 0,
  currentSpeed = 0,
  onDestinationSelect,
  showRouteInfo = true,
  clima = "sol", // "sol" | "noite" | "chuva" | "nublado"
  triggerReplay = false,
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const polylineGlowRef = useRef(null); // Linha larga inferior para brilho
  const routeRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const LRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const rotationAnimationRef = useRef(null);
  const currentRotationRef = useRef(0);
  const routeCacheRef = useRef(null);
  const lastDestinationRef = useRef(null);
  
  // Cache de última posição conhecida (para fallback)
  const lastKnownPositionRef = useRef(null);
  const lastMapUpdateRef = useRef(0);
  const MIN_UPDATE_INTERVAL = 150; // ms (mais responsivo)
  const isInitializedRef = useRef(false);

  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [eta, setEta] = useState(null);
  const [distanceToDestination, setDistanceToDestination] = useState(null);

  // Estados do Replay Progressivo
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayPositions, setReplayPositions] = useState([]);
  
  // Usar última posição conhecida como fallback
  const effectivePosition = useMemo(() => {
    if (currentPosition) {
      lastKnownPositionRef.current = currentPosition;
      return currentPosition;
    }
    return lastKnownPositionRef.current;
  }, [currentPosition]);

  // 🎯 Criar ícone do usuário com radar de alta precisão (Pulsante e Futurista)
  const createUserIcon = useCallback((L) => {
    return L.divIcon({
      html: `
        <div class="uber-avatar-wrapper" style="
          width: 70px;
          height: 70px;
          display: flex;
          justify-content: center;
          align-items: center;
          transform: rotate(0deg);
          transition: transform 0.1s linear;
        ">
          <!-- Anéis de Radar Concêntricos Pulsantes (Estilo GPS Satélite) -->
          <div class="radar-pulse-ring active-day active-night" style="
            position: absolute;
            width: 70px;
            height: 70px;
            border: 2px solid #00ff9f;
            border-radius: 50%;
            opacity: 0;
            animation: radar-pulse 3s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
          "></div>
          <div class="radar-pulse-ring active-night active-rain" style="
            position: absolute;
            width: 70px;
            height: 70px;
            border: 2px solid #00e0ff;
            border-radius: 50%;
            opacity: 0;
            animation: radar-pulse 3s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
            animation-delay: 1s;
          "></div>
          <div class="radar-pulse-ring active-rain active-nublado" style="
            position: absolute;
            width: 70px;
            height: 70px;
            border: 2px solid #a855f7;
            border-radius: 50%;
            opacity: 0;
            animation: radar-pulse 3s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
            animation-delay: 2s;
          "></div>

          <!-- Glow Central -->
          <div style="
            position: absolute;
            width: 32px;
            height: 32px;
            background: radial-gradient(circle, rgba(0, 255, 159, 0.4), transparent);
            border-radius: 50%;
            z-index: 2;
          "></div>
          
          <!-- Círculo interno branco brilhante -->
          <div style="
            position: absolute;
            width: 24px;
            height: 24px;
            background: #ffffff;
            border: 2.5px solid #0f172a;
            border-radius: 50%;
            opacity: 0.95;
            z-index: 5;
            box-shadow: 0 0 10px rgba(0, 255, 159, 0.8);
          "></div>
          
          <!-- Seta verde esportiva ciano de direção -->
          <div style="
            position: relative;
            z-index: 10;
            width: 0;
            height: 0;
            border-left: 9px solid transparent;
            border-right: 9px solid transparent;
            border-bottom: 20px solid #00ff9f;
            filter: drop-shadow(0 0 5px rgba(0, 255, 159, 0.8)) drop-shadow(0 1.5px 3px rgba(0, 0, 0, 0.5));
            transform: translateY(-4px);
          "></div>
        </div>
      `,
      className: "uber-user-marker-glow",
      iconSize: [70, 70],
      iconAnchor: [35, 35],
    });
  }, []);

  // 🎯 Criar ícone de destino estilo Garmin/NRC
  const createDestinationIcon = useCallback((L) => {
    return L.divIcon({
      html: `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          animation: pulse-destination 2s infinite;
        ">
          <!-- Círculo externo pulsante -->
          <div style="
            position: absolute;
            width: 28px;
            height: 28px;
            background: radial-gradient(circle, #ff3366, #e63946);
            border-radius: 50%;
            filter: drop-shadow(0 0 10px rgba(255, 51, 102, 0.8));
            border: 3.5px solid white;
            box-shadow: 0 0 0 6px rgba(255, 51, 102, 0.25);
          "></div>
          <div style="
            position: relative;
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            z-index: 10;
          "></div>
        </div>
      `,
      className: "uber-destination-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }, []);

  // 1️⃣ Inicializar Mapa com tema escuro e polilinhas neon duplo
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || mapError) return;

    (async () => {
      try {
        console.debug("[MapUber] Carregando Leaflet...");
        const L = (await import("leaflet")).default;
        LRef.current = L;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Configurar mapa
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          tap: true,
          bearing: 0,
        }).setView([-15.78, -47.92], 16);

        // Tile layer escuro premium
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 20,
          attribution: "",
        }).addTo(mapRef.current);

        // 1. Camada inferior de brilho neon (mais larga e com menos opacidade)
        polylineGlowRef.current = L.polyline([], {
          color: "#00ff9f",
          weight: 12,
          opacity: 0.35,
          lineCap: "round",
          lineJoin: "round",
          bubblingMouseEvents: false,
        }).addTo(mapRef.current);

        // 2. Camada superior de brilho ciano (mais fina e intensa)
        polylineRef.current = L.polyline([], {
          color: "#00e0ff",
          weight: 4.5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
          bubblingMouseEvents: false,
        }).addTo(mapRef.current);

        mapInstanceRef.current = mapRef.current;
        setIsMapReady(true);

        mapRef.current.on("click", (e) => {
          if (onDestinationSelect && !destination) {
            onDestinationSelect({
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              name: "Ponto de destino",
            });
          }
        });

        setTimeout(() => {
          if (mapRef.current) mapRef.current.invalidateSize();
        }, 300);
      } catch (error) {
        console.error("[MapUber] Erro ao instanciar mapa:", error);
        setMapError(true);
      }
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onDestinationSelect, destination, mapError]);

  // 2️⃣ Traçar Rota Dinâmica
  useEffect(() => {
    const L = LRef.current;
    if (!mapRef.current || !currentPosition || !destination || !L || !isMapReady) return;

    if (
      lastDestinationRef.current &&
      lastDestinationRef.current.lat === destination.lat &&
      lastDestinationRef.current.lng === destination.lng &&
      routeCacheRef.current
    ) {
      return;
    }

    async function drawRoute() {
      try {
        const route = await getRoute(currentPosition, destination);
        if (!route || route.length === 0) return;

        routeCacheRef.current = route;
        lastDestinationRef.current = { ...destination };

        if (routeRef.current) {
          mapRef.current.removeLayer(routeRef.current);
        }

        routeRef.current = L.polyline(route, {
          color: "#a855f7",
          weight: 4,
          opacity: 0.7,
          lineCap: "round",
          lineJoin: "round",
          dashArray: "6, 8",
          bubblingMouseEvents: false,
        }).addTo(mapRef.current);
      } catch (error) {
        console.error("[MapUber] Rota falhou:", error);
      }
    }

    drawRoute();
  }, [destination, currentPosition, isMapReady]);

  // 3️⃣ Seguir Atleta e Bearing Suave (Sem flicker)
  useEffect(() => {
    const L = LRef.current;
    if (!mapRef.current || !effectivePosition || !L || !isMapReady) return;

    const { lat, lng } = effectivePosition;
    const latlng = [lat, lng];

    if (!isInitializedRef.current && currentPosition) {
      mapRef.current.setView(latlng, 18);
      isInitializedRef.current = true;
      lastMapUpdateRef.current = Date.now();
    }

    const now = Date.now();
    if (now - lastMapUpdateRef.current < MIN_UPDATE_INTERVAL) return;
    lastMapUpdateRef.current = now;

    if (rotationAnimationRef.current) cancelAnimationFrame(rotationAnimationRef.current);

    const targetRotation = heading || 0;
    const currentRot = currentRotationRef.current;
    const startTime = Date.now();
    const duration = 200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      let diff = targetRotation - currentRot;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      const newRotation = currentRot + diff * progress;
      currentRotationRef.current = newRotation;

      if (mapRef.current && mapRef.current.setBearing) {
        mapRef.current.setBearing(newRotation);
      }

      if (markerRef.current && markerRef.current._icon) {
        const wrapper = markerRef.current._icon.querySelector('.uber-avatar-wrapper');
        if (wrapper) wrapper.style.transform = `rotate(${newRotation}deg)`;
      }

      if (progress < 1) {
        rotationAnimationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, {
        icon: createUserIcon(L),
        zIndexOffset: 1000,
      }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(latlng);
    }

    // Zoom dinâmico inteligente
    let zoomTarget = 18;
    if (currentSpeed > 16) zoomTarget = 16;
    else if (currentSpeed > 8) zoomTarget = 17;

    if (mapRef.current.getZoom() !== zoomTarget) {
      mapRef.current.setZoom(zoomTarget);
    }

    if (isInitializedRef.current && currentPosition) {
      mapRef.current.panTo(latlng, { animate: false });
    }
  }, [effectivePosition, heading, currentSpeed, isMapReady, createUserIcon, currentPosition]);

  // 4️⃣ Marcadores de Destino
  useEffect(() => {
    const L = LRef.current;
    if (!mapRef.current || !destination || !L || !isMapReady) return;

    if (destinationMarkerRef.current) {
      mapRef.current.removeLayer(destinationMarkerRef.current);
    }

    destinationMarkerRef.current = L.marker(
      [destination.lat, destination.lng],
      { icon: createDestinationIcon(L) }
    ).addTo(mapRef.current);

    if (currentPosition) {
      const dist = getDistanceSimple(
        currentPosition.lat,
        currentPosition.lng,
        destination.lat,
        destination.lng
      );
      setDistanceToDestination(dist);

      if (currentSpeed > 0) {
        setEta(Math.round((dist / currentSpeed) * 60));
      }
    }
  }, [destination, isMapReady, createDestinationIcon, currentPosition, currentSpeed]);

  // 5️⃣ Atualizar Rastro Neon (Suporta Replay e Tempo Real)
  useEffect(() => {
    if (!polylineRef.current) return;
    
    const activePositions = isReplaying ? replayPositions : positions;
    if (!activePositions || activePositions.length < 2) {
      polylineRef.current.setLatLngs([]);
      if (polylineGlowRef.current) polylineGlowRef.current.setLatLngs([]);
      return;
    }

    const latLngs = activePositions.map((p) => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latLngs);
    if (polylineGlowRef.current) {
      polylineGlowRef.current.setLatLngs(latLngs);
    }
  }, [positions, replayPositions, isReplaying]);

  // 🔄 Executar Replay da Rota
  const runReplayAnimation = useCallback(() => {
    if (positions.length < 2) return;
    setIsReplaying(true);
    setReplayPositions([positions[0]]);
    
    let index = 1;
    const speedMs = Math.max(30, Math.min(150, 1500 / positions.length));
    
    const interval = setInterval(() => {
      if (index >= positions.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsReplaying(false);
        }, 3000);
        return;
      }
      
      setReplayPositions((prev) => [...prev, positions[index]]);
      
      // Mover câmera suavemente seguindo o replay
      if (mapRef.current) {
        const pt = positions[index];
        mapRef.current.panTo([pt.lat, pt.lng], { animate: true, duration: speedMs / 1000 });
      }
      
      index++;
    }, speedMs);
  }, [positions]);

  // Assistir Gatilho do Replay
  useEffect(() => {
    if (triggerReplay && !isReplaying && positions.length >= 2) {
      runReplayAnimation();
    }
  }, [triggerReplay, runReplayAnimation, isReplaying, positions]);

  // Controles
  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  
  const centerMap = useCallback(() => {
    if (currentPosition && mapRef.current) {
      mapRef.current.flyTo([currentPosition.lat, currentPosition.lng], 18, {
        duration: 0.8,
      });
    }
  }, [currentPosition]);

  const resetRotation = useCallback(() => {
    if (mapRef.current && mapRef.current.setBearing) {
      mapRef.current.setBearing(0);
      currentRotationRef.current = 0;
    }
  }, []);

  return (
    <div className="w-full h-full relative z-0 bg-zinc-950 overflow-hidden group">
      {/* 🌪️ FILTROS AMBIENTAIS E OVERLAYS DE CLIMA */}
      <div className={`absolute inset-0 pointer-events-none z-[101] transition-all duration-[1500ms] ${
        clima === "noite" ? "bg-blue-950/15 mix-blend-color-dodge shadow-[inset_0_0_150px_rgba(0,10,30,0.6)]" :
        clima === "chuva" ? "bg-indigo-950/25 mix-blend-multiply rain-effect" :
        clima === "nublado" ? "bg-slate-700/10 mix-blend-overlay" :
        "bg-transparent"
      }`} />
      
      {/* Vinheta Premium nas Bordas para aumentar imersão e foco */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.65)] z-[102]" />

      <style>{`
        @keyframes pulse-destination {
          0% { filter: drop-shadow(0 0 6px rgba(255, 51, 102, 0.7)); }
          50% { filter: drop-shadow(0 0 14px rgba(255, 51, 102, 1)); }
          100% { filter: drop-shadow(0 0 6px rgba(255, 51, 102, 0.7)); }
        }

        @keyframes radar-pulse {
          0% {
            transform: scale(0.3);
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }

        /* Efeito sutil de chuva caindo no mapa */
        @keyframes falling-rain {
          0% { background-position: 0px 0px; }
          100% { background-position: 250px 1000px; }
        }

        .rain-effect {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='200' viewBox='0 0 100 200'%3E%3Cpath d='M12 25 L8 45 M50 90 L46 110 M85 150 L81 170 M92 20 L88 40 M20 130 L16 150' stroke='rgba(0, 224, 255, 0.25)' stroke-width='1.2' stroke-linecap='round'/%3E%3C/svg%3E");
          animation: falling-rain 0.85s linear infinite;
        }

        .leaflet-container {
          cursor: crosshair !important;
        }
      `}</style>

      {/* Container Leaflet */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ height: "100%", background: "#0a0a0f" }}
      />

      {/* TELA DE ERRO */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-[999]">
          <div className="text-center p-6 bg-zinc-900 border border-red-500/30 rounded-2xl max-w-sm">
            <p className="text-red-400 font-bold text-lg mb-2">❌ Erro no Mapa GPS</p>
            <p className="text-slate-400 text-xs mb-4">Falha ao iniciar as dependências do Leaflet no navegador.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
            >
              🔄 Recarregar Página
            </button>
          </div>
        </div>
      )}

      {/* TELA DE CARREGAMENTO */}
      {!isMapReady && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-[998]">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Sincronizando Satélites...</p>
          </div>
        </div>
      )}

      {/* INDICADOR HUD DO REPLAY */}
      {isReplaying && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600/90 to-blue-600/90 border border-purple-500/40 px-4 py-2 rounded-full z-[401] shadow-lg shadow-purple-500/20 flex items-center gap-2 animate-bounce">
          <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
          <span className="text-white text-xs font-black uppercase tracking-widest">Replay de Corrida</span>
        </div>
      )}

      {/* INFO DE ROTA ATIVA (ETA) */}
      {destination && showRouteInfo && !isReplaying && (
        <div className="absolute top-20 left-4 bg-zinc-950/85 backdrop-blur-md border border-white/10 px-4 py-3.5 rounded-2xl z-[401] shadow-2xl shadow-black/85 max-w-xs transition-all duration-300">
          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
            Rastreamento de Destino
          </p>
          <p className="text-xs font-bold text-white mb-2 truncate">{destination.name}</p>
          {distanceToDestination !== null && (
            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-white/5 pt-2">
              <span>📍 {distanceToDestination.toFixed(2)} km</span>
              {eta !== null && <span className="text-purple-300">⏱️ ~{eta} min</span>}
            </div>
          )}
        </div>
      )}

      {/* CONTROLES TÁTEIS FLUTUANTES DO MAPA */}
      <div className="absolute bottom-6 right-4 sm:right-6 flex flex-col gap-2.5 z-[401]">
        {/* Reset Bearing */}
        <button
          onClick={resetRotation}
          className="flex items-center justify-center w-11 h-11 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full shadow-2xl border border-white/5 backdrop-blur-md transition-all active:scale-90"
          title="Resetar Bússola"
        >
          <Compass size={18} />
        </button>

        {/* Centralizar Usuário */}
        <button
          onClick={centerMap}
          className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-105 text-zinc-950 rounded-full shadow-2xl shadow-emerald-500/20 transition-all active:scale-90"
          title="Centralizar Câmera"
        >
          <Navigation size={18} fill="currentColor" />
        </button>

        {/* Zoom In */}
        <button
          onClick={zoomIn}
          className="flex items-center justify-center w-11 h-11 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full shadow-2xl border border-white/5 backdrop-blur-md transition-all active:scale-90"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>

        {/* Zoom Out */}
        <button
          onClick={zoomOut}
          className="flex items-center justify-center w-11 h-11 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full shadow-2xl border border-white/5 backdrop-blur-md transition-all active:scale-90"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      {/* Balão Indicativo */}
      {!destination && !isReplaying && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-full text-purple-300 text-[10px] font-black uppercase tracking-wider animate-pulse z-[401] shadow-lg shadow-purple-950/20 backdrop-blur-sm">
          📍 Toque no mapa para traçar destino
        </div>
      )}
    </div>
  );
};

// Fórmula Haversine simples
function getDistanceSimple(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default MapUber;
