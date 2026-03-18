"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function Home() {
  const router = useRouter()

  function irLogin() {
    router.push("/login")
  }

  function irCadastro() {
    router.push("/cadastro")
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between items-center px-6 py-12 font-sans overflow-hidden relative">
      
      {/* Efeito de luz de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-green-500/10 blur-[120px] rounded-full" />

      <div className="flex-1 flex flex-col justify-center items-center w-full max-w-sm z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-6xl font-black italic uppercase tracking-tighter text-green-500 leading-none mb-2">
            ELITE<br/>SQUAD
          </h1>
          <div className="h-1 w-20 bg-white mx-auto mb-4" />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">
            Operação Fitness • Vol. 01
          </p>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-400 text-center text-sm font-medium mb-12 leading-relaxed"
        >
          A rede social definitiva para quem não aceita desculpas. 
          Registre missões, suba de nível e domine o ranking.
        </motion.p>

        <div className="flex flex-col gap-4 w-full">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={irLogin}
            className="bg-green-500 hover:bg-green-400 text-black font-black py-5 rounded-[2rem] uppercase italic text-lg shadow-[0_10px_40px_rgba(34,197,94,0.3)] transition-all"
          >
            INICIAR SESSÃO
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={irCadastro}
            className="border-2 border-zinc-800 hover:border-zinc-600 py-5 rounded-[2rem] font-black uppercase italic text-sm tracking-widest transition-all"
          >
            RECRUTAR NOVA CONTA
          </motion.button>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-zinc-600 text-[10px] font-black uppercase mt-12 tracking-widest text-center italic"
        >
          "Treino difícil, combate fácil."
        </motion.p>
      </div>

      {/* RODAPÉ DE COPYRIGHT */}
      <footer className="mt-auto pt-10 text-center z-10">
        <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.2em]">
          © 2026 @eu.efrai - Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}