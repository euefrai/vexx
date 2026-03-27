"use client";

import { useState } from "react";
import Map from "@/components/Map";
import RunTracker from "@/components/RunTracker";
import { useTracker } from "@/hooks/useTracker";
import Navbar from "@/components/Navbar";

export default function RunPage() {
  const {
    isActive,
    distance,
    time,
    pace,
    positions,
    startTracking,
    pauseTracking,
    resetTracking,
    currentPosition,
  } = useTracker();

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <Navbar />
      
      {/* Background com efeito de gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/10 via-transparent to-blue-950/10 pointer-events-none" />
      
      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden relative z-10">
        {/* 🗺️ MAPA - Ocupa 100% em mobile, 65% em desktop */}
        <div className="flex-1 order-2 lg:order-1 relative w-full lg:w-3/5 h-auto lg:h-full bg-slate-900 shadow-2xl overflow-hidden" style={{ minHeight: 'clamp(200px, 50vh, 100%)' }}>
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5" />
          <Map
            positions={positions}
            currentPosition={currentPosition}
            destination={null}
          />
        </div>

        {/* 📊 PAINEL DE CONTROLE - Ocupa 100% em mobile, 35% em desktop */}
        <div className="order-1 lg:order-2 w-full lg:w-2/5 h-auto lg:h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800/50 p-3 sm:p-4 lg:p-6 flex flex-col justify-between overflow-y-auto">
          
          {/* HEADER */}
          <div className="text-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-800/30">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-pulse">
                <span className="text-lg sm:text-2xl">🏃</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">RUNNER</h1>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-widest uppercase">Rastreador de Performance</p>
          </div>

          {/* TRACKER COMPONENT */}
          <div className="flex-1 flex items-center justify-center px-0 sm:px-2 min-h-0">
            <RunTracker
              isActive={isActive}
              distance={distance}
              time={time}
              pace={pace}
              positions={positions}
              startTracking={startTracking}
              pauseTracking={pauseTracking}
              resetTracking={resetTracking}
            />
          </div>

          {/* RODAPÉ COM DICAS */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-800/30 text-center hidden sm:block">
            <p className="text-xs text-slate-500 leading-relaxed">
              💡 {isActive ? "Sua corrida está sendo rastreada em tempo real" : "Pressione INICIAR para começar o rastreamento"}
            </p>
          </div>
        </div>
      </div>

      {/* INDICADORES NO CANTO */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-50">
        {isActive && (
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700/50 px-3 py-2 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400 font-semibold">GRAVANDO</span>
          </div>
        )}
      </div>
    </div>
  );
}