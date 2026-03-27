"use client"

import { useEffect, useState, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import TreinoCard from "@/components/TreinoCard"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import PageHeader from "@/components/PageHeader"

export const dynamic = 'force-dynamic';

function ConteudoPerfil() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const usuarioIdUrl = searchParams.get("id")

  const [perfil, setPerfil] = useState(null)
  const [ranksCustom, setRanksCustom] = useState([])
  const [treinos, setTreinos] = useState([])
  const [treinosCurtidos, setTreinosCurtidos] = useState([])
  const [postagens, setPostagens] = useState([]) 
  const [listaSeguidores, setListaSeguidores] = useState([])
  const [listaSeguindo, setListaSeguindo] = useState([])
  const [abaAtiva, setAbaAtiva] = useState("meus_treinos")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState({ seguidores: 0, seguindo: 0 })
  const [isProprioPerfil, setIsProprioPerfil] = useState(false)
  const [imagemSelecionada, setImagemSelecionada] = useState(null)

  // 1. LÓGICA DE RANKS (UNIFICADA: MANUAL > AUTOMÁTICO)
  function getRankInfo() {
    // Título Manual do QG
    if (perfil?.titulo_manual) {
      const rankEncontrado = ranksCustom.find(r => r.nome === perfil.titulo_manual)
      if (rankEncontrado) {
        return {
          nome: rankEncontrado.nome,
          cor: rankEncontrado.cor_texto || "#ffffff",
          icon: "⭐",
          min: rankEncontrado.xp_minimo || 0,
          max: (rankEncontrado.xp_minimo || 0) + 1000,
          isCustom: true
        }
      }
    }

    // Título Automático por XP
    const xp = perfil?.xp || 0
    if (xp >= 60000) return { nome: "AURA", cor: "#ef4444", icon: "⚡", min: 60000, max: 100000 }
    if (xp >= 8000) return { nome: "NO ENEMIES", cor: "#ef4444", icon: "༄", min: 8000, max: 16000 }
    if (xp >= 4000) return { nome: "ELITE", cor: "#a855f7", icon: "🛡️", min: 4000, max: 8000 }
    if (xp >= 2000) return { nome: "HIGH CORTISOL", cor: "#3b82f6", icon: "🦅", min: 2000, max: 4000 }
    if (xp >= 1000) return { nome: "BETA", cor: "#eab308", icon: "⚔️", min: 1000, max: 2000 }
    if (xp >= 500) return { nome: "FRANGO", cor: "#22c55e", icon: "🎖️", min: 500, max: 1000 }
    return { nome: "RECRUTA", cor: "#71717a", icon: "🔰", min: 0, max: 500 }
  }

  // 2. BUSCA DE DADOS
  async function carregarDados() {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return router.push("/login")

      const targetId = usuarioIdUrl || authUser.id
      setIsProprioPerfil(targetId === authUser.id)

      const [resUser, resRanks] = await Promise.all([
        supabase.from("usuarios").select("*").eq("id", targetId).single(),
        supabase.from("ranks_custom").select("*")
      ])

      if (resUser.data) setPerfil(resUser.data)
      if (resRanks.data) setRanksCustom(resRanks.data)

      const { data: treinosData } = await supabase.from("treinos").select("*").eq("usuario_id", targetId).order("created_at", { ascending: false })
      setTreinos(treinosData?.map(t => ({ ...t, usuarios: resUser.data })) || [])

      const { data: postsData } = await supabase.from("postagens").select("*").eq("usuario_id", targetId).order("created_at", { ascending: false })
      setPostagens(postsData || [])

      const { data: curtidosData } = await supabase.from("likes").select("treinos(*, usuarios(*))").eq("user_id", targetId)
      setTreinosCurtidos(curtidosData?.map(item => item.treinos).filter(Boolean) || [])

      const { data: segData } = await supabase.from("seguidores").select("usuarios!seguidores_seguidor_id_fkey(id, username, foto)").eq("seguido_id", targetId)
      setListaSeguidores(segData?.map(s => s.usuarios) || [])

      const { data: seguindoData } = await supabase.from("seguidores").select("usuarios!seguidores_seguido_id_fkey(id, username, foto)").eq("seguidor_id", targetId)
      setListaSeguindo(seguindoData?.map(s => s.usuarios) || [])

      setStats({ seguidores: segData?.length || 0, seguindo: seguindoData?.length || 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregarDados() }, [usuarioIdUrl])

  // 3. AUXILIARES E AÇÕES
  const compartilharApp = async () => {
    const shareData = {
      title: 'VEXX SQUAD',
      text: `Confira o perfil de @${perfil?.username} no VEXX SQUAD!`,
      url: window.location.href,
    }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(window.location.href)
        alert("Link copiado! ⚡")
      }
    } catch (err) { console.log(err) }
  }

  const getInfoIMC = () => {
    if (!perfil?.peso || !perfil?.altura) return { valor: "--", cor: "text-zinc-500" }
    const imc = (perfil.peso / (perfil.altura * perfil.altura)).toFixed(1)
    if (imc < 18.5) return { valor: imc, cor: "text-blue-400" }
    if (imc < 25) return { valor: imc, cor: "text-green-500" }
    if (imc < 30) return { valor: imc, cor: "text-yellow-500" }
    return { valor: imc, cor: "text-red-500" }
  }

  async function excluirTreino(id) {
    if (!confirm("ELIMINAR ESTE TREINO?")) return
    await supabase.from("treinos").delete().eq("id", id)
    carregarDados()
  }

  async function excluirPostagem(id) {
    if (!confirm("REMOVER REGISTRO?")) return
    await supabase.from("postagens").delete().eq("id", id)
    carregarDados()
  }

  async function handleUploadRegistro(event) {
    if (!isProprioPerfil) return
    try {
      setUploading(true)
      const file = event.target.files[0]
      const { data: { user } } = await supabase.auth.getUser()
      const fileName = `${user.id}/${Math.random()}.${file.name.split('.').pop()}`
      await supabase.storage.from('registros').upload(fileName, file)
      const { data: { publicUrl } } = supabase.storage.from('registros').getPublicUrl(fileName)
      await supabase.from('postagens').insert([{ usuario_id: user.id, imagem_url: publicUrl, legenda: "" }])
      carregarDados()
    } catch (error) { alert(error.message) } finally { setUploading(false) }
  }

  const status = getRankInfo()
  const infoIMC = getInfoIMC()
  const progresso = perfil ? Math.min(Math.max(((perfil.xp - status.min) / (status.max - status.min)) * 100, 0), 100) : 0

  const RenderListaUsuarios = ({ lista }) => (
    <div className="space-y-3">
      {lista.length > 0 ? lista.map(u => (
        <Link href={`/perfil?id=${u.id}`} key={u.id} className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 active:scale-95 transition-all">
          <img src={u.foto || "https://via.placeholder.com/150"} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
          <span className="text-sm font-black uppercase italic text-zinc-200">@{u.username}</span>
        </Link>
      )) : <p className="text-center py-10 text-zinc-700 text-[10px] font-black uppercase italic">Vazio.</p>}
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black italic animate-pulse">
      RASTREANDO DADOS...
    </div>
  )

  return (
    <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
      <PageHeader icon="👤" title="Perfil" subtitle="Seu histórico e conquistas" color="green" />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-black uppercase italic tracking-tighter text-green-500">
          {isProprioPerfil ? "Elite Squad / Perfil" : `Dossiê / ${perfil?.username}`}
        </h1>
        <div className="flex gap-2">
          <button onClick={compartilharApp} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 active:scale-90 transition-transform">📤</button>
          {isProprioPerfil && <Link href="/configuracoes" className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 active:scale-90 transition-transform">⚙️</Link>}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-8 bg-gradient-to-b from-zinc-900/80 to-black p-6 rounded-[3rem] border border-zinc-800 shadow-2xl relative overflow-hidden">
        {/* Glow dinâmico baseado na cor do rank */}
        <div style={{ backgroundColor: status.cor }} className="absolute -top-20 w-72 h-72 opacity-10 blur-[120px] rounded-full"></div>

        <div className="flex gap-2 mb-4 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-white/5 backdrop-blur">
            <span className="text-sm">{status.icon}</span>
            <span style={{ color: status.cor }} className="text-[9px] font-black uppercase tracking-widest">{status.nome}</span>
          </div>
          {perfil?.sexo && (
             <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 bg-zinc-800/50 border border-white/5`}>
               {perfil.sexo === 'masculino' ? '♂ Masc' : '♀ Fem'}
             </div>
          )}
        </div>

        <div className="relative mb-4 z-10">
          <img src={perfil?.foto || "https://via.placeholder.com/150"} 
               style={{ borderColor: status.cor }}
               className="w-28 h-28 rounded-full object-cover border-4 p-1 shadow-2xl transition-all duration-500" alt="" />
          <div style={{ backgroundColor: status.cor }} className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase italic shadow-lg">
            LVL {perfil?.nivel || 1}
          </div>
        </div>

        <h2 style={{ color: status.cor }} className="text-3xl font-black uppercase italic tracking-tighter leading-none z-10 transition-colors duration-500">
          @{perfil?.username}
        </h2>

        {perfil?.bio && <p className="text-zinc-500 text-xs mt-3 px-6 text-center italic leading-relaxed z-10">"{perfil.bio}"</p>}

        <div className="grid grid-cols-3 gap-4 w-full mt-6 border-t border-zinc-800/30 pt-6 z-10">
          <div className="text-center">
            <p className="text-xl font-black">{perfil?.peso || "--"}kg</p>
            <p className="text-[8px] text-zinc-600 uppercase font-black">Peso</p>
          </div>
          <div className="text-center bg-zinc-800/40 py-2 rounded-2xl border border-zinc-800/50">
            <p className={`text-xl font-black ${infoIMC.cor}`}>{infoIMC.valor}</p>
            <p className="text-[8px] text-zinc-600 uppercase font-black">IMC</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black">{perfil?.altura || "--"}m</p>
            <p className="text-[8px] text-zinc-600 uppercase font-black">Altura</p>
          </div>
        </div>

        <div className="flex gap-8 mt-6 z-10">
          <button onClick={() => setAbaAtiva("seguidores")} className="text-center active:scale-90 transition-transform">
            <p className={`text-sm font-black ${abaAtiva === "seguidores" ? "text-green-500" : "text-white"}`}>{stats.seguidores}</p>
            <p className="text-[8px] text-zinc-600 uppercase font-black">Recrutas</p>
          </button>
          <button onClick={() => setAbaAtiva("seguindo")} className="text-center active:scale-90 transition-transform">
            <p className={`text-sm font-black ${abaAtiva === "seguindo" ? "text-green-500" : "text-white"}`}>{stats.seguindo}</p>
            <p className="text-[8px] text-zinc-600 uppercase font-black">Seguindo</p>
          </button>
        </div>
      </motion.div>
      
      {/* BARRA DE EVOLUÇÃO */}
      <div className="mb-8 px-2">
          <div className="flex justify-between items-end mb-1.5 px-1">
              <span style={{ color: status.cor }} className="text-[9px] font-black uppercase italic">Evolução de Patente</span>
              <span className="text-[9px] font-black text-zinc-600">{perfil?.xp || 0} XP</span>
          </div>
          <div className="h-2.5 bg-zinc-900 rounded-full border border-zinc-800/50 p-0.5 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progresso}%` }} 
                          style={{ backgroundColor: status.cor }}
                          className="h-full rounded-full shadow-lg transition-all duration-700" />
          </div>
      </div>

      {/* TABS */}
      <div className="flex bg-zinc-900/50 p-1 rounded-2xl mb-8 border border-zinc-800/50">
        {["meus_treinos", "registros", "salvos"].map((aba) => (
          <button key={aba} onClick={() => setAbaAtiva(aba)} 
                  style={abaAtiva === aba ? { backgroundColor: status.cor, color: '#000' } : {}}
                  className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${abaAtiva !== aba ? "text-zinc-500" : "shadow-lg"}`}>
            {aba === "meus_treinos" ? "Arsenal" : aba === "registros" ? "Registros" : "Salvos"}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS TABS */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div key={abaAtiva} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {abaAtiva === "meus_treinos" && (
              <div className="space-y-4">
                {treinos.length > 0 ? treinos.map(t => (
                  <div key={t.id} className="relative group">
                    <TreinoCard treino={t} />
                    {isProprioPerfil && (
                      <button onClick={() => excluirTreino(t.id)} className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-red-500 p-2 rounded-full border border-zinc-700 z-10 active:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" /></svg>
                      </button>
                    )}
                  </div>
                )) : <p className="text-center py-10 text-zinc-700 text-[10px] font-black italic">Vazio.</p>}
              </div>
            )}

            {abaAtiva === "registros" && (
              <div className="space-y-4">
                {isProprioPerfil && (
                  <label className="block w-full cursor-pointer">
                    <div className="flex items-center justify-center py-4 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all">
                      <span className="text-[10px] font-black uppercase italic">{uploading ? "Subindo..." : "Novo Registro Visual +"}</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleUploadRegistro} className="hidden" />
                  </label>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {postagens.map((post) => (
                    <div key={post.id} className="relative group rounded-2xl aspect-square border border-zinc-800 overflow-hidden">
                      <img src={post.imagem_url} onClick={() => setImagemSelecionada(post.imagem_url)} className="w-full h-full object-cover cursor-pointer active:scale-95 transition-transform" />
                      {isProprioPerfil && (
                        <button onClick={() => excluirPostagem(post.id)} className="absolute top-1 right-1 bg-black/60 text-red-500 p-2 rounded-lg border border-zinc-700 z-10 active:scale-90">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {abaAtiva === "salvos" && (
              <div className="space-y-4">
                {treinosCurtidos.length > 0 ? treinosCurtidos.map(t => <TreinoCard key={t.id} treino={t} />) : <p className="text-center py-10 text-zinc-700 text-[10px] font-black italic">Sem salvos.</p>}
              </div>
            )}

            {abaAtiva === "seguidores" && <RenderListaUsuarios lista={listaSeguidores} />}
            {abaAtiva === "seguindo" && <RenderListaUsuarios lista={listaSeguindo} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {imagemSelecionada && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setImagemSelecionada(null)} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <img src={imagemSelecionada} style={{ borderColor: status.cor }} className="max-w-full max-h-[85vh] rounded-3xl border shadow-2xl" alt="" />
          </motion.div>
        )}
      </AnimatePresence>
      <Navbar />
    </div>
  )
}

export default function Perfil() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black italic">CARREGANDO...</div>}>
      <ConteudoPerfil />
    </Suspense>
  )
}