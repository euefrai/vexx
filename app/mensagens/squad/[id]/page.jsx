"use client"

import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useGamificacao } from "@/hooks/useGamificacao"

// Componente para renderizar foto ou iniciais do usuário com design premium
function RenderAvatar({ usuario, size = "w-8.5 h-8.5 text-[10px]" }) {
  if (usuario?.foto) {
    return (
      <div className={`${size} rounded-full border border-zinc-800 overflow-hidden shrink-0 bg-zinc-900`}>
        <img src={usuario.foto} className="w-full h-full object-cover" alt="avatar" />
      </div>
    )
  }
  
  const username = usuario?.username || "atleta"
  const initials = username.substring(0, 2).toUpperCase()
  return (
    <div className={`${size} rounded-full border border-zinc-800 overflow-hidden shrink-0 bg-zinc-900 flex items-center justify-center font-black tracking-tighter text-blue-400 select-none`}>
      {initials}
    </div>
  )
}

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

    // Inscrever em tempo real de forma otimizada para esta squad específica
    const canal = supabase
      .channel(`squad_chat_${squadId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'squad_mensagens',
        filter: `squad_id=eq.${squadId}`
      }, () => {
        carregarMensagens()
      }).subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
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

      // Carregar membros da squad de forma plana (evita falhas PGRST200)
      const { data: mems, error: memsErr } = await supabase
        .from("squad_members")
        .select("usuario_id")
        .eq("squad_id", squadId)
      
      if (memsErr) throw memsErr

      const userIds = mems?.map(m => m.usuario_id).filter(Boolean) || []
      
      let membrosPerfis = []
      if (userIds.length > 0) {
        const { data: perfis, error: perfisErr } = await supabase
          .from("usuarios")
          .select("id, username, foto")
          .in("id", userIds)
        
        if (perfisErr) throw perfisErr
        membrosPerfis = perfis || []
      }

      setMembros(membrosPerfis)

    } catch (err) {
      console.log("Falha ao carregar squads ou membros via banco, usando fallback local...", err.message)
      
      // Fallback local limpo
      const localSquads = JSON.parse(localStorage.getItem("vexx_squads") || "[]")
      const sq = localSquads.find(s => s.id === squadId) || {
        id: squadId,
        name: "Squad Operacional",
        description: "Esquadrão tático de operações fitness de alto rendimento.",
        capacity: 12
      }
      setSquadInfo(sq)

      // Carregar membros locais
      const mockMembro1 = { id: usrId, username: meuNome || "operador", foto: null }
      setMembros([mockMembro1])
    }
  }

  async function carregarMensagens(usrId = meuId) {
    try {
      // 1. Carrega as mensagens do banco de forma plana
      const { data: msgs, error } = await supabase
        .from("squad_mensagens")
        .select("*")
        .eq("squad_id", squadId)
        .order("created_at", { ascending: true })

      if (error) throw error
      const rawMsgs = msgs || []

      // 2. Resolve os perfis no cliente para evitar erros PGRST200
      const userIds = [...new Set(rawMsgs.map(m => m.usuario_id).filter(Boolean))]

      let perfisMap = {}
      if (userIds.length > 0) {
        const { data: perfis, error: perfisErr } = await supabase
          .from("usuarios")
          .select("id, username, foto")
          .in("id", userIds)

        if (!perfisErr && perfis) {
          perfis.forEach(p => {
            perfisMap[p.id] = p
          })
        }
      }

      // 3. Mapeia perfil em cada mensagem
      const mappedMsgs = rawMsgs.map(m => ({
        ...m,
        usuarios: perfisMap[m.usuario_id] || { username: "atleta", foto: null }
      }))

      setMensagens(mappedMsgs)
    } catch (err) {
      console.log("Falha ao ler squad_mensagens do banco, usando fallback local...", err.message)
      
      const localKey = `vexx_squad_msgs_${squadId}`
      const localMsgs = JSON.parse(localStorage.getItem(localKey) || "[]")
      setMensagens(localMsgs)
    }
  }

  async function executarComando(input) {
    const partes = input.trim().split(" ")
    const cmdRaw = partes[0]
    const cmdLower = cmdRaw.toLowerCase()
    const val = partes[1]
    const serie = partes[2] || "3x10"

    let msgSistema = ""

    try {
      if (cmdLower === "/help") {
        setShowHelpModal(true)
        setNovaMensagem("")
        setShowComandos(false)
        return
      } else if (cmdLower === "/peso") {
        const pesoVal = parseFloat(val)
        if (isNaN(pesoVal)) return alert("Utilize o formato: /peso [valor]")
        localStorage.setItem("meu_peso", pesoVal)
        msgSistema = `⚖️ Atualizei meu peso corporal para ${pesoVal} kg!`
        if (meuId) {
          await supabase.from("usuarios").update({ peso: pesoVal }).eq("id", meuId).catch(() => {})
          await avaliarEConquistar(meuId, "peso")
        }
      } else if (cmdLower === "/agua") {
        const qtdAgua = parseInt(val) || 250
        msgSistema = `💧 Registrei o consumo de ${qtdAgua} ml de água!`
        if (meuId) await avaliarEConquistar(meuId, "hidro")
      } else if (cmdLower === "/creatina") {
        msgSistema = `🧪 Dose diária de creatina registrada para o dia de hoje!`
        if (meuId) await avaliarEConquistar(meuId, "creatina")
      } else if (cmdLower === "/descanso") {
        const tempo = parseInt(val) || 60
        msgSistema = `⏳ Cronômetro tático de descanso iniciado: ${tempo} segundos!`
      } else {
        const nomeExercicio = cmdRaw.replace("/", "").replace(/_/g, " ").trim()
        const pesoNovo = parseFloat(val)

        if (nomeExercicio && !isNaN(pesoNovo)) {
          msgSistema = `🏋️ Treino registrado: ${nomeExercicio} | Carga: ${pesoNovo} kg | Séries: ${serie}`
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
          if (meuId) await avaliarEConquistar(meuId, "treino", { ia: false })
        } else {
          return alert("Comando inválido. Digite /help para visualizar os comandos operacionais.")
        }
      }

      // Envia a mensagem com os detalhes do progresso para o chat da Squad
      if (msgSistema) {
        try {
          const { error } = await supabase.from("squad_mensagens").insert({
            squad_id: squadId,
            usuario_id: meuId,
            texto: msgSistema
          })
          if (error) throw error
          await carregarMensagens()
        } catch (err) {
          console.log("Gravando mensagem de comando em canal local...")
          const localKey = `vexx_squad_msgs_${squadId}`
          const localMsgs = JSON.parse(localStorage.getItem(localKey) || "[]")
          const novaMsg = {
            id: `msg-${Date.now()}`,
            created_at: new Date().toISOString(),
            squad_id: squadId,
            usuario_id: meuId,
            texto: msgSistema,
            usuarios: { id: meuId, username: meuNome || "operador", foto: null }
          }
          const listaAtualizada = [...localMsgs, novaMsg]
          localStorage.setItem(localKey, JSON.stringify(listaAtualizada))
          setMensagens(listaAtualizada)
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
      // 1. Salva na Supabase
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
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none z-15" />
      
      {/* HEADER TÁTICO */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border-b border-zinc-900 p-4 pt-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 text-zinc-400 font-bold active:scale-90 transition-transform cursor-pointer"
          >
            ‹
          </button>
          <div>
            <h2 className="text-xs font-black uppercase italic tracking-tighter text-blue-400">{squadInfo?.name || "SQUAD OPERACIONAL"}</h2>
            <p className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse flex items-center gap-1 mt-0.5">
              <span className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></span> Sinal Criptografado
            </p>
          </div>
        </div>

        <div className="flex bg-zinc-950/80 p-1 rounded-2xl border border-zinc-900">
          <button 
            onClick={() => setAbaAtiva("chat")} 
            className={`px-4.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              abaAtiva === "chat" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-950/20" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Canal
          </button>
          <button 
            onClick={() => setAbaAtiva("membros")} 
            className={`px-4.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              abaAtiva === "membros" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-950/20" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Membros
          </button>
        </div>
      </div>

      {/* PROTOCOLOS DE COMANDO HELP */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black italic text-blue-500 uppercase">Ações do Esquadrão</h2>
               <button 
                 onClick={() => setShowHelpModal(false)} 
                 className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full text-white font-bold cursor-pointer"
               >
                 ✕
               </button>
            </div>
            <input 
              value={buscaHelp} 
              onChange={(e) => setBuscaHelp(e.target.value)} 
              placeholder="FILTRAR COMANDOS..." 
              className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-6 text-xs font-black uppercase outline-none focus:border-blue-500 text-zinc-100 placeholder:text-zinc-600" 
            />
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
              {comandosFiltradosHelp.map((item, i) => (
                <div key={i} className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-2xl">
                  <span className="text-blue-400 font-black text-xs">{item.cmd}</span>
                  <p className="text-zinc-500 text-[9px] font-bold uppercase mt-1">{item.desc}</p>
                  <code className="block mt-2 text-emerald-400 text-[9.5px] bg-black/30 p-2 rounded-lg border border-zinc-900">{item.exemplo}</code>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {abaAtiva === "chat" ? (
          <motion.div 
            key="chat_tab"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* CORPO DO CHAT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {mensagens.map((msg, i) => {
                const souEu = msg.usuario_id === meuId
                return (
                  <motion.div 
                    key={msg.id || i} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={`flex gap-3 ${souEu ? "justify-end" : "justify-start"}`}
                  >
                    {!souEu && <RenderAvatar usuario={msg.usuarios} />}
                    
                    <div className="max-w-[78%]">
                      {!souEu && (
                        <p className="text-[7.5px] font-black uppercase text-zinc-500 mb-1 ml-1">@{msg.usuarios?.username || "atleta"}</p>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm ${
                          souEu
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none shadow-[0_4px_12px_rgba(59,130,246,0.18)]"
                            : "bg-zinc-900 text-zinc-200 rounded-bl-none border border-zinc-850"
                        }`}
                      >
                        {msg.texto}
                      </div>
                      <p className={`text-[6px] font-bold text-zinc-650 uppercase mt-1 ${souEu ? "text-right mr-1" : "ml-1"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={scrollRef} />
            </div>

            {/* FLOATING COMANDOS DE ATALHO */}
            {showComandos && (
              <motion.div 
                initial={{ y: 20 }} 
                animate={{ y: 0 }} 
                className="mx-4 mb-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl z-50"
              >
                <div className="max-h-48 overflow-y-auto p-1 no-scrollbar">
                  {todosComandosHelp.filter(x => x.cmd.includes(filtroComando)).slice(0, 8).map(item => (
                    <button 
                      key={item.cmd} 
                      onClick={() => { setNovaMensagem(`${item.cmd} `); setShowComandos(false); }} 
                      className="w-full flex justify-between p-4 hover:bg-blue-600 hover:text-white group rounded-xl transition-all mb-0.5 text-left cursor-pointer border-none"
                    >
                      <span className="text-[10px] font-black text-zinc-300 group-hover:text-white italic">{item.cmd}</span>
                      <span className="text-[7px] text-zinc-650 group-hover:text-white/50 font-black uppercase">Selecionar</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FORMULÁRIO DE ENVIO */}
            <form onSubmit={enviarMensagem} className="p-4 bg-zinc-950 border-t border-zinc-900 flex gap-2">
              <input 
                value={novaMensagem} 
                onChange={(e) => {
                  setNovaMensagem(e.target.value)
                  if (e.target.value.startsWith("/")) { setShowComandos(true); setFiltroComando(e.target.value.toLowerCase()); } else setShowComandos(false)
                }} 
                placeholder="DIGITE OU USE '/' PARA COMANDOS..." 
                className="flex-1 bg-zinc-900 border border-zinc-850 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all placeholder:text-zinc-600 text-zinc-100" 
              />
              <button className="bg-blue-600 text-white w-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(59,130,246,0.35)] cursor-pointer active:scale-95 transition-all border-none">›</button>
            </form>
          </motion.div>
        ) : (
          
          /* ABA: MEMBROS */
          <motion.div 
            key="membros_tab"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 10 }}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            <h3 className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-2">Integrantes do Esquadrão</h3>
            
            <div className="space-y-2">
              {membros.map((m, idx) => (
                <div key={m.id || idx} className="bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 p-4 rounded-3xl flex items-center justify-between transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <RenderAvatar usuario={m} size="w-11 h-11 text-xs" />
                    <div>
                      <p className="text-xs font-black uppercase text-zinc-200 italic">@{m.username}</p>
                      <p className="text-[7px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span> Operacional
                      </p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black bg-zinc-950/80 border border-zinc-900 text-zinc-500 px-3.5 py-1.5 rounded-xl uppercase tracking-wide">
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
