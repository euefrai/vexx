"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { useGamificacao } from "@/hooks/useGamificacao"
import { motion, AnimatePresence } from "framer-motion"

export default function NovoTreino() {
  const router = useRouter()
  const { adicionarXP } = useGamificacao()

  const [titulo, setTitulo] = useState("")
  const [autor, setAutor] = useState("") 
  const [grupo, setGrupo] = useState("Full Body")
  const [intensidade, setIntensidade] = useState("Moderado")
  
  // Agora cada item é uma "Descrição" que contém o exercício e as reps
  const [exercicios, setExercicios] = useState([
    { nome: "", series: "" }
  ])
  
  const [loading, setLoading] = useState(false)

  // Lista de grupos expandida conforme solicitado
  const opcoesGrupo = [
    "All Day", "Full Body", "Full Leg", "Push Day", "Pull Day", 
    "Peito", "Costas", "Perna", "Ombro", "Bíceps", "Tríceps", "Cardio"
  ]

  useEffect(() => {
    async function getUsuario() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("usuarios").select("username").eq("id", user.id).single()
        if (data?.username) setAutor(data.username)
      }
    }
    getUsuario()
  }, [])

  function adicionarDescricao() {
    setExercicios([...exercicios, { nome: "", series: "" }])
  }

  function atualizarExercicio(index, campo, valor) {
    const novos = [...exercicios]
    novos[index][campo] = valor
    setExercicios(novos)
  }

  function removerExercicio(index) {
    if (exercicios.length > 1) {
      setExercicios(exercicios.filter((_, i) => i !== index))
    }
  }

  async function salvar() {
    if (!titulo || exercicios.some(ex => !ex.nome)) {
      return alert("Preencha o nome da operação e pelo menos um exercício!")
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const descricaoFormatada = exercicios
        .map(ex => `• ${ex.nome}: ${ex.series}`)
        .join("\n")

      const { data: treinoInserido, error: errorTreino } = await supabase
        .from("treinos")
        .insert({
          usuario_id: user.id,
          titulo,
          autor,
          grupo,
          descricao: descricaoFormatada,
        })
        .select()
        .single()

      if (errorTreino) throw errorTreino

      const registrosParaInserir = exercicios.map(ex => ({
        usuario_id: user.id,
        treino_id: treinoInserido.id,
        exercicio: ex.nome,
        series: ex.series
      }))

      const { error: errorReg } = await supabase
        .from("registros_treino")
        .insert(registrosParaInserir)

      if (errorReg) throw errorReg

      const xpTotal = 100 + (exercicios.length * 20)
      await adicionarXP(user.id, xpTotal)
      
      alert(`Missão Finalizada! +${xpTotal} XP na conta.`)
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
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        <header className="mb-8 mt-4 text-center">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-green-500">
            REGISTRAR MISSÃO
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">Operador: {autor}</p>
        </header>

        <div className="space-y-6">
          
          {/* INFO BÁSICA */}
          <div className="bg-zinc-900/40 p-5 rounded-[2.5rem] border border-zinc-800 space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 font-black ml-2 uppercase tracking-widest">Nome da Operação</label>
              <input
                placeholder="Ex: Destruição Total"
                className="w-full p-4 bg-black rounded-2xl border border-zinc-800 focus:border-green-500 outline-none font-bold text-sm"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-black ml-2 uppercase tracking-widest">Foco (Grupo)</label>
                <select
                  className="w-full p-4 bg-black rounded-2xl border border-zinc-800 text-green-500 font-black text-xs outline-none uppercase"
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value)}
                >
                  {opcoesGrupo.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-black ml-2 uppercase tracking-widest">Intensidade</label>
                <select
                  className="w-full p-4 bg-black rounded-2xl border border-zinc-800 text-yellow-500 font-black text-xs outline-none"
                  value={intensidade}
                  onChange={(e) => setIntensidade(e.target.value)}
                >
                  <option value="Leve">LEVE</option>
                  <option value="Moderado">MODERADO</option>
                  <option value="Pesado">PESADO</option>
                  <option value="Insano">INSANO 🔥</option>
                </select>
              </div>
            </div>
          </div>

          {/* LISTA DE DESCRIÇÕES (EXERCÍCIOS) */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Descrição dos Alvos</p>
            
            <AnimatePresence>
              {exercicios.map((ex, i) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  key={i} 
                  className="p-4 bg-zinc-900/80 rounded-[2rem] border border-zinc-800 relative group"
                >
                  <div className="space-y-2">
                    <input
                      placeholder="Nome do Exercício"
                      className="w-full p-3 bg-black rounded-xl border border-zinc-800 focus:border-green-500 outline-none text-sm font-bold uppercase"
                      value={ex.nome}
                      onChange={(e) => atualizarExercicio(i, "nome", e.target.value)}
                    />
                    <input
                      placeholder="Quantidade de repetições (ex: 4x12)"
                      className="w-full p-3 bg-black rounded-xl border border-zinc-800 focus:border-green-500 outline-none text-xs text-zinc-400"
                      value={ex.series}
                      onChange={(e) => atualizarExercicio(i, "series", e.target.value)}
                    />
                  </div>

                  {exercicios.length > 1 && (
                    <button 
                      onClick={() => removerExercicio(i)}
                      className="absolute top-4 right-4 text-red-500 text-xs font-black"
                    >
                      REMOVER
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              onClick={adicionarDescricao}
              className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-[10px] font-black uppercase hover:border-green-500/50 hover:text-green-500 transition-all"
            >
              + Adicionar Descrição
            </button>
          </div>

          <button
            onClick={salvar}
            disabled={loading}
            className="w-full bg-green-500 text-black py-5 rounded-[2rem] font-black text-xl shadow-[0_10px_30px_rgba(34,197,94,0.2)] active:scale-95 transition-all disabled:opacity-50 uppercase italic mt-4"
          >
            {loading ? "SINCRONIZANDO..." : "FINALIZAR MISSÃO 🔥"}
          </button>
        </div>

        <footer className="mt-16 mb-8 text-center">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] opacity-50">
            © 2026 @eu.efrai - VEXX SQUAD
          </p>
        </footer>
      </div>
      <Navbar />
    </>
  )
}