"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"

export default function KO() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    try {
      setLoading(true)
      // Query unificada para trazer os likes e os dados do usuário efrain
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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert("Faça login para curtir!")

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
      carregar() // Atualiza a contagem na tela
    } catch (err) {
      console.error("Erro ao curtir:", err)
    }
  }

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black italic text-green-500 tracking-tighter">K.O. 🔥</h1>
          <span className="bg-zinc-800 text-[10px] px-2 py-1 rounded-full text-zinc-400 font-bold">LIVE FEED</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>
        ) : (
          <div className="space-y-6">
            {posts?.map((p) => (
              <div key={p.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/50">
                <div className="flex items-center gap-3 p-3">
                  <img
                    src={p.usuarios?.foto || "https://via.placeholder.com/150"}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                  />
                  {/* Agora vai aparecer "efrain" em vez de "Guerreiro" após você salvar o perfil */}
                  <span className="font-bold text-sm">{p.usuarios?.username || "Guerreiro"}</span>
                </div>

                <div className="bg-black">
                  {p.tipo === "image" ? (
                    <img src={p.midia_url} className="w-full h-auto" />
                  ) : (
                    <video controls className="w-full max-h-[500px]"><source src={p.midia_url} /></video>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex gap-6 text-xl mb-3 items-center">
                    <button onClick={() => curtir(p.id)} className="flex items-center gap-2 active:scale-90">
                      disabled={salvando}
                      <span>❤️</span>
                      <span className="text-sm font-bold">{p.likes_ko?.length || 0}</span>
                    </button>
                    <span>💬</span>
                    <button className="hover:scale-110">🔥</button>
                  </div>
                  <p className="text-sm">
                    <span className="font-bold text-green-500 mr-2">@{p.usuarios?.username?.toLowerCase() || "user"}</span>
                    {p.legenda}
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