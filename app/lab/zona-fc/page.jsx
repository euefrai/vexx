"use client"
import { useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"

export default function ZonaFCPage() {
  const [idade, setIdade] = useState(0)
  const [freqAtual, setFreqAtual] = useState(0)
  const [zonas, setZonas] = useState(null)

  const calcular = () => {
    const i = Number(idade)
    if (!i) return

    const max = 220 - i
    setZonas({
      leve: `${Math.round(max * 0.5)} - ${Math.round(max * 0.6)}`,
      moderado: `${Math.round(max * 0.6)} - ${Math.round(max * 0.7)}`,
      duro: `${Math.round(max * 0.7)} - ${Math.round(max * 0.8)}`,
      anaerobico: `${Math.round(max * 0.8)} - ${Math.round(max * 0.9)}`,
      maximo: `${Math.round(max * 0.9)} - ${max}`
    })
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <PageHeader icon="❤️" title="Zonas de FC" subtitle="Treino otimizado pelo pulso" color="red" />
      <Link href="/lab" className="text-zinc-500 uppercase font-black text-[10px]">← Voltar</Link>

      <div className="mt-8 max-w-xs mx-auto space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Idade</label>
          <input type="number" value={idade} onChange={e => setIdade(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-red-500" placeholder="Ex: 28" />
        </div>
        <button onClick={calcular} className="w-full bg-red-500 text-black font-black uppercase italic p-3 rounded-2xl">Calcular Zonas</button>

        {zonas && (
          <div className="mt-6 bg-zinc-900 rounded-2xl border border-red-500/30 p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Frequência cardíaca máxima estimada: {220 - Number(idade)} bpm</p>
            <p className="font-black text-green-400">Zone Leve: {zonas.leve} bpm</p>
            <p className="font-black text-blue-400">Zone Moderada: {zonas.moderado} bpm</p>
            <p className="font-black text-orange-400">Zone Dura: {zonas.duro} bpm</p>
            <p className="font-black text-red-400">Zone Anaeróbica: {zonas.anaerobico} bpm</p>
            <p className="font-black text-pink-400">Zone Máxima: {zonas.maximo} bpm</p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}