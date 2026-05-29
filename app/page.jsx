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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between items-center px-6 py-16 font-sans overflow-hidden relative">
      
      {/* Efeito de luz de fundo sutil */}
      <div className="absolute top-[-10%] left-[5%] w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-80 h-80 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center items-center w-full max-w-sm z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-extrabold uppercase tracking-[0.15em] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent leading-none mb-3">
            VEXX
          </h1>
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-[0.35em] mb-4">
            ATHLETICS SQUAD
          </p>
          <div className="h-0.5 w-12 bg-emerald-500/50 mx-auto" />
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-zinc-400 text-center text-sm font-normal mb-12 leading-relaxed max-w-[280px]"
        >
          A rede social definitiva de treinamento de alta performance. Registre suas atividades, analise seus dados e evolua na squad.
        </motion.p>

        <div className="flex flex-col gap-3.5 w-full">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={irLogin}
            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-4 rounded-xl uppercase text-xs tracking-wider transition-all shadow-lg shadow-emerald-950/20 duration-300 cursor-pointer"
          >
            Iniciar Sessão
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={irCadastro}
            className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/80 py-4 rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-300 cursor-pointer"
          >
            Recrutar Nova Conta
          </motion.button>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-zinc-500 text-[10px] font-medium uppercase mt-12 tracking-[0.2em] text-center"
        >
          Consistência supera intensidade.
        </motion.p>
      </div>

      {/* RODAPÉ DE COPYRIGHT */}
      <footer className="mt-auto pt-8 text-center z-10">
        <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-[0.25em]">
          © 2026 VEXX SQUAD. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}