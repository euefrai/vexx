"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getDistance } from "@/utils/haversine";

export function useTracker() {
  const [isActive, setIsActive] = useState(false);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);

  const positionsRef = useRef([]);
  const watchId = useRef(null);
  const timerId = useRef(null);

  // 📍 PEGA LOCALIZAÇÃO INICIAL AUTOMÁTICA
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        positionsRef.current = [
          {
            lat: latitude,
            lng: longitude,
            timestamp: Date.now(),
          },
        ];
      },
      (err) => console.log(err),
      { enableHighAccuracy: true }
    );
  }, []);

  // ⏱️ TIMER
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

  // 🧭 CALCULAR DIREÇÃO (bearing)
  const getBearing = (lat1, lng1, lat2, lng2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    const dLng = toRad(lng2 - lng1);

    const y = Math.sin(dLng) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.cos(dLng);

    const brng = Math.atan2(y, x);
    return (toDeg(brng) + 360) % 360;
  };

  // 📍 TRACKING
  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) return;

    setIsActive(true);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        const lastPos =
          positionsRef.current[positionsRef.current.length - 1];

        let heading = 0;

        if (lastPos) {
          heading = getBearing(
            lastPos.lat,
            lastPos.lng,
            latitude,
            longitude
          );

          const dist = getDistance(
            lastPos.lat,
            lastPos.lng,
            latitude,
            longitude
          );

          if (dist > 0.003) {
            setDistance((prev) => prev + dist);
            positionsRef.current.push({
              lat: latitude,
              lng: longitude,
              timestamp: Date.now(),
              heading,
            });
          }
        } else {
          positionsRef.current.push({
            lat: latitude,
            lng: longitude,
            timestamp: Date.now(),
            heading,
          });
        }
      },
      (err) => console.log(err),
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );
  }, []);

  const pauseTracking = useCallback(() => {
    setIsActive(false);
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
    }
  }, []);

  const resetTracking = useCallback(() => {
    pauseTracking();
    setDistance(0);
    setTime(0);
    positionsRef.current = [];
  }, [pauseTracking]);

  const getPace = () => {
    if (distance <= 0 || time <= 0) return "0:00";

    const pace = (time / 60) / distance;
    const min = Math.floor(pace);
    const sec = Math.round((pace - min) * 60);

    return `${min}:${sec.toString().padStart(2, "0")}`;
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
  };
}