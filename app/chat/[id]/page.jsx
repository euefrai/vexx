"use client"
import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"

const ChatPrivado = () => {
  const params = useParams()
  const destinatarioId = params?.id
  const router = useRouter()
  
  const [mensagens, setMensagens] = useState([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [meuId, setMeuId] = useState(null)
  const [outroUsuario, setOutroUsuario] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (destinatarioId) {
      iniciarChat()
    }
  }, [destinatarioId])

  useEffect(() => {
    if (!meuId || !destinatarioId) return

    const canal = supabase
      .channel(`chat_room_${destinatarioId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensagens' 
      }, (payload) => {
        const msg = payload.new
        const pertenceAConversa = 
          (String(msg.remetente_id).toLowerCase() === String(meuId).toLowerCase() && String(msg.destinatario_id).toLowerCase() === String(destinatarioId).toLowerCase()) ||
          (String(msg.remetente_id).toLowerCase() === String(destinatarioId).toLowerCase() && String(msg.destinatario_id).toLowerCase() === String(meuId).toLowerCase())

        if (pertenceAConversa) {
          setMensagens(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [meuId, destinatarioId])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  async function iniciarChat() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push("/login")
    setMeuId(user.id)

    const { data: userD } = await supabase
      .from("usuarios")
      .select("username, foto")
      .eq("id", destinatarioId)
      .single()
    
    if (userD) setOutroUsuario(userD)

    const { data } = await supabase
      .from("mensagens")
      .select("*")
      .or(`and(remetente_id.eq.${user.id},destinatario_id.eq.${destinatarioId}),and(remetente_id.eq.${destinatarioId},destinatario_id.eq.${user.id})`)
      .order("created_at", { ascending: true })

    setMensagens(data || [])
  }

  async function enviarMensagem(e) {
    e.preventDefault()
    if (!novaMensagem.trim() || !meuId) return

    const textoParaEnviar = novaMensagem
    setNovaMensagem("")

    const { error } = await supabase
      .from("mensagens")
      .insert({
        texto: textoParaEnviar,
        remetente_id: meuId,
        destinatario_id: destinatarioId
      })

    if (error) console.error("Erro ao enviar:", error.message)
  }

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans text-white">
      <div className="w-full max-w-md flex flex-col h-screen bg-zinc-950 border-x border-zinc-900 shadow-2xl">
        
        {/* HEADER ATUALIZADO COM BOTÃO VOLTAR */}
        <header className="p-4 border-b border-zinc-900 flex items-center gap-4 bg-black/80 backdrop-blur-md sticky top-0 z-10">
          <button 
            onClick={() => router.push("/mensagens")} // Ajuste aqui para a sua rota de lista
            className="group flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-green-500 hover:border-green-500/50 transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-green-500/30 overflow-hidden bg-zinc-900 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
              <img src={outroUsuario?.foto || "https://via.placeholder.com/150"} className="w-full h-full object-cover" alt="Perfil" />
            </div>
            <div>
              <h1 className="font-black uppercase italic text-green-500 text-[10px] tracking-tighter leading-none">
                {outroUsuario?.username || "OPERADOR"}
              </h1>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">Canal Ativo</span>
              </div>
            </div>
          </div>
        </header>

        {/* MENSAGENS */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-black/20">
          {mensagens.map((msg, index) => {
            const souEu = String(msg.remetente_id).toLowerCase() === String(meuId).toLowerCase();

            return (
              <div 
                key={msg.id || index} 
                className={`flex w-full ${souEu ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] font-bold tracking-tight break-words relative ${
                    souEu 
                    ? "bg-green-500 text-black rounded-tr-none shadow-[0_2px_8px_rgba(34,197,94,0.15)]" 
                    : "bg-zinc-900 text-white rounded-tl-none border border-zinc-800"
                  }`}
                >
                  {msg.texto}
                  <div className={`text-[6px] leading-none mt-1 font-black uppercase opacity-30 ${souEu ? "text-black text-right" : "text-zinc-500 text-left"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </main>

        {/* INPUT AREA */}
        <footer className="p-4 bg-black border-t border-zinc-900">
          <form onSubmit={enviarMensagem} className="flex gap-2">
            <input 
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="ENVIAR MENSAGEM..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-green-500 text-[10px] text-white uppercase font-black placeholder:text-zinc-700 transition-all"
            />
            <button type="submit" className="bg-green-500 text-black px-5 rounded-xl font-black text-[10px] hover:bg-green-400 transition-all active:scale-95">
              OK
            </button>
          </form>
        </footer>
      </div>
    </div>
  )
}

export default ChatPrivado  