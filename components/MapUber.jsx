"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ZoomIn, ZoomOut, Navigation, Compass } from "lucide-react";
import { getRoute } from "@/utils/getRoute";
import "leaflet/dist/leaflet.css";

/**
 * MapUber - Componente de mapa estilo Uber que segue o usuário
 * Características:
 * - Mapa sempre centralizado no usuário (como Uber) - SEM FLICKER
 * - Rotaciona com a orientação do usuário (bearing)
 * - Zoom adaptativo baseado em velocidade
 * - Mostra rota até destino com ETA
 * - Cache de última posição como fallback
 * - Responsivo e fluido
 */
const MapUber = ({ 
  positions = [], 
  currentPosition, 
  destination, 
  heading = 0,
  currentSpeed = 0,
  onDestinationSelect,
  showRouteInfo = true,
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
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
  // Throttle de atualizações (evita flicker)
  const lastMapUpdateRef = useRef(0);
  const MIN_UPDATE_INTERVAL = 200; // ms
  // Estado de carregamento
  const isInitializedRef = useRef(false);

  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [eta, setEta] = useState(null);
  const [distanceToDestination, setDistanceToDestination] = useState(null);
  
  // Usar última posição conhecida como fallback
  const effectivePosition = useMemo(() => {
    if (currentPosition) {
      lastKnownPositionRef.current = currentPosition;
      return currentPosition;
    }
    return lastKnownPositionRef.current;
  }, [currentPosition]);

  // 🎯 Criar ícone do usuário com seta MUITO VISÍVEL
  const createUserIcon = useCallback((L, rotationDeg = 0) => {
    return L.divIcon({
      html: `
        <div style="
          width: 60px;
          height: 60px;
          display: flex;
          justify-content: center;
          align-items: center;
          transform: rotate(${rotationDeg}deg);
          transition: transform 0.3s ease-out;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
        ">
          <!-- Círculo externo (halo) -->
          <div style="
            position: absolute;
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, rgba(0, 255, 159, 0.3), rgba(0, 255, 159, 0.1));
            border-radius: 50%;
            border: 2px solid #00ff9f;
            opacity: 0.8;
            animation: pulse-user 2s infinite;
          "></div>
          
          <!-- Círculo interno branco -->
          <div style="
            position: absolute;
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 50%;
            opacity: 0.95;
            z-index: 5;
          "></div>
          
          <!-- Seta verde (GRANDE E VISÍVEL) -->
          <div style="
            position: relative;
            z-index: 10;
            width: 0;
            height: 0;
            border-left: 14px solid transparent;
            border-right: 14px solid transparent;
            border-bottom: 28px solid #00ff9f;
            filter: drop-shadow(0 0 6px rgba(0, 255, 159, 1)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7));
          "></div>
          
          <!-- Sombra interior (mais definição) -->
          <div style="
            position: absolute;
            width: 40px;
            height: 40px;
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent);
            border-radius: 50%;
            opacity: 0.6;
            z-index: 4;
          "></div>
        </div>
      `,
      className: "uber-user-marker",
      iconSize: [60, 60],
      iconAnchor: [30, 30],
    });
  }, []);

  // 🎯 Criar ícone de destino (tipo Uber)
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
            width: 32px;
            height: 32px;
            background: radial-gradient(circle, #ff6b6b, #e63946);
            border-radius: 50%;
            filter: drop-shadow(0 0 12px rgba(255, 107, 107, 0.8));
            border: 4px solid white;
            box-shadow: 0 0 0 8px rgba(255, 107, 107, 0.2);
          "></div>
          <!-- Pin central -->
          <div style="
            position: relative;
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            z-index: 10;
          "></div>
        </div>
      `,
      className: "uber-destination-marker",
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  }, []);

  // 1️⃣ Inicializar Mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || mapError) return;

    (async () => {
      try {
        console.debug("[MapUber] Importando Leaflet...");
        const L = (await import("leaflet")).default;
        LRef.current = L;

        // Corrigir ícones padrão do Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        console.debug("[MapUber] Inicializando mapa...");

        // Criar mapa com rotação ativada (Leaflet 1.9+)
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          tap: true,
          bearing: 0, // Suporta rotação
        }).setView([-15.78, -47.92], 16);

        // Tile layer escuro
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 20,
          attribution: "",
        }).addTo(mapRef.current);

        // Polyline para o rastro da corrida
        polylineRef.current = L.polyline([], {
          color: "#00ff9f",
          weight: 6,
          opacity: 0.8,
          lineCap: "round",
          lineJoin: "round",
          bubblingMouseEvents: false,
        }).addTo(mapRef.current);

        mapInstanceRef.current = mapRef.current;
        setIsMapReady(true);
        console.debug("[MapUber] ✅ Mapa inicializado");

        // Listener para cliques no mapa (selecionar destino)
        mapRef.current.on("click", (e) => {
          if (onDestinationSelect && !destination) {
            onDestinationSelect({
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              name: "Ponto de destino",
            });
          }
        });

        // Corrigir tamanho do mapa
        setTimeout(() => {
          if (mapRef.current) mapRef.current.invalidateSize();
        }, 200);
      } catch (error) {
        console.error("[MapUber] ❌ Erro ao carregar Leaflet:", error);
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

  // 2️⃣ Rota Dinâmica com Cache
  useEffect(() => {
    const L = LRef.current;
    if (!mapRef.current || !currentPosition || !destination || !L || !isMapReady) return;

    // Se destino é a mesma, usar cache
    if (
      lastDestinationRef.current &&
      lastDestinationRef.current.lat === destination.lat &&
      lastDestinationRef.current.lng === destination.lng &&
      routeCacheRef.current
    ) {
      console.debug("[MapUber] 📍 Usando rota em cache");
      return;
    }

    async function drawRoute() {
      try {
        const route = await getRoute(currentPosition, destination);

        if (!route || route.length === 0) {
          console.warn("[MapUber] Rota vazia");
          return;
        }

        // Armazenar em cache
        routeCacheRef.current = route;
        lastDestinationRef.current = { ...destination };

        // Remover rota anterior
        if (routeRef.current) {
          mapRef.current.removeLayer(routeRef.current);
        }

        // Desenhar nova rota
        routeRef.current = L.polyline(route, {
          color: "#00e0ff",
          weight: 4,
          opacity: 0.6,
          lineCap: "round",
          lineJoin: "round",
          dashArray: "5, 5",
          bubblingMouseEvents: false,
        }).addTo(mapRef.current);

        console.debug(`[MapUber] ✅ Rota com ${route.length} pontos`);
      } catch (error) {
        console.error("[MapUber] Erro ao traçar rota:", error);
      }
    }

    drawRoute();
  }, [destination, currentPosition, isMapReady]);

  // 3️⃣ Seguir Usuário com Rotation (Estilo Uber) - SEM FLICKER
  useEffect(() => {
    const L = LRef.current;
    if (!mapRef.current || !effectivePosition || !L || !isMapReady) return;

    const { lat, lng } = effectivePosition;
    const latlng = [lat, lng];

    // Primeira inicialização: usar setView (sem animação)
    if (!isInitializedRef.current && currentPosition) {
      console.debug("[MapUber] 🗺️ Primeira inicialização no mapa");
      mapRef.current.setView(latlng, 18);
      isInitializedRef.current = true;
      lastMapUpdateRef.current = Date.now();
    }

    // Throttle: só atualizar a cada 200ms (evita flicker)
    const now = Date.now();
    if (now - lastMapUpdateRef.current < MIN_UPDATE_INTERVAL) {
      return;
    }
    lastMapUpdateRef.current = now;

    // 🔄 Animar rotação suavemente
    if (rotationAnimationRef.current) {
      cancelAnimationFrame(rotationAnimationRef.current);
    }

    const targetRotation = heading || 0;
    const currentRot = currentRotationRef.current;
    let startTime = Date.now();
    const animationDuration = 200; // Mais rápido

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Encontrar menor caminho entre ângulos
      let diff = targetRotation - currentRot;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      const newRotation = currentRot + diff * progress;
      currentRotationRef.current = newRotation;

      // Atualizar bearing do mapa
      if (mapRef.current && mapRef.current.setBearing) {
        mapRef.current.setBearing(newRotation);
      }

      if (progress < 1) {
        rotationAnimationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    // Atualizar marcador do usuário
    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, {
        icon: createUserIcon(L, currentRotationRef.current),
        zIndexOffset: 1000,
      }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(latlng);
      markerRef.current.setIcon(createUserIcon(L, currentRotationRef.current));
    }

    // Adaptative Zoom baseado em velocidade
    let targetZoom = 16;
    if (currentSpeed > 15) targetZoom = 16; // Rápido: zoom out
    else if (currentSpeed > 8) targetZoom = 17; // Médio: normal
    else if (currentSpeed > 2) targetZoom = 18; // Lento: zoom ligeiramente in
    else targetZoom = 18; // Parado: manter zoom

    // Atualizar zoom sem animação (suave e sem flicker)
    if (mapRef.current.getZoom() !== targetZoom) {
      mapRef.current.setZoom(targetZoom);
    }

    // Atualizar view sem flyTo agressivo (move suave)
    // Se é primeira vez, já foi feito acima
    if (isInitializedRef.current && currentPosition) {
      // Usar setView sem zoom para apenas mover (muito mais suave)
      mapRef.current.panTo(latlng, { animate: false });
    }
  }, [effectivePosition, heading, currentSpeed, isMapReady, createUserIcon, currentPosition]);

  // 4️⃣ Marcador de Destino
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

    // Calcular distância até destino
    if (currentPosition) {
      const dist = getDistanceSimple(
        currentPosition.lat,
        currentPosition.lng,
        destination.lat,
        destination.lng
      );
      setDistanceToDestination(dist);

      // Calcular ETA (aproximado: dist / velocidade média)
      if (currentSpeed > 0) {
        const etaHours = dist / currentSpeed;
        const etaMins = Math.round(etaHours * 60);
        setEta(etaMins);
      }
    }
  }, [destination, isMapReady, createDestinationIcon, currentPosition, currentSpeed]);

  // 5️⃣ Atualizar Rastro
  useEffect(() => {
    if (!polylineRef.current || !positions || positions.length < 2) return;
    const latLngs = positions.map((p) => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latLngs);
  }, [positions]);

  // 🎮 Controles do Mapa
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
    <div className="w-full h-full relative z-0 bg-slate-900 overflow-hidden group">
      <style>{`
        @keyframes pulse-destination {
          0% {
            filter: drop-shadow(0 0 8px rgba(255, 107, 107, 0.8));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(255, 107, 107, 1));
          }
          100% {
            filter: drop-shadow(0 0 8px rgba(255, 107, 107, 0.8));
          }
        }

        @keyframes pulse-user {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 255, 159, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(0, 255, 159, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 255, 159, 0);
          }
        }

        .uber-user-marker {
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
        }

        .uber-destination-marker {
          filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.4));
        }
      `}</style>

      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ height: "100%", background: "#0f172a" }}
      />

      {/* ERRO DO MAPA */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur z-[999]">
          <div className="text-center">
            <p className="text-red-400 font-bold mb-2">❌ Erro ao carregar mapa</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg"
            >
              🔄 Recarregar
            </button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {!isMapReady && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-900/80 to-black/80 backdrop-blur z-[998]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-semibold">Inicializando mapa...</p>
          </div>
        </div>
      )}

      {/* VINHETA */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.5)] z-[100]" />

      {/* STATUS GPS */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-emerald-500/30 px-3 py-2 rounded-full z-[401] text-xs">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        <span className="text-slate-300 font-medium">GPS Ativo</span>
      </div>

      {/* INFO DE DESTINO (ETA) */}
      {destination && showRouteInfo && (
        <div className="absolute top-20 left-4 bg-slate-900/95 backdrop-blur border border-emerald-500/30 px-4 py-3 rounded-xl z-[401] shadow-lg max-w-xs">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
            🎯 Destino
          </p>
          <p className="text-sm font-semibold text-white mb-2">{destination.name}</p>
          {distanceToDestination !== null && (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>📍 {distanceToDestination.toFixed(2)} km</span>
              {eta !== null && <span>⏱️ ~{eta} min</span>}
            </div>
          )}
        </div>
      )}

      {/* CONTROLES DO MAPA */}
      <div className="absolute bottom-6 right-4 sm:right-6 flex flex-col gap-2 z-[401]">
        {/* Botão Reset Rotation */}
        <button
          onClick={resetRotation}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/80 hover:bg-slate-700 text-cyan-400 rounded-full shadow-lg border border-slate-700/50 transition-all hover:scale-110 active:scale-95"
          title="Resetar rotação"
        >
          <Compass size={18} />
        </button>

        {/* Botão Localização Atual */}
        <button
          onClick={centerMap}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-full shadow-lg hover:shadow-emerald-500/50 transition-all hover:scale-110 active:scale-95"
          title="Minha localização"
        >
          <Navigation size={18} />
        </button>

        {/* Zoom In */}
        <button
          onClick={zoomIn}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full shadow-lg border border-slate-700/50 transition-all hover:scale-110 active:scale-95"
          title="Aumentar zoom"
        >
          <ZoomIn size={18} />
        </button>

        {/* Zoom Out */}
        <button
          onClick={zoomOut}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full shadow-lg border border-slate-700/50 transition-all hover:scale-110 active:scale-95"
          title="Diminuir zoom"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      {/* Instrução de clique */}
      {!destination && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 px-3 py-2 rounded-full text-amber-400 text-xs font-semibold animate-bounce z-[401]">
          👆 Clique no mapa para definir destino
        </div>
      )}
    </div>
  );
};

// Função auxiliar para calcular distância
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
