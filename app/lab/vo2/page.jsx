"use client"
import { useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"

export default function VO2Page() {
  const [idade, setIdade] = useState(0)
  const [freqRepouso, setFreqRepouso] = useState(0)
  const [vo2, setVo2] = useState(null)

  const calcular = () => {
    const i = Number(idade)
    const fr = Number(freqRepouso)
    if (!i || !fr) return

    const est = 15.3 * (220 - i) / fr
    setVo2(Number(est.toFixed(1)))
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <PageHeader icon="🧠" title="VO2 Estimado" subtitle="Baseado em idade e pulso de repouso" color="blue" />
      <Link href="/lab" className="text-zinc-500 uppercase font-black text-[10px]">← Voltar</Link>

      <div className="mt-8 max-w-xs mx-auto space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Idade</label>
          <input type="number" value={idade} onChange={e => setIdade(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-blue-500" placeholder="Ex: 26" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">FC repouso (bpm)</label>
          <input type="number" value={freqRepouso} onChange={e => setFreqRepouso(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-blue-500" placeholder="Ex: 57" />
        </div>
        <button onClick={calcular} className="w-full bg-blue-500 text-black font-black uppercase italic p-3 rounded-2xl">Calcular VO2</button>

        {vo2 !== null && (
          <div className="mt-6 bg-zinc-900 rounded-2xl border border-blue-500/30 p-4 text-center">
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-black">VO2 estimado</p>
            <p className="text-4xl font-black text-blue-400">{vo2} ml/kg/min</p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}