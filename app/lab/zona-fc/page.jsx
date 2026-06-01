"use client"

import { useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"
import { motion, AnimatePresence } from "framer-motion"

export default function ZonaFCPage() {
  const [idade, setIdade] = useState("")
  const [resultado, setResultado] = useState(null)

  const calcular = () => {
    const i = parseInt(idade)
    if (!i) return

    const max = 220 - i

    const zonas = [
      {
        num: "ZONA 1",
        nome: "Recuperação Ativa",
        pct: "50% - 60%",
        cor: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5",
        bpmRange: `${Math.round(max * 0.5)} - ${Math.round(max * 0.6)} BPM`,
        desc: "Ideal para aquecimento, resfriamento e regeneração ativa muscular. Foco em saúde vascular básica e queima leve de gordura."
      },
      {
        num: "ZONA 2",
        nome: "Base Aeróbica / Queima de Gordura",
        pct: "60% - 70%",
        cor: "text-sky-400 border-sky-500/10 bg-sky-500/5",
        bpmRange: `${Math.round(max * 0.6)} - ${Math.round(max * 0.7)} BPM`,
        desc: "Zona de máxima lipólise (oxidação de gordura). Constrói resistência de longa duração, melhora a densidade mitocondrial e eficiência metabólica."
      },
      {
        num: "ZONA 3",
        nome: "Ritmo / Tempo Run",
        pct: "70% - 80%",
        cor: "text-amber-400 border-amber-500/10 bg-amber-500/5",
        bpmRange: `${Math.round(max * 0.7)} - ${Math.round(max * 0.8)} BPM`,
        desc: "Melhora a capacidade cardiovascular geral. O corpo começa a recrutar glicogênio de forma mista. Aumenta a velocidade de cruzeiro aeróbica."
      },
      {
        num: "ZONA 4",
        nome: "Limiar de Lactato / Anaeróbico",
        pct: "80% - 90%",
        cor: "text-orange-500 border-orange-500/10 bg-orange-500/5",
        bpmRange: `${Math.round(max * 0.8)} - ${Math.round(max * 0.9)} BPM`,
        desc: "Aumenta a tolerância ao lactato e a velocidade tática. O corpo trabalha próximo ao ponto de acúmulo de ácido nos músculos."
      },
      {
        num: "ZONA 5",
        nome: "Esforço Máximo / VO2 Max",
        pct: "90% - 100%",
        cor: "text-rose-500 border-rose-500/10 bg-rose-500/5",
        bpmRange: `${Math.round(max * 0.9)} - ${max} BPM`,
        desc: "Desenvolve a potência aeróbica máxima (VO2 Max) e explosão neuromuscular. Suportável apenas por curtos intervalos (sprints e tiros)."
      }
    ]

    setResultado({ max, zonas })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 pb-32 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />

      <PageHeader icon="❤️" title="Zonas de FC" subtitle="Frequência cardíaca para treinamento otimizado" color="red" />
      <Link href="/lab" className="text-zinc-500 hover:text-zinc-300 uppercase font-black text-[10px] tracking-widest ml-1">← Voltar ao Lab</Link>

      <div className="mt-8 space-y-6 max-w-sm mx-auto">
        <div className="bg-zinc-900/35 border border-zinc-900 rounded-3xl p-5 backdrop-blur-md">
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black uppercase text-zinc-500 block mb-2 tracking-widest ml-1">Sua Idade</label>
              <input 
                type="number" 
                value={idade} 
                onChange={e => setIdade(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-4 font-bold outline-none focus:border-red-500/40 text-zinc-200 placeholder:text-zinc-700 transition-all" 
                placeholder="Ex: 28" 
              />
            </div>
            <button 
              onClick={calcular} 
              className="w-full bg-red-500 hover:bg-red-400 text-black font-black uppercase italic p-4 rounded-2xl shadow-lg shadow-red-950/20 active:scale-[0.98] transition-all cursor-pointer mt-2 text-xs tracking-wider"
            >
              Calcular Zonas Cardíacas
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
              {/* Display FC Máxima */}
              <div className="p-6 bg-zinc-900/40 rounded-[2.5rem] border border-zinc-900 text-center">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">FC Máxima Estimada</p>
                <p className="text-5xl font-black text-red-500 italic tracking-tighter">{resultado.max} <span className="text-xl">BPM</span></p>
                <p className="text-[8.5px] text-zinc-600 font-extrabold uppercase mt-2.5 tracking-widest">
                  Fórmula clássica Astrand: 220 - idade.
                </p>
              </div>

              {/* Guia detalhado de Zonas */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-2 mb-1">Zonas de Intensidade de Campo</h4>

                {resultado.zonas.map((zona, idx) => (
                  <div 
                    key={idx}
                    className={`p-5 rounded-[2rem] border transition-all ${zona.cor}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider opacity-60">{zona.num} • {zona.pct}</span>
                        <h4 className="text-xs font-black uppercase italic tracking-tight mt-0.5">{zona.nome}</h4>
                      </div>
                      
                      <span className="text-xs font-black italic shrink-0 whitespace-nowrap bg-black/30 px-3 py-1 rounded-xl border border-white/5">{zona.bpmRange}</span>
                    </div>
                    
                    <p className="text-[10px] text-zinc-300 font-medium leading-relaxed mt-2.5 opacity-90">{zona.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Navbar />
    </div>
  )
}