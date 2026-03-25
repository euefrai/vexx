"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapContainer({ positions, currentPosition }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const mapContainerRef = useRef(null);

  // 🧭 Ícone de Seta customizado com transição CSS
  const createIcon = (rotation = 0) =>
    L.divIcon({
      html: `
        <div style="
          transform: rotate(${rotation}deg);
          transition: transform 0.3s ease-out;
          display: flex;
          justify-content: center;
          align-items: center;
        ">
          <div style="
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 20px solid #00ff9f;
            filter: drop-shadow(0 0 5px rgba(0, 255, 159, 0.5));
          "></div>
        </div>
      `,
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10], // Centraliza o ícone no ponto exato
    });

  // 🗺️ Inicializa o Mapa (Rodado apenas uma vez)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Configuração inicial do mapa
    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([-15.78, -47.92], 13);

    // 🌙 TileLayer Dark (CartoDB é excelente para apps escuros)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 20 }
    ).addTo(mapRef.current);

    // Inicializa a linha do trajeto (vazia)
    polylineRef.current = L.polyline([], {
      color: "#00ff9f",
      weight: 5,
      opacity: 0.8,
      lineJoin: "round",
    }).addTo(mapRef.current);

    // Cleanup ao desmontar o componente
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 📍 Atualiza Posição e Câmera (Efeito Suave)
  useEffect(() => {
    if (!mapRef.current || !currentPosition) return;

    const { lat, lng, heading = 0 } = currentPosition;
    const latlng = [lat, lng];

    // 🔍 Movimentação suave da câmera
    mapRef.current.flyTo(latlng, 17, {
      duration: 1.5,
      easeLinearity: 0.25,
    });

    if (!markerRef.current) {
      // Cria o marcador se não existir
      markerRef.current = L.marker(latlng, {
        icon: createIcon(heading),
      }).addTo(mapRef.current);
      // Armazena a rotação atual para suavização futura
      markerRef.current.options.currentHeading = heading;
    } else {
      // Atualiza posição do marcador
      markerRef.current.setLatLng(latlng);

      // 🧭 Lógica de rotação suave do ícone
      const prevRotation = markerRef.current.options.currentHeading || 0;
      
      // Filtro simples para evitar que a seta gire 360 graus loucamente
      let diff = heading - prevRotation;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      
      const smoothRotation = prevRotation + diff;

      markerRef.current.setIcon(createIcon(smoothRotation));
      markerRef.current.options.currentHeading = smoothRotation;
    }
  }, [currentPosition]);

  // 📏 Atualiza o Trajeto (Polyline)
  useEffect(() => {
    if (!polylineRef.current || !positions?.length) return;

    const latLngs = positions.map((p) => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latLngs);
  }, [positions]);

  return (
    <div className="w-full h-full relative z-0 bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Overlay opcional para garantir que o mapa pareça integrado ao app */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] z-[400]" />
    </div>
  );
}