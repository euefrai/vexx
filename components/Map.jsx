"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapContainer({ positions, currentPosition }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const mapContainerRef = useRef(null);
  
  const animatedPathRef = useRef([]);
  const animationFrameRef = useRef(null);

  // 🧭 Ícone de Seta customizado
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
            filter: drop-shadow(0 0 8px rgba(0, 255, 159, 0.6));
          "></div>
        </div>
      `,
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

  // 🗺️ Inicialização do Mapa (Dark Mode + Configurações de Trajeto)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([-15.78, -47.92], 13);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 20 }
    ).addTo(mapRef.current);

    // ✅ Aplicando suas configurações de estilo aqui:
    polylineRef.current = L.polyline([], {
      color: "#00ff9f",
      weight: 6,      // Mais visível
      opacity: 0.9,   // Quase sólido
      lineJoin: "round",
      lineCap: "round",
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) mapRef.current.remove();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // 📍 Atualiza Posição e Câmera
  useEffect(() => {
    if (!mapRef.current || !currentPosition) return;

    const { lat, lng, heading = 0 } = currentPosition;
    const latlng = [lat, lng];

    mapRef.current.flyTo(latlng, 17, {
      duration: 1.5,
      easeLinearity: 0.25,
    });

    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { icon: createIcon(heading) }).addTo(mapRef.current);
      markerRef.current.options.currentHeading = heading;
    } else {
      markerRef.current.setLatLng(latlng);
      
      const prevRotation = markerRef.current.options.currentHeading || 0;
      let diff = heading - prevRotation;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      
      const smoothRotation = prevRotation + diff;
      markerRef.current.setIcon(createIcon(smoothRotation));
      markerRef.current.options.currentHeading = smoothRotation;
    }
  }, [currentPosition]);

  // 📏 Linha Animada com Prioridade
  useEffect(() => {
    if (!polylineRef.current || !positions || positions.length < 2) {
        if (positions?.length === 1) {
            const firstPoint = [positions[0].lat, positions[0].lng];
            animatedPathRef.current = [firstPoint];
            polylineRef.current.setLatLngs(animatedPathRef.current);
        }
        return;
    }

    const last = positions[positions.length - 1];
    const prev = positions[positions.length - 2];
    
    let progress = 0;

    function animate() {
      progress += 0.05; 

      if (progress >= 1) progress = 1;

      const lat = prev.lat + (last.lat - prev.lat) * progress;
      const lng = prev.lng + (last.lng - prev.lng) * progress;
      const interpolatedPoint = [lat, lng];

      const currentPath = [...animatedPathRef.current, interpolatedPoint];
      polylineRef.current.setLatLngs(currentPath);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animatedPathRef.current.push([last.lat, last.lng]);
      }
    }

    cancelAnimationFrame(animationFrameRef.current);
    animate();

  }, [positions]);

  return (
    <div className="w-full h-full relative z-0 bg-slate-900 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Vinheta Dark para acabamento Premium */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)] z-[400]" />
    </div>
  );
}