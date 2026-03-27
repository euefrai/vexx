"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { getRoute } from "@/utils/getRoute";

export default function MapContainer({ positions, currentPosition, destination }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const routeRef = useRef(null);
  const mapContainerRef = useRef(null);
  const LRef = useRef(null);

  // 🧭 Função auxiliar para ícone (agora recebe L como argumento)
  const createIcon = (L, rotation = 0) =>
    L.divIcon({
      html: `
        <div style="transform: rotate(${rotation}deg); transition: transform 0.3s ease-out; display: flex; justify-content: center; align-items: center;">
          <div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 20px solid #00ff9f; filter: drop-shadow(0 0 8px rgba(0, 255, 159, 0.6));"></div>
        </div>
      `,
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

  // 1. 🗺️ Inicializa o Mapa (Build-Safe + Correção de Tela Preta)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      LRef.current = L;

      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([-15.78, -47.92], 13);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { 
        maxZoom: 20 
      }).addTo(mapRef.current);

      // 🔥 Força o Leaflet a reconhecer o tamanho do container após o render
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 200);

      // Rastro da Corrida (Verde Neon)
      polylineRef.current = L.polyline([], {
        color: "#00ff9f",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  // 2. 🛣️ ROTA AUTOMÁTICA (Destino via SearchBox ou Clique)
  useEffect(() => {
    const L = LRef.current;
    if (!mapRef.current || !currentPosition || !destination || !L) return;

    async function drawRoute() {
      try {
        const route = await getRoute(currentPosition, destination);
        if (!route || route.length === 0) return;

        if (routeRef.current) {
          mapRef.current.removeLayer(routeRef.current);
        }

        routeRef.current = L.polyline(route, {
          color: "#00e0ff",
          weight: 6,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
          className: "route-glow"
        }).addTo(mapRef.current);

        const bounds = L.latLngBounds([
          [currentPosition.lat, currentPosition.lng],
          [destination.lat, destination.lng]
        ]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } catch (error) {
        console.error("Erro ao traçar rota:", error);
      }
    }

    drawRoute();
  }, [destination, currentPosition]);

  // 3. 📍 Atualiza Posição e Marcador
  useEffect(() => {
    const L = LRef.current;
    if (!mapRef.current || !currentPosition || !L) return;

    const { lat, lng, heading = 0 } = currentPosition;
    const latlng = [lat, lng];

    // Só foca automaticamente se não estiver visualizando uma rota
    if (!destination) {
      mapRef.current.flyTo(latlng, 17, { duration: 1.5 });
    }

    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { icon: createIcon(L, heading) }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(latlng);
      markerRef.current.setIcon(createIcon(L, heading));
    }
  }, [currentPosition, destination]);

  // 4. 📏 Atualiza o Rastro da Corrida
  useEffect(() => {
    if (!polylineRef.current || !positions || positions.length < 2) return;
    const latLngs = positions.map(p => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latLngs);
  }, [positions]);

  return (
    <div className="w-full h-full relative z-0 bg-slate-900 overflow-hidden group">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full transition-all duration-300" 
        style={{ 
          minHeight: '100vh', 
          background: '#0f172a',
        }} 
      />
      
      {/* Vinheta Dark para acabamento Premium */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)] z-[400]" />
      
      {/* Orla com brilho neon */}
      <div className="absolute inset-0 pointer-events-none border border-transparent group-hover:shadow-[inset_0_0_40px_rgba(0,255,159,0.1)] rounded-lg transition-shadow duration-300 z-[400]" />
      
      {/* Indicador de status */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-2 rounded-full border border-slate-700/50 z-[401] text-xs sm:text-sm">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        <span className="text-slate-300 font-medium">GPS Ativo</span>
      </div>
    </div>
  );
}