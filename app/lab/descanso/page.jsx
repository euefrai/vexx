"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function DescansoPage() {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    let timer
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      if (isActive) navigator.vibrate?.(500) // Vibra o celular ao acabar
    }
    return () => clearInterval(timer)
  }, [isActive, timeLeft])

  const startTimer = (seconds) => {
    setTimeLeft(seconds)
    setIsActive(true)
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <Link href="/lab" className="absolute top-6 left-6 text-zinc-500 uppercase font-black text-[10px]">← Voltar</Link>
      <h1 className="text-orange-500 font-black uppercase italic text-xs mb-4 tracking-widest">Recuperação</h1>
      <div className={`text-8xl font-black italic tracking-tighter mb-12 ${timeLeft < 10 && timeLeft > 0 ? 'animate-pulse text-red-500' : 'text-white'}`}>
        {timeLeft}s
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[30, 45, 60, 90, 120, 180].map(s => (
          <button key={s} onClick={() => startTimer(s)} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl font-black text-xs hover:border-orange-500">
            {s}s
          </button>
        ))}
      </div>
      {timeLeft > 0 && (
        <button onClick={() => {setIsActive(false); setTimeLeft(0)}} className="mt-8 text-zinc-500 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
      )}
    </div>
  )
}