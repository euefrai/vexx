"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapContainer = ({ positions, currentPosition }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const startPoint = currentPosition || { lat: -15.7801, lng: -47.9292 };

      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([startPoint.lat, startPoint.lng], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        crossOrigin: true
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      polylineRef.current = L.polyline([], { 
        color: "#10b981", 
        weight: 5, 
        opacity: 0.8,
        smoothFactor: 1 
      }).addTo(mapRef.current);

      if (currentPosition) {
        markerRef.current = L.marker([currentPosition.lat, currentPosition.lng], { icon })
          .addTo(mapRef.current);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && polylineRef.current && positions.length > 0) {
      const latLngs = positions.map(pos => [pos.lat, pos.lng]);
      polylineRef.current.setLatLngs(latLngs);
    }
  }, [positions]);

  useEffect(() => {
    if (mapRef.current && currentPosition) {
      const newLatLng = [currentPosition.lat, currentPosition.lng];
      mapRef.current.panTo(newLatLng, { animate: true, duration: 1.5 });

      if (markerRef.current) {
        markerRef.current.setLatLng(newLatLng);
      } else {
        markerRef.current = L.marker(newLatLng, { icon }).addTo(mapRef.current);
      }
    }
  }, [currentPosition]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-slate-800">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default MapContainer;