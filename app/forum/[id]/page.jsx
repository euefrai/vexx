"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function TopicoDetalhes() {
  const params = useParams()
  const router = useRouter()
  const topicoId = params?.id
  
  const [topico, setTopico] = useState(null)
  const [respostas, setRespostas] = useState([])
  const [novaResposta, setNovaResposta] = useState("")
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (topicoId) {
      buscarDados()
    }
  }, [topicoId])

  async function buscarDados() {
    try {
      setLoading(true)
      const { data: topicoData } = await supabase
        .from("forum_topicos")
        .select("*, usuarios:usuario_id(username, foto)")
        .eq("id", topicoId)
        .maybeSingle()
      
      setTopico(topicoData)

      const { data: respostasData, error: errRes } = await supabase
        .from("forum_respostas")
        .select("*") 
        .eq("topico_id", topicoId)
        .order("created_at", { ascending: true })

      if (errRes) throw errRes

      if (respostasData && respostasData.length > 0) {
        const idsUsuarios = [...new Set(respostasData.map(r => r.usuario_id))]
        const { data: usuariosData } = await supabase
          .from("usuarios")
          .select("id, username, foto")
          .in("id", idsUsuarios)

        const formatadas = respostasData.map(res => ({
          ...res,
          usuarios: usuariosData?.find(u => u.id === res.usuario_id) || { username: "operador", foto: null }
        }))

        setRespostas(formatadas)
      } else {
        setRespostas([])
      }
      
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 500)
    } catch (error) {
      console.error("Erro tático na busca:", error)
    } finally {
      setLoading(false)
    }
  }

  const focarNoInput = () => {
    inputRef.current?.focus()
  }

  async function enviarResposta(e) {
    e.preventDefault()
    if (!novaResposta.trim() || enviando) return

    setEnviando(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert("ACESSO NEGADO. FAÇA LOGIN.")
      return router.push("/login")
    }

    const { error } = await supabase
      .from("forum_respostas")
      .insert({
        texto: novaResposta,
        topico_id: topicoId,
        usuario_id: user.id
      })

    if (!error) {
      setNovaResposta("")
      await buscarDados() 
    } else {
      console.error("Erro ao enviar:", error.message)
    }
    setEnviando(false)
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black uppercase text-[10px] animate-pulse">CARREGANDO BRIEFING...</div>

  return (
    <div className="min-h-screen bg-black text-white font-sans relative">
      <div className="max-w-md mx-auto p-4 pb-48"> {/* PB aumentado para não cobrir as mensagens */}
        
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-zinc-600 hover:text-green-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          <span className="text-[10px] font-black uppercase tracking-widest">VOLTAR AO CENTRO</span>
        </button>

        {/* PERGUNTA PRINCIPAL */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] mb-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={(Array.isArray(topico?.usuarios) ? topico.usuarios[0] : topico?.usuarios)?.foto || "https://via.placeholder.com/150"} 
              className="w-8 h-8 rounded-full border border-green-500/50 object-cover" 
              alt="" 
            />
            <div>
              <p className="text-[10px] font-black text-green-500 uppercase italic">
                @{ (Array.isArray(topico?.usuarios) ? topico.usuarios[0] : topico?.usuarios)?.username || "operador"}
              </p>
              <p className="text-[7px] text-zinc-600 font-bold uppercase">{topico?.created_at && new Date(topico.created_at).toLocaleString()}</p>
            </div>
          </div>
          <h1 className="text-xl font-black italic uppercase leading-tight text-white mb-2">
            {topico?.titulo}
          </h1>
          
          <button 
            onClick={focarNoInput}
            className="inline-block px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full active:scale-90 transition-transform cursor-pointer"
          >
             <span className="text-[7px] font-black text-green-500 uppercase tracking-widest italic">Dúvida de Campo • Responder</span>
          </button>
        </div>

        <h2 className="text-[10px] font-black uppercase text-zinc-600 mb-6 tracking-widest ml-1 text-center italic">
          --- {respostas.length} RESPOSTAS TÁTICAS ---
        </h2>

        {/* LISTA DE RESPOSTAS */}
        <div className="space-y-4">
          {respostas.length > 0 ? (
            respostas.map((res) => (
              <div key={res.id} className="bg-zinc-950 border border-zinc-900 p-5 rounded-[1.5rem] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <img 
                    src={res.usuarios?.foto || "https://via.placeholder.com/150"} 
                    className="w-5 h-5 rounded-full object-cover grayscale" 
                    alt="" 
                  />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">
                    @{res.usuarios?.username || "operador"}
                  </span>
                </div>
                <p className="text-sm font-bold text-zinc-300 leading-relaxed italic">
                  "{res.texto}"
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-10 opacity-20">
               <p className="text-[8px] font-black uppercase tracking-[0.3em]">Aguardando Suporte Tático...</p>
            </div>
          )}
          <div ref={scrollRef} className="h-20" />
        </div>

        {/* CAMPO FIXO - SUBI PARA 85PX PARA FICAR BEM VISÍVEL ACIMA DA NAVBAR */}
        <div className="fixed bottom-[85px] left-0 right-0 p-4 bg-black/80 backdrop-blur-md border-t border-zinc-900/50 max-w-md mx-auto z-[60]">
          <form onSubmit={enviarResposta} className="flex gap-2">
            <input 
              ref={inputRef}
              value={novaResposta}
              onChange={(e) => setNovaResposta(e.target.value)}
              placeholder="ENVIE SEU SUPORTE TÁTICO..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-[11px] font-black uppercase outline-none focus:border-green-500 transition-all placeholder:text-zinc-700 text-white"
            />
            <button 
              type="submit" 
              disabled={enviando}
              className="bg-green-500 text-black px-5 rounded-2xl font-black text-[10px] uppercase italic active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              OK
            </button>
          </form>
        </div>

      </div>
      <Navbar />
    </div>
  )
}