"use client"

import { useState } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import PageHeader from "@/components/PageHeader"
import { motion, AnimatePresence } from "framer-motion"

export default function IMCPage() {
  const [peso, setPeso] = useState("")
  const [altura, setAltura] = useState("")
  const [resultado, setResultado] = useState(null)

  const calcular = () => {
    const p = parseFloat(peso)
    const altM = parseFloat(altura) / 100
    if (!p || !altM) return

    const imc = parseFloat((p / (altM * altM)).toFixed(1))
    
    let classe = ""
    let cor = ""
    let conselhoTreino = ""
    let conselhoNutri = ""
    let progressoPercent = 0 // para a agulha no gauge

    if (imc < 18.5) {
      classe = "Abaixo do Peso"
      cor = "text-sky-400"
      conselhoTreino = "Foco em hipertrofia muscular. Priorize exercícios multiarticulares de força com cargas progressivas e limite o cardio excessivo."
      conselhoNutri = "Superávit calórico limpo. Aumente o consumo de proteínas de alto valor biológico e carboidratos complexos."
      progressoPercent = Math.min((imc / 18.5) * 25, 25)
    } else if (imc >= 18.5 && imc < 25) {
      classe = "Peso Saudável"
      cor = "text-emerald-400"
      conselhoTreino = "Recomposição corporal e ganho de massa magra. Combine treinos de força pesados com 2 a 3 sessões semanais de cardio de alta intensidade."
      conselhoNutri = "Manutenção calórica ou leve superávit. Foco em micronutrientes, hidratação e constância nas refeições pré/pós treino."
      progressoPercent = 25 + ((imc - 18.5) / 6.5) * 25
    } else if (imc >= 25 && imc < 30) {
      classe = "Sobrepeso"
      cor = "text-amber-400"
      conselhoTreino = "Recomposição ativa. Combine musculação de alta intensidade com treinos táticos de corrida/cardio (LISS e HIIT) para queimar gordura preservando músculos."
      conselhoNutri = "Déficit calórico moderado (300-500 kcal). Aumente a ingestão de fibras e proteínas para maximizar a saciedade."
      progressoPercent = 50 + ((imc - 25) / 5) * 25
    } else {
      classe = "Obesidade"
      cor = "text-rose-500"
      conselhoTreino = "Treinos de força consistentes para proteção articular e aumento do gasto basal. Faça cardio de baixo impacto (caminhada inclinada, elíptico) para preservar joelhos."
      conselhoNutri = "Déficit calórico controlado. Reduza carboidratos refinados e ultraprocessados, priorizando fontes limpas e alimentos integrais."
      progressoPercent = 75 + Math.min(((imc - 30) / 10) * 25, 25)
    }

    setResultado({ imc, classe, cor, conselhoTreino, conselhoNutri, progressoPercent })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 pb-32 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

      <PageHeader icon="⚖️" title="Medir IMC" subtitle="Análise de índice de massa corporal" color="green" />
      <Link href="/lab" className="text-zinc-500 hover:text-zinc-300 uppercase font-black text-[10px] tracking-widest ml-1">← Voltar ao Lab</Link>
      
      <div className="mt-8 space-y-6 max-w-sm mx-auto">
        <div className="bg-zinc-900/35 border border-zinc-900 rounded-3xl p-5 backdrop-blur-md">
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black uppercase text-zinc-500 block mb-2 tracking-widest ml-1">Peso Corporal (kg)</label>
              <input 
                type="number" 
                value={peso} 
                onChange={e => setPeso(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-4 font-bold outline-none focus:border-emerald-500/40 text-zinc-200 placeholder:text-zinc-700 transition-all" 
                placeholder="Ex: 82" 
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-zinc-500 block mb-2 tracking-widest ml-1">Altura Tática (cm)</label>
              <input 
                type="number" 
                value={altura} 
                onChange={e => setAltura(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-4 font-bold outline-none focus:border-emerald-500/40 text-zinc-200 placeholder:text-zinc-700 transition-all" 
                placeholder="Ex: 178" 
              />
            </div>
            <button 
              onClick={calcular} 
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase italic p-4 rounded-2xl shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition-all cursor-pointer mt-2 text-xs tracking-wider"
            >
              Analisar Biometria Tática
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
              {/* Card principal com o valor */}
              <div className="p-6 bg-zinc-900/40 rounded-[2.5rem] border border-zinc-900 text-center relative overflow-hidden">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Seu IMC Calculado</p>
                <p className="text-5xl font-black text-emerald-400 italic tracking-tighter">{resultado.imc}</p>
                <p className={`text-xs font-black uppercase mt-2 tracking-wide ${resultado.cor}`}>{resultado.classe}</p>

                {/* Gauge Horizontal de Espectro */}
                <div className="mt-6 space-y-2">
                  <div className="relative w-full h-2.5 bg-zinc-800 rounded-full overflow-visible flex">
                    <div className="w-[25%] h-full bg-sky-400 rounded-l-full" title="Abaixo do peso" />
                    <div className="w-[25%] h-full bg-emerald-400" title="Normal" />
                    <div className="w-[25%] h-full bg-amber-400" title="Sobrepeso" />
                    <div className="w-[25%] h-full bg-rose-500 rounded-r-full" title="Obesidade" />
                    
                    {/* Indicador de agulha flutuante */}
                    <motion.div 
                      initial={{ left: "0%" }}
                      animate={{ left: `${resultado.progressoPercent}%` }}
                      transition={{ type: "spring", damping: 15 }}
                      className="absolute -top-1 w-4 h-4 bg-zinc-100 border-2 border-zinc-950 rounded-full -ml-2 shadow-md flex items-center justify-center"
                    >
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-[7px] text-zinc-600 font-extrabold uppercase px-0.5 tracking-wider">
                    <span>Abaixo</span>
                    <span>Saudável</span>
                    <span>Sobrepeso</span>
                    <span>Obeso</span>
                  </div>
                </div>
              </div>

              {/* Recomendações personalizadas baseadas no IMC */}
              <div className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-[2rem] space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🏋️‍♂️</span>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Protocolo de Treino</h4>
                    <p className="text-[10px] text-zinc-300 font-medium leading-relaxed mt-1">{resultado.conselhoTreino}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 pt-3.5 border-t border-zinc-900/50">
                  <span className="text-lg">🥩</span>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Diretrizes Alimentares</h4>
                    <p className="text-[10px] text-zinc-300 font-medium leading-relaxed mt-1">{resultado.conselhoNutri}</p>
                  </div>
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