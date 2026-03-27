"use client";

import React from "react";
import { Play, Pause, RotateCcw, TrendingUp } from "lucide-react";
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
}) {
  // Velocidade média
  const avgSpeed = time > 0 && distance > 0 ? ((distance / (time / 3600)).toFixed(1)) : 0;

  return (
    <div className="w-full h-full flex flex-col justify-between space-y-3 sm:space-y-4">
      {/* ESTATÍSTICAS EM TEMPO REAL */}
      <RunStats distance={distance} time={time} pace={pace} positions={positions} />

      {/* GRÁFICO */}
      <div className="pt-2 sm:pt-3 border-t border-slate-700/30">
        <p className="text-xs text-slate-400 mb-2 tracking-widest uppercase font-bold">📈 Velocidade em Tempo Real</p>
        <RunChart positions={positions} />
      </div>

      {/* VELOCIDADE MÉDIA */}
      {distance > 0 && time > 0 && (
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-600/30 hover:border-blue-500/50 rounded-lg transition-all group">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="text-xs text-slate-300 font-medium group-hover:text-slate-200 transition-colors">Vel. Média</span>
          </div>
          <span className="text-sm font-black text-blue-300 group-hover:text-blue-200 transition-colors">
            {avgSpeed} km/h
          </span>
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
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] uppercase tracking-tight text-xs sm:text-sm transform hover:-translate-y-1 active:translate-y-0 transition-all"
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