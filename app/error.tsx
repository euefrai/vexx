"use client"

import { useEffect } from "react"
import { useToast } from "@/context/ToastContext"

export default function error({ error, reset }: { error: Error; reset: () => void }) {
  const toast = useToast()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[Error Boundary]", error)
    toast.error("Ocorreu um erro não previsto")
  }, [error, toast])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">⚠️ Algo deu errado</h1>
        
        <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg mb-6 text-left">
          <p className="text-red-300 text-sm font-mono break-words">
            {error?.message || "Erro desconhecido"}
          </p>
        </div>

        <p className="text-zinc-400 mb-6">
          Desculpe pelo inconveniente. Tente recarregar a página ou voltar.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="flex-1 bg-green-500 text-black font-bold py-3 rounded-xl hover:bg-green-400 transition-all"
          >
            Tentar Novamente
          </button>
          
          <button
            onClick={() => window.location.href = "/"}
            className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-all"
          >
            Ir para Início
          </button>
        </div>
      </div>
    </div>
  )
}
