"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getDistance } from "@/utils/haversine";

/**
 * Hook unificado para rastreamento de corrida de alta fidelidade
 * Características:
 * - Separação entre posicionamento do marcador (tempo real sensível) e cálculo de rota (filtrado anti-ruído)
 * - Tolerância de precisão calibrada para navegadores web móveis/desktops (150m)
 * - Auto-recuperação de conexão GPS
 */
export function useMapTracking() {
  const [isActive, setIsActive] = useState(false);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [heading, setHeading] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [isGPSConnected, setIsGPSConnected] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const positionsRef = useRef([]);
  const watchIdRef = useRef(null);
  const timerIdRef = useRef(null);
  const speedHistoryRef = useRef([]);
  const lastUpdateRef = useRef(0);
  const gpsRetryRef = useRef(0);
  const maxGpsRetriesRef = useRef(4);

  const calculateBearing = useCallback((lat1, lng1, lat2, lng2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    const dLng = toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);

    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }, []);

  const calculateAverageSpeed = useCallback((totalDistance, totalTime) => {
    if (totalTime <= 0 || totalDistance <= 0) return 0;
    return totalDistance / (totalTime / 3600);
  }, []);

  // Obter localização inicial e centralizar marcador
  const queryInitialLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const initialPos = {
          lat: latitude,
          lng: longitude,
          timestamp: Date.now(),
          heading: 0,
          speed: 0,
        };

        if (positionsRef.current.length === 0) {
          positionsRef.current = [initialPos];
        }
        
        setCurrentPosition(initialPos);
        setGpsAccuracy(accuracy);
        setIsGPSConnected(true);
        gpsRetryRef.current = 0;
      },
      (error) => {
        console.warn(`[GPS Init] Falha na obtenção da localização inicial: ${error.message}`);
        if (gpsRetryRef.current < maxGpsRetriesRef.current) {
          gpsRetryRef.current++;
          setTimeout(queryInitialLocation, 2500);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    queryInitialLocation();
  }, [queryInitialLocation]);

  // Cronômetro de treino
  useEffect(() => {
    if (isActive) {
      timerIdRef.current = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          setAvgSpeed(calculateAverageSpeed(distance, newTime));
          return newTime;
        });
      }, 1000);
    } else {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    }

    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    };
  }, [isActive, distance, calculateAverageSpeed]);

  // Rastreamento Contínuo
  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) return;

    setIsActive(true);
    setIsGPSConnected(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: gpsSpeed, accuracy, heading: gpsHeading } = pos.coords;
        const now = Date.now();

        // Throttle para poupar processador
        if (now - lastUpdateRef.current < 1000) return;

        // Filtro calibrado: Ignorar apenas anomalias críticas (>150 metros)
        if (accuracy > 150) {
          console.warn(`[GPS Noise] Ponto ignorado devido a baixa precisão (${accuracy}m)`);
          return;
        }

        lastUpdateRef.current = now;

        try {
          const freshSpeed = gpsSpeed !== null && gpsSpeed !== undefined
            ? Math.max(0, gpsSpeed * 3.6)
            : 0;

          const freshPos = {
            lat: latitude,
            lng: longitude,
            timestamp: now,
            heading: gpsHeading ?? heading ?? 0,
            speed: freshSpeed,
            accuracy,
          };

          // 🎯 ATUALIZAÇÃO IMEDIATA DO MARCADOR DO MAPA (Sem atraso ou filtro anti-ruído)
          setCurrentPosition(freshPos);
          setGpsAccuracy(accuracy);
          setIsGPSConnected(true);
          gpsRetryRef.current = 0;

          const lastPos = positionsRef.current[positionsRef.current.length - 1];

          if (lastPos) {
            const dist = getDistance(lastPos.lat, lastPos.lng, latitude, longitude);
            const timeDiffSeconds = (now - lastPos.timestamp) / 1000;

            const velocity = gpsSpeed !== null && gpsSpeed !== undefined
              ? gpsSpeed * 3.6
              : dist > 0
                ? (dist / (timeDiffSeconds / 3600))
                : 0;

            const calculatedBearing = dist > 0.003
              ? calculateBearing(lastPos.lat, lastPos.lng, latitude, longitude)
              : (gpsHeading ?? lastPos.heading ?? 0);

            // 📍 FILTRO DE ROTA: Apenas insere no traçado se houver movimento (>3m) e o treino estiver rodando
            if (dist > 0.003 && isActive) {
              setDistance((prev) => prev + dist);
              setHeading(calculatedBearing);
              setCurrentSpeed(Math.max(0, velocity));

              const newPathPos = {
                lat: latitude,
                lng: longitude,
                timestamp: now,
                heading: calculatedBearing,
                speed: Math.max(0, velocity),
              };

              positionsRef.current.push(newPathPos);

              speedHistoryRef.current.push({ speed: velocity, timestamp: now });
              speedHistoryRef.current = speedHistoryRef.current.filter((s) => now - s.timestamp < 60000);
            }
          } else {
            // Primeiro ponto da rota de treino ativo
            if (isActive) {
              positionsRef.current.push(freshPos);
            }
          }
        } catch (error) {
          console.error("[GPS Tracking] Erro ao atualizar coordenadas:", error);
        }
      },
      (error) => {
        console.warn(`[GPS Watch] Falha ao rastrear: ${error.message}`);
        setIsGPSConnected(false);

        // Tentativa de reconexão automática
        if (gpsRetryRef.current < maxGpsRetriesRef.current && isActive) {
          gpsRetryRef.current++;
          setTimeout(() => {
            if (isActive) startTracking();
          }, 3000);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 9000,
      }
    );
  }, [isActive, heading, calculateBearing]);

  const pauseTracking = useCallback(() => {
    setIsActive(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const resetTracking = useCallback(() => {
    pauseTracking();
    setDistance(0);
    setTime(0);
    setCurrentSpeed(0);
    setAvgSpeed(0);
    setHeading(0);
    positionsRef.current = [];
    speedHistoryRef.current = [];
    gpsRetryRef.current = 0;
  }, [pauseTracking]);

  const getPace = useCallback(() => {
    if (distance <= 0 || time <= 0) return "0:00";
    const paceDecimal = (time / 60) / distance;
    const min = Math.floor(paceDecimal);
    const sec = Math.round((paceDecimal - min) * 60);
    return min > 59 ? "--:--" : `${min}:${sec.toString().padStart(2, "0")}`;
  }, [distance, time]);

  const getCalories = useCallback(() => {
    return Math.round(distance * 68);
  }, [distance]);

  const getMaxSpeed = useCallback(() => {
    if (positionsRef.current.length === 0) return 0;
    return Math.max(...positionsRef.current.map((p) => p.speed || 0));
  }, []);

  return {
    isActive,
    distance,
    time,
    currentPosition,
    heading,
    currentSpeed,
    avgSpeed,
    isGPSConnected,
    gpsAccuracy,
    positions: positionsRef.current,
    startTracking,
    pauseTracking,
    resetTracking,
    pace: getPace(),
    calories: getCalories(),
    maxSpeed: getMaxSpeed(),
    positionCount: positionsRef.current.length,
  };
}
