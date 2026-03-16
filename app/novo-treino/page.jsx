"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function NovoTreino() {
  const router = useRouter()

  const [titulo, setTitulo] = useState("")
  const [grupo, setGrupo] = useState("Peito")
  const [exercicios, setExercicios] = useState([""])
  const [loading, setLoading] = useState(false)

  function adicionarExercicio() {
    setExercicios([...exercicios, ""])
  }

  function atualizarExercicio(index, valor) {
    const novos = [...exercicios]
    novos[index] = valor
    setExercicios(novos)
  }

  function removerExercicio(index) {
    if (exercicios.length > 1) {
      setExercicios(exercicios.filter((_, i) => i !== index))
    }
  }

  async function salvar() {
    if (!titulo || exercicios[0] === "") {
      return alert("Preencha o título e pelo menos um exercício!")
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Transformamos a lista de exercícios em um texto formatado
      const descricao = exercicios.filter(ex => ex.trim() !== "").join("\n")

      const { error } = await supabase
        .from("treinos")
        .insert({
          user_id: user.id, // Padronizado conforme seus erros anteriores
          titulo,
          grupo,
          descricao
        })

      if (error) throw error

      alert("Treino criado com sucesso! 💪")
      router.push("/feed")
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          Novo Treino <span className="text-green-500">💪</span>
        </h1>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs text-zinc-500 font-bold ml-1 uppercase">Nome do Treino</label>
            <input
              placeholder="Ex: Treino de Segunda"
              className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 focus:border-green-500 outline-none"
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Grupo Muscular */}
          <div>
            <label className="text-xs text-zinc-500 font-bold ml-1 uppercase">Foco do Dia</label>
            <select
              className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 focus:border-green-500 outline-none appearance-none"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
            >
              {["Peito", "Costas", "Perna", "Ombro", "Bíceps", "Tríceps", "Full Body","full legg"].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Lista de Exercícios */}
          <div className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800">
            <p className="mb-4 text-sm font-bold text-zinc-400 uppercase tracking-widest">
              Exercícios & Séries
            </p>

            <div className="space-y-3">
              {exercicios.map((ex, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Ex: Supino 3x10"
                    className="flex-1 p-3 bg-black rounded-xl border border-zinc-800 focus:border-green-500 outline-none text-sm"
                    value={ex}
                    onChange={(e) => atualizarExercicio(i, e.target.value)}
                  />
                  {exercicios.length > 1 && (
                    <button 
                      disabled={salvando}
                      onClick={() => removerExercicio(i)}
                      className="text-zinc-600 hover:text-red-500 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={adicionarExercicio}
              disabled={salvando}
              className="mt-4 w-full py-2 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm font-bold hover:border-green-500/50 hover:text-green-500 transition-all"
            >
              + Adicionar mais um
            </button>
          </div>

          {/* Botão Salvar */}
          <button
            onClick={salvar}
            disabled={loading}
            className="w-full bg-green-500 text-black py-4 rounded-2xl font-black text-lg shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "SALVANDO..." : "SALVAR TREINO"}
          </button>
        </div>
      </div>
      <Navbar />
    </>
  )
}