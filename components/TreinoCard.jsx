"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function TreinoCard({ treino }) {
  const router = useRouter()
  const [likes, setLikes] = useState(0)
  const [jaCurtiu, setJaCurtiu] = useState(false)
  const [loadingLike, setLoadingLike] = useState(false)
  
  const autor = treino.usuarios

  useEffect(() => {
    carregarLikes()
  }, [treino.id])

  async function carregarLikes() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { count } = await supabase
        .from("likes")
        .select("*", { count: 'exact', head: true })
        .eq("treino_id", treino.id)

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
          .insert({ treino_id: treino.id, user_id: user.id })

        if (error && error.code !== '23505') throw error
        setJaCurtiu(true)
        setLikes(prev => prev + 1)
      }
    } catch (error) {
      console.error("Erro na ação de curtir:", error)
    } finally {
      setLoadingLike(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-[2rem] border border-zinc-800 p-5 shadow-xl mb-4"
    >
      {/* CABEÇALHO: FOTO E NOME */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-black">
            <img 
              src={autor?.foto || "https://via.placeholder.com/150"} 
              alt={autor?.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white leading-none">
              {autor?.username || "Guerreiro Elite"}
            </span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {treino.grupo}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleLike}
          disabled={loadingLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            jaCurtiu ? "bg-red-500/10 text-red-500" : "bg-zinc-800 text-zinc-500"
          }`}
        >
          <span className="text-sm">{jaCurtiu ? "❤️" : "🤍"}</span>
          <span className="text-xs font-black">{likes}</span>
        </button>
      </div>

      {/* CONTEÚDO DO TREINO EM LISTA */}
      <h2 className="text-xl font-black italic uppercase text-green-500 mb-2">
        {treino.titulo}
      </h2>
      
      <div className="bg-black/50 rounded-2xl p-6 mb-4 border border-zinc-800/50">
        <div className="flex flex-col gap-4">
          {treino.descricao.split(/[\n,;]+/).map((exercicio, index) => (
            exercicio.trim() && (
              <div key={index} className="flex items-start gap-3 group">
                {/* Marcador Neon */}
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0" />
                
                <p className="text-sm text-zinc-300 font-medium leading-tight tracking-wide">
                  {exercicio.trim()}
                </p>
              </div>
            )
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-600 tracking-widest">
         <span>Criado por {autor?.username}</span>
         <span className="text-green-900">#ELITESQUAD</span>
      </div>
    </motion.div>
  )
}