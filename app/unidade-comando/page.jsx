"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import PageHeader from "@/components/PageHeader"
import { Share2, Download, Trash2, Zap, Brain, Utensils, Activity, Target, TrendingUp, Clock, Plus, Menu, Cpu, ShieldAlert, Send } from "lucide-react"

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
    general: { icon: "🛰️", label: "Comando Geral", color: "red", hex: "#ef4444", desc: "Orientações gerais e diretrizes táticas" },
    treino: { icon: "💪", label: "Treinador IA", color: "orange", hex: "#f97316", desc: "Montar arsenal e adaptar treinos" },
    analise: { icon: "📊", label: "Analista", color: "blue", hex: "#3b82f6", desc: "Análise de performance em tempo real" },
    nutricao: { icon: "🥗", label: "Nutricionista", color: "green", hex: "#22c55e", desc: "Combustível biológico e macros" },
    planejamento: { icon: "📅", label: "Planejador", color: "purple", hex: "#a855f7", desc: "Calendário operacional semanal" },
    recuperacao: { icon: "🏥", label: "Recuperação", color: "pink", hex: "#ec4899", desc: "Prevenção de lesões e fadiga" }
  }

  const QUICK_ACTIONS = {
    general: [
      { label: "Status operacional", prompt: "Qual o meu status operacional atual no VEXX Squad?" },
      { label: "Protocolo de hoje", prompt: "Recomende um protocolo tático rápido para o dia de hoje" }
    ],
    treino: [
      { label: "Montar treino completo", prompt: "Crie um treino completo de corrida para hoje baseado no meu histórico" },
      { label: "Descanso ativo", prompt: "Recomende um treino de descanso ativo para hoje" },
      { label: "Intervalo curto", prompt: "Planeje um treino de intervalo curto (20-30 min) de alta intensidade" }
    ],
    analise: [
      { label: "Resumo semanal", prompt: "Analise minha performance desta semana" },
      { label: "Comparação de ritmos", prompt: "Compare meu pace médio este mês com o mês passado" },
      { label: "Velocidade vs Resistência", prompt: "Mostre como está minha progressão em velocidade e resistência" }
    ],
    nutricao: [
      { label: "Plano de refeições", prompt: "Crie um plano de refeições para um dia de treino intenso" },
      { label: "Combustível pré-treino", prompt: "Recomende alimentos de alta performance para o pré-treino" },
      { label: "Recalcular macros", prompt: "Recalcule meus macros baseado no meu peso e objetivos de treino" }
    ],
    planejamento: [
      { label: "Semana que vem", prompt: "Planeje minha periodização de treinos para a próxima semana" },
      { label: "Reduzir volume", prompt: "Preciso reduzir meu volume de treinos em 30%. Como adaptar?" },
      { label: "Meta de 10K", prompt: "Monte um planejamento de 4 semanas para bater meu recorde nos 10K" }
    ],
    recuperacao: [
      { label: "Alívio muscular", prompt: "Quais os melhores alongamentos e massagens para alívio muscular pós-corrida?" },
      { label: "Termoterapia", prompt: "Quando usar gelo e quando usar compressa morna após os treinos?" }
    ]
  }

  // 📊 Carrega stats do usuário
  useEffect(() => {
    const carregarStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let runs = [];
        try {
          const { data, error } = await supabase
            .from("runs")
            .select("*")
            .or(`user_id.eq.${user.id},usuario_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(5);
          
          if (error) throw error;
          runs = data || [];
        } catch (dbErr) {
          console.log("Unidade de Comando carregando stats locais (fallback)...");
          const localRuns = JSON.parse(localStorage.getItem("vexx_runs") || "[]");
          runs = localRuns.filter(r => r.user_id === user.id || r.usuario_id === user.id).slice(0, 5);
        }

        if (runs && runs.length > 0) {
          const totalKm = runs.reduce((acc, r) => acc + (r.distancia || 0), 0);
          
          // Calcular pace médio de corrida com segurança
          let paces = [];
          runs.forEach(r => {
            if (r.pace) {
              if (typeof r.pace === "string" && r.pace.includes(":")) {
                const [m, s] = r.pace.split(":").map(Number);
                if (!isNaN(m) && !isNaN(s)) paces.push(m + s/60);
              } else {
                const pVal = parseFloat(r.pace);
                if (!isNaN(pVal)) paces.push(pVal);
              }
            }
          });
          const avgPace = paces.length > 0 ? (paces.reduce((a, b) => a + b, 0) / paces.length) : 0;
          const mins = Math.floor(avgPace);
          const secs = Math.round((avgPace - mins) * 60);

          setUserStats({
            ultimasCoridas: runs.length,
            kmSemana: totalKm,
            paceMedia: avgPace > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : "0:00",
            ultimoTreino: new Date(runs[0].created_at).toLocaleDateString()
          });
        }
      } catch (err) {
        console.log("Erro ao carregar stats:", err);
      }
    };

    carregarStats();
  }, []);

  // 🧠 MEMÓRIA CURTA (Limite de 20 mensagens)
  useEffect(() => {
    const memoriaSalva = localStorage.getItem(`vexx_chat_memory_${mode}`)
    if (memoriaSalva) {
      // Garante que o carregamento respeite o limite de 20 mensagens
      const historicoRecuperado = JSON.parse(memoriaSalva).slice(-20)
      setChat(historicoRecuperado)
    } else {
      setChat([])
    }
  }, [mode])

  // 💾 SALVAR MEMÓRIA CURTA: Salva no localStorage limitado a 20 itens
  useEffect(() => {
    if (chat.length > 0) {
      const historicoCortado = chat.slice(-20)
      localStorage.setItem(`vexx_chat_memory_${mode}`, JSON.stringify(historicoCortado))
    }
    // Auto-scroll suave para a base do chat
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chat, mode])

  async function falarComComando(customInput = null) {
    const textoEnviar = customInput || input
    if (!textoEnviar.trim() || loading) return
    
    const novaMensagem = { role: "user", content: textoEnviar }
    // Garante que o histórico enviado tenha no máximo 19 mensagens para que com a nova fiquem exatamente 20
    const novoHistorico = [...chat, novaMensagem].slice(-20)
    
    setChat(novoHistorico)
    if (!customInput) setInput("")
    setLoading(true)

    try {
      const contextoMode = `Modo: ${MODES[mode].label}. ${MODES[mode].desc}. `
      const statsContext = userStats ? `Dados físicos recentes do Operador: ${JSON.stringify(userStats)}. ` : ""
      
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
        setChat(prev => {
          const atualizado = [...prev, { role: "assistant", content: data.resposta }]
          return atualizado.slice(-20) // Enforça o limite de 20 mensagens no retorno
        })
      } else {
        throw new Error("Resposta vazia")
      }
    } catch (err) {
      console.error(err)
      setChat(prev => {
        const atualizado = [...prev, { role: "assistant", content: "⚠️ FALHA NA COMUNICAÇÃO COM O COMANDO. REDE SATELLITAL INSTÁVEL." }]
        return atualizado.slice(-20)
      })
    } finally {
      setLoading(false)
    }
  }

  const exportarConversa = () => {
    const texto = chat.map(msg => `${msg.role === "user" ? "Operador" : "VEXX COMANDO"}: ${msg.content}`).join("\n\n")
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(texto))
    element.setAttribute("download", `vexx-tatico-${mode}-${new Date().toISOString().slice(0,10)}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const limparMemoria = () => {
    if (confirm(`Excluir histórico tático do modo "${MODES[mode].label}"?`)) {
      localStorage.removeItem(`vexx_chat_memory_${mode}`)
      setChat([])
    }
  }

  const activeColor = MODES[mode].hex

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-950 via-black to-black text-white p-4 pb-36 font-sans">
      <PageHeader icon={MODES[mode].icon} title="Comando Tático" subtitle="Inteligência Artificial Operacional" color={MODES[mode].color} />
      
      {/* 🚀 TELEMETRIA SUPERIOR */}
      <div className="max-w-2xl mx-auto mt-6 bg-zinc-950/80 backdrop-blur-md p-4 rounded-3xl border border-zinc-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between text-[9px] font-black tracking-widest text-zinc-500 uppercase mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
            <span className="text-zinc-400">Canal Seguro Encriptado</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu size={10} className="text-red-500" />
            <span>Memória Curta: {chat.length}/20</span>
          </div>
        </div>

        {/* 🎛️ SELETOR DE MODO */}
        <div className="relative">
          <button 
            onClick={() => setShowModes(!showModes)}
            style={{ borderColor: `${activeColor}40` }}
            className="w-full flex items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border hover:bg-zinc-900 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl p-1.5 bg-zinc-950 rounded-xl border border-zinc-800">{MODES[mode].icon}</span>
              <div className="text-left">
                <p className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                  {MODES[mode].label}
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeColor }}></span>
                </p>
                <p className="text-[10px] text-zinc-400 font-medium">{MODES[mode].desc}</p>
              </div>
            </div>
            <Menu size={18} className={`transition-transform duration-300 ${showModes ? 'rotate-90 text-red-500' : 'text-zinc-400'}`} />
          </button>

          {showModes && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 z-50 space-y-1 shadow-2xl backdrop-blur-xl">
              {Object.entries(MODES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setShowModes(false) }}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                    mode === key 
                      ? "bg-zinc-900 border border-zinc-800" 
                      : "hover:bg-zinc-900/50"
                  }`}
                >
                  <span className="text-xl p-1 bg-zinc-900 rounded-lg border border-zinc-800">{value.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                      {value.label}
                      {mode === key && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: value.hex }}></span>}
                    </p>
                    <p className="text-[9px] text-zinc-500 font-medium">{value.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 📊 PAINEL DE DADOS FÍSICOS */}
        {userStats ? (
          <div className="grid grid-cols-4 gap-2.5 mt-4">
            <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-2xl text-center hover:bg-zinc-900/60 transition-colors">
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Missões</p>
              <p className="text-sm font-black text-red-500 mt-0.5">{userStats.ultimasCoridas}</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-2xl text-center hover:bg-zinc-900/60 transition-colors">
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Volume Km</p>
              <p className="text-sm font-black text-blue-500 mt-0.5">{userStats.kmSemana.toFixed(1)}</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-2xl text-center hover:bg-zinc-900/60 transition-colors">
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Pace Médio</p>
              <p className="text-sm font-black text-green-500 mt-0.5">{userStats.paceMedia}'</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-2xl text-center hover:bg-zinc-900/60 transition-colors">
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Última Ref</p>
              <p className="text-[10px] font-black text-zinc-400 mt-1 truncate">{userStats.ultimoTreino}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-2 text-center text-[9px] text-zinc-600 font-bold uppercase tracking-widest border border-dashed border-zinc-800 rounded-xl">
            Sem telemetria recente de exercícios
          </div>
        )}

        {/* ⚡ AÇÕES DE RESPOSTA RÁPIDA */}
        {QUICK_ACTIONS[mode] && (
          <div className="mt-4 pt-3 border-t border-zinc-900">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">Comandos Táticos Recomendados</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS[mode].slice(0, 2).map((action, i) => (
                <button
                  key={i}
                  onClick={() => falarComComando(action.prompt)}
                  disabled={loading}
                  style={{ hoverBorderColor: activeColor }}
                  className="bg-zinc-900/70 hover:bg-zinc-900 disabled:opacity-50 border border-zinc-800/80 p-2 rounded-xl text-[10px] font-bold text-left transition-all duration-200 flex items-start gap-1.5 group hover:border-zinc-700 cursor-pointer"
                >
                  <Zap size={10} className="text-yellow-500 mt-0.5 shrink-0 group-hover:scale-125 transition-transform" />
                  <span className="text-zinc-300 leading-tight truncate w-full">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 💬 CHAT CONVERSA */}
      <div className="max-w-2xl mx-auto space-y-4 mt-6 mb-24 px-1">
        {chat.length === 0 && (
          <div className="text-center py-20 bg-zinc-950/20 rounded-3xl border border-dashed border-zinc-900/80 max-w-lg mx-auto">
            <Brain size={32} className="mx-auto text-zinc-700 animate-pulse mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Aguardando coordenadas...</p>
            <p className="text-[9px] text-zinc-600 mt-1 max-w-xs mx-auto">Sua Unidade de Comando Tático armazena as últimas 20 mensagens desta conversa na memória volátil.</p>
          </div>
        )}

        {chat.map((msg, i) => (
          <div 
            key={i} 
            className={`p-4 rounded-2xl max-w-[90%] flex flex-col transition-all duration-300 ${
              msg.role === "user" 
                ? "ml-auto bg-zinc-900/70 border border-zinc-850 text-sm font-semibold text-zinc-200 shadow-md" 
                : "mr-auto bg-gradient-to-br from-red-950/30 to-zinc-900/50 border border-red-950/40 text-sm leading-relaxed text-zinc-100 shadow-[0_4px_20px_rgba(239,68,68,0.03)]"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${msg.role === "user" ? "bg-zinc-500" : "bg-red-500 animate-pulse"}`}></span>
              <p className={`text-[9px] uppercase font-black tracking-widest ${msg.role === "user" ? "text-zinc-500" : "text-red-500"}`}>
                {msg.role === "user" ? "Operador (Você)" : "VEXX COMANDO"}
              </p>
            </div>
            <p className="whitespace-pre-line text-xs font-medium leading-relaxed tracking-wide text-zinc-300">
              {msg.content}
            </p>
          </div>
        ))}
        
        {loading && (
          <div className="mr-auto bg-zinc-950/80 p-4 rounded-2xl border border-red-950/60 flex items-center gap-3 shadow-md max-w-xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <p className="text-red-500 text-[9px] font-black uppercase tracking-widest">Sincronizando satélite...</p>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* 📋 CONTROLES FIXOS INFERIORES */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-40">
        <div className="max-w-2xl mx-auto flex flex-col gap-2.5">
          
          {chat.length > 0 && (
            <div className="flex gap-2 justify-end px-1">
              <button 
                onClick={exportarConversa}
                className="bg-zinc-950/90 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 p-2 rounded-xl border border-zinc-800/80 backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                title="Exportar registros"
              >
                <Download size={12} />
                Exportar
              </button>
              <button 
                onClick={limparMemoria}
                className="bg-zinc-950/90 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 p-2 rounded-xl border border-zinc-800/80 backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                title="Limpar memória tática"
              >
                <Trash2 size={12} />
                Limpar
              </button>
            </div>
          )}
          
          <div 
            style={{ shadowColor: activeColor }}
            className="flex items-center gap-2 bg-zinc-950/95 backdrop-blur-lg p-2.5 rounded-2xl border border-zinc-800 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: activeColor }}></div>
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && falarComComando()}
              placeholder={`Enviar mensagem no modo ${MODES[mode].label}...`}
              className="flex-1 bg-transparent p-2 outline-none text-xs font-bold text-zinc-100 placeholder:text-zinc-700 uppercase tracking-wide"
              disabled={loading}
            />
            <button 
              onClick={() => falarComComando()}
              disabled={loading || !input.trim()}
              style={{ backgroundColor: activeColor }}
              className="hover:brightness-110 text-black w-10 h-10 rounded-xl font-black transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shrink-0"
            >
              <Send size={15} className="text-zinc-950" />
            </button>
          </div>
        </div>
      </div>
      
      <Navbar />
    </div>
  )
}