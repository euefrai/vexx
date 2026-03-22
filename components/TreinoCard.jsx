"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useGamificacao } from "@/hooks/useGamificacao"
import { registrarAtividade } from "@/lib/logger" // Importe unificado

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

  // Dados do Autor e Rank
  const autor = treino.usuarios
  const rankDoAutor = autor?.ranks_custom 
  const corAura = rankDoAutor?.cor_texto || "#22c55e" 
  const possuiAura = (autor?.xp || 0) > 500 

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

  async function handleLike() {
    if (!userId) return router.push("/login")
    if (loadingLike) return

    setLoadingLike(true)
    const estavaCurtido = jaCurtiu 

    try {
      // Otimismo na UI
      setJaCurtiu(!estavaCurtido)
      setLikes(prev => estavaCurtido ? prev - 1 : prev + 1)

      if (estavaCurtido) {
        await supabase.from("likes").delete().eq("user_id", userId).eq("treino_id", treino.id)
      } else {
        await supabase.from("likes").insert({ user_id: userId, treino_id: treino.id })
        
        // Log de Atividade e XP apenas se for um novo Like
        if (treino.usuario_id !== userId) {
          await adicionarXP(treino.usuario_id, 10)
        }
        await registrarAtividade(
          userId, 
          "LIKE_GIVEN", 
          `Deu um salve no treino: ${treino.titulo}`, 
          treino.id
        )
      }
    } catch (err) {
      // Reverte em caso de erro
      setJaCurtiu(estavaCurtido)
      setLikes(prev => estavaCurtido ? prev + 1 : prev - 1)
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
      const { error } = await supabase.from("comentarios").insert({
        treino_id: treino.id,
        usuario_id: userId,
        texto: novoComentario.trim()
      })

      if (!error) {
        setNovoComentario("")
        await carregarComentarios()
        await adicionarXP(userId, 5)
        await registrarAtividade(
          userId, 
          "COMENTARIO_POSTADO", 
          `Enviou uma mensagem no protocolo: ${treino.titulo}`, 
          treino.id
        )
      }
    } finally {
      setEnviandoComentario(false)
    }
  }

  return (
    <div className="relative mb-8 group">
      {/* AURA DINÂMICA */}
      <AnimatePresence>
        {possuiAura && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.15, 0.35, 0.15],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ backgroundColor: corAura }}
            className="absolute -inset-1 rounded-xl blur-2xl z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          borderLeftColor: corAura,
          boxShadow: possuiAura ? `0 0 25px ${corAura}22` : '10px 10px 0px 0px rgba(0,0,0,1)' 
        }}
        className="relative z-10 bg-zinc-900 overflow-hidden border-l-4"
      >
        {/* HEADER */}
        <div className="p-5 flex justify-between items-start border-b border-zinc-800">
          <div className="flex gap-4">
            <div className="relative">
              <img 
                src={autor?.foto || "https://via.placeholder.com/150"} 
                alt="Avatar"
                className="w-12 h-12 rounded-none grayscale border-2 object-cover"
                style={{ borderColor: corAura }}
              />
              <div 
                style={{ backgroundColor: corAura }}
                className="absolute -bottom-2 -right-2 text-black text-[10px] font-black px-1 uppercase italic"
              >
                {rankDoAutor?.icone || "🎖️"}
              </div>
            </div>
            <div>
              <p style={{ color: corAura }} className="text-sm font-black italic tracking-tighter uppercase">
                {autor?.username || "OPERADOR"}
              </p>
              <span className="inline-block bg-zinc-800 text-zinc-400 text-[9px] font-black px-2 py-0.5 mt-1 uppercase border border-zinc-700">
                {rankDoAutor?.nome || "RECRUTA"} • {treino.grupo}
              </span>
            </div>
          </div>

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

        {/* CORPO */}
        <div className="p-5 bg-gradient-to-b from-transparent to-black/20">
          <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter leading-none text-white">
            {treino.titulo}
          </h2>

          <div className="bg-zinc-950 p-4 border border-zinc-800 space-y-2">
            {treino.descricao?.split("\n").map((ex, i) => (
              ex.trim() && (
                <div key={i} className="flex items-start gap-2 group/item">
                  <span className="text-green-500 font-black text-xs mt-1">/&gt;</span>
                  <p className="text-sm text-zinc-400 font-medium group-hover/item:text-white transition-colors">
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

        {/* SEÇÃO DE COMENTÁRIOS */}
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
    </div>
  )
}