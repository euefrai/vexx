"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import PageHeader from "@/components/PageHeader"

export default function KO() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [curtindo, setCurtindo] = useState(false) // Adicionado para controlar o clique duplo
  const [filtro, setFiltro] = useState("todos")
  const [busca, setBusca] = useState("")
  const [ordenacao, setOrdenacao] = useState("recentes")

  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
      await carregar()
    }
    init()
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

      if (error) throw error

      const normalizados = (data || []).map(item => ({
        ...item,
        likes_count: item.likes_ko?.length || 0,
        ja_curtiu: userId ? (item.likes_ko?.some(l => l.usuario_id === userId) || false) : false
      }))

      setPosts(normalizados)
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
      
      await carregar()
    } catch (err) {
      console.error("Erro ao curtir:", err)
    } finally {
      setCurtindo(false)
    }
  }

  async function deletarPost(postId) {
    if (!confirm("Remover este post da galeria?")) return
    const { error } = await supabase.from("posts_ko").delete().eq("id", postId)
    if (error) {
      console.error("Erro ao deletar post:", error)
      return
    }
    await supabase.from("likes_ko").delete().eq("post_id", postId)
    carregar()
  }

  const postsFiltrados = useMemo(() => {
    let resultado = [...posts]

    if (filtro === "video") resultado = resultado.filter(p => p.tipo === "video")
    if (filtro === "image") resultado = resultado.filter(p => p.tipo === "image")

    if (busca.trim()) {
      resultado = resultado.filter(p => p.legenda?.toLowerCase().includes(busca.toLowerCase()) || p.usuarios?.username?.toLowerCase().includes(busca.toLowerCase()))
    }

    if (ordenacao === "top") {
      resultado = resultado.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    } else {
      resultado = resultado.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    return resultado
  }, [posts, filtro, busca, ordenacao])

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        <PageHeader icon="🥊" title="KO" subtitle="Galeria de melhores nocautes" color="red" />

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-black italic text-green-500 tracking-tighter uppercase">K.O. 🔥</h1>
            <span className="bg-zinc-800 text-[10px] px-2 py-1 rounded-full text-zinc-400 font-black tracking-widest">LIVE FEED</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por legenda ou atleta..."
              className="flex-1 min-w-[160px] bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs placeholder-zinc-500 outline-none focus:border-green-500"
            />
            <select value={filtro} onChange={e => setFiltro(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
              <option value="todos">Todos</option>
              <option value="video">Vídeos</option>
              <option value="image">Fotos</option>
            </select>
            <select value={ordenacao} onChange={e => setOrdenacao(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs outline-none">
              <option value="recentes">Mais Recentes</option>
              <option value="top">Mais Curtidos</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div>
          </div>
        ) : (
          <div>
            {postsFiltrados.length === 0 ? (
              <div className="py-20 text-center text-zinc-400 text-sm uppercase font-black tracking-wider">
                Nenhum K.O. encontrado para esses filtros.
              </div>
            ) : (
              <div className="space-y-6">
                {postsFiltrados.map((p) => (
                  <div key={p.id} className="bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800/50 shadow-2xl">
                {/* Header do Post */}
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
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

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-[9px] uppercase font-black rounded-xl ${p.tipo === 'video' ? 'bg-purple-700 text-white' : 'bg-blue-700 text-white'}`}>
                      {p.tipo === 'video' ? 'Vídeo' : 'Foto'}
                    </span>
                    {userId === p.usuario_id && (
                      <button onClick={() => deletarPost(p.id)} className="text-[10px] text-red-400 hover:text-red-200 font-black uppercase">DELETE</button>
                    )}
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
                      className={`flex items-center gap-2 transition-all active:scale-90 disabled:opacity-50 ${p.ja_curtiu ? 'text-pink-400' : 'text-zinc-300'}`}
                    >
                      <span className="text-2xl">{p.ja_curtiu ? '💖' : '🤍'}</span>
                      <span className="text-sm font-black">{p.likes_count || 0}</span>
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
    )}
  </div>
  <Navbar />
</>
  )
}