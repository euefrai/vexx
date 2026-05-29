"use client";

import React from "react";
import { Activity, CircleDot, AlertTriangle } from "lucide-react";

export default function RunStatus({ isActive, distance, isPaused = false }) {
  if (!isActive && distance === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-bounce">
      <div className="bg-zinc-950/90 backdrop-blur-md border border-emerald-500/35 rounded-2xl px-4 py-3 shadow-2xl shadow-emerald-500/10 flex items-center gap-3 group hover:border-emerald-500/50 transition-all duration-300">
        
        {/* Glow Superior */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent rounded-t-2xl" />

        {/* Indicador Animado */}
        <div className="flex items-center justify-center">
          {isActive ? (
            <div className="relative flex items-center justify-center">
              <Activity size={18} className="text-emerald-400 animate-pulse z-10" />
              <span className="absolute w-6 h-6 bg-emerald-500/10 rounded-full animate-ping pointer-events-none" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <CircleDot size={18} className="text-amber-400 z-10" />
              <span className="absolute w-6 h-6 bg-amber-500/10 rounded-full animate-ping pointer-events-none" />
            </div>
          )}
        </div>

        {/* Informações Telemetria */}
        <div className="flex flex-col gap-0.5">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">
            {isActive ? "Rastreando Atividade" : "Rastreamento Pausado"}
          </p>
          <p className="text-xs text-white font-black leading-none mt-1">
            {distance.toFixed(2)} <span className="text-[9px] font-extrabold text-zinc-500 uppercase">km</span> {isPaused && "• Pausada"}
          </p>
        </div>

        {/* Borda lateral glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/50 via-emerald-400/20 to-transparent rounded-r-2xl" />
      </div>
    </div>
  );
}
