"use client";

import { Activity, Award, Zap, TrendingUp, Calendar, Clock } from "lucide-react";

export default function RunSummary({ distance, time, pace, positions = [] }) {
  // Calcula calories (aproximado: 0.063 cal por km para média)
  const calories = Math.round(distance * 63);
  
  // Verifica velocidade máxima
  const maxSpeed = positions.length > 0 
    ? Math.max(...positions.map(p => p.speed || 0)) 
    : 0;

  // Calcula elevação média (simulado)
  const elevation = distance > 0 ? Math.round(distance * 5) : 0;

  // Formata data/hora atual
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { 
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <div className="w-full space-y-4">
      {/* HEADER DO RESUMO */}
      <div className="border-b border-slate-700/30 pb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">📊 Resumo da Corrida</h3>
        <p className="text-xs text-slate-500 capitalize">{dateStr}</p>
      </div>

      {/* GRID DE ESTATÍSTICAS */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Distância */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border border-emerald-600/20 rounded-lg p-3 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Distância</p>
            <Zap size={14} className="text-emerald-500" />
          </div>
          <p className="text-lg font-black text-white">{distance.toFixed(2)} <span className="text-xs text-emerald-400">km</span></p>
          {distance > 0 && <p className="text-xs text-slate-500 mt-1">+{(distance * 1000).toFixed(0)}m</p>}
        </div>

        {/* Tempo */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-600/20 rounded-lg p-3 hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Tempo</p>
            <Clock size={14} className="text-blue-500" />
          </div>
          <p className="text-lg font-black text-white">
            {Math.floor(time / 3600)}:{String(Math.floor((time % 3600) / 60)).padStart(2, "0")}
          </p>
          <p className="text-xs text-slate-500 mt-1">{time}s</p>
        </div>

        {/* Ritmo */}
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-600/20 rounded-lg p-3 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Ritmo Médio</p>
            <TrendingUp size={14} className="text-purple-500" />
          </div>
          <p className="text-lg font-black text-white">{pace} <span className="text-xs text-purple-400">/km</span></p>
        </div>

        {/* Velocidade Máxima */}
        <div className="bg-gradient-to-br from-orange-900/20 to-orange-900/5 border border-orange-600/20 rounded-lg p-3 hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Vel. Máxima</p>
            <Activity size={14} className="text-orange-500" />
          </div>
          <p className="text-lg font-black text-white">{maxSpeed.toFixed(1)} <span className="text-xs text-orange-400">km/h</span></p>
        </div>

        {/* Calorias */}
        <div className="bg-gradient-to-br from-red-900/20 to-red-900/5 border border-red-600/20 rounded-lg p-3 hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Calorias</p>
            <Award size={14} className="text-red-500" />
          </div>
          <p className="text-lg font-black text-white">{calories} <span className="text-xs text-red-400">kcal</span></p>
        </div>

        {/* Elevação */}
        <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 border border-cyan-600/20 rounded-lg p-3 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Elev. Aprox.</p>
            <Calendar size={14} className="text-cyan-500" />
          </div>
          <p className="text-lg font-black text-white">{elevation} <span className="text-xs text-cyan-400">m</span></p>
        </div>
      </div>

      {/* SEGMENTOS/MARCOS */}
      {positions.length > 10 && (
        <div className="border-t border-slate-700/30 pt-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">🏁 Pontos Importantes</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg border border-slate-700/20">
              <span className="text-xs text-slate-300">🚀 Velocidade de Saída</span>
              <span className="text-sm font-bold text-emerald-400">{(positions[0]?.speed || 0).toFixed(1)} km/h</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg border border-slate-700/20">
              <span className="text-xs text-slate-300">⚡ Velocidade Final</span>
              <span className="text-sm font-bold text-cyan-400">{(positions[positions.length - 1]?.speed || 0).toFixed(1)} km/h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
