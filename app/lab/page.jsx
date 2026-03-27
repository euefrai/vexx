"use client"

import Navbar from "@/components/Navbar"
import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import PageHeader from "@/components/PageHeader"

export default function LabPage() {

  // 🧠 DASHBOARD STATES
  const [calorias, setCalorias] = useState(0)
  const [proteina, setProteina] = useState(0)

  const META_CALORIAS = 2000
  const META_PROTEINA = 150

  useEffect(() => {
    const macros = JSON.parse(localStorage.getItem("elite_macros_history")) || []

    const totalCal = macros.reduce((acc, item) => acc + item.calorias, 0)
    const totalProt = macros.reduce((acc, item) => acc + item.proteina, 0)

    setCalorias(totalCal)
    setProteina(totalProt)
  }, [])

  const progressoCal = Math.min((calorias / META_CALORIAS) * 100, 100)
  const progressoProt = Math.min((proteina / META_PROTEINA) * 100, 100)

  function getMensagem() {
    if (progressoProt >= 100) return "🔥 Shape batido hoje. Monstro."
    if (progressoProt >= 70) return "💪 Tá no caminho. Continua."
    if (progressoProt >= 40) return "⚠️ Bora comer melhor."
    return "💀 Tá fraco hoje..."
  }

  // 🚀 RUN ADICIONADO NO TOPO
  const tools = [
    {
      nome: "RUN",
      desc: "Corrida em tempo real (GPS)",
      icon: "🏃‍♂️",
      link: "/run",
      cor: "border-emerald-500/40"
    },

    { nome: "CRONÔMETRO", desc: "Tempo Total de Treino", icon: "⏱️", link: "/lab/cronometro", cor: "border-blue-500/30" },
    { nome: "DESCANSO", desc: "Timer de Intervalo", icon: "⏳", link: "/lab/descanso", cor: "border-orange-500/30" },
    { nome: "MEDIR IMC", desc: "Índice de Massa Corporal", icon: "⚖️", link: "/lab/imc", cor: "border-green-500/30" },
    { nome: "1RM", desc: "Força máxima estimada", icon: "⚡", link: "/lab/1rm", cor: "border-purple-500/30" },
    { nome: "COOPER", desc: "Teste de 12 minutos", icon: "🏃", link: "/lab/cooper", cor: "border-emerald-500/30" },
    { nome: "ZONAS FC", desc: "Treino por pulso", icon: "❤️", link: "/lab/zona-fc", cor: "border-red-500/30" },
    { nome: "CALORIAS", desc: "Estimativa de gasto", icon: "🔥", link: "/lab/calorias", cor: "border-orange-500/30" },
    { nome: "VO2", desc: "Estimativa de capacidade aeróbica", icon: "🧠", link: "/lab/vo2", cor: "border-blue-500/30" },
    { nome: "MACROS", desc: "Proteína/Carbo/Gordura", icon: "🥩", link: "/lab/macros", cor: "border-red-500/30" },
    { nome: "METABOLISMO", desc: "Gasto Calórico Diário", icon: "🔥", link: "/lab/tmb", cor: "border-yellow-500/30" },
  ]

  return (
    <div className="max-w-md mx-auto p-6 pb-32 min-h-screen bg-black text-white font-sans">
      <PageHeader icon="🧪" title="Laboratório" subtitle="Ferramentas e calculadoras de fitness" color="purple" />


      {/* 🔥 DASHBOARD */}
      <div className="bg-zinc-900/40 border border-green-500/20 p-4 rounded-3xl mb-8">

        <p className="text-[10px] text-zinc-500 uppercase mb-3">
          Resumo do dia
        </p>

        {/* CALORIAS */}
        <div className="mb-4">
          <p className="text-[10px] text-zinc-500 mb-1">
            Calorias: {calorias} / {META_CALORIAS}
          </p>
          <div className="w-full h-2 bg-zinc-800 rounded-full">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${progressoCal}%` }}
            />
          </div>
        </div>

        {/* PROTEÍNA */}
        <div className="mb-4">
          <p className="text-[10px] text-zinc-500 mb-1">
            Proteína: {proteina.toFixed(1)}g / {META_PROTEINA}g
          </p>
          <div className="w-full h-2 bg-zinc-800 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progressoProt}%` }}
            />
          </div>
        </div>

        {/* IA */}
        <p className="text-[10px] text-center text-green-400 italic">
          {getMensagem()}
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.nome}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={tool.link}>
              <div className={`group relative bg-zinc-900/40 border ${tool.cor} p-5 rounded-[2.5rem] hover:bg-zinc-800/60 transition-all active:scale-95 h-full flex flex-col justify-between overflow-hidden`}>
                
                {/* 🔥 BADGE LIVE NO RUN */}
                {tool.nome === "RUN" && (
                  <span className="absolute top-2 right-3 text-[8px] bg-emerald-500 text-black px-2 py-[2px] rounded-full font-black animate-pulse">
                    LIVE
                  </span>
                )}

                <div className="absolute -right-4 -top-4 w-12 h-12 bg-white/5 blur-2xl group-hover:bg-green-500/10 transition-colors"></div>
                
                <div>
                  <span className="text-3xl mb-3 block">{tool.icon}</span>
                  <h3 className="font-black text-xs uppercase italic tracking-tight group-hover:text-green-400 transition-colors">
                    {tool.nome}
                  </h3>
                </div>
                
                <p className="text-[8px] text-zinc-600 uppercase font-black mt-2 leading-tight">
                  {tool.desc}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* STATUS */}
      <div className="mt-8 p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-[10px] font-black uppercase italic text-zinc-500">
            Sistema ativo
          </p>
        </div>
      </div>

      <Navbar />
    </div>
  )
}