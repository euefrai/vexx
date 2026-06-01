"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, RotateCcw, Flag } from "lucide-react"

export default function CronometroPage() {
  const [tempo, setTempo] = useState(0) // Tempo em milissegundos
  const [isActive, setIsActive] = useState(false)
  const [laps, setLaps] = useState([])
  
  const intervalRef = useRef(null)
  const startTimeRef = useRef(0)

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now() - tempo
      intervalRef.current = setInterval(() => {
        setTempo(Date.now() - startTimeRef.current)
      }, 10) // Atualizar a cada 10ms (centissegundos)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive])

  const handleStartPause = () => {
    setIsActive(!isActive)
  }

  const handleReset = () => {
    setIsActive(false)
    setTempo(0)
    setLaps([])
  }

  const handleLap = () => {
    if (!isActive) return
    const lapNum = laps.length + 1
    const totalTime = tempo

    // Calcular tempo relativo da volta (diferença com a volta anterior)
    const lastLapTime = laps.length > 0 ? laps[0].totalTime : 0
    const lapTime = totalTime - lastLapTime

    const novaVolta = {
      id: lapNum,
      lapTime,
      totalTime
    }

    // Adiciona no topo da lista
    setLaps(prev => [novaVolta, ...prev])
  }

  // Formatador avançado de tempo (MM:SS.CC)
  const formatTime = (ms) => {
    const totalSeconds = ms / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const centiseconds = Math.floor((ms % 1000) / 10)

    const minStr = minutes.toString().padStart(2, "0")
    const secStr = seconds.toString().padStart(2, "0")
    const centiStr = centiseconds.toString().padStart(2, "0")

    return {
      main: `${minStr}:${secStr}`,
      centi: centiStr
    }
  }

  const timeFormatted = formatTime(tempo)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 pb-32 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

      <PageHeader icon="⏱️" title="Cronômetro" subtitle="Medição de alta precisão para treinos" color="blue" />
      <Link href="/lab" className="text-zinc-500 hover:text-zinc-300 uppercase font-black text-[10px] tracking-widest ml-1">← Voltar ao Lab</Link>

      <div className="mt-8 space-y-6 max-w-sm mx-auto flex flex-col items-center">
        {/* Display do Cronômetro Esportivo */}
        <div className="w-full bg-zinc-900/35 border border-zinc-900 rounded-[2.5rem] p-8 text-center backdrop-blur-md relative overflow-hidden">
          <p className="text-zinc-650 text-[9px] font-black uppercase tracking-widest mb-1.5">Cronômetro Tático</p>
          
          <div className="flex items-baseline justify-center font-mono font-black italic select-none">
            <span className="text-6xl text-blue-400 tracking-tighter">{timeFormatted.main}</span>
            <span className="text-2xl text-blue-500/60 ml-1 font-bold">.{timeFormatted.centi}</span>
          </div>
        </div>

        {/* Painel de Controles */}
        <div className="flex gap-4 items-center justify-center w-full">
          {/* Botão Volta */}
          <button 
            onClick={handleLap}
            disabled={!isActive}
            className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
              isActive 
                ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 active:scale-90" 
                : "border-zinc-900 text-zinc-700 cursor-not-allowed"
            }`}
            title="Marcar Volta"
          >
            <Flag size={18} />
          </button>

          {/* Botão Play / Pause */}
          <button 
            onClick={handleStartPause}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer ${
              isActive 
                ? "bg-rose-500 text-white shadow-rose-950/20" 
                : "bg-blue-500 text-black shadow-blue-950/20 hover:bg-blue-400"
            }`}
          >
            {isActive ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
          </button>

          {/* Botão Reset */}
          <button 
            onClick={handleReset}
            className="w-14 h-14 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            title="Resetar Cronômetro"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Tabela de Voltas */}
        <div className="w-full">
          <AnimatePresence>
            {laps.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-zinc-900/20 border border-zinc-900 rounded-[2rem] p-5 w-full space-y-3"
              >
                <div className="flex justify-between text-[8px] font-black text-zinc-650 uppercase tracking-widest px-2 pb-1 border-b border-zinc-900/50">
                  <span>Volta</span>
                  <span>Parcial</span>
                  <span>Acumulado</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {laps.map((lap) => {
                    const lTime = formatTime(lap.lapTime)
                    const tTime = formatTime(lap.totalTime)
                    return (
                      <motion.div 
                        key={lap.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center py-2 px-3 bg-zinc-900/30 border border-zinc-900/50 rounded-xl font-mono text-[10px]"
                      >
                        <span className="font-sans font-black text-blue-400">#{lap.id.toString().padStart(2, "0")}</span>
                        <span className="text-zinc-200">+{lTime.main}<span className="text-[8px] opacity-60">.{lTime.centi}</span></span>
                        <span className="text-zinc-400">{tTime.main}<span className="text-[8px] opacity-60">.{tTime.centi}</span></span>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Navbar />
    </div>
  )
}