"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function CriarTreinoIA() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [treino, setTreino] = useState("")
  const router = useRouter()

  const prompts = [
    "Treino para ganhar massa muscular",
    "Treino para emagrecer rápido",
    "Treino só com peso corporal em casa",
    "Treino para iniciante completo",
    "Treino avançado de hipertrofia",
    "Treino focado em perna",
    "Treino estilo push pull legs"
  ]

  // Corrigido: removi a tipagem explícita que causa erro se o ambiente não estiver 100% TS
  async function gerarTreino(texto) {
    if (!texto || !texto.trim()) return

    setLoading(true)
    setTreino("")

    try {
      const res = await fetch("/api/gerar-treino", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: texto })
      })

      const data = await res.json()
      
      if (data.treino) {
        setTreino(data.treino)
      } else {
        alert("A IA não retornou um treino válido.")
      }

    } catch (err) {
      console.error(err)
      alert("Erro ao conectar com a IA 😢")
    } finally {
      setLoading(false)
    }
  }

  function enviarParaMissao() {
    if (!treino) return
    const encoded = encodeURIComponent(treino)
    router.push(`/novo-treino?ia=${encoded}`)
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">
      <h1 className="text-2xl font-black text-green-500 mb-6 text-center italic uppercase">
        GERADOR DE TREINO IA 🤖
      </h1>

      {/* PROMPTS PRONTOS */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center max-w-md mx-auto">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setInput(p) // Preenche o input também para o usuário ver
              gerarTreino(p)
            }}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold uppercase hover:border-green-500/50 transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* INPUT MANUAL */}
      <div className="max-w-md mx-auto mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descreva o treino que você quer..."
          className="w-full p-4 bg-zinc-900 rounded-2xl outline-none border border-zinc-800 focus:border-green-500 font-bold text-sm"
        />
      </div>

      <div className="max-w-md mx-auto">
        <button
          onClick={() => gerarTreino(input)}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-black transition active:scale-95 ${
            loading ? "bg-zinc-800 text-zinc-500" : "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          }`}
        >
          {loading ? "PROCESSANDO ESTRATÉGIA..." : "GERAR TREINO 🔥"}
        </button>
      </div>

      {/* RESULTADO DA IA */}
      {treino && (
        <div className="max-w-md mx-auto mt-6 bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800 animate-in fade-in zoom-in duration-300">
          <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-4">Briefing da Missão:</p>
          
          <div className="text-sm leading-relaxed whitespace-pre-line font-medium text-zinc-300">
            {treino}
          </div>

          <button
            onClick={enviarParaMissao}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all uppercase italic text-xs tracking-tighter"
          >
            ENVIAR PARA REGISTRAR MISSÃO 🚀
          </button>
        </div>
      )}

      <Navbar />
    </div>
  )
}