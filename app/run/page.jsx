"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRoute } from "@/utils/getRoute";

export default function MapContainer({ positions, currentPosition, destination }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const routeRef = useRef(null);
  const mapContainerRef = useRef(null);

  // 🧭 Ícone de Seta
  const createIcon = (rotation = 0) =>
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

  // 1. 🗺️ Inicializa o Mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([-15.78, -47.92], 13);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { 
      maxZoom: 20 
    }).addTo(mapRef.current);

    // Rastro da Corrida (Verde Neon)
    polylineRef.current = L.polyline([], {
      color: "#00ff9f",
      weight: 6,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  // 2. 🛣️ ROTA AUTOMÁTICA (Baseada no SearchBox)
  useEffect(() => {
    if (!mapRef.current || !currentPosition || !destination) return;

    async function drawRoute() {
      const route = await getRoute(currentPosition, destination);

      if (!route || route.length === 0) return;

      if (routeRef.current) {
        mapRef.current.removeLayer(routeRef.current);
      }

      // Desenha a rota azul com o efeito de brilho CSS
      routeRef.current = L.polyline(route, {
        color: "#00e0ff",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
        className: "route-glow" // Ativa o filtro do globals.css
      }).addTo(mapRef.current);

      // Opcional: Ajusta o zoom para mostrar a rota inteira ao selecionar
      const bounds = L.latLngBounds([
        [currentPosition.lat, currentPosition.lng],
        [destination.lat, destination.lng]
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    drawRoute();
  }, [destination, currentPosition]);

  // 3. 📍 Atualiza Posição do Usuário
  useEffect(() => {
    if (!mapRef.current || !currentPosition) return;

    const { lat, lng, heading = 0 } = currentPosition;
    const latlng = [lat, lng];

    // Se NÃO houver destino selecionado, mantém o foco no usuário
    if (!destination) {
      mapRef.current.flyTo(latlng, 17, { duration: 1.5 });
    }

    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { icon: createIcon(heading) }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(latlng);
      markerRef.current.setIcon(createIcon(heading));
    }
  }, [currentPosition, destination]);

  // 4. 📏 Atualiza o Rastro da Corrida
  useEffect(() => {
    if (!polylineRef.current || !positions || positions.length < 2) return;
    const latLngs = positions.map(p => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latLngs);
  }, [positions]);

  return (
    <div className="w-full h-full relative z-0 bg-slate-900 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)] z-[400]" />
    </div>
  );
}