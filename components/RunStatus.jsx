"use client";

import React from "react";
import { Activity, CheckCircle2, AlertCircle } from "lucide-react";

export default function RunStatus({ isActive, distance, isPaused = false }) {
  if (!isActive && distance === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-emerald-900/80 via-slate-900/80 to-slate-900/80 backdrop-blur-md border border-emerald-500/40 rounded-xl px-4 py-3 shadow-lg shadow-emerald-500/30 flex items-center gap-3 group hover:border-emerald-500/60 transition-all duration-300">
        {/* Indicador */}
        <div className="flex items-center justify-center">
          {isActive ? (
            <Activity size={20} className="text-emerald-400 animate-pulse" />
          ) : (
            <CheckCircle2 size={20} className="text-blue-400" />
          )}
        </div>

        {/* Informações */}
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-black text-emerald-300 uppercase tracking-wider">
            {isActive ? "🏃 Em Andamento" : "✓ Pausa"}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            {distance.toFixed(2)} km {isPaused && "• Pausada"}
          </p>
        </div>

        {/* Vinheta direita */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/50 via-emerald-400/20 to-transparent rounded-r-xl" />
      </div>
    </div>
  );
}
