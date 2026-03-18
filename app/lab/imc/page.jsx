"use client"
import { useState } from "react"
import Link from "next/link"

export default function IMCPage() {
  const [peso, setPeso] = useState("")
  const [altura, setAltura] = useState("")
  const [resultado, setResultado] = useState(null)

  const calcular = () => {
    const altM = altura / 100
    const imc = (peso / (altM * altM)).toFixed(1)
    setResultado(imc)
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <Link href="/lab" className="text-zinc-500 uppercase font-black text-[10px]">← Voltar</Link>
      <h1 className="text-2xl font-black uppercase italic text-green-500 mt-8 mb-8 tracking-tighter text-center">Índice de Massa Corporal</h1>
      
      <div className="space-y-6 max-w-xs mx-auto">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Peso (kg)</label>
          <input type="number" value={peso} onChange={e => setPeso(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 font-black outline-none focus:border-green-500 text-white" placeholder="Ex: 85" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2">Altura (cm)</label>
          <input type="number" value={altura} onChange={e => setAltura(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 font-black outline-none focus:border-green-500 text-white" placeholder="Ex: 180" />
        </div>
        <button onClick={calcular} className="w-full bg-green-500 text-black font-black uppercase italic p-4 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)]">Analisar Biometria</button>
        
        {resultado && (
          <div className="mt-8 p-6 bg-zinc-900 rounded-[2.5rem] border border-green-500/30 text-center animate-in fade-in zoom-in duration-300">
            <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Seu IMC é</p>
            <p className="text-5xl font-black text-green-500 italic">{resultado}</p>
          </div>
        )}
      </div>
    </div>
  )
}