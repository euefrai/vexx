"use client";

import React, { useMemo } from "react";
import { Play, Pause, RotateCcw, TrendingUp, Gauge } from "lucide-react";
import RunChart from "./RunChart";
import RunStats from "./RunStats";

export default function RunTracker({
  isActive,
  distance,
  time,
  pace,
  positions = [],
  startTracking,
  pauseTracking,
  resetTracking,
  currentSpeed = 0,
  avgSpeed = 0,
  maxSpeed = 0,
  isGPSConnected = true,
}) {
  // Memoize cálculos para evitar re-renderings desnecessários
  const metrics = useMemo(() => {
    return {
      avgSpeedKmh: avgSpeed > 0 ? avgSpeed.toFixed(1) : "0",
      currentSpeedKmh: currentSpeed > 0 ? currentSpeed.toFixed(1) : "0",
      maxSpeedKmh: maxSpeed > 0 ? maxSpeed.toFixed(1) : "0",
    };
  }, [avgSpeed, currentSpeed, maxSpeed]);

  return (
    <div className="w-full h-full flex flex-col justify-between space-y-3 sm:space-y-4">
      {/* ESTATÍSTICAS EM TEMPO REAL */}
      <RunStats 
        distance={distance} 
        time={time} 
        pace={pace} 
        positions={positions}
        currentSpeed={currentSpeed}
        avgSpeed={avgSpeed}
      />

      {/* STATUS DO GPS */}
      {!isGPSConnected && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-red-400 font-semibold">⚠️ GPS Desconectado</span>
        </div>
      )}

      {/* GRÁFICO */}
      <div className="pt-2 sm:pt-3 border-t border-slate-700/30">
        <p className="text-xs text-slate-400 mb-2 tracking-widest uppercase font-bold">📈 Velocidade em Tempo Real</p>
        <RunChart positions={positions} />
      </div>

      {/* VELOCIDADES */}
      {distance > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {/* Velocidade Atual */}
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-600/30 hover:border-cyan-500/50 rounded-lg transition-all group">
            <div className="flex items-center gap-2">
              <Gauge size={12} className="text-cyan-400" />
              <span className="text-xs text-slate-300 font-medium">Vel. Atual</span>
            </div>
            <span className="text-sm font-black text-cyan-300">
              {metrics.currentSpeedKmh} km/h
            </span>
          </div>

          {/* Velocidade Média */}
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-600/30 hover:border-blue-500/50 rounded-lg transition-all group">
            <div className="flex items-center gap-2">
              <TrendingUp size={12} className="text-blue-400" />
              <span className="text-xs text-slate-300 font-medium">Vel. Média</span>
            </div>
            <span className="text-sm font-black text-blue-300">
              {metrics.avgSpeedKmh} km/h
            </span>
          </div>
        </div>
      )}

      {/* CONTROLES */}
      <div className="flex justify-center items-center gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-slate-700/30">
        {/* Reset */}
        <button
          onClick={resetTracking}
          className="p-2.5 sm:p-3 bg-slate-800/60 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all rounded-full border border-slate-700 hover:border-red-500/30 transform hover:scale-110 active:scale-95"
          title="Reiniciar"
        >
          <RotateCcw size={14} className="sm:size-[16px]" />
        </button>

        {/* Start / Pause */}
        {!isActive ? (
          <button
            onClick={startTracking}
            disabled={!isGPSConnected}
            className={`flex items-center gap-2 ${
              isGPSConnected
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950'
                : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
            } px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] uppercase tracking-tight text-xs sm:text-sm transform hover:-translate-y-1 active:translate-y-0 transition-all`}
          >
            <Play size={12} fill="currentColor" className="sm:size-[14px]" />
            <span className="hidden sm:inline">Iniciar</span>
            <span className="sm:hidden">Ir</span>
          </button>
        ) : (
          <button
            onClick={pauseTracking}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] uppercase tracking-tight text-xs sm:text-sm transform hover:-translate-y-1 active:translate-y-0 transition-all"
          >
            <Pause size={12} fill="currentColor" className="sm:size-[14px]" />
            <span className="hidden sm:inline">Pausar</span>
            <span className="sm:hidden">Stop</span>
          </button>
        )}

        <div className="flex-shrink-0 w-0 sm:w-8" />
      </div>
    </div>
  );
}