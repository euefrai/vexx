"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Corrige o bug dos ícones do Leaflet no Next.js/Webpack
// (Os caminhos dos ícones padrão quebram no build)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Position {
  lat: number;
  lng: number;
}

interface MapProps {
  positions: Position[];
  currentPosition: Position | null;
}

const MapContainer: React.FC<MapProps> = ({ positions, currentPosition }) => {
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // 1. Inicializa o mapa apenas na primeira renderização
    if (!mapRef.current) {
      // Centraliza no Brasil por padrão ou na posição atual se existir
      const startPoint = currentPosition || { lat: -15.7801, lng: -47.9292 };

      mapRef.current = L.map("map", {
        zoomControl: false, // Vamos adicionar depois no canto certo
        attributionControl: false // Limpa a barra inferior
      }).setView([startPoint.lat, startPoint.lng], 16);

      // 2. Adiciona a camada de tiles do OpenStreetMap (ONLINE)
      // 💡 Para funcionar OFFLINE, você precisará configurar um Service Worker (PWA)
      // para fazer cache das URLs que começam com 'tile.openstreetmap.org'
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        crossOrigin: true // Importante para o cache do Service Worker
      }).addTo(mapRef.current);

      // Adiciona controle de zoom no canto inferior direito
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      // 3. Inicializa a linha da rota (vazia)
      polylineRef.current = L.polyline([], { 
        color: "#10b981", // emerald-500
        weight: 5, 
        opacity: 0.8,
        smoothFactor: 1 
      }).addTo(mapRef.current);

      // 4. Inicializa o marcador da posição atual
      if (currentPosition) {
        markerRef.current = L.marker([currentPosition.lat, currentPosition.lng], { icon })
          .addTo(mapRef.current);
      }
    }

    // Cleanup function: destrói o mapa se o componente sair da tela
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Executa apenas uma vez

  // ✨ Atualização EM TEMPO REAL
  useEffect(() => {
    if (mapRef.current && polylineRef.current) {
      // Converte [{lat, lng}] para [[lat, lng]] que o Leaflet entende
      const latLngs = positions.map(pos => [pos.lat, pos.lng] as L.LatLngTuple);
      polylineRef.current.setLatLngs(latLngs);
      
      // Se tivermos pontos, ajusta o mapa para mostrar toda a rota automaticamente
      if (latLngs.length > 1) {
         // mapRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [20, 20] });
      }
    }
  }, [positions]); // Roda sempre que a rota mudar

  // ✨ Atualização do Marcador e Centralização
  useEffect(() => {
    if (mapRef.current && currentPosition) {
      const newLatLng: L.LatLngTuple = [currentPosition.lat, currentPosition.lng];
      
      // Move o mapa para a nova posição (suavemente)
      mapRef.current.panTo(newLatLng);

      // Atualiza ou cria o marcador
      if (markerRef.current) {
        markerRef.current.setLatLng(newLatLng);
      } else {
         markerRef.current = L.marker(newLatLng, { icon }).addTo(mapRef.current);
      }
    }
  }, [currentPosition]); // Roda sempre que a posição atual mudar

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-700 shadow-inner">
      <div id="map" className="w-full h-full z-0" />
      
      {/* Overlay gradiente opcional para UX */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default MapContainer;