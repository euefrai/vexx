"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useGamificacao } from "@/hooks/useGamificacao"

export default function TreinoCard({ treino }) {
  const router = useRouter()
  const { adicionarXP } = useGamificacao()
  
  const [likes, setLikes] = useState(0)
  const [jaCurtiu, setJaCurtiu] = useState(false)
  const [loadingLike, setLoadingLike] = useState(false)

  const [comentarios, setComentarios] = useState([])
  const [novoComentario, setNovoComentario] = useState("")
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [mostrarComentarios, setMostrarComentarios] = useState(false)

  const autor = treino.usuarios

  useEffect(() => {
    carregarLikes()
    carregarComentarios()
  }, [treino.id])

  async function carregarLikes() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { count, error } = await supabase
        .from("likes")
        .select("*", { count: 'exact', head: true })
        .eq("treino_id", treino.id)

      if (error) throw error
      setLikes(count || 0)

      if (user) {
        const { data: curtidaExistente } = await supabase
          .from("likes")
          .select("*")
          .eq("treino_id", treino.id)
          .eq("user_id", user.id) 
          .maybeSingle()

        if (curtidaExistente) setJaCurtiu(true)
      }
    } catch (error) {
      console.error("Erro ao carregar likes:", error)
    }
  }

  async function compartilharTreino() {
    const textoCompartilhar = `🔥 Saca só esse treino de ${treino.grupo.toUpperCase()} que vi no ELITE SQUAD!\n\n💪 ${treino.titulo}\n\n${treino.descricao}\n\nBora treinar? ⚡`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Treino: ${treino.titulo}`,
          text: textoCompartilhar,
          url: window.location.href 
        })
      } catch (err) {
        console.error("Erro ao compartilhar:", err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(textoCompartilhar)
        alert("Texto do treino copiado! 🚀")
      } catch (err) {
        alert("Ops, não consegui compartilhar.")
      }
    }
  }

  async function handleLike() {
    if (loadingLike) return
    try {
      setLoadingLike(true)
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return router.push("/login")

      if (jaCurtiu) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("treino_id", treino.id)

        if (error) throw error
        setJaCurtiu(false)
        setLikes(prev => Math.max(0, prev - 1))
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ 
            treino_id: treino.id, 
            user_id: currentUser.id 
          })

        if (error && error.code !== '23505') throw error
        
        setJaCurtiu(true)
        setLikes(prev => prev + 1)

        if (treino.usuario_id !== currentUser.id) {
          await adicionarXP(treino.usuario_id, 10)
        }
      }
    } catch (error) {
      console.error("Erro na ação de curtir:", error)
    } finally {
      setLoadingLike(false)
    }
  }

  async function carregarComentarios() {
    try {
      const { data, error } = await supabase
        .from("comentarios")
        .select("*, usuarios(username, foto)")
        .eq("treino_id", treino.id)
        .order("created_at", { ascending: true })

      if (error) throw error
      setComentarios(data || [])
    } catch (error) {
      console.error("Erro ao carregar comentários:", error)
    }
  }

  async function enviarComentario() {
    if (!novoComentario.trim() || enviandoComentario) return
    try {
      setEnviandoComentario(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")

      const { error } = await supabase
        .from("comentarios")
        .insert({
          treino_id: treino.id,
          usuario_id: user.id,
          texto: novoComentario
        })

      if (error) throw error
      setNovoComentario("")
      carregarComentarios()
      await adicionarXP(user.id, 5)
    } catch (error) {
      alert("Erro ao comentar: " + error.message)
    } finally {
      setEnviandoComentario(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900/50 backdrop-blur-sm rounded-[2.5rem] border border-zinc-800 p-6 shadow-xl mb-6 relative overflow-hidden"
    >
      {/* HEADER DO CARD */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-green-500/20 p-0.5 bg-black">
            <img src={autor?.foto || "https://via.placeholder.com/150"} className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white uppercase tracking-tighter leading-none italic">
              {autor?.username || "Guerreiro"}
            </span>
            <span className="text-[9px] text-green-500 font-black uppercase tracking-widest mt-0.5">{treino.grupo}</span>
          </div>
        </div>
        
        <div className="flex gap-1.5">
            <button 
              onClick={compartilharTreino}
              className="bg-zinc-800/50 text-zinc-400 w-9 h-9 flex items-center justify-center rounded-xl text-xs transition-all active:scale-90 hover:text-green-500"
            >
              📤
            </button>
            <button 
              onClick={() => setMostrarComentarios(!mostrarComentarios)} 
              className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all active:scale-90 flex items-center gap-2 ${mostrarComentarios ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}
            >
              💬 {comentarios.length}
            </button>
            <button 
              onClick={handleLike} 
              disabled={loadingLike} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all active:scale-90 border ${jaCurtiu ? "bg-red-500/5 text-red-500 border-red-500/20" : "bg-zinc-800/50 text-zinc-500 border-transparent"}`}
            >
              <span className="text-xs">{jaCurtiu ? "❤️" : "🤍"}</span>
              <span className="text-[10px] font-black">{likes}</span>
            </button>
        </div>
      </div>

      {/* TÍTULO E DESCRIÇÃO FORMATADA */}
      <h2 className="text-2xl font-black italic uppercase text-white mb-4 tracking-tighter leading-none">{treino.titulo}</h2>
      
      <div className="bg-black/40 rounded-[1.5rem] p-5 mb-4 border border-zinc-800/30">
        <div className="space-y-4">
          {treino.descricao?.split(/[\n,;]+/).map((ex, i) => (
            ex.trim() && (
              <div key={i} className="flex items-start gap-3 group">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] shrink-0 group-hover:scale-125 transition-transform" />
                <p className="text-[13px] text-zinc-300 font-bold leading-tight uppercase tracking-tight">{ex.trim()}</p>
              </div>
            )
          ))}
        </div>
      </div>

      {/* SEÇÃO DE COMENTÁRIOS */}
      {mostrarComentarios && (
        <div className="mt-6 pt-6 border-t border-zinc-800/50 space-y-4">
          <div className="max-h-52 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {comentarios.map((c) => (
              <div key={c.id} className="flex gap-3 items-start">
                <img src={c.usuarios?.foto || "https://via.placeholder.com/150"} className="w-7 h-7 rounded-full object-cover border border-zinc-800" />
                <div className="bg-zinc-800/30 p-3 rounded-2xl flex-1 border border-zinc-800/20">
                  <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">@{c.usuarios?.username}</p>
                  <p className="text-xs text-zinc-300 leading-normal">{c.texto}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <input  
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="ESCREVER RESPOSTA..."
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-bold outline-none focus:border-green-500/50 text-white placeholder:text-zinc-700 uppercase"
            />
            <button 
              onClick={enviarComentario}
              disabled={enviandoComentario}
              className="bg-green-500 text-black px-5 rounded-xl text-[10px] font-black uppercase italic active:scale-95 disabled:opacity-50"
            >
              {enviandoComentario ? "..." : "ENVIAR"}
            </button>
          </div>
        </div>
      )}

      {/* FOOTER DO CARD */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800/30">
          <span className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.2em]">OPERACIONAL // {autor?.username}</span>
          <div className="flex gap-1">
             <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
             <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
             <span className="w-1 h-1 bg-green-500 rounded-full"></span>
          </div>
      </div>
    </motion.div>
  )
}