"use client"

import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useGamificacao } from "@/hooks/useGamificacao"

export default function ChatSquad() {
  const { id: squadId } = useParams()
  const router = useRouter()
  const { avaliarEConquistar } = useGamificacao()

  // Interface
  const [abaAtiva, setAbaAtiva] = useState("chat")
  const [showComandos, setShowComandos] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [filtroComando, setFiltroComando] = useState("")
  const [buscaHelp, setBuscaHelp] = useState("")

  // Dados
  const [squadInfo, setSquadInfo] = useState(null)
  const [membros, setMembros] = useState([])
  const [mensagens, setMensagens] = useState([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [meuId, setMeuId] = useState(null)
  const [meuNome, setMeuNome] = useState("")
  const [loading, setLoading] = useState(true)
  
  const scrollRef = useRef(null)

  const listaExercicios = [
    "Supino Reto", "Supino Inclinado", "Crucifixo Reto", "Voador", "Puxada Aberta", "Remada Curvada", "Terra", "Barra Fixa",
    "Agachamento Livre", "Leg Press 45", "Extensora", "Stiff", "Desenvolvimento Barra", "Elevação Lateral", "Encolhimento",
    "Rosca Direta", "Rosca Scott", "Rosca Martelo", "Triceps Pulley", "Triceps Corda", "Abdominal Supra", "Prancha"
  ].sort()

  const comandosSistema = [
    { cmd: "/help", desc: "Abre os comandos operacionais", exemplo: "/help" },
    { cmd: "/peso", desc: "Atualiza peso corporal", exemplo: "/peso 82.5" },
    { cmd: "/agua", desc: "Registra ingestão de água", exemplo: "/agua 500" },
    { cmd: "/creatina", desc: "Registra consumo de creatina", exemplo: "/creatina" },
    { cmd: "/descanso", desc: "Inicia cronômetro tático de descanso", exemplo: "/descanso 60" },
  ]

  const todosComandosHelp = [
    ...comandosSistema,
    ...listaExercicios.map(ex => ({
      cmd: `/${ex.replace(/\s+/g, '_')}`,
      desc: `Registra treino para ${ex}`,
      exemplo: `/${ex.replace(/\s+/g, '_')} 80 4x12`
    }))
  ]

  const comandosFiltradosHelp = todosComandosHelp.filter(item => 
    item.cmd.toLowerCase().includes(buscaHelp.toLowerCase()) || 
    item.desc.toLowerCase().includes(buscaHelp.toLowerCase())
  )

  useEffect(() => {
    iniciarSessao()

    // Inscrever em tempo real
    const canal = supabase
      .channel(`squad_chat_${squadId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squad_mensagens' }, () => {
        carregarMensagens()
      }).subscribe()

    return () => supabase.removeChannel(canal)
  }, [meuId, squadId])

  useEffect(() => {
    if (abaAtiva === "chat") {
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 150)
    }
  }, [mensagens, abaAtiva])

  async function iniciarSessao() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")
      setMeuId(user.id)

      // Carregar meu username
      const { data: meuPerfil } = await supabase.from("usuarios").select("username").eq("id", user.id).single()
      if (meuPerfil) setMeuNome(meuPerfil.username)

      // 1. Carregar Detalhes do Esquadrão
      await carregarSquadDetails(user.id)

      // 2. Carregar Mensagens
      await carregarMensagens(user.id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function carregarSquadDetails(usrId) {
    try {
      const { data: sq, error } = await supabase.from("squads").select("*").eq("id", squadId).single()
      if (error) throw error
      setSquadInfo(sq)

      // Carregar membros
      const { data: mems, error: memsErr } = await supabase
        .from("squad_members")
        .select("usuario_id, usuarios (id, username, foto)")
        .eq("squad_id", squadId)
      
      if (memsErr) throw memsErr
      setMembros(mems?.map(m => m.usuarios).filter(Boolean) || [])

    } catch (err) {
      console.log("Banco sem suporte a tabelas de squads. Usando mock local...", err.message)
      
      // Fallback
      const localSquads = JSON.parse(localStorage.getItem("vexx_squads") || "[]")
      const sq = localSquads.find(s => s.id === squadId) || {
        id: squadId,
        name: squadId.includes("alpha") ? "Alpha Tactical" : "Iron Body Builders",
        description: "Esquadrão tático de operações fitness de alto rendimento.",
        capacity: 12
      }
      setSquadInfo(sq)

      // Carregar membros locais
      const mockMembro1 = { id: usrId, username: meuNome || "operador", foto: null }
      const mockMembro2 = { id: "user-2", username: "cardio_commander", foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" }
      const mockMembro3 = { id: "user-3", username: "iron_beast", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" }
      setMembros([mockMembro1, mockMembro2, mockMembro3])
    }
  }

  async function carregarMensagens(usrId = meuId) {
    try {
      const { data: msgs, error } = await supabase
        .from("squad_mensagens")
        .select("*, usuarios:usuario_id (id, username, foto)")
        .eq("squad_id", squadId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMensagens(msgs || [])
    } catch (err) {
      console.log("Falha ao ler squad_mensagens do banco, usando fallback local...")
      
      const localKey = `vexx_squad_msgs_${squadId}`
      const localMsgs = JSON.parse(localStorage.getItem(localKey) || "[]")
      
      if (localMsgs.length === 0) {
        const mockMsgs = [
          {
            id: "msg-1",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            squad_id: squadId,
            usuario_id: "user-2",
            texto: "BEM-VINDO AO CANAL DA SQUAD. Sensores operacionais ativos.",
            usuarios: { id: "user-2", username: "cardio_commander", foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" }
          },
          {
            id: "msg-2",
            created_at: new Date(Date.now() - 1800000).toISOString(),
            squad_id: squadId,
            usuario_id: "user-3",
            texto: "Hoje o treino de perna foi no limite! Foco total.",
            usuarios: { id: "user-3", username: "iron_beast", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" }
          }
        ]
        localStorage.setItem(localKey, JSON.stringify(mockMsgs))
        setMensagens(mockMsgs)
      } else {
        setMensagens(localMsgs)
      }
    }
  }

  async function executarComando(input) {
    const partes = input.trim().split(" ")
    const cmdRaw = partes[0]
    const cmdLower = cmdRaw.toLowerCase()
    const val = partes[1]
    const serie = partes[2] || "3x10"

    try {
      if (cmdLower === "/help") {
        setShowHelpModal(true)
      } else if (cmdLower === "/peso") {
        localStorage.setItem("meu_peso", val)
        alert(`Peso corporal atualizado para ${val}KG!`)
        if (meuId) await avaliarEConquistar(meuId, "peso")
      } else if (cmdLower === "/agua") {
        alert(`${val || 250}ml de água ingeridos com sucesso!`)
        if (meuId) await avaliarEConquistar(meuId, "hidro")
      } else if (cmdLower === "/creatina") {
        alert("Creatina diária registrada!")
        if (meuId) await avaliarEConquistar(meuId, "creatina")
      } else if (cmdLower === "/descanso") {
        alert(`Timer de descanso de ${val || 60}s iniciado no hud.`)
      } else {
        const nomeExercicio = cmdRaw.replace("/", "").replace(/_/g, " ").trim()
        const pesoNovo = parseFloat(val)

        if (nomeExercicio && !isNaN(pesoNovo)) {
          // Salvar registro de treino
          try {
            await supabase.from("registros_treino").insert({ 
              usuario_id: meuId, 
              exercicio: nomeExercicio, 
              peso: pesoNovo, 
              series: serie 
            })
          } catch (e) {
            console.log("Registrando treino localmente...")
          }
          alert(`Treino de ${nomeExercicio} gravado! Carga: ${pesoNovo}kg.`)
          if (meuId) await avaliarEConquistar(meuId, "treino", { ia: false })
        }
      }
    } catch (err) { 
      console.error(err) 
    }
    setNovaMensagem("")
    setShowComandos(false)
  }

  async function enviarMensagem(e) {
    e.preventDefault()
    if (!novaMensagem.trim()) return
    if (novaMensagem.startsWith("/")) return executarComando(novaMensagem)

    const texto = novaMensagem
    setNovaMensagem("")

    try {
      // 1. Tenta salvar na Supabase
      const { error } = await supabase.from("squad_mensagens").insert({
        squad_id: squadId,
        usuario_id: meuId,
        texto
      })

      if (error) throw error
      await carregarMensagens()
    } catch (err) {
      console.log("Gravando mensagem em canal local...")
      
      const localKey = `vexx_squad_msgs_${squadId}`
      const localMsgs = JSON.parse(localStorage.getItem(localKey) || "[]")
      
      const novaMsg = {
        id: `msg-${Date.now()}`,
        created_at: new Date().toISOString(),
        squad_id: squadId,
        usuario_id: meuId,
        texto,
        usuarios: { id: meuId, username: meuNome || "operador", foto: null }
      }
      
      const listaAtualizada = [...localMsgs, novaMsg]
      localStorage.setItem(localKey, JSON.stringify(listaAtualizada))
      setMensagens(listaAtualizada)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* HEADER TÁTICO */}
      <div className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 p-4 pt-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 font-black">‹</button>
          <div>
            <h2 className="text-xs font-black uppercase italic tracking-tighter text-blue-400">{squadInfo?.name || "CANAL SQUAD"}</h2>
            <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Sinal Criptografado</p>
          </div>
        </div>

        <div className="flex bg-zinc-900 p-1 rounded-full border border-zinc-800">
          <button onClick={() => setAbaAtiva("chat")} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${abaAtiva === "chat" ? "bg-blue-500 text-black shadow-md" : "text-zinc-500"}`}>Canal</button>
          <button onClick={() => setAbaAtiva("membros")} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${abaAtiva === "membros" ? "bg-blue-500 text-black shadow-md" : "text-zinc-500"}`}>Membros</button>
        </div>
      </div>

      {/* PROTOCOLOS DE COMANDO HELP */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black italic text-blue-500 uppercase">Ações do Esquadrão</h2>
               <button onClick={() => setShowHelpModal(false)} className="w-10 h-10 bg-zinc-900 rounded-full text-white font-bold">✕</button>
            </div>
            <input value={buscaHelp} onChange={(e) => setBuscaHelp(e.target.value)} placeholder="FILTRAR COMANDOS..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-6 text-xs font-black uppercase outline-none focus:border-blue-500" />
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
              {comandosFiltradosHelp.map((item, i) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-3xl">
                  <span className="text-blue-400 font-black text-xs">{item.cmd}</span>
                  <p className="text-zinc-500 text-[9px] font-bold uppercase mt-1">{item.desc}</p>
                  <code className="block mt-2 text-emerald-400 text-[10px] bg-black/50 p-2 rounded-lg">{item.exemplo}</code>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {abaAtiva === "chat" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden">
            
            {/* CORPO DO CHAT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {mensagens.map((msg, i) => {
                const souEu = msg.usuario_id === meuId
                return (
                  <div key={msg.id || i} className={`flex gap-3 ${souEu ? "justify-end" : "justify-start"}`}>
                    {!souEu && (
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                        <img src={msg.usuarios?.foto || "https://via.placeholder.com/150"} className="w-full h-full object-cover" alt="avatar" />
                      </div>
                    )}
                    
                    <div className="max-w-[75%]">
                      {!souEu && (
                        <p className="text-[7.5px] font-black uppercase text-zinc-500 mb-1 ml-1">@{msg.usuarios?.username || "atleta"}</p>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl text-[11px] font-bold leading-relaxed ${
                          souEu
                            ? "bg-blue-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(37,99,235,0.2)]"
                            : "bg-zinc-900 text-zinc-200 rounded-bl-none border border-zinc-800"
                        }`}
                      >
                        {msg.texto}
                      </div>
                      <p className={`text-[6px] font-bold text-zinc-600 uppercase mt-1 ${souEu ? "text-right mr-1" : "ml-1"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={scrollRef} />
            </div>

            {/* FLOATING COMANDOS DE ATALHO */}
            {showComandos && (
              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="mx-4 mb-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl z-50">
                <div className="max-h-48 overflow-y-auto p-1 no-scrollbar">
                  {todosComandosHelp.filter(x => x.cmd.includes(filtroComando)).slice(0, 8).map(item => (
                    <button key={item.cmd} onClick={() => { setNovaMensagem(`${item.cmd} `); setShowComandos(false); }} className="w-full flex justify-between p-4 hover:bg-blue-600 group rounded-xl transition-all mb-1 text-left">
                      <span className="text-[10px] font-black text-zinc-300 group-hover:text-white italic">{item.cmd}</span>
                      <span className="text-[7px] text-zinc-600 group-hover:text-white/50 font-black uppercase">Selecionar</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FORMULÁRIO DE ENVIO */}
            <form onSubmit={enviarMensagem} className="p-4 bg-zinc-950 border-t border-zinc-900 flex gap-2">
              <input value={novaMensagem} onChange={(e) => {
                  setNovaMensagem(e.target.value)
                  if (e.target.value.startsWith("/")) { setShowComandos(true); setFiltroComando(e.target.value.toLowerCase()); } else setShowComandos(false)
                }} placeholder="DIGITE OU USE '/' PARA COMANDOS..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all placeholder:text-zinc-600" />
              <button className="bg-blue-600 text-white w-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(37,99,235,0.3)]">›</button>
            </form>
          </motion.div>
        ) : (
          
          /* ABA: MEMBROS */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[4px] ml-2">Integrantes do Esquadrão</h3>
            
            <div className="space-y-2">
              {membros.map((m, idx) => (
                <div key={m.id || idx} className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-zinc-800 overflow-hidden bg-zinc-950">
                      <img src={m.foto || "https://via.placeholder.com/150"} className="w-full h-full object-cover" alt={m.username} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-white italic">@{m.username}</p>
                      <p className="text-[7.5px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">Operacional</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black bg-zinc-950 border border-zinc-800 text-zinc-500 px-3 py-1.5 rounded-xl uppercase">
                    Atleta
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
