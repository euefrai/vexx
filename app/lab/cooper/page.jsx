"use client"
import { useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"

export default function CooperPage() {
  const [distancia, setDistancia] = useState(0)
  const [idade, setIdade] = useState(0)
  const [vo2, setVo2] = useState(null)

  const calcular = () => {
    const d = Number(distancia)
    const i = Number(idade)
    if (!d || !i) return

    const resultado = 22.351 * (d / 1000) - 3.2 * i + 50.2
    setVo2(Math.max(0, Number(resultado.toFixed(1))))
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <PageHeader icon="🏃" title="Cooper Test" subtitle="Estimativa de VO2 Max por 12 minutos" color="green" />
      <Link href="/lab" className="text-zinc-500 uppercase font-black text-[10px]">← Voltar</Link>

      <div className="mt-8 max-w-xs mx-auto space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Distância (m)</label>
          <input type="number" value={distancia} onChange={e => setDistancia(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-green-500" placeholder="Ex: 2800" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Idade</label>
          <input type="number" value={idade} onChange={e => setIdade(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-green-500" placeholder="Ex: 25" />
        </div>
        <button onClick={calcular} className="w-full bg-green-500 text-black font-black uppercase italic p-3 rounded-2xl">Calcular VO2 Max</button>

        {vo2 !== null && (
          <div className="mt-6 bg-zinc-900 rounded-2xl border border-green-500/30 p-4 text-center">
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-black">Estimativa VO2 Max</p>
            <p className="text-4xl font-black text-green-400">{vo2} ml/kg/min</p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}