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
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl w-full max-w-2xl mx-auto space-y-8 hover:border-slate-600/70 transition-all duration-300">
      
      {/* HEADER COM GRADIENTE */}
      <div className="text-center pb-4 border-b border-slate-700/30">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Sessão de Corrida</h3>
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 rounded-full bg-emerald-300"></div>
          </div>
          <span className="text-xs text-emerald-400 font-semibold">Rastreando sua jornada</span>
        </div>
      </div>
      
      {/* 📊 MÉTRICAS - Grid de 4 Colunas com Efeito Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        
        {/* Distância */}
        <div className="bg-slate-900/50 hover:bg-slate-800/70 border border-slate-700/30 hover:border-emerald-500/30 rounded-2xl p-4 transition-all duration-300 group cursor-default">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 flex items-center justify-center gap-1 group-hover:text-emerald-400 transition-colors">
            <MapPin size={12} /> Distância
          </p>
          <h2 className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
            {distance.toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
          </h2>
        </div>

        {/* Tempo */}
        <div className="bg-slate-900/50 hover:bg-slate-800/70 border border-slate-700/30 hover:border-blue-500/30 rounded-2xl p-4 transition-all duration-300 group cursor-default">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 flex items-center justify-center gap-1 group-hover:text-blue-400 transition-colors">
            <Timer size={12} /> Tempo
          </p>
          <h2 className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors">{formatTime(time)}</h2>
        </div>

        {/* Pace */}
        <div className="bg-slate-900/50 hover:bg-slate-800/70 border border-slate-700/30 hover:border-cyan-500/30 rounded-2xl p-4 transition-all duration-300 group cursor-default">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 flex items-center justify-center gap-1 group-hover:text-cyan-400 transition-colors">
            <Zap size={12} /> Ritmo
          </p>
          <h2 className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
            {pace} <span className="text-xs font-normal text-slate-400">/km</span>
          </h2>
        </div>

        {/* Velocidade */}
        <div className="bg-slate-900/50 hover:bg-slate-800/70 border border-slate-700/30 hover:border-emerald-500/30 rounded-2xl p-4 transition-all duration-300 group cursor-default">
          <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-2 flex items-center justify-center gap-1 group-hover:text-emerald-300 transition-colors">
            <Gauge size={12} /> Velocidade
          </p>
          <h2 className="text-2xl font-black text-emerald-400 group-hover:text-emerald-300 transition-colors">
            {currentSpeed.toFixed(1)} <span className="text-xs font-normal text-emerald-600">km/h</span>
          </h2>
        </div>
      </div>

      {/* 🧩 GRÁFICO DE PERFORMANCE (Aparece quando há dados) */}
      <div className="pt-2 border-t border-slate-700/30">
        <RunChart positions={positions} />
      </div>

      {/* 🎮 CONTROLES */}
      <div className="flex justify-center items-center gap-6 pt-4 border-t border-slate-700/30">
        
        {/* Reset */}
        <button
          onClick={resetTracking}
          className="p-4 bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-all duration-300 rounded-full border border-slate-700 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transform hover:scale-110 active:scale-95"
          title="Reiniciar"
        >
          <RotateCcw size={20} className="transition-transform duration-300" />
        </button>

        {/* Start / Pause principal */}
        {!isActive ? (
          <button
            onClick={startTracking}
            className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 transition-all duration-300 px-10 py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] uppercase tracking-tighter transform hover:-translate-y-1 active:translate-y-0"
          >
            <Play size={24} fill="currentColor" />
            Iniciar
          </button>
        ) : (
          <button
            onClick={pauseTracking}
            className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition-all duration-300 px-10 py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] uppercase tracking-tighter transform hover:-translate-y-1 active:translate-y-0"
          >
            <Pause size={24} fill="currentColor" />
            Pausar
          </button>
        )}

        {/* Espaço para simetria */}
        <div className="w-[52px]" /> 
      </div>
    </div>
  );
}