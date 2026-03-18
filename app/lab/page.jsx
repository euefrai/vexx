"use client"

import Navbar from "@/components/Navbar"
import Link from "next/link"
import { motion } from "framer-motion"

export default function LabPage() {
  const tools = [
    { 
      nome: "CRONÔMETRO", 
      desc: "Tempo Total de Treino", 
      icon: "⏱️", 
      link: "/lab/cronometro",
      cor: "border-blue-500/30" 
    },
    { 
      nome: "DESCANSO", 
      desc: "Timer de Intervalo", 
      icon: "⏳", 
      link: "/lab/descanso",
      cor: "border-orange-500/30" 
    },
    { 
      nome: "MEDIR IMC", 
      desc: "Índice de Massa Corporal", 
      icon: "⚖️", 
      link: "/lab/imc",
      cor: "border-green-500/30" 
    },
    { 
      nome: "RPM / 1RM", 
      desc: "Cálculo de Força Máxima", 
      icon: "⚡", 
      link: "/lab/rpm",
      cor: "border-purple-500/30" 
    },
    { 
      nome: "MACROS", 
      desc: "Proteína/Carbo/Gordura", 
      icon: "🥩", 
      link: "/lab/macros",
      cor: "border-red-500/30" 
    },
    { 
      nome: "METABOLISMO", 
      desc: "Gasto Calórico Diário", 
      icon: "🔥", 
      link: "/lab/tmb",
      cor: "border-yellow-500/30" 
    },
  ]

  return (
    <div className="max-w-md mx-auto p-6 pb-32 min-h-screen bg-black text-white font-sans">
      {/* Header Estilizado */}
      <header className="mb-10">
        <h1 className="text-3xl font-black uppercase italic text-green-500 tracking-tighter">
          BIOMETRICS <span className="text-white">LAB</span>
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-[2px] w-12 bg-green-500"></div>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">
            Elite Squad Performance Tools
          </p>
        </div>
      </header>

      {/* Grid de Ferramentas */}
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
                {/* Efeito de brilho ao passar o mouse */}
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

      {/* Banner de Aviso/Status */}
      <div className="mt-8 p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-[10px] font-black uppercase italic text-zinc-500">
            Todos os sistemas operacionais
          </p>
        </div>
      </div>

      <Navbar />
    </div>
  )
}