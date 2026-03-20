"use client"

import { useState, useEffect, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/components/Navbar"
import { useGamificacao } from "@/hooks/useGamificacao"
import { motion, AnimatePresence } from "framer-motion"

export const dynamic = 'force-dynamic';

function ConteudoNovoTreino() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const treinoId = searchParams.get("id")
  const iaTreino = searchParams.get("ia") // 🔥 CAPTURA O TREINO DA IA

  const { adicionarXP } = useGamificacao()

  const [titulo, setTitulo] = useState("")
  const [autor, setAutor] = useState("") 
  const [grupo, setGrupo] = useState("Full Body")
  const [exercicios, setExercicios] = useState([{ nome: "", series: "" }])
  const [loading, setLoading] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  const opcoesGrupo = [
    "All Day", "Full Body", "Full Leg", "Push Day", "Pull Day", 
    "Peito", "Costas", "Perna", "Ombro", "Bíceps", "Tríceps", "Cardio"
  ]

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("usuarios")
        .select("username")
        .eq("id", user.id)
        .single()

      if (data?.username) setAutor(data.username)

      // 🧠 LÓGICA DE PREENCHIMENTO AUTOMÁTICO VIA IA
      if (iaTreino) {
        const texto = decodeURIComponent(iaTreino)
        const linhas = texto.split("\n")
        
        const exerciciosFormatados = linhas
          .filter(l => l.includes(":"))
          .map(l => {
            const [nome, series] = l.split(":")
            return {
              nome: nome.trim(),
              series: series.trim()
            }
          })

        if (exerciciosFormatados.length > 0) {
          setTitulo(linhas[0] || "Treino IA")
          setExercicios(exerciciosFormatados)
          return // Sai do init para não sobrepor com edição
        }
      }

      // LÓGICA DE EDIÇÃO (EXISTENTE)
      if (treinoId) {
        setModoEdicao(true)
        const { data: treino } = await supabase
          .from("treinos")
          .select("*")
          .eq("id", treinoId)
          .single()

        if (treino) {
          setTitulo(treino.titulo || "")
          setGrupo(treino.grupo || "Full Body")
          const lista = treino.descricao?.split("\n").map(linha => {
            const [nome, series] = linha.split(":")
            return {
              nome: nome?.trim() || "",
              series: series?.trim() || ""
            }
          })
          if (lista?.length) setExercicios(lista)
        }
      }
    }
    init()
  }, [treinoId, iaTreino]) // 🔥 Adicionado iaTreino como dependência

  function adicionarDescricao() {
    setExercicios(prev => [...prev, { nome: "", series: "" }])
  }

  function atualizarExercicio(index, campo, valor) {
    setExercicios(prev => {
      const novos = [...prev]
      novos[index][campo] = valor
      return novos
    })
  }

  function removerExercicio(index) {
    if (exercicios.length > 1) {
      setExercicios(prev => prev.filter((_, i) => i !== index))
    }
  }

  async function salvar() {
    if (!titulo.trim()) return alert("Digite o nome da missão.")
    if (exercicios.some(ex => !ex.nome.trim())) return alert("Todos os exercícios precisam de nome.")

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const descricaoFormatada = exercicios
        .map(ex => `${ex.nome.trim()}: ${ex.series.trim() || "-"}`)
        .join("\n")

      if (modoEdicao) {
        const { error } = await supabase
          .from("treinos")
          .update({
            titulo: titulo.trim(),
            grupo: grupo,
            descricao: descricaoFormatada,
          })
          .eq("id", treinoId)

        if (error) throw error
        alert("Missão atualizada com sucesso 🔥")
      } else {
        const { error } = await supabase
          .from("treinos")
          .insert({
            usuario_id: user.id,
            titulo: titulo.trim(),
            autor: autor,
            grupo: grupo,
            descricao: descricaoFormatada,
          })

        if (error) throw error
        const xpTotal = 100 + (exercicios.length * 20)
        if (adicionarXP) await adicionarXP(user.id, xpTotal)
        alert(`Missão Finalizada! +${xpTotal} XP 🔥`)
      }
      router.push("/feed")
    } catch (err) {
      alert("Erro: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
      <header className="mb-8 mt-4 text-center">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-green-500">
          {modoEdicao ? "EDITAR MISSÃO" : "REGISTRAR MISSÃO"}
        </h1>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
          Operador: {autor || "..."}
        </p>
      </header>

      <div className="space-y-6">
        {/* 🔥 BOTÃO GERADOR IA */}
        {!modoEdicao && (
          <button
            onClick={() => router.push("/criar-treino-ia")}
            className="w-full mb-4 border border-green-500/50 text-green-500 py-4 rounded-[2rem] font-black hover:bg-green-500/10 transition-all uppercase italic text-xs tracking-widest flex items-center justify-center gap-2"
          >
            <span>🤖</span> CRIAR TREINO COM IA
          </button>
        )}

        <div className="bg-zinc-900/40 p-5 rounded-[2.5rem] border border-zinc-800 space-y-4">
          <input
            placeholder="Nome da operação"
            className="w-full p-4 bg-black rounded-2xl border border-zinc-800 focus:border-green-500 outline-none font-bold text-sm uppercase"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <select
            className="w-full p-4 bg-black rounded-2xl border border-zinc-800 text-green-500 font-black text-xs uppercase"
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
          >
            {opcoesGrupo.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {exercicios.map((ex, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                key={i} 
                className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 relative"
              >
                {exercicios.length > 1 && (
                  <button 
                    onClick={() => removerExercicio(i)}
                    className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 p-2 text-xs font-black"
                  >
                    X
                  </button>
                )}
                <input
                  placeholder="Exercício"
                  className="w-full mb-2 p-3 bg-black rounded-xl border border-zinc-800 text-sm font-bold uppercase"
                  value={ex.nome}
                  onChange={(e) => atualizarExercicio(i, "nome", e.target.value)}
                />
                <input
                  placeholder="Séries (ex: 3x12)"
                  className="w-full p-3 bg-black rounded-xl border border-zinc-800 text-sm uppercase"
                  value={ex.series}
                  onChange={(e) => atualizarExercicio(i, "series", e.target.value)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <button onClick={adicionarDescricao} className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:border-green-500/50">
            + ADICIONAR ITEM AO ARSENAL
          </button>
        </div>

        <button
          onClick={salvar}
          disabled={loading}
          className="w-full bg-green-500 text-black py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95 transition-all"
        >
          {loading ? "SINCRONIZANDO..." : modoEdicao ? "SALVAR ALTERAÇÕES" : "FINALIZAR MISSÃO 🔥"}
        </button>
      </div>
    </div>
  )
}

export default function NovoTreino() {
  return (
    <>
      <Suspense fallback={<div className="bg-black min-h-screen flex items-center justify-center text-green-500 font-black italic">CARREGANDO BRIEFING...</div>}>
        <ConteudoNovoTreino />
      </Suspense>
      <Navbar />
    </>
  )
}