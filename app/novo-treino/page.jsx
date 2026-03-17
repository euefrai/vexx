"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { useGamificacao } from "@/hooks/useGamificacao" // 1. Importando o hook

export default function NovoTreino() {
  const router = useRouter()
  const { adicionarXP } = useGamificacao() // 2. Inicializando a função de XP

  const [titulo, setTitulo] = useState("")
  const [autor, setAutor] = useState("") 
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
    if (!titulo || !autor || exercicios[0] === "") {
      return alert("Preencha o título, o autor e pelo menos um exercício!")
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const exerciciosValidos = exercicios.filter(ex => ex.trim() !== "")
      const descricao = exerciciosValidos.join("\n")

      // 3. Salvando o treino no banco
      const { error } = await supabase
        .from("treinos")
        .insert({
          usuario_id: user.id,
          titulo,
          autor,
          grupo,
          descricao
        })

      if (error) throw error

      // --- SISTEMA DE XP ---
      // 4. Calculando XP: 100 base pelo treino + 15 por cada exercício
      const xpTotal = 100 + (exerciciosValidos.length * 15)
      
      const resultado = await adicionarXP(user.id, xpTotal)
      
      if (resultado?.subiuDeNivel) {
        alert(`PARABÉNS! Você subiu para o Nível ${resultado.novoNivel}! 🎖️`)
      }

      alert(`Treino finalizado! Você ganhou +${xpTotal} XP 💪`)
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
          
          {/* Título do Treino */}
          <div>
            <label className="text-[10px] text-zinc-500 font-black ml-1 uppercase tracking-widest">Nome do Treino</label>
            <input
              placeholder="Ex: Treino de Segunda"
              className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 focus:border-green-500 outline-none font-bold"
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Campo do Autor */}
          <div>
            <label className="text-[10px] text-zinc-500 font-black ml-1 uppercase tracking-widest">Criador / Autor</label>
            <input
              placeholder="Seu nome ou apelido"
              className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 focus:border-green-500 outline-none font-bold text-white"
              onChange={(e) => setAutor(e.target.value)}
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
                      type="button"
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
              type="button"
              onClick={adicionarExercicio}
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