"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getDistance } from "@/utils/haversine";

export function useTracker() {
  const [isActive, setIsActive] = useState(false);
  const [distance, setDistance] = useState(0); 
  const [time, setTime] = useState(0); 
  
  // No JS puro, iniciamos o useRef apenas com o valor inicial (null ou array vazio)
  const positionsRef = useRef([]);
  const watchId = useRef(null);
  const timerId = useRef(null);

  // ⏱️ Lógica do Cronômetro
  useEffect(() => {
    if (isActive) {
      timerId.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerId.current) clearInterval(timerId.current);
    }

    return () => {
      if (timerId.current) clearInterval(timerId.current);
    };
  }, [isActive]);

  // 📍 Lógica do GPS
  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      alert("Geolocalização não suportada no seu navegador.");
      return;
    }

    setIsActive(true);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude, timestamp: Date.now() };

        const lastPos = positionsRef.current[positionsRef.current.length - 1];

        if (lastPos) {
          const newDist = getDistance(lastPos.lat, lastPos.lng, latitude, longitude);
          
          // Anti-ruído: só conta se houver deslocamento real (> 3 metros)
          if (newDist > 0.003) { 
            setDistance((prev) => prev + newDist);
            positionsRef.current.push(newPos);
          }
        } else {
          // Primeira posição registrada
          positionsRef.current.push(newPos);
        }
      },
      (error) => console.error("Erro no GPS:", error),
      { 
        enableHighAccuracy: true, 
        maximumAge: 1000,         
        timeout: 5000 
      }
    );
  }, []);

  const pauseTracking = useCallback(() => {
    setIsActive(false);
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const resetTracking = useCallback(() => {
    pauseTracking();
    setDistance(0);
    setTime(0);
    positionsRef.current = [];
  }, [pauseTracking]);

  // ⚡ Ritmo (Pace) em min/km
  const getPace = () => {
    if (distance <= 0 || time <= 0) return "0:00";
    
    const paceDecimal = (time / 60) / distance; 
    const minutes = Math.floor(paceDecimal);
    const seconds = Math.round((paceDecimal - minutes) * 60);
    
    if (minutes > 59) return "--:--"; 
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isActive,
    distance,
    time,
    startTracking,
    pauseTracking,
    resetTracking,
    pace: getPace(),
    positions: positionsRef.current
  };
}