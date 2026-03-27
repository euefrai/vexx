"use client";

import React from "react";
import { Play, Pause, RotateCcw, Zap, Timer, MapPin, Gauge } from "lucide-react";
import RunChart from "./RunChart"; // 🧩 Importando o gráfico

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

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
  
  // 🏎️ Calcula velocidade atual a partir do último ponto registrado
  const currentSpeed =
    positions.length > 0
      ? positions[positions.length - 1].speed || 0
      : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-2xl mx-auto space-y-6 sm:space-y-8 hover:border-slate-600/70 transition-all duration-300 relative overflow-hidden">
      <div className="absolute -top-1/2 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none" />
      
      {/* HEADER COM GRADIENTE */}
      <div className="text-center pb-4 border-b border-slate-700/30 relative z-10">
        <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Sessão de Corrida</h3>
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/50">
            <div className="w-4 h-4 rounded-full bg-emerald-300 shadow-lg"></div>
          </div>
          <span className="text-xs text-emerald-400 font-semibold">Rastreando sua jornada</span>
        </div>
      </div>
      
      {/* 📊 MÉTRICAS - Grid Responsivo com Efeito Card */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center relative z-10">
        
        {/* Distância */}
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 hover:from-slate-800/60 hover:to-slate-900/40 border border-slate-700/30 hover:border-emerald-500/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 group cursor-default shadow-lg hover:shadow-emerald-500/20">
          <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 sm:mb-2 flex items-center justify-center gap-1 group-hover:text-emerald-400 transition-colors">
            <MapPin size={10} className="sm:size-[12px]" /> Distância
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
            {distance.toFixed(2)} <span className="text-[10px] sm:text-xs font-normal text-slate-400">km</span>
          </h2>
        </div>

        {/* Tempo */}
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 hover:from-slate-800/60 hover:to-slate-900/40 border border-slate-700/30 hover:border-blue-500/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 group cursor-default shadow-lg hover:shadow-blue-500/20">
          <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 sm:mb-2 flex items-center justify-center gap-1 group-hover:text-blue-400 transition-colors">
            <Timer size={10} className="sm:size-[12px]" /> Tempo
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-blue-300 transition-colors">{formatTime(time)}</h2>
        </div>

        {/* Pace */}
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 hover:from-slate-800/60 hover:to-slate-900/40 border border-slate-700/30 hover:border-cyan-500/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 group cursor-default shadow-lg hover:shadow-cyan-500/20">
          <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 sm:mb-2 flex items-center justify-center gap-1 group-hover:text-cyan-400 transition-colors">
            <Zap size={10} className="sm:size-[12px]" /> Ritmo
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
            {pace} <span className="text-[10px] sm:text-xs font-normal text-slate-400">/km</span>
          </h2>
        </div>

        {/* Velocidade */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900/60 hover:from-emerald-900/50 hover:to-slate-900/40 border border-emerald-600/30 hover:border-emerald-500/70 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 group cursor-default shadow-lg hover:shadow-emerald-500/40">
          <p className="text-[9px] sm:text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1 sm:mb-2 flex items-center justify-center gap-1 group-hover:text-emerald-300 transition-colors">
            <Gauge size={10} className="sm:size-[12px]" /> Velocidade
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-emerald-400 group-hover:text-emerald-300 transition-colors">
            {currentSpeed.toFixed(1)} <span className="text-[10px] sm:text-xs font-normal text-emerald-600">km/h</span>
          </h2>
        </div>
      </div>

      {/* 🧩 GRÁFICO DE PERFORMANCE (Aparece quando há dados) */}
      <div className="pt-2 sm:pt-4 border-t border-slate-700/30 relative z-10">
        <p className="text-xs text-slate-400 mb-2 tracking-widest uppercase font-bold">📈 Velocidade em Tempo Real</p>
        <RunChart positions={positions} />
      </div>

      {/* 🎮 CONTROLES */}
      <div className="flex justify-center items-center gap-2 sm:gap-6 pt-4 sm:pt-6 border-t border-slate-700/30 relative z-10">
        
        {/* Reset */}
        <button
          onClick={resetTracking}
          className="p-3 sm:p-4 bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-all duration-300 rounded-full border border-slate-700 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transform hover:scale-110 active:scale-95 sm:hover:scale-125"
          title="Reiniciar"
        >
          <RotateCcw size={18} className="sm:size-[20px] transition-transform duration-300" />
        </button>

        {/* Start / Pause principal */}
        {!isActive ? (
          <button
            onClick={startTracking}
            className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 transition-all duration-300 px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] uppercase tracking-tighter text-sm sm:text-base transform hover:-translate-y-1 active:translate-y-0"
          >
            <Play size={18} fill="currentColor" className="sm:size-[24px]" />
            <span>Iniciar</span>
          </button>
        ) : (
          <button
            onClick={pauseTracking}
            className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition-all duration-300 px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] uppercase tracking-tighter text-sm sm:text-base transform hover:-translate-y-1 active:translate-y-0"
          >
            <Pause size={18} fill="currentColor" className="sm:size-[24px]" />
            <span>Pausar</span>
          </button>
        )}

        {/* Espaço para simetria */}
        <div className="w-10 sm:w-[52px]" />
      </div>
    </div>
  );
}