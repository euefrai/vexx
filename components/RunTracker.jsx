"use client";

import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

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
  startTracking,
  pauseTracking,
  resetTracking,
}) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 shadow-2xl">
      
      {/* 📊 MÉTRICAS */}
      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        
        {/* Distância */}
        <div>
          <p className="text-xs text-slate-400 uppercase">Distância</p>
          <h2 className="text-xl font-bold">
            {distance.toFixed(2)} <span className="text-sm">km</span>
          </h2>
        </div>

        {/* Tempo */}
        <div>
          <p className="text-xs text-slate-400 uppercase">Tempo</p>
          <h2 className="text-xl font-bold">{formatTime(time)}</h2>
        </div>

        {/* Pace */}
        <div>
          <p className="text-xs text-slate-400 uppercase">Ritmo</p>
          <h2 className="text-xl font-bold">
            {pace} <span className="text-sm">/km</span>
          </h2>
        </div>
      </div>

      {/* 🎮 CONTROLES */}
      <div className="flex justify-center gap-4">
        
        {/* Start / Pause */}
        {!isActive ? (
          <button
            onClick={startTracking}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition px-6 py-3 rounded-full font-semibold shadow-lg"
          >
            <Play size={18} />
            Iniciar
          </button>
        ) : (
          <button
            onClick={pauseTracking}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 transition px-6 py-3 rounded-full font-semibold shadow-lg"
          >
            <Pause size={18} />
            Pausar
          </button>
        )}

        {/* Reset */}
        <button
          onClick={resetTracking}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 transition px-5 py-3 rounded-full font-semibold shadow-lg"
        >
          <RotateCcw size={18} />
          Reset
        </button>
      </div>
    </div>
  );
}