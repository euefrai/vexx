"use client"
import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"

const ChatPrivado = () => {
  const params = useParams()
  const destinatarioId = params?.id
  const router = useRouter()
  
  // Estados de Interface
  const [abaAtiva, setAbaAtiva] = useState("chat")
  const [showComandos, setShowComandos] = useState(false)
  const [registros, setRegistros] = useState([])
  const [filtroComando, setFiltroComando] = useState("")
  const [exercicioExpandido, setExercicioExpandido] = useState(null)
  
  // Estados do Chat
  const [mensagens, setMensagens] = useState([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [meuId, setMeuId] = useState(null)
  const [outroUsuario, setOutroUsuario] = useState(null)
  const [estaDigitando, setEstaDigitando] = useState(false)
  
  const scrollRef = useRef(null)
  const somEnviado = useRef(null)
  const somRecebido = useRef(null)

  const listaExercicios = [
    "Supino Reto", "Supino Inclinado", "Supino Declinado", "Crucifixo Reto", "Voador", "Crossover", "Flexão de Braços",
    "Pulldown", "Remada Curvada", "Remada Baixa", "Remada Unilateral", "Puxada Aberta", "Levantamento Terra", "Barra Fixa",
    "Agachamento Livre", "Agachamento Maquina", "Leg Press 45", "Cadeira Extensora", "Mesa Flexora", "Cadeira Flexora",
    "Stiff", "Elevação Pélvica", "Panturrilha Sentado", "Desenvolvimento Halter", "Elevação Lateral", "Face Pull",
    "Rosca Direta", "Rosca Alternada", "Rosca Scott", "Triceps Testa", "Triceps Pulley", "Triceps Corda", "Abdominal Supra"
  ].sort()

  // --- FUNÇÕES DE INTELIGÊNCIA ---

  const calcularStreak = () => {
    if (registros.length === 0) return 0
    const datas = [...new Set(registros.map(r => new Date(r.created_at).toDateString()))]
    let streak = 0
    let hoje = new Date()
    for (let i = 0; i < datas.length; i++) {
      const dataTreino = new Date(datas[i])
      const diff = Math.floor((hoje - dataTreino) / (1000 * 60 * 60 * 24))
      if (diff === streak) streak++ 
      else break
    }
    return streak
  }

  // --- EFEITOS ---

  useEffect(() => {
    somEnviado.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3")
    somRecebido.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3")
    if (destinatarioId) iniciarChat()
    buscarRegistros()
  }, [destinatarioId])

  useEffect(() => {
    if (!meuId || !destinatarioId) return
    const canal = supabase.channel(`chat_room_${destinatarioId}`)
    canal
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        const msg = payload.new
        if (String(msg.destinatario_id) === String(meuId)) {
            somRecebido.current?.play().catch(() => {})
        }
        setMensagens(prev => [...prev.filter(m => m.id !== msg.id), msg])
      })
      .on('broadcast', { event: 'digitando' }, (p) => {
        if (String(p.payload.userId) === String(destinatarioId)) setEstaDigitando(p.payload.isTyping)
      })
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [meuId, destinatarioId])

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

  const handleInputChange = (val) => {
    setNovaMensagem(val)
    const canal = supabase.channel(`chat_room_${destinatarioId}`)
    canal.send({ type: 'broadcast', event: 'digitando', payload: { userId: meuId, isTyping: val.length > 0 } })
    if (val.startsWith("/")) {
      setShowComandos(true)
      setFiltroComando(val.slice(1).split(" ")[0].toLowerCase())
    } else setShowComandos(false)
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
      const comando = partes[0].toLowerCase()

      if (comando === "/setpeso" && partes[1]) {
        const p = parseFloat(partes[1])
        localStorage.setItem("meu_peso", p)
        alert(`CORPO ATUALIZADO: ${p}KG`)
        setNovaMensagem("")
        return
      }

      if (comando === "/imc" && partes[1]) {
        const alt = parseFloat(partes[1])
        const pCorpo = parseFloat(localStorage.getItem("meu_peso"))
        if (!pCorpo) alert("USE /setpeso PRIMEIRO")
        else alert(`IMC: ${(pCorpo / (alt * alt)).toFixed(1)}`)
        setNovaMensagem("")
        return
      }

      const exercicio = partes[0].replace("/", "").replace(/_/g, " ")
      const pesoNovo = parseFloat(partes[1])
      
      if (!isNaN(pesoNovo) && listaExercicios.includes(exercicio)) {
        // --- NOVO: Lógica de Bloqueio de Duplicata ---
        const todosDesteExercicio = registros.filter(r => r.exercicio === exercicio)
        const ultimoRegistro = todosDesteExercicio[0] // O primeiro do array (pois está ordenado por created_at: false)
        const maiorCargaHistorica = Math.max(...todosDesteExercicio.map(r => r.peso), 0)

        if (ultimoRegistro && ultimoRegistro.peso === pesoNovo) {
          alert(`ERRO: CARGA DE ${pesoNovo}KG JÁ REGISTRADA COMO ÚLTIMA ENTRADA. FOQUE NA PROGRESSÃO!`)
          setNovaMensagem("")
          return
        }

        await supabase.from("registros_treino").insert({ usuario_id: meuId, exercicio, peso: pesoNovo })
        
        const meuPeso = parseFloat(localStorage.getItem("meu_peso"))
        const pct = meuPeso ? `(${((pesoNovo/meuPeso)*100).toFixed(0)}% do corpo)` : ""
        
        if (maiorCargaHistorica > 0 && pesoNovo > maiorCargaHistorica) {
          alert(`🔥 RECORDE EM ${exercicio.toUpperCase()}! ${pesoNovo}KG ${pct}`)
        } else {
          alert(`REGISTRADO: ${pesoNovo}KG ${pct}`)
        }

        buscarRegistros()
        setNovaMensagem("")
        return
      }
    }

    const texto = novaMensagem
    setNovaMensagem("")
    somEnviado.current?.play().catch(() => {})
    await supabase.from("mensagens").insert({ texto, remetente_id: meuId, destinatario_id: destinatarioId })
  }

  const exerciciosFiltrados = listaExercicios.filter(ex => ex.toLowerCase().includes(filtroComando))

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans text-white">
      <div className="w-full max-w-md flex flex-col h-screen bg-zinc-950 border-x border-zinc-900 relative">
        
        <div className="flex bg-black border-b border-zinc-900 z-20">
          {["chat", "treino"].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[2px] ${abaAtiva === aba ? "text-green-500 border-b-2 border-green-500" : "text-zinc-600"}`}>
              {aba === "chat" ? "COMUNICAÇÃO" : "PERFORMANCE"}
            </button>
          ))}
        </div>

        <header className="p-4 border-b border-zinc-900 flex items-center gap-4 bg-black/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => router.push("/mensagens")} className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-green-500/30 overflow-hidden bg-zinc-900">
                <img src={outroUsuario?.foto || "https://via.placeholder.com/150"} className="w-full h-full object-cover" alt="Perfil" />
            </div>
            <div>
              <h1 className="font-black uppercase italic text-green-500 text-[10px] leading-none">
                {abaAtiva === "chat" ? (outroUsuario?.username || "OPERADOR") : "LOG TÁTICO"}
                {calcularStreak() > 0 && <span className="ml-2 text-orange-500 animate-pulse">🔥 {calcularStreak()}</span>}
              </h1>
              <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">{estaDigitando ? "RECEBENDO DADOS..." : "SISTEMA ONLINE"}</span>
            </div>
          </div>
        </header>

        {abaAtiva === "chat" ? (
          <>
            <main className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {mensagens.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${String(msg.remetente_id) === String(meuId) ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] font-bold ${String(msg.remetente_id) === String(meuId) ? "bg-green-500 text-black rounded-tr-none" : "bg-zinc-900 text-white rounded-tl-none border border-zinc-800"}`}>
                    {msg.texto}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </main>

            {showComandos && exerciciosFiltrados.length > 0 && (
              <div className="absolute bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50 max-h-60 overflow-y-auto">
                {exerciciosFiltrados.map(ex => (
                  <button key={ex} onClick={() => selecionarExercicio(ex)} className="w-full text-left px-4 py-3 text-[10px] font-bold border-b border-zinc-800 hover:bg-green-500 hover:text-black transition-colors uppercase">
                    / {ex}
                  </button>
                ))}
              </div>
            )}

            <footer className="p-4 bg-black border-t border-zinc-900">
              <form onSubmit={enviarMensagem} className="flex gap-2">
                <input id="chat-input" value={novaMensagem} onChange={(e) => handleInputChange(e.target.value)} placeholder="COMANDOS: /EXERCICIO OU /SETPESO..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-green-500" />
                <button type="submit" className="bg-green-500 text-black px-5 rounded-xl font-black text-[10px]">OK</button>
              </form>
            </footer>
          </>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-black">
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
                  <p className="text-[7px] text-zinc-500 font-black uppercase">Peso Corporal</p>
                  <p className="text-sm font-black text-white">{typeof window !== 'undefined' ? localStorage.getItem("meu_peso") || "0" : "0"} KG</p>
                </div>
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
                  <p className="text-[7px] text-zinc-500 font-black uppercase">Frequência</p>
                  <p className="text-sm font-black text-orange-500">🔥 {calcularStreak()} DIAS</p>
                </div>
             </div>

             <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
               <h2 className="text-green-500 font-black italic uppercase text-sm">HISTÓRICO DE FORÇA</h2>
               <span className="text-zinc-600 text-[8px] font-bold">TOTAL: {registros.length}</span>
             </div>

             <div className="space-y-3">
               {registros.map((reg) => {
                 const isExpandido = exercicioExpandido === reg.id;
                 const historicoDesteExercicio = registros.filter(r => r.exercicio === reg.exercicio && r.id !== reg.id);

                 return (
                   <div key={reg.id} className="flex flex-col gap-1">
                     <button 
                       onClick={() => setExercicioExpandido(isExpandido ? null : reg.id)}
                       className={`w-full bg-zinc-900/50 border ${isExpandido ? 'border-green-500' : 'border-zinc-800'} p-4 rounded-xl flex justify-between items-center transition-all`}
                     >
                        <div className="text-left">
                          <div className="text-[10px] font-black uppercase text-white">{reg.exercicio}</div>
                          <div className="text-[7px] text-zinc-600 font-bold uppercase mt-1">
                            {new Date(reg.created_at).toLocaleDateString()} {isExpandido ? '• OCULTAR' : '• VER ANTERIORES'}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-green-500 font-black text-2xl tracking-tighter">{reg.peso}</span>
                          <span className="text-green-500/50 font-black text-[10px]">KG</span>
                        </div>
                     </button>

                     {isExpandido && (
                       <div className="mx-2 bg-zinc-950 border-x border-b border-zinc-800 rounded-b-xl overflow-hidden">
                         {historicoDesteExercicio.length > 0 ? (
                           historicoDesteExercicio.map(h => (
                             <div key={h.id} className="flex justify-between items-center px-4 py-2 border-t border-zinc-900">
                               <span className="text-[8px] font-bold text-zinc-500 uppercase">{new Date(h.created_at).toLocaleDateString()}</span>
                               <span className="text-[10px] font-black text-zinc-300">{h.peso} KG</span>
                             </div>
                           ))
                         ) : (
                           <div className="px-4 py-3 text-[8px] font-bold text-zinc-700 uppercase text-center">Nenhum registro anterior</div>
                         )}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
          </main>
        )}
      </div>
    </div>
  )
}

export default ChatPrivado