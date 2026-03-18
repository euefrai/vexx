"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function CronometroPage() {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    let interval = null
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive])

  const formatTime = (sec) => {
    const hrs = Math.floor(sec / 3600)
    const mins = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <Link href="/lab" className="absolute top-6 left-6 text-zinc-500 uppercase font-black text-[10px]">← Voltar</Link>
      <h1 className="text-zinc-500 font-black uppercase italic text-xs mb-4 tracking-widest text-center">Tempo de Operação</h1>
      <div className="text-7xl font-black italic tracking-tighter mb-12 text-green-500">
        {formatTime(seconds)}
      </div>
      <div className="flex gap-4">
        <button 
          onClick={() => setIsActive(!isActive)}
          className={`px-8 py-4 rounded-full font-black uppercase italic text-sm transition-all ${isActive ? 'bg-red-500 text-white' : 'bg-green-500 text-black'}`}
        >
          {isActive ? "Pausar" : "Iniciar"}
        </button>
        <button 
          onClick={() => {setSeconds(0); setIsActive(false)}}
          className="px-8 py-4 rounded-full bg-zinc-800 font-black uppercase italic text-sm"
        >
          Resetar
        </button>
      </div>
    </div>
  )
}