"use client"
import { useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"

export default function OneRMPage() {
  const [peso, setPeso] = useState(0)
  const [reps, setReps] = useState(0)
  const [umRM, setUmRM] = useState(null)

  const calcular = () => {
    const p = Number(peso)
    const r = Number(reps)
    if (!p || !r) return

    const resultado = p / (1.0278 - (0.0278 * r))
    setUmRM(Math.round(resultado))
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <PageHeader icon="⚡" title="1RM" subtitle="Cálculo de máximo de uma repetição" color="purple" />
      <Link href="/lab" className="text-zinc-500 uppercase font-black text-[10px]">← Voltar</Link>

      <div className="mt-8 max-w-xs mx-auto space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Peso (kg)</label>
          <input type="number" value={peso} onChange={e => setPeso(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-purple-500" placeholder="Ex: 100" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Repetições</label>
          <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-purple-500" placeholder="Ex: 8" />
        </div>
        <button onClick={calcular} className="w-full bg-purple-500 text-black font-black uppercase italic p-3 rounded-2xl">Calcular 1RM</button>

        {umRM !== null && (
          <div className="mt-6 bg-zinc-900 rounded-2xl border border-purple-500/30 p-4 text-center">
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-black">1RM estimado</p>
            <p className="text-4xl font-black text-purple-400">{umRM} kg</p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}