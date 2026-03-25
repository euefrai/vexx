"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapContainer({ positions, currentPosition }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const mapContainerRef = useRef(null);

  // 🧭 Ícone dinâmico (seta girando)
  const createIcon = (rotation = 0) =>
    L.divIcon({
      html: `
        <div style="
          transform: rotate(${rotation}deg);
          transition: transform 0.2s linear;
        ">
          <div style="
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 20px solid #10b981;
          "></div>
        </div>
      `,
      className: "",
      iconSize: [20, 20],
    });

  // 🗺️ INIT MAP
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !currentPosition) return;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([currentPosition.lat, currentPosition.lng], 17);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);

    polylineRef.current = L.polyline([], {
      color: "#10b981",
      weight: 5,
    }).addTo(mapRef.current);

    markerRef.current = L.marker(
      [currentPosition.lat, currentPosition.lng],
      { icon: createIcon(0) }
    ).addTo(mapRef.current);

  }, [currentPosition]);

  // 📍 ATUALIZA POSIÇÃO + ROTAÇÃO
  useEffect(() => {
    if (!mapRef.current || !currentPosition) return;

    const { lat, lng, heading = 0 } = currentPosition;

    const newLatLng = [lat, lng];

    mapRef.current.panTo(newLatLng, {
      animate: true,
      duration: 1,
    });

    if (markerRef.current) {
      markerRef.current.setLatLng(newLatLng);
      markerRef.current.setIcon(createIcon(heading));
    }

  }, [currentPosition]);

  // 📏 LINHA DO TRAJETO
  useEffect(() => {
    if (!polylineRef.current || !positions?.length) return;

    const latLngs = positions.map((p) => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latLngs);
  }, [positions]);

  return (
    <div className="w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}