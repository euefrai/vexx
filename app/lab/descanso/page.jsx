"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, RotateCcw } from "lucide-react"

export default function DescansoPage() {
  const [initialTime, setInitialTime] = useState(60) // Tempo inicial em segundos
  const [timeLeft, setTimeLeft] = useState(0) // Tempo restante
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    let timer = null
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1)
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false)
      // Feedback táctil tático (Vibração) ao expirar
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([150, 100, 150, 100, 200])
      }
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isActive, timeLeft])

  const startTimer = (seconds) => {
    setInitialTime(seconds)
    setTimeLeft(seconds)
    setIsActive(true)
  }

  const handleStartPause = () => {
    if (timeLeft > 0) {
      setIsActive(!isActive)
    }
  }

  const handleReset = () => {
    setIsActive(false)
    setTimeLeft(0)
  }

  // Cálculo de progresso do anel circular SVG
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = timeLeft > 0 && initialTime > 0
    ? circumference - (timeLeft / initialTime) * circumference
    : 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 pb-32 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />

      <PageHeader icon="⏳" title="Descanso tático" subtitle="Controle preciso de intervalos de recuperação" color="orange" />
      <Link href="/lab" className="text-zinc-500 hover:text-zinc-300 uppercase font-black text-[10px] tracking-widest ml-1">← Voltar ao Lab</Link>

      <div className="mt-8 space-y-6 max-w-sm mx-auto flex flex-col items-center">
        {/* Temporizador Circular (SVG Progress Ring) */}
        <div className="relative w-56 h-56 flex items-center justify-center bg-zinc-900/15 border border-zinc-900 rounded-full shadow-inner backdrop-blur-md">
          <svg className="w-full h-full transform -rotate-90 select-none">
            {/* Círculo de fundo */}
            <circle
              cx="112"
              cy="112"
              r={radius}
              className="stroke-zinc-900/60"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Círculo de progresso com gradiente */}
            <motion.circle
              cx="112"
              cy="112"
              r={radius}
              className="stroke-orange-500"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              animate={{ strokeDashoffset }}
              transition={{ ease: "linear", duration: 1 }}
            />
          </svg>

          {/* Conteúdo de Texto Central */}
          <div className="absolute flex flex-col items-center select-none font-mono">
            {timeLeft > 0 ? (
              <>
                <span className={`text-5xl font-black italic tracking-tighter transition-colors duration-300 ${
                  timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-zinc-100"
                }`}>
                  {timeLeft}s
                </span>
                <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest mt-1">Recuperação</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-black italic tracking-tighter text-zinc-500">Pronto</span>
                <span className="text-[7.5px] font-black text-emerald-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Ir pro Set
                </span>
              </>
            )}
          </div>
        </div>

        {/* Controles de Play/Pause/Reset quando ativo */}
        {timeLeft > 0 && (
          <div className="flex gap-4 items-center justify-center mt-2">
            <button 
              onClick={handleReset}
              className="w-12 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              title="Cancelar"
            >
              <RotateCcw size={16} />
            </button>

            <button 
              onClick={handleStartPause}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer ${
                isActive 
                  ? "bg-rose-500 text-white shadow-rose-950/20" 
                  : "bg-orange-500 text-black shadow-orange-950/20 hover:bg-orange-400"
              }`}
            >
              {isActive ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
            </button>
          </div>
        )}

        {/* Grade de Presets Rápidos */}
        <div className="w-full bg-zinc-900/35 border border-zinc-900 rounded-[2.5rem] p-5 backdrop-blur-md">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest text-center mb-4">Escolha o Intervalo de Campo</p>
          
          <div className="grid grid-cols-3 gap-3">
            {[30, 45, 60, 90, 120, 180].map(s => {
              const activePreset = timeLeft > 0 && initialTime === s
              return (
                <button 
                  key={s} 
                  onClick={() => startTimer(s)} 
                  className={`border p-4 rounded-2xl font-black text-xs transition-all active:scale-[0.96] flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activePreset
                      ? "bg-orange-500 border-orange-500 text-black shadow-md shadow-orange-950/10"
                      : "bg-zinc-950/50 border-zinc-900 text-zinc-300 hover:border-orange-500/30 hover:bg-zinc-900/30"
                  }`}
                >
                  <span className="text-[13px] italic font-black">{s}s</span>
                  <span className="text-[7px] text-zinc-500 font-extrabold uppercase tracking-wide leading-none">
                    {s <= 45 ? "Curto" : s <= 90 ? "Médio" : "Longo"}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  )
}