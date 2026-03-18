"use client"
import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function ChatPrivado() {
  const { id: destinatarioId } = useParams()
  const router = useRouter()
  
  // Estados de Interface
  const [abaAtiva, setAbaAtiva] = useState("chat")
  const [showComandos, setShowComandos] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false) // Novo: Modal de Ajuda
  const [filtroComando, setFiltroComando] = useState("")
  const [buscaHelp, setBuscaHelp] = useState("") // Novo: Busca dentro do Help

  // Estados de Dados
  const [mensagens, setMensagens] = useState([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [meuId, setMeuId] = useState(null)
  const [outroUsuario, setOutroUsuario] = useState(null)
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  
  const scrollRef = useRef(null)

  const listaExercicios = [
    "Supino Reto", "Supino Inclinado", "Crucifixo", "Voador", "Crossover", 
    "Pulldown", "Remada Curvada", "Remada Baixa", "Puxada Aberta", "Terra",
    "Agachamento", "Leg Press", "Extensora", "Flexora", "Stiff",
    "Desenvolvimento", "Elevação Lateral", "Face Pull",
    "Rosca Direta", "Rosca Scott", "Triceps Pulley", "Triceps Corda"
  ].sort()

  const comandosSistema = [
    { cmd: "/help", desc: "Abre a central de inteligência de comandos", exemplo: "/help" },
    { cmd: "/peso", desc: "Atualiza seu peso corporal no sistema", exemplo: "/peso 85.5" },
    { cmd: "/meta", desc: "Define seu objetivo de peso corporal", exemplo: "/meta 90" },
    { cmd: "/clean", desc: "Reseta as configurações locais do app", exemplo: "/clean" },
  ]

  // Junta tudo para o buscador do Modal de Ajuda
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        const msg = payload.new
        if ((msg.remetente_id === meuId && msg.destinatario_id === destinatarioId) ||
            (msg.remetente_id === destinatarioId && msg.destinatario_id === meuId)) {
          setMensagens(prev => [...prev, msg])
        }
      }).subscribe()
    return () => supabase.removeChannel(canal)
  }, [meuId, destinatarioId])

  useEffect(() => {
    if (abaAtiva === "chat") setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }, [mensagens, abaAtiva])

  async function iniciarSessao() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push("/login")
    setMeuId(user.id)
    const { data: userD } = await supabase.from("usuarios").select("username, foto").eq("id", destinatarioId).single()
    if (userD) setOutroUsuario(userD)
    const { data: msgs } = await supabase.from("mensagens").select("*")
      .or(`and(remetente_id.eq.${user.id},destinatario_id.eq.${destinatarioId}),and(remetente_id.eq.${destinatarioId},destinatario_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
    setMensagens(msgs || [])
    const { data: regs } = await supabase.from("registros_treino").select("*").eq("usuario_id", user.id).order("created_at", { ascending: false })
    setRegistros(regs || [])
    setLoading(false)
  }

  async function executarComando(input) {
    const partes = input.trim().split(" ")
    const cmd = partes[0].toLowerCase()
    const val = partes[1]
    const serie = partes[2] || "3x10"

    try {
      if (cmd === "/help") {
        setShowHelpModal(true)
      } else if (cmd === "/peso") {
        localStorage.setItem("meu_peso", val)
      } else if (cmd === "/meta") {
        localStorage.setItem("meta_peso", val)
      } else if (cmd === "/clean") {
        localStorage.clear()
        window.location.reload()
      } else {
        const nomeExercicio = cmd.replace("/", "").replace(/_/g, " ")
        const pesoNovo = parseFloat(val)
        if (!isNaN(pesoNovo)) {
          await supabase.from("registros_treino").insert({ usuario_id: meuId, exercicio: nomeExercicio, peso: pesoNovo, serie: serie })
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
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400">‹</button>
          <div className="flex items-center gap-3">
             <div className="relative">
                <img src={outroUsuario?.foto || "https://via.placeholder.com/150"} className="w-10 h-10 rounded-full object-cover border border-green-500/50" alt="avatar" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
             </div>
             <div>
                <h2 className="text-xs font-black uppercase italic text-white">{outroUsuario?.username || "OPERADOR"}</h2>
                <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">Online</p>
             </div>
          </div>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-full border border-zinc-800">
          <button onClick={() => setAbaAtiva("chat")} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${abaAtiva === "chat" ? "bg-green-500 text-black" : "text-zinc-500"}`}>Chat</button>
          <button onClick={() => setAbaAtiva("treino")} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${abaAtiva === "treino" ? "bg-green-500 text-black" : "text-zinc-500"}`}>Log</button>
        </div>
      </div>

      {/* MODAL DE HELP (O COMANDO /HELP ABRE ISSO) */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm p-4 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black italic text-green-500 uppercase tracking-tighter">Central de Comandos</h2>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Manual de Operações VEXX</p>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white font-bold">X</button>
            </div>

            <input 
              autoFocus
              value={buscaHelp}
              onChange={(e) => setBuscaHelp(e.target.value)}
              placeholder="PESQUISAR COMANDO OU ALVO..."
              className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-4 outline-none focus:border-green-500 text-xs font-black uppercase"
            />

            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
              {comandosFiltradosHelp.map((item, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl hover:border-green-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-green-500 font-black text-sm tracking-tight">{item.cmd}</span>
                    <span className="text-[7px] bg-zinc-800 text-zinc-500 px-2 py-1 rounded-md font-bold uppercase tracking-widest">Atalho</span>
                  </div>
                  <p className="text-zinc-300 text-[10px] font-bold uppercase mb-3 leading-relaxed">{item.desc}</p>
                  <div className="bg-black p-3 rounded-xl border border-zinc-800">
                    <p className="text-[8px] text-zinc-600 font-black uppercase mb-1 tracking-tighter">Exemplo de uso:</p>
                    <code className="text-blue-400 text-[10px] font-mono">{item.exemplo}</code>
                  </div>
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
                <div key={i} className={`flex ${msg.remetente_id === meuId ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[11px] font-bold ${msg.remetente_id === meuId ? "bg-green-500 text-black rounded-br-none" : "bg-zinc-900 text-zinc-200 rounded-bl-none border border-zinc-800"}`}>
                    {msg.texto}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* AUTO-COMPLETE RÁPIDO AO DIGITAR "/" */}
            {showComandos && (
              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="mx-4 mb-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                <div className="p-2 border-b border-zinc-800 bg-zinc-950/50 flex justify-between px-4"><span className="text-[8px] font-black text-green-500 uppercase italic">Sugestões de Comando</span></div>
                <div className="max-h-40 overflow-y-auto p-1">
                  {todosComandosHelp.filter(x => x.cmd.includes(filtroComando)).slice(0, 10).map(item => (
                    <button key={item.cmd} onClick={() => { setNovaMensagem(`${item.cmd} `); setShowComandos(false); }} className="w-full flex justify-between p-3 hover:bg-green-500 group rounded-xl transition-colors">
                      <span className="text-[10px] font-black text-zinc-300 group-hover:text-black">{item.cmd}</span>
                      <span className="text-[7px] text-zinc-600 group-hover:text-black/50 font-black uppercase">Click p/ usar</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <form onSubmit={enviarMensagem} className="p-4 bg-zinc-950 border-t border-zinc-900 flex gap-2">
              <input 
                value={novaMensagem} 
                onChange={(e) => {
                  setNovaMensagem(e.target.value)
                  if (e.target.value.startsWith("/")) {
                    setShowComandos(true)
                    setFiltroComando(e.target.value.toLowerCase())
                  } else setShowComandos(false)
                }}
                placeholder="DIGITE OU USE /HELP PARA MANUAL" 
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-green-500 transition-all" 
              />
              <button className="bg-green-500 text-black w-14 rounded-2xl flex items-center justify-center font-bold">›</button>
            </form>
          </motion.div>
        ) : (
          /* ABA PERFORMANCE */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 p-4 rounded-[2rem] border border-zinc-800 text-center">
                <p className="text-[7px] font-black text-zinc-600 uppercase mb-1">Peso Atual</p>
                <p className="text-xl font-black italic text-white">{localStorage.getItem("meu_peso") || "--"}KG</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-[2rem] border border-zinc-800 text-center">
                <p className="text-[7px] font-black text-zinc-600 uppercase mb-1">Meta</p>
                <p className="text-xl font-black italic text-blue-500">{localStorage.getItem("meta_peso") || "--"}KG</p>
              </div>
            </div>
            <div className="space-y-3 pb-20">
              <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[3px] ml-2">Log de Operações</h3>
              {registros.map(reg => (
                <div key={reg.id} className="bg-zinc-900/80 p-5 rounded-[2.5rem] border border-zinc-800 flex justify-between items-center">
                  <div>
                    <h4 className="text-[10px] font-black uppercase italic text-white">{reg.exercicio}</h4>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">{reg.serie} • {new Date(reg.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-2xl font-black italic text-green-500">{reg.weight || reg.peso}KG</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}