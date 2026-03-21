"use client"

import { motion, AnimatePresence } from "framer-motion"
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
  const [userId, setUserId] = useState(null)

  const autor = treino.usuarios

  useEffect(() => {
    const inicializar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        checkSeCurtiu(user.id)
      }
      carregarTotalLikes()
      carregarComentarios()
    }
    inicializar()
  }, [treino.id])

  async function carregarTotalLikes() {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("treino_id", treino.id)
    setLikes(count || 0)
  }

  async function checkSeCurtiu(uid) {
    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("treino_id", treino.id)
      .eq("user_id", uid)
      .maybeSingle()
    setJaCurtiu(!!data)
  }

  // 🔹 LIKE / UNLIKE BLINDADO (MESCLADO)
  async function handleLike() {
    if (!userId) return router.push("/login")
    if (loadingLike) return

    setLoadingLike(true)
    const estavaCurtido = jaCurtiu 

    try {
      // UI Otimista
      setJaCurtiu(!estavaCurtido)
      setLikes(prev => estavaCurtido ? prev - 1 : prev + 1)

      if (estavaCurtido) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", userId)
          .eq("treino_id", treino.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ 
            user_id: userId, 
            treino_id: treino.id 
          })

        if (error && error.code !== "23505") throw error

        if (treino.usuario_id !== userId) {
          await adicionarXP(treino.usuario_id, 10)
        }
      }
    } catch (err) {
      console.error("Erro na operação de Like:", err)
      setJaCurtiu(estavaCurtido)
      setLikes(prev => estavaCurtido ? prev + 1 : prev - 1)
      alert("Falha na sincronização. Tente novamente.")
    } finally {
      setLoadingLike(false)
    }
  }

  async function carregarComentarios() {
    const { data } = await supabase
      .from("comentarios")
      .select("*, usuarios(username, foto)")
      .eq("treino_id", treino.id)
      .order("created_at", { ascending: true })
    setComentarios(data || [])
  }

  async function enviarComentario() {
    if (!novoComentario.trim() || enviandoComentario) return
    if (!userId) return router.push("/login")

    try {
      setEnviandoComentario(true)
      await supabase.from("comentarios").insert({
        treino_id: treino.id,
        usuario_id: userId,
        texto: novoComentario.trim()
      })
      setNovoComentario("")
      carregarComentarios()
      adicionarXP(userId, 5)
    } finally {
      setEnviandoComentario(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border-l-4 border-green-500 overflow-hidden mb-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
    >
      {/* HEADER BRUTAL */}
      <div className="p-5 flex justify-between items-start border-b border-zinc-800">
        <div className="flex gap-4">
          <div className="relative">
            <img 
              src={autor?.foto || "https://via.placeholder.com/150"} 
              className="w-12 h-12 rounded-none grayscale border-2 border-zinc-700 object-cover"
            />
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-[8px] font-black px-1 uppercase italic">
              Active
            </div>
          </div>
          <div>
            <p className="text-sm font-black italic tracking-tighter uppercase text-zinc-100">
              {autor?.username || "OPERADOR"}
            </p>
            <span className="inline-block bg-zinc-800 text-green-400 text-[10px] font-black px-2 py-0.5 mt-1 uppercase border border-green-500/30">
              {treino.grupo}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
           <div className="flex gap-3">
              {userId === treino.usuario_id && (
                <button onClick={() => router.push(`/novo-treino?id=${treino.id}`)} className="text-zinc-500 hover:text-white transition uppercase text-[10px] font-bold">
                  [Editar]
                </button>
              )}
              <button onClick={() => setMostrarComentarios(!mostrarComentarios)} className="text-zinc-100 font-black text-xs">
                MSG: {comentarios.length}
              </button>
           </div>
        </div>
      </div>

      {/* CORPO DO CARD */}
      <div className="p-5 bg-gradient-to-b from-transparent to-black/20">
        <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter leading-none text-white">
          {treino.titulo}
        </h2>

        <div className="bg-zinc-950 p-4 border border-zinc-800 space-y-2">
          {treino.descricao?.split("\n").map((ex, i) => (
            ex.trim() && (
              <div key={i} className="flex items-start gap-2 group">
                <span className="text-green-500 font-black text-xs mt-1">/&gt;</span>
                <p className="text-sm text-zinc-400 font-medium group-hover:text-white transition-colors">
                  {ex.trim().toUpperCase()}
                </p>
              </div>
            )
          ))}
        </div>
      </div>

      {/* FOOTER AÇÕES */}
      <div className="p-0 bg-zinc-800/30 flex justify-between items-stretch border-t border-zinc-800 h-14">
          <button 
            onClick={handleLike}
            disabled={loadingLike}
            className={`flex-1 flex items-center justify-center gap-2 transition-all active:scale-110 ${jaCurtiu ? 'text-red-600 bg-red-600/5' : 'text-zinc-500 hover:text-white'}`}
          >
            <span className="text-xl">{jaCurtiu ? '☣️' : '🔘'}</span>
            <span className="font-black italic text-sm">{likes}</span>
          </button>

          <button 
            onClick={() => setMostrarComentarios(!mostrarComentarios)}
            className="flex-1 bg-green-500 text-black font-black text-[10px] uppercase italic tracking-widest hover:bg-white transition"
          >
            {mostrarComentarios ? "Fechar Relatório" : "Acessar Protocolo"}
          </button>
      </div>

      {/* SEÇÃO DE COMENTÁRIOS ESTILO TERMINAL */}
      <AnimatePresence>
        {mostrarComentarios && (
          <motion.div 
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden bg-black border-t border-zinc-800"
          >
            <div className="p-5 space-y-4">
              <div className="max-h-40 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {comentarios.map(c => (
                  <div key={c.id} className="border-l-2 border-zinc-800 pl-3">
                    <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">
                      @{c.usuarios?.username}
                    </p>
                    <p className="text-xs text-zinc-300 font-medium">{c.texto}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <input
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="DIGITE SUA MENSAGEM..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 p-3 text-[10px] font-bold text-white uppercase outline-none focus:border-green-500"
                />
                <button
                  onClick={enviarComentario}
                  disabled={enviandoComentario}
                  className="bg-zinc-100 text-black px-4 font-black text-[10px] uppercase hover:bg-green-500 transition-colors"
                >
                  {enviandoComentario ? "..." : "SEND"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}