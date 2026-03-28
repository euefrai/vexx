"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import PageHeader from "@/components/PageHeader"
import { Share2, Download, Trash2, Zap, Brain, Utensils, Activity, Target, TrendingUp, Clock, Plus, Menu } from "lucide-react"

export default function UnidadeComando() {
  const [chat, setChat] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState("general") // general, treino, analise, nutricao, planejamento
  const [showModes, setShowModes] = useState(false)
  const [userStats, setUserStats] = useState(null)
  const scrollRef = useRef(null)

  // Contextos especializados
  const MODES = {
    general: { icon: "🛰️", label: "Comando Geral", color: "red", desc: "Orientações gerais e dúvidas" },
    treino: { icon: "💪", label: "Treinador IA", color: "orange", desc: "Criar e adaptar treinos" },
    analise: { icon: "📊", label: "Analista", color: "blue", desc: "Análise de performance" },
    nutricao: { icon: "🥗", label: "Nutricionista", color: "green", desc: "Recomendações nutricionais" },
    planejamento: { icon: "📅", label: "Planejador", color: "purple", desc: "Plano semanal/mensal" },
    recuperacao: { icon: "🏥", label: "Recuperação", color: "pink", desc: "Lesões e recuperação" }
  }

  const QUICK_ACTIONS = {
    treino: [
      { label: "Montar treino completo", prompt: "Crie um treino completo de corrida para hoje baseado no meu histórico" },
      { label: "Descanso ativo", prompt: "Recomende um treino de descanso ativo para hoje" },
      { label: "Intervalo curto", prompt: "Planeje um treino de intervalo curto (20-30 min)" }
    ],
    analise: [
      { label: "Resumo semanal", prompt: "Analize minha performance desta semana" },
      { label: "Comparação", prompt: "Compare meu desempenho este mês com o mês passado" },
      { label: "Progressão", prompt: "Mostre minha progressão em velocidade e resistência" }
    ],
    nutricao: [
      { label: "Plano refeições", prompt: "Crie um plano de refeições para um dia de treino" },
      { label: "Pré-treino", prompt: "Recomende alimentos para pré-treino" },
      { label: "Recalcular macros", prompt: "Recalcule meus macros baseado no meu peso e objetivos" }
    ],
    planejamento: [
      { label: "Semana próxima", prompt: "Planeje meus treinos para a próxima semana" },
      { label: "Redução de volume", prompt: "Adapte meus treinos com redução de 30% de volume" },
      { label: "Periodização", prompt: "Monte um plano de periodização de 4 semanas" }
    ]
  }

  // 📊 Carrega stats do usuário
  useEffect(() => {
    const carregarStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: runs } = await supabase
          .from("runs")
          .select("*")
          .eq("usuario_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        if (runs && runs.length > 0) {
          const totalKm = runs.reduce((acc, r) => acc + (r.distancia || 0), 0)
          const avgPace = runs.reduce((acc, r) => acc + (r.pace || 0), 0) / runs.length
          setUserStats({
            ultimasCoridas: runs.length,
            kmSemana: totalKm,
            paceMedia: avgPace.toFixed(1),
            ultimoTreino: new Date(runs[0].created_at).toLocaleDateString()
          })
        }
      } catch (err) {
        console.log("Erro ao carregar stats:", err)
      }
    }

    carregarStats()
  }, [])

  // 🧠 MEMÓRIA LONGA: Carrega o histórico ao abrir a página
  useEffect(() => {
    const memoriaSalva = localStorage.getItem(`vexx_chat_memory_${mode}`)
    if (memoriaSalva) {
      setChat(JSON.parse(memoriaSalva))
    } else {
      setChat([])
    }
  }, [mode])

  // 💾 SALVAR MEMÓRIA: Salva no localStorage a cada nova mensagem
  useEffect(() => {
    if (chat.length > 0) {
      localStorage.setItem(`vexx_chat_memory_${mode}`, JSON.stringify(chat))
    }
    // Auto-scroll para a última mensagem
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }, 100)
  }, [chat, mode])

  async function falarComComando(customInput = null) {
    const textoEnviar = customInput || input
    if (!textoEnviar.trim() || loading) return
    
    const novaMensagem = { role: "user", content: textoEnviar }
    const novoHistorico = [...chat, novaMensagem]
    
    setChat(novoHistorico)
    if (!customInput) setInput("")
    setLoading(true)

    try {
      const contextoMode = `Modo: ${MODES[mode].label}. ${MODES[mode].desc}. `
      const statsContext = userStats ? `Dados do usuário: ${JSON.stringify(userStats)}. ` : ""
      
      const res = await fetch("/api/inteligencia-campo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          historico: novoHistorico,
          contexto: contextoMode + statsContext
        }) 
      })
      
      const data = await res.json()
      
      if (data.resposta) {
        setChat(prev => [...prev, { role: "assistant", content: data.resposta }])
      } else {
        throw new Error("Resposta vazia")
      }
    } catch (err) {
      console.error(err)
      setChat(prev => [...prev, { role: "assistant", content: "⚠️ Falha na comunicação. Tente novamente." }])
    } finally {
      setLoading(false)
    }
  }

  const exportarConversa = () => {
    const texto = chat.map(msg => `${msg.role === "user" ? "Você" : "VEXX"}: ${msg.content}`).join("\n\n")
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(texto))
    element.setAttribute("download", `unidade-comando-${mode}-${new Date().toISOString().slice(0,10)}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const limparMemoria = () => {
    if(confirm(`Limpar histórico do modo "${MODES[mode].label}"?`)) {
      localStorage.removeItem(`vexx_chat_memory_${mode}`)
      setChat([])
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-32">
      <PageHeader icon={MODES[mode].icon} title="Unidade de Comando" subtitle={MODES[mode].desc} color={MODES[mode].color} />
      
      {/* 🎛️ SELETOR DE MODO */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="relative">
          <button 
            onClick={() => setShowModes(!showModes)}
            className="w-full flex items-center justify-between gap-2 bg-gradient-to-r from-zinc-900 to-zinc-800 p-3 rounded-xl border border-zinc-700 hover:border-zinc-600 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{MODES[mode].icon}</span>
              <div className="text-left">
                <p className="font-black text-sm">{MODES[mode].label}</p>
                <p className="text-[10px] text-zinc-500">{MODES[mode].desc}</p>
              </div>
            </div>
            <Menu size={20} className={`transition-transform ${showModes ? 'rotate-180' : ''}`} />
          </button>

          {showModes && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl p-2 z-50 space-y-1">
              {Object.entries(MODES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setShowModes(false) }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    mode === key 
                      ? "bg-red-600/20 border border-red-600" 
                      : "hover:bg-zinc-800"
                  }`}
                >
                  <p className="font-bold text-sm flex items-center gap-2">
                    <span>{value.icon}</span> {value.label}
                  </p>
                  <p className="text-[10px] text-zinc-400">{value.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 📊 STATS DO USUÁRIO */}
        {userStats && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg text-center">
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Corridas</p>
              <p className="text-lg font-black text-red-500">{userStats.ultimasCoridas}</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg text-center">
              <p className="text-[10px] text-zinc-500 font-bold uppercase">km/sem</p>
              <p className="text-lg font-black text-blue-500">{userStats.kmSemana.toFixed(1)}</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg text-center">
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Pace</p>
              <p className="text-lg font-black text-green-500">{userStats.paceMedia}'</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg text-center">
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Último</p>
              <p className="text-[11px] font-bold text-zinc-400">{userStats.ultimoTreino}</p>
            </div>
          </div>
        )}

        {/* ⚡ QUICK ACTIONS */}
        {QUICK_ACTIONS[mode] && (
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Ações Rápidas</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACTIONS[mode].map((action, i) => (
                <button
                  key={i}
                  onClick={() => falarComComando(action.prompt)}
                  disabled={loading}
                  className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 border border-zinc-700 p-2 rounded-lg text-[11px] font-bold text-left transition-colors"
                >
                  <Zap size={14} className="mb-1 text-yellow-500" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 💬 CHAT */}
      <div className="max-w-2xl mx-auto space-y-4 mt-8 mb-20">
        {chat.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <p className="text-xs font-black uppercase tracking-widest italic">Aguardando ordens...</p>
            <p className="text-[10px] text-zinc-600 mt-2">Use as ações rápidas acima ou digite algo</p>
          </div>
        )}

        {chat.map((msg, i) => (
          <div key={i} className={`p-4 rounded-2xl max-w-[95%] animate-in fade-in slide-in-from-bottom-2 ${
            msg.role === "user" 
              ? "ml-auto bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-100" 
              : "mr-auto bg-gradient-to-br from-red-600/10 to-orange-600/10 border border-red-900/30 text-sm leading-relaxed text-red-50"
          }`}>
            <p className={`text-[8px] uppercase font-black mb-1 ${msg.role === "user" ? "text-zinc-500" : "text-red-500"}`}>
              {msg.role === "user" ? "Operador" : "VEXX - " + MODES[mode].label}
            </p>
            {msg.content}
          </div>
        ))}
        
        {loading && (
          <div className="mr-auto bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800 animate-pulse">
            <p className="text-red-600 text-[8px] font-black uppercase">⟳ Sincronizando...</p>
          </div>
        )}
      </div>

      {/* 📋 CONTROLES */}
      <div className="fixed bottom-24 left-0 right-0 px-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          {chat.length > 0 && (
            <div className="flex gap-2 justify-end">
              {/* <button 
                onClick={() => {}} 
                className="bg-zinc-900 hover:bg-zinc-800 p-2 rounded-lg border border-zinc-700 transition-all"
                title="Compartilhar"
              >
                <Share2 size={14} />
              </button> */}
              <button 
                onClick={exportarConversa}
                className="bg-zinc-900 hover:bg-zinc-800 p-2 rounded-lg border border-zinc-700 transition-all"
                title="Exportar"
              >
                <Download size={14} />
              </button>
              <button 
                onClick={limparMemoria}
                className="bg-zinc-900 hover:bg-red-900/30 p-2 rounded-lg border border-zinc-700 transition-all"
                title="Limpar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
          
          <div className="flex gap-2 bg-zinc-900/90 backdrop-blur-md p-2 rounded-2xl border border-red-600/20 shadow-2xl">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && falarComComando()}
              placeholder="Digite uma pergunta ou ordem..."
              className="flex-1 bg-transparent p-2 outline-none text-sm font-bold placeholder:text-zinc-700"
            />
            <button 
              onClick={() => falarComComando()}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-black italic text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Zap size={14} />
              {loading ? "..." : "ENVIAR"}
            </button>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  )
}