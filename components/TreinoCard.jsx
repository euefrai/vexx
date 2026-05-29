"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useGamificacao } from "@/hooks/useGamificacao"
import { registrarAtividade } from "@/lib/logger"
import { Heart, MessageSquare, Pencil, Send } from "lucide-react"

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
    <div className="relative mb-6 group">
      {/* AURA DINÂMICA SUTIL - APENAS UM BRILHO EXTERNO SUAVE */}
      <AnimatePresence>
        {possuiAura && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.03, 0.08, 0.03],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ backgroundColor: corAura }}
            className="absolute -inset-0.5 rounded-2xl blur-xl z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          borderLeftColor: corAura,
          boxShadow: possuiAura ? `0 0 20px ${corAura}11` : 'none' 
        }}
        className="relative z-10 bg-zinc-900/40 backdrop-blur-md border border-zinc-900 rounded-2xl overflow-hidden border-l-3"
      >
        {/* HEADER */}
        <div className="p-4 flex justify-between items-center border-b border-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={autor?.foto || "/avatar-padrao.png"} 
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border"
                style={{ borderColor: corAura }}
              />
              <div 
                style={{ backgroundColor: corAura }}
                className="absolute -bottom-1 -right-1 text-zinc-950 text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md"
              >
                {rankDoAutor?.icone || "🎖️"}
              </div>
            </div>
            <div>
              <p style={{ color: corAura }} className="text-xs font-bold uppercase tracking-wider">
                {autor?.username || "OPERADOR"}
              </p>
              <span className="inline-block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                {rankDoAutor?.nome || "RECRUTA"} • {treino.grupo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userId === treino.usuario_id && (
              <button 
                onClick={() => router.push(`/novo-treino?id=${treino.id}`)} 
                className="text-zinc-500 hover:text-emerald-400 transition-colors uppercase text-[9px] font-bold tracking-wider cursor-pointer flex items-center gap-1 border border-zinc-800 px-2 py-1 rounded-lg hover:border-emerald-500/20 bg-zinc-900/30"
              >
                <Pencil size={10} /> Editar
              </button>
            )}
          </div>
        </div>

        {/* CORPO */}
        <div className="p-5 bg-gradient-to-b from-transparent to-zinc-950/20">
          <h2 className="text-xl font-bold mb-3.5 uppercase tracking-wide text-zinc-100 leading-snug">
            {treino.titulo}
          </h2>

          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/50 space-y-2.5">
            {treino.descricao?.split("\n").map((ex, i) => (
              ex.trim() && (
                <div key={i} className="flex items-start gap-2.5 group/item">
                  <span className="text-emerald-500 font-extrabold text-[10px] mt-1 select-none">/&gt;</span>
                  <p className="text-xs text-zinc-400 font-medium tracking-wide leading-relaxed uppercase group-hover/item:text-zinc-200 transition-colors">
                    {ex.trim()}
                  </p>
                </div>
              )
            ))}
          </div>
        </div>

        {/* FOOTER AÇÕES */}
        <div className="p-0 bg-zinc-900/20 flex justify-between items-stretch border-t border-zinc-900/50 h-12">
          <button 
            onClick={handleLike}
            disabled={loadingLike}
            className={`flex-1 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              jaCurtiu 
                ? 'text-rose-500 bg-rose-500/5 font-bold' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/10'
            }`}
          >
            <Heart size={16} className={jaCurtiu ? 'fill-rose-500' : ''} />
            <span className="font-bold text-xs tracking-wider">{likes}</span>
          </button>

          <button 
            onClick={() => setMostrarComentarios(!mostrarComentarios)}
            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider transition-all duration-300 border-l border-zinc-900/50 cursor-pointer"
          >
            {mostrarComentarios ? "Fechar Comentários" : `Comentários (${comentarios.length})`}
          </button>
        </div>

        {/* SEÇÃO DE COMENTÁRIOS */}
        <AnimatePresence>
          {mostrarComentarios && (
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: 'auto' }} 
              exit={{ height: 0 }}
              className="overflow-hidden bg-zinc-950/70 border-t border-zinc-900/50"
            >
              <div className="p-4 space-y-3.5">
                <div className="max-h-40 overflow-y-auto space-y-2.5 pr-2 scrollbar-thin scrollbar-thumb-zinc-900">
                  {comentarios.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider text-center py-2">Sem mensagens registradas.</p>
                  ) : (
                    comentarios.map(c => (
                      <div key={c.id} className="border-l border-zinc-800 pl-3 py-0.5">
                        <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                          @{c.usuarios?.username}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{c.texto}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="flex-1 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 text-[11px] font-semibold text-zinc-200 outline-none focus:border-emerald-500/50 placeholder:text-zinc-600 transition-colors"
                  />
                  <button
                    onClick={enviarComentario}
                    disabled={enviandoComentario}
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {enviandoComentario ? "..." : <><Send size={12} /> Enviar</>}
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