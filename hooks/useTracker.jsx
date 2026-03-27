"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getDistance } from "@/utils/haversine";

export function useTracker() {
  const [isActive, setIsActive] = useState(false);
  const [distance, setDistance] = useState(0); // km
  const [time, setTime] = useState(0); // segundos
  const [currentPosition, setCurrentPosition] = useState(null);

  const positionsRef = useRef([]);
  const watchId = useRef(null);
  const timerId = useRef(null);

  // 🧭 Lógica para calcular Direção (Bearing)
  const getBearing = (lat1, lng1, lat2, lng2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    const dLng = toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);

    const brng = Math.atan2(y, x);
    return (toDeg(brng) + 360) % 360;
  };

  // 📍 Pega localização inicial automática ao carregar
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (positionsRef.current.length === 0) {
          const initialPos = {
            lat: latitude,
            lng: longitude,
            timestamp: Date.now(),
            heading: 0,
            speed: 0
          };
          positionsRef.current = [initialPos];
          setCurrentPosition(initialPos);
        }
      },
      (err) => console.error("Erro na posição inicial:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  // ⏱️ Timer (Cronômetro)
  useEffect(() => {
    if (isActive) {
      timerId.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerId.current) clearInterval(timerId.current);
    }
    return () => clearInterval(timerId.current);
  }, [isActive]);

  // 📍 Lógica Principal de Tracking (Unificada)
  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) return;

    setIsActive(true);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        const now = Date.now();
        
        const lastPos = positionsRef.current[positionsRef.current.length - 1];

        if (lastPos) {
          const dist = getDistance(lastPos.lat, lastPos.lng, latitude, longitude);
          const timeDiffSeconds = (now - lastPos.timestamp) / 1000;

          // Cálculo de velocidade: Prioriza GPS (m/s -> km/h), senão calcula via distância
          const velocity = speed !== null ? speed * 3.6 : (dist / (timeDiffSeconds / 3600));

          // Cálculo de direção
          const heading = getBearing(lastPos.lat, lastPos.lng, latitude, longitude);

          // Filtro anti-ruído (só registra se mover mais de 3 metros)
          if (dist > 0.003) {
            setDistance((prev) => prev + dist);
            const newPos = {
              lat: latitude,
              lng: longitude,
              timestamp: now,
              heading: heading,
              speed: velocity > 0 ? velocity : 0,
            };
            positionsRef.current.push(newPos);
            setCurrentPosition(newPos);
          }
        } else {
          // Registro caso a lista esteja vazia
          const newPos = {
            lat: latitude,
            lng: longitude,
            timestamp: now,
            heading: 0,
            speed: 0,
          };
          positionsRef.current.push(newPos);
          setCurrentPosition(newPos);
        }
      },
      (err) => console.error("Erro no watchPosition:", err),
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
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

  // ⚡ Cálculo de Ritmo (Pace)
  const getPace = () => {
    if (distance <= 0 || time <= 0) return "0:00";
    const paceDecimal = (time / 60) / distance;
    const min = Math.floor(paceDecimal);
    const sec = Math.round((paceDecimal - min) * 60);
    return min > 59 ? "--:--" : `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return {
    isActive,
    distance,
    time,
    startTracking,
    pauseTracking,
    resetTracking,
    pace: getPace(),
    positions: positionsRef.current,
    currentPosition,
  };
}