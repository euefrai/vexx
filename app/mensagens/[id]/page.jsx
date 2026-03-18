"use client"
import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function ChatPrivado() {
  const { id: destinatarioId } = useParams()
  const router = useRouter()
  
  // Interface
  const [abaAtiva, setAbaAtiva] = useState("chat")
  const [showComandos, setShowComandos] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [filtroComando, setFiltroComando] = useState("")
  const [buscaHelp, setBuscaHelp] = useState("")

  // Dados
  const [mensagens, setMensagens] = useState([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [meuId, setMeuId] = useState(null)
  const [outroUsuario, setOutroUsuario] = useState(null)
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  
  const scrollRef = useRef(null)

  const listaExercicios = [
    "Supino Reto", "Supino Inclinado", "Supino Declinado", "Crucifixo Reto", "Voador", "Crossover", "Chest Press",
    "Pulldown", "Remada Curvada", "Remada Baixa", "Puxada Aberta", "Terra", "Remada Cavalinho", "Barra Fixa", "Serrote",
    "Agachamento Livre", "Agachamento Hack", "Leg Press 45", "Extensora", "Flexora Deitada", "Stiff", "Afundo", "Elevação Pélvica", "Panturrilha em Pé",
    "Desenvolvimento Arnold", "Desenvolvimento Barra", "Elevação Lateral", "Elevação Frontal", "Face Pull", "Remada Alta", "Encolhimento",
    "Rosca Direta", "Rosca Scott", "Rosca Martelo", "Triceps Pulley", "Triceps Corda", "Triceps Testa", "Paralelas",
    "Abdominal Supra", "Abdominal Infra", "Prancha", "Abdominal Roda"
  ].sort()

  const comandosSistema = [
    { cmd: "/help", desc: "Abre a central de inteligência", exemplo: "/help" },
    { cmd: "/peso", desc: "Atualiza peso corporal", exemplo: "/peso 85.5" },
    { cmd: "/meta", desc: "Define meta de peso", exemplo: "/meta 90" },
    { cmd: "/cardio", desc: "Registra tempo de aeróbico", exemplo: "/cardio 30" },
    { cmd: "/creatina", desc: "Registra consumo de creatina", exemplo: "/creatina" },
    { cmd: "/agua", desc: "Registra ingestão de água", exemplo: "/agua 500" },
    { cmd: "/descanso", desc: "Avisa tempo de intervalo", exemplo: "/descanso 60" },
    { cmd: "/clean", desc: "Reseta configurações locais", exemplo: "/clean" },
  ]

  const todosComandosHelp = [
    ...comandosSistema,
    ...listaExercicios.map(ex => ({
      cmd: `/${ex.replace(/\s+/g, '_')}`,
      desc: `Registra carga para ${ex}`,
      exemplo: `/${ex.replace(/\s+/g, '_')} 80 4x12`
    }))
  ]

  const comandosFiltradosHelp = todosComandosHelp.filter(item => 
    item.cmd.toLowerCase().includes(buscaHelp.toLowerCase()) || 
    item.desc.toLowerCase().includes(buscaHelp.toLowerCase())
  )

  useEffect(() => {
    iniciarSessao()
    const canal = supabase
      .channel(`chat_${destinatarioId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens' }, () => {
        atualizarMensagens()
      }).subscribe()
    return () => supabase.removeChannel(canal)
  }, [meuId, destinatarioId])

  useEffect(() => {
    if (abaAtiva === "chat") setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }, [mensagens, abaAtiva])

  async function atualizarMensagens() {
    const { data: msgs } = await supabase.from("mensagens").select("*")
      .or(`and(remetente_id.eq.${meuId},destinatario_id.eq.${destinatarioId}),and(remetente_id.eq.${destinatarioId},destinatario_id.eq.${meuId})`)
      .order("created_at", { ascending: true })
    setMensagens(msgs || [])
  }

  async function iniciarSessao() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push("/login")
    setMeuId(user.id)
    const { data: userD } = await supabase.from("usuarios").select("username, foto").eq("id", destinatarioId).single()
    if (userD) setOutroUsuario(userD)
    
    await atualizarMensagens()

    const { data: regs } = await supabase.from("registros_treino").select("*").eq("usuario_id", user.id).order("created_at", { ascending: false })
    setRegistros(regs || [])
    setLoading(false)
  }

  // FUNÇÕES DE EXCLUSÃO
  async function excluirMensagem(id) {
    if(!confirm("Deseja apagar essa mensagem?")) return
    await supabase.from("mensagens").delete().eq("id", id)
    atualizarMensagens()
  }

  async function excluirLog(id) {
    if(!confirm("Remover este registro de treino?")) return
    await supabase.from("registros_treino").delete().eq("id", id)
    iniciarSessao()
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
      } else if (cmdLower === "/meta") {
        localStorage.setItem("meta_peso", val)
      } else if (cmdLower === "/creatina") {
        alert("Creatina registrada! Protocolo mantido.")
      } else if (cmdLower === "/descanso") {
        alert(`Timer de ${val || 60}s iniciado! Foco na próxima série.`)
      } else if (cmdLower === "/clean") {
        localStorage.clear()
        window.location.reload()
      } else {
        const nomeExercicio = cmdRaw.replace("/", "").replace(/_/g, " ").trim()
        const pesoNovo = parseFloat(val)

        if (nomeExercicio && !isNaN(pesoNovo)) {
          const { error } = await supabase.from("registros_treino").insert({ 
            usuario_id: meuId, 
            exercicio: nomeExercicio, 
            peso: pesoNovo, 
            series: serie 
          })
          if (error) throw error
          iniciarSessao()
          setAbaAtiva("treino")
        }
      }
    } catch (err) { console.error(err) }
    setNovaMensagem("")
    setShowComandos(false)
  }

  async function enviarMensagem(e) {
    e.preventDefault()
    if (!novaMensagem.trim()) return
    if (novaMensagem.startsWith("/")) return executarComando(novaMensagem)
    
    const texto = novaMensagem
    setNovaMensagem("")
    await supabase.from("mensagens").insert({ texto, remetente_id: meuId, destinatario_id: destinatarioId })
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 p-4 pt-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 font-black">‹</button>
          <div className="flex items-center gap-3">
             <div className="relative">
                <img src={outroUsuario?.foto || "https://via.placeholder.com/150"} className="w-10 h-10 rounded-full object-cover border border-green-500/50" alt="avatar" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-[0_0_10px_#22c55e]"></div>
             </div>
             <div>
                <h2 className="text-xs font-black uppercase italic tracking-tighter text-white">{outroUsuario?.username || "OPERADOR"}</h2>
                <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Link Estabilizado</p>
             </div>
          </div>
        </div>

        <div className="flex bg-zinc-900 p-1 rounded-full border border-zinc-800">
          <button onClick={() => setAbaAtiva("chat")} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${abaAtiva === "chat" ? "bg-green-500 text-black" : "text-zinc-500"}`}>Chat</button>
          <button onClick={() => setAbaAtiva("treino")} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${abaAtiva === "treino" ? "bg-green-500 text-black" : "text-zinc-500"}`}>Log</button>
        </div>
      </div>

      {/* MODAL HELP */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black italic text-green-500 uppercase">Protocolos</h2>
               <button onClick={() => setShowHelpModal(false)} className="w-10 h-10 bg-zinc-900 rounded-full text-white font-bold">✕</button>
            </div>
            <input value={buscaHelp} onChange={(e) => setBuscaHelp(e.target.value)} placeholder="PESQUISAR..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-6 text-xs font-black uppercase outline-none focus:border-green-500" />
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
              {comandosFiltradosHelp.map((item, i) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-3xl">
                  <span className="text-green-500 font-black text-xs">{item.cmd}</span>
                  <p className="text-zinc-500 text-[9px] font-bold uppercase mt-1">{item.desc}</p>
                  <code className="block mt-2 text-blue-400 text-[10px] bg-black/50 p-2 rounded-lg">{item.exemplo}</code>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {abaAtiva === "chat" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {mensagens.map((msg, i) => (
                <div key={i} className={`flex ${msg.remetente_id === meuId ? "justify-end" : "justify-start"} group relative`}>
                  {msg.remetente_id === meuId && (
                    <button onClick={() => excluirMensagem(msg.id)} className="opacity-0 group-hover:opacity-100 mr-2 text-zinc-700 hover:text-red-500 transition-all text-[10px]">✕</button>
                  )}
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[11px] font-bold ${
                    msg.remetente_id === meuId ? "bg-green-500 text-black rounded-br-none" : "bg-zinc-900 text-zinc-200 rounded-bl-none border border-zinc-800"
                  }`}>
                    {msg.texto}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {showComandos && (
              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="mx-4 mb-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl z-50">
                <div className="max-h-48 overflow-y-auto p-1 no-scrollbar">
                  {todosComandosHelp.filter(x => x.cmd.includes(filtroComando)).slice(0, 8).map(item => (
                    <button key={item.cmd} onClick={() => { setNovaMensagem(`${item.cmd} `); setShowComandos(false); }} className="w-full flex justify-between p-4 hover:bg-green-500 group rounded-xl transition-all mb-1">
                      <span className="text-[10px] font-black text-zinc-300 group-hover:text-black italic">{item.cmd}</span>
                      <span className="text-[7px] text-zinc-600 group-hover:text-black/50 font-black uppercase">Selecionar</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <form onSubmit={enviarMensagem} className="p-4 bg-zinc-950 border-t border-zinc-900 flex gap-2">
              <input value={novaMensagem} onChange={(e) => {
                  setNovaMensagem(e.target.value)
                  if (e.target.value.startsWith("/")) { setShowComandos(true); setFiltroComando(e.target.value.toLowerCase()); } else setShowComandos(false)
                }} placeholder="COMANDO OU MENSAGEM..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-green-500 transition-all" />
              <button className="bg-green-500 text-black w-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(34,197,94,0.3)]">›</button>
            </form>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/30 p-5 rounded-[2.5rem] border border-zinc-800 text-center">
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Massa Atual</p>
                <p className="text-2xl font-black italic text-white">{localStorage.getItem("meu_peso") || "00"}KG</p>
              </div>
              <div className="bg-zinc-900/30 p-5 rounded-[2.5rem] border border-zinc-800 text-center">
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Meta Target</p>
                <p className="text-2xl font-black italic text-blue-500">{localStorage.getItem("meta_peso") || "00"}KG</p>
              </div>
            </div>

            <div className="space-y-3 pb-24">
              <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[5px] ml-4">Database Log</h3>
              {registros.map(reg => (
                <div key={reg.id} className="bg-zinc-900/80 p-6 rounded-[2.5rem] border border-zinc-800 flex justify-between items-center group relative overflow-hidden">
                  <div className="z-10">
                    <h4 className="text-[11px] font-black uppercase italic text-white group-hover:text-green-500 transition-colors">{reg.exercicio}</h4>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">{reg.series} • {new Date(reg.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4 z-10">
                    <span className="text-2xl font-black italic text-green-500">{reg.peso}KG</span>
                    <button onClick={() => excluirLog(reg.id)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}