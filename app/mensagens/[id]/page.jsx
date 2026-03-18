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
  const [filtroComando, setFiltroComando] = useState("")

  // Estados de Dados
  const [mensagens, setMensagens] = useState([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [meuId, setMeuId] = useState(null)
  const [outroUsuario, setOutroUsuario] = useState(null)
  const [registros, setRegistros] = useState([])
  
  const scrollRef = useRef(null)

  const listaExercicios = [
    "Supino Reto", "Supino Inclinado", "Supino Declinado", "Crucifixo Reto", "Voador", "Crossover", "Flexão de Braços",
    "Pulldown", "Remada Curvada", "Remada Baixa", "Remada Unilateral", "Puxada Aberta", "Levantamento Terra", "Barra Fixa",
    "Agachamento Livre", "Agachamento Maquina", "Leg Press 45", "Cadeira Extensora", "Mesa Flexora", "Cadeira Flexora",
    "Stiff", "Elevação Pélvica", "Panturrilha Sentado", "Desenvolvimento Halter", "Elevação Lateral", "Face Pull",
    "Rosca Direta", "Rosca Alternada", "Rosca Scott", "Triceps Testa", "Triceps Pulley", "Triceps Corda", "Abdominal Supra"
  ].sort()

  const exerciciosFiltrados = listaExercicios.filter(ex => 
    ex.toLowerCase().includes(filtroComando.toLowerCase())
  )

  const getVolumeTotal = () => registros.reduce((acc, curr) => acc + (curr.peso || 0), 0)
  const getRecordes = () => {
    const recordes = {}
    registros.forEach(r => {
      if (!recordes[r.exercicio] || r.peso > recordes[r.exercicio]) recordes[r.exercicio] = r.peso
    })
    return recordes
  }

  useEffect(() => {
    iniciarSessao()

    const canal = supabase
      .channel(`chat_${destinatarioId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensagens' 
      }, (payload) => {
        const msg = payload.new
        if ((msg.remetente_id === meuId && msg.destinatario_id === destinatarioId) ||
            (msg.remetente_id === destinatarioId && msg.destinatario_id === meuId)) {
          setMensagens(prev => [...prev, msg])
        }
      })
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [meuId, destinatarioId])

  useEffect(() => {
    if (abaAtiva === "chat") scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens, abaAtiva])

  async function iniciarSessao() {
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
  }

  async function executarComando(comandoFull) {
    const partes = comandoFull.trim().split(" ")
    const cmd = partes[0].toLowerCase()
    const val = partes[1]

    if (cmd === "/peso") {
      localStorage.setItem("meu_peso", val)
    } else if (cmd === "/meta") {
      localStorage.setItem("meta_peso", val)
    } else {
      const exercicio = cmd.replace("/", "").replace(/_/g, " ")
      const pesoNovo = parseFloat(val)
      if (!isNaN(pesoNovo) && listaExercicios.includes(exercicio)) {
        await supabase.from("registros_treino").insert({ usuario_id: meuId, exercicio, peso: pesoNovo })
        iniciarSessao()
      }
    }
    setNovaMensagem("")
  }

  async function enviarMensagem(e) {
    e.preventDefault()
    if (!novaMensagem.trim()) return
    if (novaMensagem.startsWith("/")) return executarComando(novaMensagem)
    const texto = novaMensagem
    setNovaMensagem("")
    await supabase.from("mensagens").insert({ texto, remetente_id: meuId, destinatario_id: destinatarioId })
  }

  const handleInputChange = (val) => {
    setNovaMensagem(val)
    if (val.startsWith("/")) {
      setShowComandos(true)
      setFiltroComando(val.slice(1).split(" ")[0].toLowerCase())
    } else setShowComandos(false)
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* TABS */}
      <div className="flex bg-zinc-950 border-b border-zinc-900 z-20">
        {["chat", "treino"].map(aba => (
          <button key={aba} onClick={() => setAbaAtiva(aba)} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[2px] transition-all ${abaAtiva === aba ? "text-green-500 border-b-2 border-green-500" : "text-zinc-600"}`}>
            {aba === "chat" ? "Comunicação" : "Performance"}
          </button>
        ))}
      </div>

      {/* HEADER COM FOTO PERFEITA */}
      <div className="p-4 border-b border-zinc-800 flex items-center gap-4 bg-black/50 backdrop-blur-md">
        <button onClick={() => router.push("/mensagens")} className="text-zinc-500 hover:text-white transition-colors">←</button>
        
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar Container */}
          <div className="relative w-10 h-10 shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <img 
                src={outroUsuario?.foto || "https://via.placeholder.com/150"} 
                alt={outroUsuario?.username}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            {/* Indicador Online */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
          </div>

          <div>
            <h1 className="font-black uppercase italic text-green-500 tracking-tighter text-sm leading-none">
              {abaAtiva === "chat" ? (outroUsuario?.username || "CARREGANDO...") : "LOG PESSOAL"}
            </h1>
            <p className="text-[7px] text-zinc-600 font-bold uppercase mt-1 tracking-widest">
              Status: Conexão Segura
            </p>
          </div>
        </div>
      </div>

      {abaAtiva === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {mensagens.map((msg, index) => (
              <div key={index} className={`flex ${msg.remetente_id === meuId ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-4 rounded-3xl text-xs font-bold ${
                  msg.remetente_id === meuId ? "bg-green-500 text-black rounded-tr-none" : "bg-zinc-900 text-white rounded-tl-none border border-zinc-800"
                }`}>
                  {msg.texto}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          {showComandos && (
            <div className="absolute bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto border-t-4 border-t-green-500">
              {exerciciosFiltrados.map(ex => (
                <button key={ex} onClick={() => { setNovaMensagem(`/${ex.replace(/\s+/g, '_')} `); setShowComandos(false); }} className="w-full text-left px-4 py-3 text-[9px] font-bold border-b border-zinc-800 hover:bg-green-500 hover:text-black uppercase transition-colors">
                  / {ex}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={enviarMensagem} className="p-4 bg-black border-t border-zinc-900 flex gap-2">
            <input value={novaMensagem} onChange={(e) => handleInputChange(e.target.value)} placeholder="COMANDOS: /PESO, /SUPINO..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 outline-none focus:border-green-500 text-[10px] font-black uppercase" />
            <button className="bg-green-500 text-black px-6 rounded-2xl font-black text-xs active:scale-95 transition-transform">➤</button>
          </form>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
          <div className="grid grid-cols-3 gap-2 text-left">
            <div className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800">
              <p className="text-[6px] text-zinc-600 font-black uppercase">Volume</p>
              <p className="text-xs font-black text-green-500">{getVolumeTotal()}KG</p>
            </div>
            <div className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800">
              <p className="text-[6px] text-zinc-600 font-black uppercase">Peso</p>
              <p className="text-xs font-black text-white">{localStorage.getItem("meu_peso") || "--"}KG</p>
            </div>
            <div className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800">
              <p className="text-[6px] text-zinc-600 font-black uppercase">Meta</p>
              <p className="text-xs font-black text-blue-400">{localStorage.getItem("meta_peso") || "--"}KG</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest border-l-2 border-green-500 pl-2 text-left">Recordes Pessoais (PR)</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {Object.entries(getRecordes()).map(([ex, peso]) => (
                <div key={ex} className="min-w-[120px] bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-left">
                  <p className="text-[8px] font-black uppercase text-zinc-400 truncate">{ex}</p>
                  <p className="text-lg font-black italic text-white">{peso}KG</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pb-20">
            <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest border-l-2 border-zinc-800 pl-2 text-left">Log Recente</h3>
            {registros.map((reg) => (
              <div key={reg.id} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center text-left">
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-100">{reg.exercicio}</p>
                  <p className="text-[7px] text-zinc-600 font-bold uppercase">{new Date(reg.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-green-500 font-black text-xl italic">{reg.peso}KG</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}