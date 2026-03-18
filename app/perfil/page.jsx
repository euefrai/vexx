"use client"

import { useEffect, useState, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import TreinoCard from "@/components/TreinoCard"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

// Força a página a ser renderizada no servidor apenas no momento da requisição
export const dynamic = 'force-dynamic';

function ConteudoPerfil() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const usuarioIdUrl = searchParams.get("id")

  const [perfil, setPerfil] = useState(null)
  const [treinos, setTreinos] = useState([])
  const [treinosCurtidos, setTreinosCurtidos] = useState([])
  const [postagens, setPostagens] = useState([]) 
  const [abaAtiva, setAbaAtiva] = useState("meus_treinos")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState({ seguidores: 0, seguindo: 0 })
  const [isProprioPerfil, setIsProprioPerfil] = useState(false)
  const [imagemSelecionada, setImagemSelecionada] = useState(null)

  // Sistema de Patentes (Rank) baseado no XP
  function getStatusEvolucao(xp = 0) {
    if (xp >= 8000) return { nome: "AURA", cor: "text-red-500", icon: "⚡", min: 8000, max: 20000 }
    if (xp >= 4000) return { nome: "NO ENEMIES", cor: "text-purple-500", icon: "🛡️", min: 4000, max: 8000 }
    if (xp >= 2000) return { nome: "HIGH CORTISOL", cor: "text-blue-500", icon: "🦅", min: 2000, max: 4000 }
    if (xp >= 1000) return { nome: "BETA", cor: "text-yellow-500", icon: "⚔️", min: 1000, max: 2000 }
    if (xp >= 500) return { nome: "FRANGO", cor: "text-green-500", icon: "🎖️", min: 500, max: 1000 }
    return { nome: "RECRUTA", cor: "text-zinc-500", icon: "🔰", min: 0, max: 500 }
  }

  const getInfoIMC = () => {
    if (!perfil?.peso || !perfil?.altura) return { valor: "--", cor: "text-zinc-500" }
    const imc = (perfil.peso / (perfil.altura * perfil.altura)).toFixed(1)
    if (imc < 18.5) return { valor: imc, cor: "text-blue-400" }
    if (imc < 25) return { valor: imc, cor: "text-green-500" }
    if (imc < 30) return { valor: imc, cor: "text-yellow-500" }
    return { valor: imc, cor: "text-red-500" }
  }

  useEffect(() => { carregarDados() }, [usuarioIdUrl])

  async function carregarDados() {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return router.push("/login")

      const targetId = usuarioIdUrl || authUser.id
      setIsProprioPerfil(targetId === authUser.id)

      const { data: userData } = await supabase.from("usuarios").select("*").eq("id", targetId).single()
      if (userData) setPerfil(userData)

      const { data: treinosData } = await supabase.from("treinos").select("*").eq("usuario_id", targetId).order("created_at", { ascending: false })
      setTreinos(treinosData?.map(t => ({ ...t, usuarios: userData })) || [])

      const { data: postsData } = await supabase.from("postagens").select("*").eq("usuario_id", targetId).order("created_at", { ascending: false })
      setPostagens(postsData || [])

      const { data: curtidosData } = await supabase.from("likes").select("treinos(*, usuarios(*))").eq("user_id", targetId)
      setTreinosCurtidos(curtidosData?.map(item => item.treinos).filter(Boolean) || [])

      const { count: cSeg } = await supabase.from("seguidores").select("*", { count: 'exact', head: true }).eq("seguido_id", targetId)
      const { count: cSeguindo } = await supabase.from("seguidores").select("*", { count: 'exact', head: true }).eq("seguidor_id", targetId)
      setStats({ seguidores: cSeg || 0, seguindo: cSeguindo || 0 })

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUploadRegistro(event) {
    if (!isProprioPerfil) return
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      const { data: { user } } = await supabase.auth.getUser()
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Math.random()}.${fileExt}`

      let { error: uploadError } = await supabase.storage.from('registros').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('registros').getPublicUrl(fileName)

      await supabase.from('postagens').insert([{ 
        usuario_id: user.id, 
        imagem_url: publicUrl, 
        legenda: "" 
      }])

      carregarDados()
    } catch (error) {
      alert("Erro ao subir imagem: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const infoIMC = getInfoIMC()
  const status = getStatusEvolucao(perfil?.xp || 0)
  const progresso = perfil ? Math.min(Math.max(((perfil.xp - status.min) / (status.max - status.min)) * 100, 0), 100) : 0

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black italic animate-pulse">
      RASTREANDO DADOS...
    </div>
  )

  return (
    <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-black uppercase italic tracking-tighter text-green-500">
            {isProprioPerfil ? "Elite Squad / Perfil" : `Dossiê / ${perfil?.username}`}
          </h1>
          {isProprioPerfil && (
            <Link href="/configuracoes" className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 active:scale-90 transition-transform">⚙️</Link>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-6 bg-zinc-900/40 p-6 rounded-[3rem] border border-zinc-800/50 shadow-2xl relative">
          <div className="flex gap-2 mb-4">
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/5">
                <span className="text-sm">{status.icon}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${status.cor}`}>{status.nome}</span>
             </div>
             <div className="px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[9px] font-black uppercase text-zinc-400">
                {perfil?.sexo === 'masculino' ? '♂ Masc' : perfil?.sexo === 'feminino' ? '♀ Fem' : '◈'}
             </div>
          </div>

          <div className="relative mb-4">
            <img src={perfil?.foto || "https://via.placeholder.com/150"} className="w-28 h-28 rounded-full object-cover border-4 border-green-500 p-1 shadow-lg shadow-green-500/20" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase italic">
              LVL {perfil?.nivel || 1}
            </div>
          </div>

          <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">@{perfil?.username}</h2>
          {perfil?.bio && <p className="text-zinc-500 text-xs mt-3 px-6 text-center italic leading-relaxed">"{perfil.bio}"</p>}

          <div className="grid grid-cols-3 gap-4 w-full mt-6 border-t border-zinc-800/30 pt-6">
            <div className="text-center">
              <p className="text-lg font-black">{perfil?.peso || "--"}kg</p>
              <p className="text-[8px] text-zinc-600 uppercase font-black">Peso</p>
            </div>
            <div className="text-center bg-zinc-800/30 py-1 rounded-2xl border border-zinc-800/50">
              <p className={`text-lg font-black ${infoIMC.cor}`}>{infoIMC.valor}</p>
              <p className="text-[8px] text-zinc-600 uppercase font-black">IMC</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black">{perfil?.altura || "--"}m</p>
              <p className="text-[8px] text-zinc-600 uppercase font-black">Altura</p>
            </div>
          </div>

          <div className="flex gap-8 mt-6">
            <div className="text-center">
              <p className="text-sm font-black text-white">{stats.seguidores}</p>
              <p className="text-[8px] text-zinc-600 uppercase font-black">Recrutas</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-white">{stats.seguindo}</p>
              <p className="text-[8px] text-zinc-600 uppercase font-black">Seguindo</p>
            </div>
          </div>
        </motion.div>
        
        <div className="mb-8 px-2">
            <div className="flex justify-between items-end mb-1.5 px-1">
                <span className={`text-[9px] font-black uppercase italic ${status.cor}`}>Evolução de Rank</span>
                <span className="text-[9px] font-black text-zinc-600">{perfil?.xp || 0} / {status.max} XP</span>
            </div>
            <div className="h-2.5 bg-zinc-900 rounded-full border border-zinc-800/50 p-0.5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progresso}%` }} className="h-full bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]" />
            </div>
        </div>

        <div className="flex bg-zinc-900/50 p-1 rounded-2xl mb-8 border border-zinc-800/50">
          <button onClick={() => setAbaAtiva("meus_treinos")} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${abaAtiva === "meus_treinos" ? "bg-green-500 text-black shadow-lg shadow-green-500/20" : "text-zinc-500"}`}>Arsenal</button>
          <button onClick={() => setAbaAtiva("registros")} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${abaAtiva === "registros" ? "bg-green-500 text-black shadow-lg shadow-green-500/20" : "text-zinc-500"}`}>Registros</button>
          <button onClick={() => setAbaAtiva("salvos")} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${abaAtiva === "salvos" ? "bg-green-500 text-black shadow-lg shadow-green-500/20" : "text-zinc-500"}`}>Salvos</button>
        </div>

        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div key={abaAtiva} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {abaAtiva === "meus_treinos" && (
                <div className="space-y-4">
                  {treinos.length > 0 ? treinos.map(t => <TreinoCard key={t.id} treino={t} />) : <p className="text-center py-10 text-zinc-700 text-[10px] font-bold uppercase italic font-black">Vazio.</p>}
                </div>
              )}

              {abaAtiva === "registros" && (
                <div className="space-y-4">
                  {isProprioPerfil && (
                    <label className="block w-full cursor-pointer">
                      <div className="flex items-center justify-center py-4 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all group">
                        <span className="text-[10px] font-black uppercase text-zinc-500 italic group-hover:text-green-500">
                          {uploading ? "Subindo Arquivo..." : "Novo Registro Visual +"}
                        </span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleUploadRegistro} className="hidden" />
                    </label>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {postagens.map((post) => (
                      <div key={post.id} className="relative group overflow-hidden rounded-2xl aspect-square border border-zinc-800">
                        <img 
                          src={post.imagem_url} 
                          onClick={() => setImagemSelecionada(post.imagem_url)} 
                          className="w-full h-full object-cover cursor-pointer active:scale-95 transition-transform" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {abaAtiva === "salvos" && (
                <div className="space-y-4">
                  {treinosCurtidos.length > 0 ? treinosCurtidos.map(t => <TreinoCard key={t.id} treino={t} />) : <p className="text-center py-10 text-zinc-700 text-[10px] font-bold uppercase italic font-black">Sem referências salvas.</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {imagemSelecionada && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setImagemSelecionada(null)} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
              <img src={imagemSelecionada} className="max-w-full max-h-[85vh] rounded-3xl border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,1)]" />
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )
}

// O componente principal exportado envolve tudo em Suspense para evitar erros de Build
export default function Perfil() {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black italic">CARREGANDO...</div>}>
        <ConteudoPerfil />
      </Suspense>
      <Navbar />
    </>
  )
}