"use client"

import { useState, useEffect, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/components/Navbar"
import { useGamificacao } from "@/hooks/useGamificacao"
import { motion, AnimatePresence } from "framer-motion"
import PageHeader from "@/components/PageHeader"
import { Sparkles, Plus, Trash2, Save, AlertTriangle, CheckCircle, Info, ChevronRight, Dumbbell } from "lucide-react"

function ConteudoNovoTreino() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const treinoId = searchParams.get("id")
  const iaTreino = searchParams.get("ia") // 🔥 CAPTURA O TREINO DA IA

  const { adicionarXP, avaliarEConquistar } = useGamificacao()

  const [titulo, setTitulo] = useState("")
  const [autor, setAutor] = useState("") 
  const [grupo, setGrupo] = useState("Full Body")
  const [exercicios, setExercicios] = useState([{ nome: "", series: "" }])
  const [loading, setLoading] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  // Custom Toast State (removes ugly browser alerts)
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const opcoesGrupo = [
    { id: "Full Body", label: "Full Body", icon: "🏋️" },
    { id: "Push Day", label: "Push Day", icon: "🔥" },
    { id: "Pull Day", label: "Pull Day", icon: "💪" },
    { id: "Cardio", label: "Cardio / Corrida", icon: "🏃" },
    { id: "Peito", label: "Peito", icon: "🛡️" },
    { id: "Costas", label: "Costas", icon: "🦅" },
    { id: "Perna", label: "Pernas", icon: "🦵" },
    { id: "Ombro", label: "Ombro", icon: "🛡️" },
    { id: "Bíceps", label: "Bíceps", icon: "💪" },
    { id: "Tríceps", label: "Tríceps", icon: "⚡" }
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
          showToast("Briefing da IA importado com sucesso 🤖", "info")
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
    } else {
      showToast("Seu arsenal precisa de pelo menos 1 item.", "warning")
    }
  }

  async function salvar() {
    if (!titulo.trim()) return showToast("Insira o nome da operação.", "warning")
    if (exercicios.some(ex => !ex.nome.trim())) return showToast("Todos os exercícios do arsenal precisam de nome.", "warning")

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
        showToast("Missão atualizada com sucesso 🔥", "success")
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
        if (avaliarEConquistar) await avaliarEConquistar(user.id, "treino", { ia: !!iaTreino })
        showToast(`Missão Finalizada! +${xpTotal} XP 🔥`, "success")
      }
      
      setTimeout(() => {
        router.push("/feed")
      }, 1500)

    } catch (err) {
      showToast("Falha operacional: " + err.message, "danger")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-32 text-white min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-950 via-black to-black font-sans relative">
      
      {/* 🔔 CUSTOM TOAST NOTIFICATION BLOCK */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 z-[999] max-w-sm mx-auto"
          >
            <div className={`p-3.5 rounded-2xl border backdrop-blur-md flex items-center gap-3 shadow-xl ${
              toast.type === "success" ? "bg-green-950/90 border-green-500/40 text-green-200" :
              toast.type === "warning" ? "bg-amber-950/90 border-amber-500/40 text-amber-200" :
              toast.type === "danger" ? "bg-red-950/90 border-red-500/40 text-red-200" :
              "bg-zinc-900/90 border-zinc-700/80 text-zinc-200"
            }`}>
              {toast.type === "success" && <CheckCircle size={18} className="text-green-500 shrink-0" />}
              {toast.type === "warning" && <AlertTriangle size={18} className="text-amber-500 shrink-0" />}
              {toast.type === "danger" && <AlertTriangle size={18} className="text-red-500 shrink-0" />}
              {toast.type === "info" && <Info size={18} className="text-blue-400 shrink-0" />}
              
              <p className="text-xs font-bold uppercase tracking-wide leading-snug">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader icon="🏋️" title={modoEdicao ? "Editar Treino" : "Novo Treino"} subtitle="Configure seu arsenal operacional" color="green" />

      <div className="space-y-5 mt-6">
        
        {/* 🔥 BOTÃO GERADOR IA */}
        {!modoEdicao && (
          <button
            onClick={() => router.push("/criar-treino-ia")}
            className="w-full border border-green-500/30 hover:border-green-500/60 text-green-500 py-3.5 rounded-2xl font-black bg-zinc-950/40 hover:bg-green-500/10 transition-all duration-300 uppercase italic text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Sparkles size={13} className="animate-pulse" />
            CONSTRUIR TREINO COM IA
          </button>
        )}

        {/* NOME DA OPERAÇÃO */}
        <div className="bg-zinc-950/80 p-4 rounded-3xl border border-zinc-850 space-y-4">
          <div>
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5 px-1">Código da Missão</label>
            <input
              placeholder="Ex: OPERAÇÃO HIPERTROFIA BRAÇO"
              className="w-full p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 focus:border-green-500/60 outline-none font-bold text-xs uppercase tracking-wider text-zinc-150 transition-all placeholder:text-zinc-700"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
        </div>

        {/* GRUPO MUSCULAR - SLIDER HORIZONTAL DESLIZANTE */}
        <div className="bg-zinc-950/80 p-4 rounded-3xl border border-zinc-850">
          <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block mb-3 px-1">
            Foco Operacional (Músculo Alvo)
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x mask-gradient">
            {opcoesGrupo.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGrupo(g.id)}
                className={`px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer snap-start shrink-0 flex items-center gap-1.5 ${
                  grupo === g.id 
                    ? "bg-green-500/10 border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.15)]" 
                    : "bg-zinc-900/40 border-zinc-850 hover:bg-zinc-900 text-zinc-400"
                }`}
              >
                <span>{g.icon}</span>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* FORMULÁRIO DE EXERCÍCIOS */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
              Arsenal de Equipamentos ({exercicios.length})
            </label>
            <Dumbbell size={12} className="text-zinc-600" />
          </div>

          <AnimatePresence>
            {exercicios.map((ex, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                key={i} 
                className="p-4 bg-zinc-950/80 rounded-3xl border border-zinc-850 relative group hover:border-zinc-800/80 transition-all overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-green-500/20 group-hover:bg-green-500/50 transition-colors"></div>
                
                {exercicios.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removerExercicio(i)}
                    className="absolute top-2 right-2 text-zinc-650 hover:text-red-500 p-2 transition-all cursor-pointer"
                    title="Excluir item"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                
                <div className="space-y-3 mt-1.5">
                  <div>
                    <label className="text-[7px] font-black uppercase tracking-widest text-zinc-600 block mb-1">Exercício {String(i + 1).padStart(2, "0")}</label>
                    <input
                      placeholder="Nome do exercício"
                      className="w-full p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 text-xs font-bold uppercase tracking-wider text-zinc-200 focus:border-green-500/40 outline-none transition-all"
                      value={ex.nome}
                      onChange={(e) => atualizarExercicio(i, "nome", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[7px] font-black uppercase tracking-widest text-zinc-600 block mb-1">Protocolo de Séries</label>
                    <input
                      placeholder="Ex: 4x12 (ou 3x Falha / 45s Descanso)"
                      className="w-full p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 text-xs font-semibold uppercase tracking-wider text-zinc-300 focus:border-green-500/40 outline-none transition-all"
                      value={ex.series}
                      onChange={(e) => atualizarExercicio(i, "series", e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button 
            type="button"
            onClick={adicionarDescricao} 
            className="w-full py-3.5 border border-dashed border-zinc-800/80 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-green-500 hover:border-green-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99] bg-zinc-950/10"
          >
            <Plus size={12} />
            ADICIONAR ITEM AO ARSENAL
          </button>
        </div>

        {/* AÇÃO PRINCIPAL DE SALVAR */}
        <button
          onClick={salvar}
          disabled={loading}
          className="w-full bg-green-500 hover:brightness-105 text-black py-4.5 rounded-2xl font-black shadow-[0_0_20px_rgba(34,197,94,0.35)] active:scale-[0.98] transition-all uppercase italic text-xs tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={14} />
          {loading ? "SINCRONIZANDO DADOS..." : modoEdicao ? "ATUALIZAR MISSÃO" : "SALVAR E FINALIZAR MISSÃO 🔥"}
        </button>
      </div>
    </div>
  )
}

export default function NovoTreino() {
  return (
    <>
      <Suspense fallback={
        <div className="bg-black min-h-screen flex flex-col items-center justify-center text-green-500 font-black italic text-xs tracking-widest gap-3 uppercase">
          <div className="w-8 h-8 rounded-full border border-dashed border-green-500 animate-spin"></div>
          Carregando Briefing Tático...
        </div>
      }>
        <ConteudoNovoTreino />
      </Suspense>
      <Navbar />
    </>
  )
}