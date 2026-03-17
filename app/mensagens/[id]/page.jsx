"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"

export default function ChatPrivado() {
  const { id: destinatarioId } = useParams()
  const router = useRouter()
  const [mensagens, setMensagens] = useState([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [meuId, setMeuId] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    iniciarChat()

    // ESCUTA EM TEMPO REAL
    const canal = supabase
      .channel('chat_privado')
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
  }, [meuId])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  async function iniciarChat() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push("/login")
    setMeuId(user.id)

    // Carregar histórico
    const { data } = await supabase
      .from("mensagens")
      .select("*")
      .or(`and(remetente_id.eq.${user.id},destinatario_id.eq.${destinatarioId}),and(remetente_id.eq.${destinatarioId},destinatario_id.eq.${user.id})`)
      .order("created_at", { ascending: true })

    setMensagens(data || [])
  }

  async function enviarMensagem(e) {
    e.preventDefault()
    if (!novaMensagem.trim()) return

    const msgParaEnviar = novaMensagem
    setNovaMensagem("") // Limpa o input rápido

    const { error } = await supabase
      .from("mensagens")
      .insert({
        texto: msgParaEnviar,
        remetente_id: meuId,
        destinatario_id: destinatarioId
      })

    if (error) console.error("Erro ao enviar:", error)
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* HEADER */}
      <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-zinc-500">←</button>
        <h1 className="font-black uppercase italic text-green-500 tracking-tighter text-lg">Chat Elite</h1>
      </div>

      {/* MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.map((msg, index) => (
          <div key={index} className={`flex ${msg.remetente_id === meuId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium ${
              msg.remetente_id === meuId 
              ? "bg-green-500 text-black rounded-tr-none" 
              : "bg-zinc-900 text-white rounded-tl-none border border-zinc-800"
            }`}>
              {msg.texto}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={enviarMensagem} className="p-4 bg-zinc-950 border-t border-zinc-800 flex gap-2">
        <input 
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 outline-none focus:border-green-500 text-sm"
        />
        <button className="bg-green-500 text-black p-4 rounded-2xl font-black">
          ➤
        </button>
      </form>
    </div>
  )
}