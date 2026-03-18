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
  const [grupo, setGrupo] = useState("Peito")
  const [duracao, setDuracao] = useState("60")
  const [intensidade, setIntensidade] = useState("Moderado")
  
  const [exercicios, setExercicios] = useState([
    { nome: "", series: "", peso: "" }
  ])
  
  const [loading, setLoading] = useState(false)

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

  function adicionarExercicio() {
    setExercicios([...exercicios, { nome: "", series: "", peso: "" }])
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
    if (!titulo || exercicios.some(ex => !ex.nome || !ex.peso)) {
      return alert("Preencha o título e os detalhes (nome e peso) de todos os exercícios!")
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const descricaoFormatada = exercicios
        .map(ex => `• ${ex.nome}: ${ex.series} sets | ${ex.peso}kg`)
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
        peso: Number(ex.peso),
        series: ex.series
      }))

      const { error: errorReg } = await supabase
        .from("registros_treino")
        .insert(registrosParaInserir)

      if (errorReg) throw errorReg

      const xpTotal = 100 + (exercicios.length * 20) + (intensidade === "Insano" ? 50 : 0)
      const resultado = await adicionarXP(user.id, xpTotal)
      
      if (resultado?.subiuDeNivel) {
        alert(`NÍVEL MÁXIMO! Você subiu para o Nível ${resultado.novoNivel}! 🎖️`)
      }

      alert(`Missão Cumprida! +${xpTotal} XP na conta.`)
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
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">Treino de Elite</p>
        </header>

        <div className="space-y-6">
          
          {/* INFO BÁSICA */}
          <div className="bg-zinc-900/40 p-5 rounded-[2.5rem] border border-zinc-800 space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 font-black ml-2 uppercase tracking-widest">Nome da Operação</label>
              <input
                placeholder="Ex: Destruição de Peitoral"
                className="w-full p-4 bg-black rounded-2xl border border-zinc-800 focus:border-green-500 outline-none font-bold text-sm"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-black ml-2 uppercase tracking-widest">Foco</label>
                <select
                  className="w-full p-4 bg-black rounded-2xl border border-zinc-800 text-green-500 font-black text-xs outline-none"
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value)}
                >
                  {["Peito", "Costas", "Perna", "Ombro", "Bíceps", "Tríceps", "Full Body"].map(g => (
                    <option key={g} value={g}>{g.toUpperCase()}</option>
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

          {/* LISTA DE EXERCÍCIOS */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Explosivos / Exercícios</p>
            
            <AnimatePresence>
              {exercicios.map((ex, i) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  key={i} 
                  className="p-4 bg-zinc-900/80 rounded-[2rem] border border-zinc-800 relative group"
                >
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      placeholder="Exercício"
                      className="col-span-12 p-3 bg-black rounded-xl border border-zinc-800 focus:border-green-500 outline-none text-sm font-bold"
                      value={ex.nome}
                      onChange={(e) => atualizarExercicio(i, "nome", e.target.value)}
                    />
                    <input
                      placeholder="Séries (ex: 3x12)"
                      className="col-span-6 p-3 bg-black rounded-xl border border-zinc-800 focus:border-green-500 outline-none text-xs"
                      value={ex.series}
                      onChange={(e) => atualizarExercicio(i, "series", e.target.value)}
                    />
                    <div className="col-span-6 relative">
                      <input
                        placeholder="Peso total"
                        type="number"
                        className="w-full p-3 bg-black rounded-xl border border-zinc-800 focus:border-green-500 outline-none text-xs pr-8"
                        value={ex.peso}
                        onChange={(e) => atualizarExercicio(i, "peso", e.target.value)}
                      />
                      <span className="absolute right-3 top-3.5 text-[10px] text-zinc-600 font-black">KG</span>
                    </div>
                  </div>

                  {exercicios.length > 1 && (
                    <button 
                      onClick={() => removerExercicio(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] shadow-lg"
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              onClick={adicionarExercicio}
              className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-[10px] font-black uppercase hover:border-green-500/50 hover:text-green-500 transition-all"
            >
              + Adicionar Próximo Alvo
            </button>
          </div>

          <button
            onClick={salvar}
            disabled={loading}
            className="w-full bg-green-500 text-black py-5 rounded-[2rem] font-black text-xl shadow-[0_10px_30px_rgba(34,197,94,0.2)] active:scale-95 transition-all disabled:opacity-50 uppercase italic flex items-center justify-center gap-2"
          >
            {loading ? "PROCESSANDO..." : "FINALIZAR MISSÃO 🔥"}
          </button>
        </div>

        {/* RODAPÉ DE COPYRIGHT */}
        <footer className="mt-16 mb-8 text-center">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] opacity-50">
            © 2026 @eu.efrai - Todos os direitos reservados.
          </p>
        </footer>
      </div>
      <Navbar />
    </>
  )
}