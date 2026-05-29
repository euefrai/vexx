"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Sparkles, Camera, Shield, Plus, X, Pencil } from "lucide-react"

export default function BotaoFlutuante() {
  const [aberto, setAberto] = useState(false)
  const router = useRouter()

  const acoes = [
    { label: "Missão IA", icon: <Sparkles size={16} />, rota: "/criar-treino-ia", color: "bg-emerald-500 hover:bg-emerald-400 text-zinc-950" },
    { label: "Bio Scanner", icon: <Camera size={16} />, rota: "/lab/macros", color: "bg-blue-600 hover:bg-blue-500 text-white" },
    { label: "Inteligência", icon: <Shield size={16} />, rota: "/unidade-comando", color: "bg-rose-600 hover:bg-rose-500 text-white" },
    { label: "Nova Missão", icon: <Pencil size={16} />, rota: "/novo-treino", color: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200" },
  ]

  return (
    <div className="fixed bottom-24 right-6 flex flex-col items-end gap-3.5 z-[100]">
      <AnimatePresence>
        {aberto && (
          <div className="flex flex-col items-end gap-3 mb-1">
            {acoes.map((acao, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2.5"
              >
                <span className="bg-zinc-900/90 text-zinc-300 text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider border border-zinc-800/80 backdrop-blur-sm shadow-md">
                  {acao.label}
                </span>
                <button
                  onClick={() => {
                    router.push(acao.rota)
                    setAberto(false)
                  }}
                  className={`${acao.color} w-11 h-11 rounded-xl shadow-lg flex items-center justify-center border border-white/5 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 cursor-pointer`}
                >
                  {acao.icon}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setAberto(!aberto)}
        className={`w-13 h-13 rounded-xl shadow-xl flex items-center justify-center transition-all duration-300 border border-white/5 cursor-pointer ${
          aberto ? "bg-zinc-800 text-zinc-300" : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/20"
        }`}
      >
        <motion.div
          animate={{ rotate: aberto ? 135 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center"
        >
          {aberto ? <X size={20} /> : <Plus size={22} />}
        </motion.div>
      </motion.button>
    </div>
  )
}