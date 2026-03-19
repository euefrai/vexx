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

  const [userId, setUserId] = useState(null)

  const autor = treino.usuarios

  useEffect(() => {
    pegarUsuario()
    carregarLikes()
    carregarComentarios()
  }, [treino.id])

  // 🔹 PEGAR USER
  async function pegarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
  }

  // 🔹 LIKES
  async function carregarLikes() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("treino_id", treino.id)

      setLikes(count || 0)

      if (user) {
        const { data } = await supabase
          .from("likes")
          .select("*")
          .eq("treino_id", treino.id)
          .eq("user_id", user.id)
          .maybeSingle()

        setJaCurtiu(!!data)
      }
    } catch (err) {
      console.error("Erro ao carregar likes:", err)
    }
  }

  // 🔹 LIKE / UNLIKE
  async function handleLike() {
    if (loadingLike) return

    try {
      setLoadingLike(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")

      if (jaCurtiu) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("treino_id", treino.id)

        if (error) throw error

        setJaCurtiu(false)
        setLikes(prev => Math.max(0, prev - 1))
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({
            treino_id: treino.id,
            user_id: user.id
          })

        if (error && error.code !== "23505") throw error

        setJaCurtiu(true)
        setLikes(prev => prev + 1)

        // 🔥 XP só se não for o próprio treino
        if (treino.usuario_id !== user.id) {
          await adicionarXP(treino.usuario_id, 10)
        }
      }
    } catch (err) {
      console.error("Erro no like:", err)
    } finally {
      setLoadingLike(false)
    }
  }

  // 🔹 COMENTÁRIOS
  async function carregarComentarios() {
    try {
      const { data, error } = await supabase
        .from("comentarios")
        .select("*, usuarios(username, foto)")
        .eq("treino_id", treino.id)
        .order("created_at", { ascending: true })

      if (error) throw error

      setComentarios(data || [])
    } catch (err) {
      console.error("Erro comentários:", err)
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
          texto: novoComentario.trim()
        })

      if (error) throw error

      setNovoComentario("")
      await carregarComentarios()
      await adicionarXP(user.id, 5)

    } catch (err) {
      alert("Erro ao comentar: " + err.message)
    } finally {
      setEnviandoComentario(false)
    }
  }

  // 🔹 EDITAR
  function editarTreino() {
    router.push(`/novo-treino?id=${treino.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900/50 rounded-[2.5rem] border border-zinc-800 p-6 mb-6"
    >

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <div className="flex items-center gap-3">
          <img 
            src={autor?.foto || "https://via.placeholder.com/150"} 
            className="w-10 h-10 rounded-full border border-green-500/20"
          />
          <div>
            <p className="text-xs font-black">@{autor?.username || "user"}</p>
            <p className="text-[9px] text-green-500 uppercase">{treino.grupo}</p>
          </div>
        </div>

        {/* 🔥 AÇÕES */}
        <div className="flex gap-2 items-center">

          {/* EDITAR */}
          {userId === treino.usuario_id && (
            <button
              onClick={editarTreino}
              className="bg-zinc-800/50 w-9 h-9 rounded-xl text-xs active:scale-90 hover:bg-green-500/20 transition"
            >
              ✏️
            </button>
          )}

          {/* COMENT */}
          <button
            onClick={() => setMostrarComentarios(!mostrarComentarios)}
            className="text-xs"
          >
            💬 {comentarios.length}
          </button>

          {/* LIKE */}
          <button
            onClick={handleLike}
            disabled={loadingLike}
            className="text-xs"
          >
            {jaCurtiu ? "❤️" : "🤍"} {likes}
          </button>

        </div>
      </div>

      {/* TITULO */}
      <h2 className="text-xl font-black mb-3">{treino.titulo}</h2>

      {/* DESCRIÇÃO */}
      <div className="bg-black/40 p-4 rounded-xl mb-4">
        {treino.descricao?.split("\n").map((ex, i) => (
          ex.trim() && (
            <p key={i} className="text-sm text-zinc-300">
              • {ex.trim()}
            </p>
          )
        ))}
      </div>

      {/* COMENTÁRIOS */}
      {mostrarComentarios && (
        <div className="space-y-3">

          {comentarios.map(c => (
            <p key={c.id} className="text-xs">
              <span className="text-green-500 font-bold">
                @{c.usuarios?.username}
              </span>{" "}
              {c.texto}
            </p>
          ))}

          <div className="flex gap-2">
            <input
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Comentar..."
              className="flex-1 bg-black border border-zinc-800 p-2 rounded text-xs"
            />
            <button
              onClick={enviarComentario}
              disabled={enviandoComentario}
              className="text-xs bg-green-500 text-black px-3 rounded"
            >
              {enviandoComentario ? "..." : "OK"}
            </button>
          </div>

        </div>
      )}

    </motion.div>
  )
}