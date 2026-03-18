"use client"
import { useState } from "react"
import Link from "next/link"

export default function RPMPage() {
  const [peso, setPeso] = useState("")
  const [reps, setReps] = useState("")
  const [umRM, setUmRM] = useState(null)

  const calcular = () => {
    // Fórmula de Brzycki: Peso / (1.0278 - (0.0278 * Reps))
    const res = peso / (1.0278 - (0.0278 * reps))
    setUmRM(Math.round(res))
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <Link href="/lab" className="text-zinc-500 uppercase font-black text-[10px]">← Voltar</Link>
      <h1 className="text-2xl font-black uppercase italic text-purple-500 mt-8 mb-8 tracking-tighter text-center">Personal Record (1RM)</h1>
      
      <div className="space-y-6 max-w-xs mx-auto">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Carga do Set (kg)</label>
          <input type="number" value={peso} onChange={e => setPeso(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 font-black outline-none focus:border-purple-500" placeholder="Ex: 100" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Repetições feitas</label>
          <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 font-black outline-none focus:border-purple-500" placeholder="Ex: 8" />
        </div>
        <button onClick={calcular} className="w-full bg-purple-600 text-white font-black uppercase italic p-4 rounded-2xl">Calcular Força Bruta</button>
        
        {umRM && (
          <div className="mt-8 p-6 bg-zinc-900 rounded-[2.5rem] border border-purple-500/30 text-center">
            <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Seu 1RM estimado é</p>
            <p className="text-5xl font-black text-purple-500 italic">{umRM} KG</p>
            <p className="text-[8px] text-zinc-600 mt-2 uppercase font-bold italic">Baseado na fórmula de Brzycki</p>
          </div>
        )}
      </div>
    </div>
  )
}