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
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl w-full max-w-2xl mx-auto space-y-8">
      
      {/* 📊 MÉTRICAS - Grid de 4 Colunas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        
        {/* Distância */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
            <MapPin size={12} /> Distância
          </p>
          <h2 className="text-2xl font-black text-white">
            {distance.toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
          </h2>
        </div>

        {/* Tempo */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
            <Timer size={12} /> Tempo
          </p>
          <h2 className="text-2xl font-black text-white">{formatTime(time)}</h2>
        </div>

        {/* Pace */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
            <Zap size={12} /> Ritmo
          </p>
          <h2 className="text-2xl font-black text-white">
            {pace} <span className="text-xs font-normal text-slate-400">/km</span>
          </h2>
        </div>

        {/* Velocidade */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
            <Gauge size={12} /> Velocidade
          </p>
          <h2 className="text-2xl font-black text-emerald-400">
            {currentSpeed.toFixed(1)} <span className="text-xs font-normal text-emerald-600">km/h</span>
          </h2>
        </div>
      </div>

      {/* 🧩 GRÁFICO DE PERFORMANCE (Aparece quando há dados) */}
      <div className="pt-2">
        <RunChart positions={positions} />
      </div>

      {/* 🎮 CONTROLES */}
      <div className="flex justify-center items-center gap-6 pt-2">
        
        {/* Reset */}
        <button
          onClick={resetTracking}
          className="p-4 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-all rounded-full border border-slate-700"
          title="Reiniciar"
        >
          <RotateCcw size={20} />
        </button>

        {/* Start / Pause principal */}
        {!isActive ? (
          <button
            onClick={startTracking}
            className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all px-10 py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] uppercase tracking-tighter"
          >
            <Play size={24} fill="currentColor" />
            Iniciar
          </button>
        ) : (
          <button
            onClick={pauseTracking}
            className="flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all px-10 py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] uppercase tracking-tighter"
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