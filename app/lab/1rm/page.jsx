"use client"

import { useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"
import { motion, AnimatePresence } from "framer-motion"

export default function OneRMPage() {
  const [peso, setPeso] = useState("")
  const [reps, setReps] = useState("")
  const [resultado, setResultado] = useState(null)

  const calcular = () => {
    const p = parseFloat(peso)
    const r = parseInt(reps)
    if (!p || !r) return

    // Fórmula de Epley: 1RM = p / (1.0278 - 0.0278 * r)
    const umRM = Math.round(p / (1.0278 - (0.0278 * r)))

    // Calcular tabela de percentual de cargas de treinamento
    const percentuais = [
      { pct: 100, reps: "1 REP", desc: "Força Pura / Recorde Pessoal" },
      { pct: 95, reps: "2 REPS", desc: "Força Máxima Absoluta" },
      { pct: 90, reps: "3-4 REPS", desc: "Bloco de Força / Tensão Alta" },
      { pct: 85, reps: "5-6 REPS", desc: "Hipertrofia Miofibrilar / Carga" },
      { pct: 80, reps: "7-8 REPS", desc: "Hipertrofia Mista / Padrão" },
      { pct: 75, reps: "9-10 REPS", desc: "Hipertrofia Sarcoplasmática" },
      { pct: 70, reps: "11-12 REPS", desc: "Resistência de Força / Volume" },
      { pct: 60, reps: "15 REPS", desc: "Resistência / Capilarização" },
      { pct: 50, reps: "20+ REPS", desc: "Recuperação / Reabilitação Ativa" }
    ].map(item => ({
      ...item,
      pesoEstimado: Math.round((umRM * item.pct) / 100)
    }))

    setResultado({ umRM, percentuais })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 pb-32 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

      <PageHeader icon="⚡" title="Força 1RM" subtitle="Estimativa de força máxima para uma repetição" color="purple" />
      <Link href="/lab" className="text-zinc-500 hover:text-zinc-300 uppercase font-black text-[10px] tracking-widest ml-1">← Voltar ao Lab</Link>

      <div className="mt-8 space-y-6 max-w-sm mx-auto">
        <div className="bg-zinc-900/35 border border-zinc-900 rounded-3xl p-5 backdrop-blur-md">
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black uppercase text-zinc-500 block mb-2 tracking-widest ml-1">Carga Utilizada (kg)</label>
              <input 
                type="number" 
                value={peso} 
                onChange={e => setPeso(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-4 font-bold outline-none focus:border-purple-500/40 text-zinc-200 placeholder:text-zinc-700 transition-all" 
                placeholder="Ex: 80" 
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-zinc-500 block mb-2 tracking-widest ml-1">Repetições Executadas (Reps)</label>
              <input 
                type="number" 
                value={reps} 
                onChange={e => setReps(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-4 font-bold outline-none focus:border-purple-500/40 text-zinc-200 placeholder:text-zinc-700 transition-all" 
                placeholder="Ex: 8" 
              />
            </div>
            <button 
              onClick={calcular} 
              className="w-full bg-purple-500 hover:bg-purple-400 text-black font-black uppercase italic p-4 rounded-2xl shadow-lg shadow-purple-950/20 active:scale-[0.98] transition-all cursor-pointer mt-2 text-xs tracking-wider"
            >
              Calcular Carga Máxima
            </button>
          </div>
        </div>

        <AnimatePresence>
          {resultado && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-5"
            >
              {/* Display de Resultado Principal */}
              <div className="p-6 bg-zinc-900/40 rounded-[2.5rem] border border-zinc-900 text-center">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Carga 1RM Estimada</p>
                <p className="text-5xl font-black text-purple-400 italic tracking-tighter">{resultado.umRM} kg</p>
                <p className="text-[8px] text-zinc-500 font-extrabold uppercase mt-2.5 tracking-widest leading-relaxed">
                  Baseado na fórmula balística de Epley.<br/>Use esses dados para calibrar suas planilhas de força.
                </p>
              </div>

              {/* Tabela de Zonas de Cargas */}
              <div className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-[2rem] space-y-4">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1 mb-2">Tabela de Intensidade Tática</h4>
                
                <div className="space-y-2.5">
                  <div className="flex text-[8px] font-black text-zinc-600 uppercase tracking-widest px-1 mb-1.5 justify-between">
                    <span>Intensidade</span>
                    <span>Peso</span>
                    <span className="w-24 text-right">Objetivo Típico</span>
                  </div>

                  {resultado.percentuais.map((item, idx) => (
                    <div 
                      key={idx}
                      className={`flex justify-between items-center py-2 px-3 rounded-xl border transition-colors ${
                        item.pct >= 90 
                          ? "bg-purple-500/5 border-purple-500/15" 
                          : item.pct >= 75
                            ? "bg-emerald-500/5 border-emerald-500/10"
                            : "bg-zinc-900/40 border-zinc-900/80"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-zinc-200">{item.pct}%</span>
                        <span className="text-[8px] text-zinc-500 font-extrabold uppercase mt-0.5">{item.reps}</span>
                      </div>
                      
                      <span className="text-xs font-black italic text-zinc-100">{item.pesoEstimado} kg</span>
                      
                      <span className="text-[8px] text-zinc-500 font-bold uppercase truncate w-24 text-right">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Navbar />
    </div>
  )
}