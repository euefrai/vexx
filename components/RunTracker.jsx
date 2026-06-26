"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Lock, Unlock, PlayCircle, Eye, Flame, ShieldAlert, Cpu } from "lucide-react";
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
  isGPSConnected = true,
  isSimulando = false,
  onToggleSimulado = null,
}) {
  const [isLocked, setIsLocked] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  // Manipular drag do cadeado slide-to-unlock
  const handleDrag = (event, info) => {
    // A pista de drag tem 180px de largura
    const x = Math.max(0, Math.min(180, info.point.x - event.target.getBoundingClientRect().left));
    const progress = x / 180;
    setDragProgress(progress);
    
    if (x >= 170) {
      setIsLocked(false);
      setDragProgress(0);
    }
  };

  return (
    <div className="w-full h-full relative flex flex-col justify-between space-y-4">
      {/* 🔒 ACCIDENTAL TOUCH LOCK SHEET (BLOQUEIO DE TELA) */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-3xl z-50 p-6 flex flex-col items-center justify-between"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mt-8">
              <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Lock size={28} className="text-purple-400" />
              </div>
              <h4 className="text-white font-black uppercase tracking-wider text-sm">Painel Protegido</h4>
              <p className="text-[10px] text-zinc-500 font-bold max-w-xs mt-1 leading-relaxed">
                O bloqueio de toque acidental está ativo para evitar interrupções causadas por suor ou fricção com roupas.
              </p>
            </div>

            {/* Slide to Unlock Handle */}
            <div className="w-full max-w-[240px] h-12 bg-zinc-900 border border-white/5 rounded-full relative flex items-center justify-between p-1 overflow-hidden">
              {/* Barra de progresso ciano */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500/10 to-purple-500/30 transition-all pointer-events-none" 
                style={{ width: `${Math.max(12, dragProgress * 100)}%` }} 
              />
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest animate-pulse">
                  Deslize para liberar
                </span>
              </div>

              {/* Botão de arrastar */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 180 }}
                dragElastic={0.05}
                onDrag={handleDrag}
                onDragEnd={() => setDragProgress(0)}
                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10 hover:scale-105 active:scale-95 transition-transform"
              >
                <Unlock size={16} className="text-white" />
              </motion.div>
            </div>

            <div className="mb-4 text-[9px] text-zinc-600 font-extrabold uppercase tracking-widest">
              VEXX SQUAD SHIELD
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* METRICAS PRINCIPAIS */}
      <RunStats 
        distance={distance} 
        time={time} 
        pace={pace} 
        positions={positions}
        currentSpeed={currentSpeed}
        avgSpeed={avgSpeed}
      />

      {/* GRÁFICO TELEMETRIA */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center px-1">
          <p className="text-[9px] text-zinc-500 tracking-widest uppercase font-black">CURVA VELOCIDADE</p>
          {positions.length > 0 && (
            <span className="text-[9px] text-emerald-400 font-black animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Rastreando
            </span>
          )}
        </div>
        <RunChart positions={positions} />
      </div>

      {/* PAINEL DE CONTROLES TÁTEIS — Premium */}
      <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
        
        {/* Controles de Ação de Corrida */}
        <div className="flex items-center justify-center gap-5">
          
          {/* Botão Reset / Finalizar */}
          {distance > 0 && (
            <motion.button
              onClick={resetTracking}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              className="p-3.5 bg-zinc-900/80 border border-white/[0.06] text-zinc-500 hover:text-rose-400 hover:border-rose-500/25 hover:bg-rose-500/5 transition-all rounded-full shadow-lg"
              title="Finalizar Treino"
            >
              <RotateCcw size={16} />
            </motion.button>
          )}

          {/* Botão Start / Pause Principal (Pulsação Premium) */}
          {!isActive ? (
            <motion.button
              onClick={startTracking}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              disabled={!isGPSConnected && !isSimulando}
              className="relative group"
            >
              {/* Glow ring pulsante por trás do botão */}
              {(isGPSConnected || isSimulando) && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-emerald-500/20"
                  animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ filter: "blur(8px)" }}
                />
              )}
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                isGPSConnected || isSimulando
                  ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-zinc-950 shadow-emerald-500/30 group-hover:shadow-emerald-500/50"
                  : "bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed"
              }`}>
                <Play size={22} fill="currentColor" className="ml-1" />
              </div>
            </motion.button>
          ) : (
            <motion.button
              onClick={pauseTracking}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="relative"
            >
              {/* Glow ring de pausa */}
              <motion.div
                className="absolute inset-0 rounded-full bg-amber-500/20"
                animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ filter: "blur(6px)" }}
              />
              <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-zinc-950 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/30">
                <Pause size={22} fill="currentColor" />
              </div>
            </motion.button>
          )}

          {/* Botão Lock Screen */}
          {isActive && (
            <motion.button
              onClick={() => setIsLocked(true)}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              className="p-3.5 bg-zinc-900/80 border border-white/[0.06] text-zinc-500 hover:text-purple-400 hover:border-purple-500/25 hover:bg-purple-500/5 transition-all rounded-full shadow-lg"
              title="Proteger Tela"
            >
              <Lock size={16} />
            </motion.button>
          )}
        </div>

        {/* ⚙️ SIMULADOR E STATUS */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider px-1 bg-zinc-900/30 p-2.5 rounded-2xl border border-white/[0.04]">
          {/* Status GPS */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isGPSConnected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"}`} />
            <span>GPS: {isGPSConnected ? "Ativo" : "Offline"}</span>
          </div>

          {/* Interruptor Simulador */}
          {onToggleSimulado && (
            <button
              onClick={onToggleSimulado}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border ${
                isSimulando
                  ? "bg-purple-500/10 border-purple-500/35 text-purple-300 font-black shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                  : "bg-transparent border-white/5 hover:border-white/10 text-zinc-400"
              }`}
            >
              <Cpu size={11} className={isSimulando ? "animate-spin" : ""} />
              <span>Simulador {isSimulando ? "ON" : "OFF"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}