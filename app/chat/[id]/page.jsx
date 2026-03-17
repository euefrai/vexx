"use client"
import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"

const ChatPrivado = () => {
  const params = useParams()
  const destinatarioId = params?.id
  const router = useRouter()
  
  // Estados de Interface e Abas
  const [abaAtiva, setAbaAtiva] = useState("chat")
  const [showComandos, setShowComandos] = useState(false)
  const [registros, setRegistros] = useState([])
  const [filtroComando, setFiltroComando] = useState("")
  
  // Estados do Chat
  const [mensagens, setMensagens] = useState([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [meuId, setMeuId] = useState(null)
  const [outroUsuario, setOutroUsuario] = useState(null)
  const [estaDigitando, setEstaDigitando] = useState(false)
  
  const scrollRef = useRef(null)
  const somEnviado = useRef(null)
  const somRecebido = useRef(null)

  // SUPER LISTA DE EXERCÍCIOS (TÁTICA DE ELITE)
  const listaExercicios = [
    // PEITO
    "Supino Reto", "Supino Inclinado", "Supino Declinado", "Crucifixo Reto", "Crucifixo Inclinado", "Voador", "Crossover", "Flexão de Braços", "Supino Máquina",
    // COSTAS
    "Pulldown", "Remada Curvada", "Remada Cavalinho", "Remada Baixa", "Remada Unilateral", "Puxada Aberta", "Puxada Triângulo", "Levantamento Terra", "Barra Fixa", "Lombar", "Crucifixo Inverso",
    // PERNAS
    "Agachamento Livre", "Agachamento Maquina", "Leg Press 45", "Leg Press Horizontal", "Cadeira Extensora", "Mesa Flexora", "Cadeira Flexora", "Cadeira Abdutora", "Cadeira Adutora", "Afundo", "Passada", "Stiff", "Elevação Pélvica", "Hack Squat", "Panturrilha Sentado", "Panturrilha em Pé",
    // OMBROS
    "Desenvolvimento Halter", "Desenvolvimento Barra", "Elevação Lateral", "Elevação Frontal", "Desenvolvimento Arnold", "Encolhimento", "Face Pull",
    // BRAÇOS (BÍCEPS/TRÍCEPS)
    "Rosca Direta", "Rosca Alternada", "Rosca Scott", "Rosca Concentrada", "Rosca Martelo", "Triceps Testa", "Triceps Frances", "Triceps Pulley", "Triceps Corda", "Triceps Coice", "Mergulho Paralelas", "Supino Fechado",
    // ABDÔMEN
    "Abdominal Supra", "Abdominal Infra", "Prancha", "Abdominal Roda"
  ].sort() // Organiza em ordem alfabética para facilitar a leitura

  // 1. Inicialização
  useEffect(() => {
    somEnviado.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3")
    somRecebido.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3")
    if(somEnviado.current) somEnviado.current.volume = 0.4
    if(somRecebido.current) somRecebido.current.volume = 0.5
    if ("Notification" in window) Notification.requestPermission()
    if (destinatarioId) iniciarChat()
    buscarRegistros()
  }, [destinatarioId])

  // 2. Notificações Motivacionais
  useEffect(() => {
    const frases = [
      "HORA DO COMBATE, PAUL! O FERRO NÃO SE LEVANTA SOZINHO.",
      "MISSÃO DADA É MISSÃO CUMPRIDA. BORA PRO TREINO!",
      "NÃO SEJA MEDÍOCRE. O OPERADOR ELITE ESTÁ EM CAMPO.",
      "A DOR É O RESULTADO DA SUA EVOLUÇÃO!"
    ]
    const timer = setInterval(() => {
      if (Notification.permission === "granted" && document.hidden) {
        new Notification("COMANDO CENTRAL", { body: frases[Math.floor(Math.random() * frases.length)], icon: "/logo.png" })
      }
    }, 1000 * 60 * 60 * 2) 
    return () => clearInterval(timer)
  }, [])

  // 3. Realtime
  useEffect(() => {
    if (!meuId || !destinatarioId) return
    const canal = supabase.channel(`chat_room_${destinatarioId}`)
    canal
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        const msg = payload.new
        const pertenceAConversa = 
          (String(msg.remetente_id) === String(meuId) && String(msg.destinatario_id) === String(destinatarioId)) ||
          (String(msg.remetente_id) === String(destinatarioId) && String(msg.destinatario_id) === String(meuId))

        if (pertenceAConversa) {
          setMensagens(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            if (String(msg.remetente_id) !== String(meuId)) {
              somRecebido.current?.play().catch(() => {})
              if (Notification.permission === "granted" && document.hidden) {
                new Notification(`OPERADOR: ${outroUsuario?.username || "SISTEMA"}`, { body: msg.texto })
              }
            }
            return [...prev, msg]
          })
        }
      })
      .on('broadcast', { event: 'digitando' }, (payload) => {
        if (String(payload.payload.userId) === String(destinatarioId)) setEstaDigitando(payload.payload.isTyping)
      })
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [meuId, destinatarioId, outroUsuario])

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }) }, [mensagens, estaDigitando])

  async function iniciarChat() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push("/login")
    setMeuId(user.id)
    const { data: userD } = await supabase.from("usuarios").select("username, foto").eq("id", destinatarioId).single()
    if (userD) setOutroUsuario(userD)
    const { data } = await supabase.from("mensagens").select("*")
      .or(`and(remetente_id.eq.${user.id},destinatario_id.eq.${destinatarioId}),and(remetente_id.eq.${destinatarioId},destinatario_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
    setMensagens(data || [])
  }

  async function buscarRegistros() {
    const { data } = await supabase.from("registros_treino").select("*").order("created_at", { ascending: false })
    setRegistros(data || [])
  }

  const avisarDigitando = (valor) => {
    const canal = supabase.channel(`chat_room_${destinatarioId}`)
    canal.send({ type: 'broadcast', event: 'digitando', payload: { userId: meuId, isTyping: valor.length > 0 } })
  }

  const handleInputChange = (val) => {
    setNovaMensagem(val)
    avisarDigitando(val)
    if (val.startsWith("/")) {
      setShowComandos(true)
      const termo = val.slice(1).split(" ")[0] 
      setFiltroComando(termo.toLowerCase())
    } else {
      setShowComandos(false)
    }
  }

  const selecionarExercicio = (ex) => {
    setNovaMensagem(`/${ex.replace(/\s+/g, '_')} `)
    setShowComandos(false)
    document.getElementById("chat-input").focus()
  }

  async function enviarMensagem(e) {
    e.preventDefault()
    if (!novaMensagem.trim() || !meuId) return

    if (novaMensagem.startsWith("/")) {
      const partes = novaMensagem.trim().split(" ")
      if (partes.length >= 2) {
        const exercicio = partes[0].replace("/", "").replace(/_/g, " ")
        const peso = parseFloat(partes[1])
        if (!isNaN(peso)) {
          await supabase.from("registros_treino").insert({ usuario_id: meuId, exercicio, peso })
          buscarRegistros()
          setNovaMensagem("")
          return
        }
      }
    }

    const texto = novaMensagem
    setNovaMensagem("")
    somEnviado.current?.play().catch(() => {})
    await supabase.from("mensagens").insert({ texto, remetente_id: meuId, destinatario_id: destinatarioId })
  }

  const exerciciosFiltrados = listaExercicios.filter(ex => 
    ex.toLowerCase().includes(filtroComando)
  )

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans text-white">
      <div className="w-full max-w-md flex flex-col h-screen bg-zinc-950 border-x border-zinc-900 shadow-2xl relative">
        
        {/* ABAS */}
        <div className="flex bg-black border-b border-zinc-900 z-20">
          {["chat", "treino"].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[2px] transition-all ${abaAtiva === aba ? "text-green-500 border-b-2 border-green-500 bg-green-500/5" : "text-zinc-600"}`}>
              {aba === "chat" ? "COMUNICAÇÃO TÁTICA" : "EVOLUÇÃO DE CARGA"}
            </button>
          ))}
        </div>

        {/* HEADER */}
        <header className="p-4 border-b border-zinc-900 flex items-center gap-4 bg-black/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => router.push("/mensagens")} className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-green-500/30 overflow-hidden bg-zinc-900">
                <img src={outroUsuario?.foto || "https://via.placeholder.com/150"} className="w-full h-full object-cover" alt="Perfil" />
            </div>
            <div>
              <h1 className="font-black uppercase italic text-green-500 text-[10px] leading-none">{abaAtiva === "chat" ? (outroUsuario?.username || "OPERADOR") : "CENTRAL DE CARGAS"}</h1>
              <div className="flex items-center gap-1">
                <span className={`w-1 h-1 rounded-full ${estaDigitando ? 'bg-white animate-pulse' : 'bg-green-500'}`}></span>
                <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">{estaDigitando ? "RECEBENDO DADOS..." : "SISTEMA ONLINE"}</span>
              </div>
            </div>
          </div>
        </header>

        {abaAtiva === "chat" ? (
          <>
            <main className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-black/20">
              {mensagens.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${String(msg.remetente_id) === String(meuId) ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] font-bold ${String(msg.remetente_id) === String(meuId) ? "bg-green-500 text-black rounded-tr-none" : "bg-zinc-900 text-white rounded-tl-none border border-zinc-800"}`}>
                    {msg.texto}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </main>

            {/* MENU COMANDOS */}
            {showComandos && exerciciosFiltrados.length > 0 && (
              <div className="absolute bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50 max-h-60 overflow-y-auto no-scrollbar">
                {exerciciosFiltrados.map(ex => (
                  <button key={ex} onClick={() => selecionarExercicio(ex)} className="w-full text-left px-4 py-3 text-[10px] font-bold border-b border-zinc-800 hover:bg-green-500 hover:text-black transition-colors uppercase">
                    / {ex}
                  </button>
                ))}
              </div>
            )}

            <footer className="p-4 bg-black border-t border-zinc-900">
              <form onSubmit={enviarMensagem} className="flex gap-2">
                <input id="chat-input" value={novaMensagem} onChange={(e) => handleInputChange(e.target.value)} placeholder="USE '/' PARA COMANDOS..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-green-500 transition-all" />
                <button type="submit" className="bg-green-500 text-black px-5 rounded-xl font-black text-[10px]">OK</button>
              </form>
            </footer>
          </>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-black">
             <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
               <h2 className="text-green-500 font-black italic uppercase text-sm">LOG DE PERFORMANCE</h2>
               <span className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">Total: {registros.length}</span>
             </div>
             <div className="space-y-3">
               {registros.map(reg => (
                 <div key={reg.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-black uppercase text-white tracking-wider">{reg.exercicio}</div>
                      <div className="text-[7px] text-zinc-600 font-bold uppercase mt-1">{new Date(reg.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-green-500 font-black text-2xl tracking-tighter">{reg.peso}</span>
                      <span className="text-green-500/50 font-black text-[10px]">KG</span>
                    </div>
                 </div>
               ))}
             </div>
          </main>
        )}
      </div>
    </div>
  )
}

export default ChatPrivado