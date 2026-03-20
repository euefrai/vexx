"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function CriarTreinoIA() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [treino, setTreino] = useState("")
  const router = useRouter()

  // 🔥 PROMPTS PRONTOS (editável)
  const prompts = [
    "Treino para ganhar massa muscular",
    "Treino para emagrecer rápido",
    "Treino só com peso corporal em casa",
    "Treino para iniciante completo",
    "Treino avançado de hipertrofia",
    "Treino focado em perna",
    "Treino estilo push pull legs"
  ]

  async function gerarTreino(texto: string) {
    if (!texto.trim()) return

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
      setTreino(data.treino)

    } catch (err) {
      console.error(err)
      alert("Erro ao gerar treino 😢")
    } finally {
      setLoading(false)
    }
  }

  function enviarParaMissao() {
    if (!treino) return
    const encoded = encodeURIComponent(treino)

    // 🔥 REDIRECIONA PRA SUA TELA
    router.push(`/novo-treino?ia=${encoded}`)
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">

      {/* HEADER */}
      <h1 className="text-2xl font-black text-green-500 mb-6 text-center">
        GERADOR DE TREINO IA 🤖
      </h1>

      {/* PROMPTS */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => gerarTreino(p)}
            className="px-3 py-2 bg-zinc-800 rounded-xl text-xs hover:bg-green-500/20 transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <div className="max-w-md mx-auto mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descreva o treino que você quer..."
          className="w-full p-3 bg-zinc-900 rounded-xl outline-none border border-zinc-800 focus:border-green-500"
        />
      </div>

      {/* BOTÃO */}
      <div className="max-w-md mx-auto">
        <button
          onClick={() => gerarTreino(input)}
          className="w-full bg-green-500 text-black py-3 rounded-xl font-bold active:scale-95 transition"
        >
          GERAR TREINO 🔥
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-center text-zinc-400 mt-4">
          Gerando treino com IA...
        </p>
      )}

      {/* RESULTADO */}
      {treino && (
        <div className="max-w-md mx-auto mt-6 bg-zinc-900 p-4 rounded-xl whitespace-pre-line border border-zinc-800">

          <p className="text-green-400 text-sm mb-2">TREINO GERADO:</p>

          {treino}

          {/* BOTÃO ENVIAR */}
          <button
            onClick={enviarParaMissao}
            className="mt-4 w-full bg-blue-500 py-3 rounded-xl font-bold active:scale-95 transition"
          >
            ENVIAR PARA REGISTRAR MISSÃO 🚀
          </button>
        </div>
      )}

      <Navbar />
    </div>
  )
}