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
  const [loading, setLoading] = useState(false) // O seu estado se chama loading

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
      
      const descricao = exercicios.filter(ex => ex.trim() !== "").join("\n")

      const { error } = await supabase
        .from("treinos")
        .insert({
          user_id: user.id, // Verifique se no banco não é usuario_id
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
        <h1 className="text-2xl font-black uppercase italic mb-6 flex items-center gap-2 text-green-500">
          Novo Treino 💪
        </h1>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="text-[10px] text-zinc-500 font-black ml-1 uppercase tracking-widest">Nome do Treino</label>
            <input
              placeholder="Ex: Treino de Segunda"
              className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 focus:border-green-500 outline-none font-bold"
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Grupo Muscular */}
          <div>
            <label className="text-[10px] text-zinc-500 font-black ml-1 uppercase tracking-widest">Foco do Dia</label>
            <select
              className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 focus:border-green-500 outline-none appearance-none font-bold text-green-500"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
            >
              {["Peito", "Costas", "Perna", "Ombro", "Bíceps", "Tríceps", "Full Body","full legg"].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Lista de Exercícios */}
          <div className="bg-zinc-900/50 p-5 rounded-[2rem] border border-zinc-800 shadow-xl">
            <p className="mb-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              Exercícios & Séries
            </p>

            <div className="space-y-3">
              {exercicios.map((ex, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Ex: Supino 3x10"
                    className="flex-1 p-3 bg-black rounded-xl border border-zinc-800 focus:border-green-500 outline-none text-sm font-medium"
                    value={ex}
                    onChange={(e) => atualizarExercicio(i, e.target.value)}
                  />
                  {exercicios.length > 1 && (
                    <button 
                      // ✅ CORREÇÃO: Trocado 'salvando' por 'loading'
                      disabled={loading} 
                      onClick={() => removerExercicio(i)}
                      className="text-zinc-600 hover:text-red-500 px-2 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={adicionarExercicio}
              // ✅ CORREÇÃO: Trocado 'salvando' por 'loading'
              disabled={loading}
              className="mt-4 w-full py-3 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:border-green-500/50 hover:text-green-500 transition-all"
            >
              + Adicionar mais um
            </button>
          </div>

          {/* Botão Salvar */}
          <button
            onClick={salvar}
            disabled={loading}
            className="w-full bg-green-500 text-black py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-500/10 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-tighter italic"
          >
            {loading ? "SALVANDO..." : "FINALIZAR TREINO 🔥"}
          </button>
        </div>
      </div>
      <Navbar />
    </>
  )
}