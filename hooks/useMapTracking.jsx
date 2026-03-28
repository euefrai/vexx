"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getDistance } from "@/utils/haversine";

/**
 * Hook unificado para rastreamento de corrida tipo Uber
 * Combina GPS tracking, cálculo de bearing, rota e métricas em um único place
 */
export function useMapTracking() {
  // ▶️ ESTADO PRINCIPAL
  const [isActive, setIsActive] = useState(false);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [heading, setHeading] = useState(0); // Para rotação do mapa
  const [currentSpeed, setCurrentSpeed] = useState(0); // Velocidade em tempo real
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [isGPSConnected, setIsGPSConnected] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  // 🔄 REFS (não causam re-render)
  const positionsRef = useRef([]);
  const watchIdRef = useRef(null);
  const timerIdRef = useRef(null);
  const speedHistoryRef = useRef([]);
  const lastUpdateRef = useRef(0);
  const gpsRetryRef = useRef(0);
  const maxGpsRetriesRef = useRef(3);

  // 🧭 Cálculo de Bearing (Direção entre dois pontos)
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

  // 📊 Cálculo de velocidade média
  const calculateAverageSpeed = useCallback((totalDistance, totalTime) => {
    if (totalTime <= 0 || totalDistance <= 0) return 0;
    return totalDistance / (totalTime / 3600); // km/h
  }, []);

  // 📍 Inicialização - Pega localização inicial com retry
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.error("[MapTracking] ❌ Geolocation não disponível");
      return;
    }

    const getInitialPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          console.debug(`[MapTracking] ✅ Posição inicial: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

          const initialPos = {
            lat: latitude,
            lng: longitude,
            timestamp: Date.now(),
            heading: 0,
            speed: 0,
          };

          positionsRef.current = [initialPos];
          setCurrentPosition(initialPos);
          setGpsAccuracy(accuracy);
          setIsGPSConnected(true);
          gpsRetryRef.current = 0;
        },
        (error) => {
          console.warn(`[MapTracking] ⚠️ Erro posição inicial: ${error.message}`);
          if (gpsRetryRef.current < maxGpsRetriesRef.current) {
            gpsRetryRef.current++;
            console.log(`[MapTracking] Retry ${gpsRetryRef.current}/${maxGpsRetriesRef.current}...`);
            setTimeout(getInitialPosition, 2000);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    };

    getInitialPosition();
  }, []);

  // ⏱️ Timer para cronômetro
  useEffect(() => {
    if (isActive) {
      timerIdRef.current = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          // Atualizar velocidade média a cada segundo
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

  // 🎯 Iniciar rastreamento com watchPosition
  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      console.error("[MapTracking] ❌ Geolocation não disponível");
      return;
    }

    console.debug("[MapTracking] ▶️ Iniciando rastreamento...");
    setIsActive(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: gpsSpeed, accuracy, heading: gpsHeading } = pos.coords;
        const now = Date.now();

        // Throttle: não processar mais de uma vez a cada 500ms
        if (now - lastUpdateRef.current < 500) return;
        lastUpdateRef.current = now;

        try {
          const lastPos = positionsRef.current[positionsRef.current.length - 1];

          if (lastPos) {
            const dist = getDistance(lastPos.lat, lastPos.lng, latitude, longitude);
            const timeDiffSeconds = (now - lastPos.timestamp) / 1000;

            // Cálculo de velocidade: Prioriza GPS
            const velocity = gpsSpeed !== null && gpsSpeed !== undefined
              ? gpsSpeed * 3.6  // m/s -> km/h
              : dist > 0
                ? (dist / (timeDiffSeconds / 3600))
                : 0;

            // Cálculo de bearing
            const calculatedBearing = dist > 0.001
              ? calculateBearing(lastPos.lat, lastPos.lng, latitude, longitude)
              : (gpsHeading ?? lastPos.heading ?? 0);

            // Filtro anti-ruído: só registra se mover mais de 2 metros
            if (dist > 0.002) {
              setDistance((prev) => prev + dist);

              const newPos = {
                lat: latitude,
                lng: longitude,
                timestamp: now,
                heading: calculatedBearing,
                speed: Math.max(0, velocity),
              };

              positionsRef.current.push(newPos);
              setCurrentPosition(newPos);
              setHeading(calculatedBearing);
              setCurrentSpeed(Math.max(0, velocity));
              setGpsAccuracy(accuracy);
              setIsGPSConnected(true);
              gpsRetryRef.current = 0;

              // Log a cada 10 pontos
              if (positionsRef.current.length % 10 === 0) {
                console.debug(
                  `[MapTracking] 📍 ${positionsRef.current.length} pontos | ` +
                  `dist=${dist.toFixed(3)}km | vel=${velocity.toFixed(1)}km/h | ` +
                  `bearing=${calculatedBearing.toFixed(0)}° | acc=${accuracy}m`
                );
              }

              // Manter histórico de velocidades (últimos 60 segundos)
              speedHistoryRef.current.push({
                speed: velocity,
                timestamp: now,
              });
              speedHistoryRef.current = speedHistoryRef.current.filter(
                (s) => now - s.timestamp < 60000
              );
            }
          }
        } catch (error) {
          console.error("[MapTracking] Erro ao processar posição:", error);
        }
      },
      (error) => {
        console.warn(`[MapTracking] ⚠️ watchPosition error: ${error.message}`);
        setIsGPSConnected(false);

        // Retry se falha
        if (gpsRetryRef.current < maxGpsRetriesRef.current && isActive) {
          gpsRetryRef.current++;
          setTimeout(() => {
            console.log(`[MapTracking] Retry ${gpsRetryRef.current}/${maxGpsRetriesRef.current}...`);
            startTracking();
          }, 3000);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 500,
        timeout: 8000,
      }
    );
  }, [calculateBearing]);

  // ⏸️ Pausar rastreamento
  const pauseTracking = useCallback(() => {
    console.debug("[MapTracking] ⏸️ Pausando rastreamento...");
    setIsActive(false);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // 🔄 Resetar tudo
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
    console.debug("[MapTracking] 🔄 Rastreamento resetado");
  }, [pauseTracking]);

  // 📊 Cálculo de Ritmo (Pace)
  const getPace = useCallback(() => {
    if (distance <= 0 || time <= 0) return "0:00";
    const paceDecimal = (time / 60) / distance;
    const min = Math.floor(paceDecimal);
    const sec = Math.round((paceDecimal - min) * 60);
    return min > 59 ? "--:--" : `${min}:${sec.toString().padStart(2, "0")}`;
  }, [distance, time]);

  // 📈 Cálculo de calorias
  const getCalories = useCallback(() => {
    return Math.round(distance * 63);
  }, [distance]);

  // 🏃 Cálculo de velocidade máxima
  const getMaxSpeed = useCallback(() => {
    if (positionsRef.current.length === 0) return 0;
    return Math.max(...positionsRef.current.map((p) => p.speed || 0));
  }, []);

  return {
    // Estado
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

    // Métodos
    startTracking,
    pauseTracking,
    resetTracking,

    // Cálculos
    pace: getPace(),
    calories: getCalories(),
    maxSpeed: getMaxSpeed(),

    // Para debug
    positionCount: positionsRef.current.length,
  };
}
