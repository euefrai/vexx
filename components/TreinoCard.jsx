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
          .eq("usuario_id", user.id) // CORRIGIDO: de user_id para usuario_id
          .maybeSingle()

        if (curtidaExistente) setJaCurtiu(true)
      }
    } catch (error) {
      console.error("Erro ao carregar likes:", error)
    }
  }

  async function compartilharTreino() {
    const textoCompartilhar = `🔥 Saca só esse treino de ${treino.grupo.toUpperCase()} que vi no VEXX!\n\n💪 ${treino.titulo}\n\n${treino.descricao}\n\nBora treinar? ⚡`

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
        alert("Texto do treino copiado! Agora é só colar onde quiser. 🚀")
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
          .eq("usuario_id", currentUser.id) // CORRIGIDO: usuario_id
          .eq("treino_id", treino.id)

        if (error) throw error
        setJaCurtiu(false)
        setLikes(prev => Math.max(0, prev - 1))
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ 
            treino_id: treino.id, 
            usuario_id: currentUser.id // CORRIGIDO: usuario_id
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
          usuario_id: user.id, // CORRIGIDO: de user_id para usuario_id
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-[2rem] border border-zinc-800 p-5 shadow-xl mb-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-black">
            <img src={autor?.foto || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white leading-none">{autor?.username || "Guerreiro"}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{treino.grupo}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
            <button 
              onClick={compartilharTreino}
              className="bg-zinc-800 text-zinc-400 p-2 rounded-full text-xs transition-colors hover:text-green-500"
            >
                📤
            </button>
            <button onClick={() => setMostrarComentarios(!mostrarComentarios)} className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-full text-xs font-black">
                💬 {comentarios.length}
            </button>
            <button onClick={handleLike} disabled={loadingLike} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-90 ${jaCurtiu ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-zinc-800 text-zinc-500 border-transparent"}`}>
                <span className="text-sm">{jaCurtiu ? "❤️" : "🤍"}</span>
                <span className="text-xs font-black">{likes}</span>
            </button>
        </div>
      </div>

      <h2 className="text-xl font-black italic uppercase text-green-500 mb-2">{treino.titulo}</h2>
      <div className="bg-black/50 rounded-2xl p-6 mb-4 border border-zinc-800/50">
        <div className="flex flex-col gap-4">
          {treino.descricao?.split(/[\n,;]+/).map((ex, i) => (
            ex.trim() && (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0" />
                <p className="text-sm text-zinc-300 font-medium leading-tight">{ex.trim()}</p>
              </div>
            )
          ))}
        </div>
      </div>

      {mostrarComentarios && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
          <div className="max-h-40 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {comentarios.map((c) => (
              <div key={c.id} className="flex gap-2 items-start">
                <img src={c.usuarios?.foto || "https://via.placeholder.com/150"} className="w-6 h-6 rounded-full object-cover" />
                <div className="bg-zinc-800/50 p-2 rounded-xl flex-1">
                  <p className="text-[10px] font-black text-green-500">@{c.usuarios?.username}</p>
                  <p className="text-xs text-zinc-300">{c.texto}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input  
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-green-500 text-white"
            />
            <button 
              onClick={enviarComentario}
              disabled={enviandoComentario}
              className="bg-green-500 text-black px-4 py-2 rounded-xl text-xs font-black uppercase italic active:scale-95"
            >
              {enviandoComentario ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-4">
          <span>Criado por {autor?.username}</span>
          <span className="text-green-900">#ELITESQUAD</span>
      </div>
    </motion.div>
  )
}