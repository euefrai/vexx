"use client"
import { useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"

export default function CaloriasPage() {
  const [peso, setPeso] = useState(0)
  const [duracao, setDuracao] = useState(0)
  const [nivel, setNivel] = useState("moderado")
  const [kcal, setKcal] = useState(null)

  const factors = { leve: 5.0, moderado: 8.0, pesado: 10.0 }

  const calcular = () => {
    const p = Number(peso)
    const d = Number(duracao)
    if (!p || !d) return
    const gasto = p * factors[nivel] * (d / 60)
    setKcal(gasto.toFixed(1))
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <PageHeader icon="🔥" title="Calorias" subtitle="Estimativa de gasto em treino" color="orange" />
      <Link href="/lab" className="text-zinc-500 uppercase font-black text-[10px]">← Voltar</Link>

      <div className="mt-8 max-w-xs mx-auto space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Peso (kg)</label>
          <input type="number" value={peso} onChange={e => setPeso(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-orange-500" placeholder="Ex: 80" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Duração (min)</label>
          <input type="number" value={duracao} onChange={e => setDuracao(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-orange-500" placeholder="Ex: 45" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Intensidade</label>
          <select value={nivel} onChange={e => setNivel(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-orange-500">
            <option value="leve">Leve</option>
            <option value="moderado">Moderado</option>
            <option value="pesado">Pesado</option>
          </select>
        </div>
        <button onClick={calcular} className="w-full bg-orange-500 text-black font-black uppercase italic p-3 rounded-2xl">Calcular Gasto</button>

        {kcal !== null && (
          <div className="mt-6 bg-zinc-900 rounded-2xl border border-orange-500/30 p-4 text-center">
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-black">Calorias estimadas queimadas</p>
            <p className="text-4xl font-black text-orange-400">{kcal} kcal</p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}