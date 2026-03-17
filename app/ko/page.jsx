"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"

export default function KO() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [curtindo, setCurtindo] = useState(false) // Adicionado para controlar o clique duplo

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("posts_ko")
        .select(`
          *,
          usuarios (username, foto),
          likes_ko (usuario_id)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error("Erro ao carregar K.O:", error)
    } finally {
      setLoading(false)
    }
  }

  async function curtir(postId) {
    if (curtindo) return // Evita múltiplos cliques
    
    try {
      setCurtindo(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert("Faça login para curtir!")

      // Verifica se já curtiu
      const { data: jaCurtiu } = await supabase
        .from("likes_ko")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("post_id", postId)

      if (jaCurtiu && jaCurtiu.length > 0) {
        await supabase.from("likes_ko").delete().eq("usuario_id", user.id).eq("post_id", postId)
      } else {
        await supabase.from("likes_ko").insert({ usuario_id: user.id, post_id: postId })
      }
      
      // Atualiza apenas os dados necessários sem dar reload na página inteira
      carregar() 
    } catch (err) {
      console.error("Erro ao curtir:", err)
    } finally {
      setCurtindo(false)
    }
  }

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black italic text-green-500 tracking-tighter uppercase">K.O. 🔥</h1>
          <span className="bg-zinc-800 text-[10px] px-2 py-1 rounded-full text-zinc-400 font-black tracking-widest">LIVE FEED</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts?.map((p) => (
              <div key={p.id} className="bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800/50 shadow-2xl">
                {/* Header do Post */}
                <div className="flex items-center gap-3 p-4">
                  <img
                    src={p.usuarios?.foto || "https://via.placeholder.com/150"}
                    className="w-10 h-10 rounded-full object-cover border-2 border-green-500/20"
                  />
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase tracking-tighter italic">
                      {p.usuarios?.username || "Guerreiro"}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase">Membro Elite</span>
                  </div>
                </div>

                {/* Mídia */}
                <div className="bg-black aspect-video flex items-center justify-center overflow-hidden">
                  {p.tipo === "image" ? (
                    <img src={p.midia_url} className="w-full h-full object-cover" />
                  ) : (
                    <video controls className="w-full h-full object-cover">
                      <source src={p.midia_url} />
                    </video>
                  )}
                </div>

                {/* Ações e Legenda */}
                <div className="p-5">
                  <div className="flex gap-6 mb-4 items-center">
                    <button 
                      onClick={() => curtir(p.id)} 
                      disabled={curtindo}
                      className="flex items-center gap-2 group transition-all active:scale-90 disabled:opacity-50"
                    >
                      <span className="text-2xl group-hover:scale-120 transition-transform">❤️</span>
                      <span className="text-sm font-black">{p.likes_ko?.length || 0}</span>
                    </button>
                    <button className="text-2xl hover:scale-110 transition-transform">💬</button>
                    <button className="text-2xl hover:scale-110 transition-transform">🔥</button>
                  </div>
                  
                  <p className="text-sm leading-relaxed">
                    <span className="font-black text-green-500 mr-2 uppercase italic text-xs">
                      @{p.usuarios?.username || "user"}
                    </span>
                    <span className="text-zinc-300 font-medium">{p.legenda}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Navbar />
    </>
  )
}