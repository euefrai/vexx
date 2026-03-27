"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Navigation, Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { getRoute } from "@/utils/getRoute";

export default function MapContainer({ positions, currentPosition, destination, onDestinationSelect }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const routeRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const LRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Ícone para marcador de usuário
  const createIcon = (L, rotation = 0) =>
    L.divIcon({
      html: `
        <div style="transform: rotate(${rotation}deg); transition: transform 0.3s ease-out; display: flex; justify-content: center; align-items: center;">
          <div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 20px solid #00ff9f; filter: drop-shadow(0 0 12px rgba(0, 255, 159, 0.8));"></div>
        </div>
      `,
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

  // Ícone para destino
  const createDestinationIcon = (L) =>
    L.divIcon({
      html: `
        <div style="display: flex; justify-content: center; align-items: center; animation: pulse 2s infinite;">
          <div style="width: 20px; height: 20px; background: radial-gradient(circle, #ff6b6b, #ff0000); border-radius: 50%; filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.8)); border: 3px solid white;"></div>
        </div>
      `,
      className: "",
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

  // 1. Inicializa o Mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      LRef.current = L;

      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        tap: true,
      }).setView([-15.78, -47.92], 14);

      // Camada de tile (mapa escuro)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
        attribution: "",
      }).addTo(mapRef.current);

      // Rastro da corrida
      polylineRef.current = L.polyline([], {
        color: "#00ff9f",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);

      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 200);

      setIsMapReady(true);

      // Adiciona listener para cliques no mapa
      mapRef.current.on("click", (e) => {
        if (onDestinationSelect) {
          onDestinationSelect({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            name: "Ponto de destino",
          });
        }
      });
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, [onDestinationSelect]);

  // 2. Rota automática
  useEffect(() => {
    const L = LRef.current;
    if (!mapRef.current || !currentPosition || !destination || !L || !isMapReady) return;

    async function drawRoute() {
      try {
        const route = await getRoute(currentPosition, destination);
        if (!route || route.length === 0) return;

        if (routeRef.current) {
          mapRef.current.removeLayer(routeRef.current);
        }

        routeRef.current = L.polyline(route, {
          color: "#00e0ff",
          weight: 5,
          opacity: 0.8,
          lineCap: "round",
          lineJoin: "round",
          dashArray: "5, 5",
        }).addTo(mapRef.current);

        const bounds = L.latLngBounds([
          [currentPosition.lat, currentPosition.lng],
          [destination.lat, destination.lng],
        ]);
        mapRef.current.fitBounds(bounds, { padding: [80, 80] });
      } catch (error) {
        console.error("Erro ao traçar rota:", error);
      }
    }

    drawRoute();
  }, [destination, currentPosition, isMapReady]);

  // 3. Atualiza posição do usuário
  useEffect(() => {
    const L = LRef.current;
    if (!mapRef.current || !currentPosition || !L || !isMapReady) return;

    const { lat, lng, heading = 0 } = currentPosition;
    const latlng = [lat, lng];

    if (!destination) {
      mapRef.current.flyTo(latlng, 16, { duration: 1.5 });
    }

    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { icon: createIcon(L, heading) }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(latlng);
      markerRef.current.setIcon(createIcon(L, heading));
    }
  }, [currentPosition, destination, isMapReady]);

  // 4. Adiciona marcador de destino
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
  }, [destination, isMapReady]);

  // 5. Atualiza rastro da corrida
  useEffect(() => {
    if (!polylineRef.current || !positions || positions.length < 2) return;
    const latLngs = positions.map((p) => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latLngs);
  }, [positions]);

  // Funções de controle do mapa
  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const centerMap = () => {
    if (currentPosition && mapRef.current) {
      mapRef.current.flyTo([currentPosition.lat, currentPosition.lng], 16, { duration: 0.8 });
    }
  };

  return (
    <div className="w-full h-full relative z-0 bg-slate-900 overflow-hidden group">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: "100vh", background: "#0f172a" }}
      />

      {/* Vinheta */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)] z-[100]" />

      {/* Status GPS */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-emerald-500/30 px-3 py-2 rounded-full z-[401] text-xs sm:text-sm">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        <span className="text-slate-300 font-medium">GPS Online</span>
      </div>

      {/* CONTROLES DO MAPA */}
      <div className="absolute bottom-6 right-4 sm:right-6 flex flex-col gap-2 z-[401]">
        {/* Botão de Localização Atual */}
        <button
          onClick={centerMap}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-full shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-110 active:scale-95"
          title="Centralizar em minha localização"
        >
          <Navigation size={18} />
        </button>

        {/* Zoom In */}
        <button
          onClick={zoomIn}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full shadow-lg border border-slate-700/50 transition-all duration-300 transform hover:scale-110 active:scale-95"
          title="Aumentar zoom"
        >
          <ZoomIn size={18} />
        </button>

        {/* Zoom Out */}
        <button
          onClick={zoomOut}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full shadow-lg border border-slate-700/50 transition-all duration-300 transform hover:scale-110 active:scale-95"
          title="Diminuir zoom"
        >
          <ZoomOut size={18} />
        </button>

        {/* Símbolo de Clique */}
        {!destination && (
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/50 animate-pulse text-xs font-bold text-center leading-none">
            👆
          </div>
        )}
      </div>

      {/* INFO DE DESTINO */}
      {destination && (
        <div className="absolute top-20 left-4 sm:left-6 bg-slate-900/95 backdrop-blur border border-cyan-500/30 px-4 py-3 rounded-xl z-[401] max-w-xs">
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">🎯 Destino Definido</p>
          <p className="text-sm font-semibold text-white">{destination.name}</p>
        </div>
      )}

      {/* TOOLTIP DE INTERAÇÃO */}
      {!destination && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur border border-slate-700/50 px-4 py-2 rounded-full z-[400] text-center animate-bounce hidden sm:block">
          <p className="text-xs text-slate-300 font-medium">Clique no mapa para definir destino</p>
        </div>
      )}
    </div>
  );
}