"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

export default function BotaoFlutuante() {
  const [aberto, setAberto] = useState(false)
  const router = useRouter()

  // Aqui você pode colocar o caminho "bagunçado" que a função vai limpar
  const acoes = [
    { label: "Missão IA", icon: "🤖", rota: "criar-treino-ia", color: "bg-green-500" },
    { label: "Bio Scanner", icon: "📷", rota: "/lab/macros/", color: "bg-blue-500" },
    { label: "Inteligência", icon: "💀", rota: "//unidade-comando", color: "bg-red-600" },
    { label: "Nova Missão", icon: "📝", rota: "/novo-treino", color: "bg-zinc-700" },
  ]

  // 🔥 FUNÇÃO CORINGA: Limpa as rotas automaticamente
  const navegarPara = (caminhoSujo) => {
    // 1. Pega apenas a última parte da rota (o slug real) caso você tenha movido de pasta
    // Ex: "/lab/macros/" vira "macros"
    const partes = caminhoSujo.split('/').filter(Boolean);
    const slugReal = partes[partes.length - 1];

    // 2. Navega para a raiz do slug, ignorando caminhos intermediários errados
    router.push(`/${slugReal}`);
    setAberto(false);
  }

  return (
    <div className="fixed bottom-24 right-6 flex flex-col items-end gap-3 z-[100]">
      <AnimatePresence>
        {aberto && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {acoes.map((acao, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2"
              >
                <span className="bg-black/80 text-white text-[10px] px-2 py-1 rounded-md font-black uppercase italic border border-zinc-800">
                  {acao.label}
                </span>
                <button
                  onClick={() => navegarPara(acao.rota)} // Chamada da função inteligente
                  className={`${acao.color} w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-xl border border-white/20`}
                >
                  {acao.icon}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setAberto(!aberto)}
        className={`w-14 h-14 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center text-3xl font-bold transition-all ${
          aberto ? "bg-zinc-800 text-white rotate-45" : "bg-green-400 text-black"
        }`}
      >
        +
      </motion.button>
    </div>
  )
}