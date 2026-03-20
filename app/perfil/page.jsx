"use client"

import { useEffect, useState, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import TreinoCard from "@/components/TreinoCard"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export const dynamic = 'force-dynamic';

function ConteudoPerfil() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const usuarioIdUrl = searchParams.get("id")

  const [perfil, setPerfil] = useState(null)
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

  // FUNÇÃO DE COMPARTILHAR AJUSTADA
  const compartilharApp = async () => {
    const shareData = {
      title: 'VEXX SQUAD',
      text: `Confira o perfil de @${perfil?.username || 'um soldado'} no VEXX SQUAD!`,
      url: window.location.href, // Compartilha o link específico do perfil atual
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link do perfil copiado! ⚡");
      }
    } catch (err) {
      console.log('Erro ao compartilhar', err);
    }
  };

  function getStatusEvolucao(xp = 0) {
    if (xp >= 8000) return { nome: "AURA", cor: "text-red-500", icon: "⚡", min: 8000, max: 20000 }
    if (xp >= 4000) return { nome: "NO ENEMIES", cor: "text-purple-500", icon: "🛡️", min: 4000, max: 8000 }
    if (xp >= 2000) return { nome: "HIGH CORTISOL", cor: "text-blue-500", icon: "🦅", min: 2000, max: 4000 }
    if (xp >= 1000) return { nome: "BETA", cor: "text-yellow-500", icon: "⚔️", min: 1000, max: 2000 }
    if (xp >= 500) return { nome: "FRANGO", cor: "text-green-500", icon: "🎖️", min: 500, max: 1000 }
    return { nome: "RECRUTA", cor: "text-zinc-500", icon: "🔰", min: 0, max: 500 }
  }

  function getCorNivel(xp = 0) {
    if (xp >= 8000) return { cor: "text-red-500", bg: "bg-red-500", border: "border-red-500", shadow: "shadow-red-500/30" }
    if (xp >= 4000) return { cor: "text-purple-500", bg: "bg-purple-500", border: "border-purple-500", shadow: "shadow-purple-500/30" }
    if (xp >= 2000) return { cor: "text-blue-500", bg: "bg-blue-500", border: "border-blue-500", shadow: "shadow-blue-500/30" }
    if (xp >= 1000) return { cor: "text-yellow-500", bg: "bg-yellow-500", border: "border-yellow-500", shadow: "shadow-yellow-500/30" }
    if (xp >= 500) return { cor: "text-green-500", bg: "bg-green-500", border: "border-green-500", shadow: "shadow-green-500/30" }
    return { cor: "text-zinc-500", bg: "bg-zinc-500", border: "border-zinc-500", shadow: "shadow-zinc-500/30" }
  }

  function getInfoIMC() {
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

  async function excluirTreino(id) {
    if (!confirm("ELIMINAR ESTE TREINO DO ARSENAL?")) return
    const { error } = await supabase.from("treinos").delete().eq("id", id)
    if (error) alert("Erro ao deletar: " + error.message)
    else carregarDados()
  }

  async function excluirPostagem(id) {
    if (!confirm("REMOVER ESTE REGISTRO VISUAL?")) return
    const { error } = await supabase.from("postagens").delete().eq("id", id)
    if (error) alert("Erro ao deletar: " + error.message)
    else carregarDados()
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
      await supabase.from('postagens').insert([{ usuario_id: user.id, imagem_url: publicUrl, legenda: "" }])
      carregarDados()
    } catch (error) {
      alert("Erro ao subir imagem: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const infoIMC = getInfoIMC()
  const status = getStatusEvolucao(perfil?.xp || 0)
  const corNivel = getCorNivel(perfil?.xp || 0)
  const progresso = perfil ? Math.min(Math.max(((perfil.xp - status.min) / (status.max - status.min)) * 100, 0), 100) : 0

  const RenderListaUsuarios = ({ lista }) => (
    <div className="space-y-3">
      {lista.length > 0 ? lista.map(u => (
        <Link href={`/perfil?id=${u.id}`} key={u.id} className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 active:scale-95 transition-all">
          <img src={u.foto || "https://via.placeholder.com/150"} className={`w-10 h-10 rounded-full object-cover border ${corNivel.border}/30`} alt="" />
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-black uppercase italic tracking-tighter text-green-500">
            {isProprioPerfil ? "Elite Squad / Perfil" : `Dossiê / ${perfil?.username}`}
          </h1>
          
          {/* BOTÕES DE AÇÃO: Compartilhar e Configurações */}
          <div className="flex gap-2">
            <button 
              onClick={compartilharApp}
              className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 active:scale-90 transition-transform flex items-center justify-center"
              title="Compartilhar Perfil"
            >
              📤
            </button>
            {isProprioPerfil && (
              <Link href="/configuracoes" className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 active:scale-90 transition-transform">⚙️</Link>
            )}
          </div>
        </div>

        {/* ... (Todo o restante do seu código permanece igual) ... */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8 bg-gradient-to-b from-zinc-900/80 to-black p-6 rounded-[3rem] border border-zinc-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Glow background baseado no XP */}
          <div className={`absolute -top-20 w-72 h-72 ${corNivel.bg}/10 blur-[120px] rounded-full`}></div>

          {/* BADGES */}
          <div className="flex gap-2 mb-4 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-white/5 backdrop-blur">
              <span className="text-sm">{status.icon}</span>
              <span className={`text-[9px] font-black uppercase tracking-widest ${corNivel.cor}`}>
                {status.nome}
              </span>
            </div>

            <div className={`
              px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1
              ${perfil?.sexo === 'masculino' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                perfil?.sexo === 'feminino' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 
                'bg-zinc-800 text-zinc-400 border border-zinc-700'}
            `}>
              {perfil?.sexo === 'masculino' && <>♂ Masculino</>}
              {perfil?.sexo === 'feminino' && <>♀ Feminino</>}
              {!perfil?.sexo && <>◈ Status N/A</>}
            </div>
          </div>

          {/* AVATAR COM BORDA DINÂMICA */}
          <div className="relative mb-4 z-10">
            <div className={`absolute inset-0 rounded-full ${corNivel.bg}/20 blur-2xl`}></div>
            <img 
              src={perfil?.foto || "https://via.placeholder.com/150"} 
              className={`w-28 h-28 rounded-full object-cover border-4 p-1 shadow-xl transition-all duration-500 ${corNivel.border} ${corNivel.shadow}`}
              alt=""
            />
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase italic shadow-lg transition-colors duration-500 ${corNivel.bg}`}>
              LVL {perfil?.nivel || 1}
            </div>
          </div>

          {/* USERNAME DINÂMICO */}
          <h2 className={`text-3xl font-black uppercase italic tracking-tighter leading-none z-10 transition-colors duration-500 ${corNivel.cor}`}>
            @{perfil?.username}
          </h2>

          {perfil?.bio && (
            <p className="text-zinc-500 text-xs mt-3 px-6 text-center italic leading-relaxed z-10">
              "{perfil.bio}"
            </p>
          )}

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4 w-full mt-6 border-t border-zinc-800/30 pt-6 z-10">
            <div className="text-center">
              <p className="text-xl font-black">{perfil?.peso || "--"}kg</p>
              <p className="text-[8px] text-zinc-600 uppercase font-black">Peso</p>
            </div>
            <div className="text-center bg-zinc-800/40 py-2 rounded-2xl border border-zinc-800/50 shadow-inner">
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
              <p className={`text-sm font-black ${abaAtiva === "seguidores" ? corNivel.cor : "text-white"}`}>{stats.seguidores}</p>
              <p className="text-[8px] text-zinc-600 uppercase font-black">Recrutas</p>
            </button>
            <button onClick={() => setAbaAtiva("seguindo")} className="text-center active:scale-90 transition-transform">
              <p className={`text-sm font-black ${abaAtiva === "seguindo" ? corNivel.cor : "text-white"}`}>{stats.seguindo}</p>
              <p className="text-[8px] text-zinc-600 uppercase font-black">Seguindo</p>
            </button>
          </div>
        </motion.div>
        
        <div className="mb-8 px-2">
            <div className="flex justify-between items-end mb-1.5 px-1">
                <span className={`text-[9px] font-black uppercase italic ${corNivel.cor}`}>Evolução de Rank</span>
                <span className="text-[9px] font-black text-zinc-600">{perfil?.xp || 0} / {status.max} XP</span>
            </div>
            <div className="h-2.5 bg-zinc-900 rounded-full border border-zinc-800/50 p-0.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${progresso}%` }} 
                  className={`h-full rounded-full transition-all duration-700 ${corNivel.bg} ${corNivel.shadow}`} 
                />
            </div>
        </div>

        <div className="flex bg-zinc-900/50 p-1 rounded-2xl mb-8 border border-zinc-800/50">
          <button onClick={() => setAbaAtiva("meus_treinos")} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${abaAtiva === "meus_treinos" ? `${corNivel.bg} text-black shadow-lg` : "text-zinc-500"}`}>Arsenal</button>
          <button onClick={() => setAbaAtiva("registros")} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${abaAtiva === "registros" ? `${corNivel.bg} text-black shadow-lg` : "text-zinc-500"}`}>Registros</button>
          <button onClick={() => setAbaAtiva("salvos")} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${abaAtiva === "salvos" ? `${corNivel.bg} text-black shadow-lg` : "text-zinc-500"}`}>Salvos</button>
        </div>

        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div key={abaAtiva} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {abaAtiva === "meus_treinos" && (
                <div className="space-y-4">
                  {treinos.length > 0 ? treinos.map(t => (
                    <div key={t.id} className="relative group">
                      <TreinoCard treino={t} />
                      {isProprioPerfil && (
                        <button onClick={() => excluirTreino(t.id)} className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-red-500 p-2 rounded-full border border-zinc-700 shadow-lg z-10 active:scale-90 transition-all md:opacity-0 md:group-hover:opacity-100">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" /></svg>
                        </button>
                      )}
                    </div>
                  )) : <p className="text-center py-10 text-zinc-700 text-[10px] font-bold uppercase italic font-black">Vazio.</p>}
                </div>
              )}

              {abaAtiva === "registros" && (
                <div className="space-y-4">
                  {isProprioPerfil && (
                    <label className="block w-full cursor-pointer">
                      <div className="flex items-center justify-center py-4 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all group">
                        <span className={`text-[10px] font-black uppercase italic group-hover:${corNivel.cor}`}>
                          {uploading ? "Subindo Arquivo..." : "Novo Registro Visual +"}
                        </span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleUploadRegistro} className="hidden" />
                    </label>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {postagens.map((post) => (
                      <div key={post.id} className="relative group overflow-hidden rounded-2xl aspect-square border border-zinc-800">
                        <img src={post.imagem_url} onClick={() => setImagemSelecionada(post.imagem_url)} className="w-full h-full object-cover cursor-pointer active:scale-95 transition-transform" alt="" />
                        {isProprioPerfil && (
                          <button onClick={(e) => { e.stopPropagation(); excluirPostagem(post.id); }} className="absolute top-1 right-1 bg-black/60 backdrop-blur-md text-red-500 p-2 rounded-lg border border-zinc-700 z-10 active:scale-90 transition-all md:opacity-0 md:group-hover:opacity-100">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" /></svg>
                          </button>
                        )}
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

              {abaAtiva === "seguidores" && <RenderListaUsuarios lista={listaSeguidores} />}
              {abaAtiva === "seguindo" && <RenderListaUsuarios lista={listaSeguindo} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {imagemSelecionada && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setImagemSelecionada(null)} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
              <img src={imagemSelecionada} className={`max-w-full max-h-[85vh] rounded-3xl border shadow-2xl ${corNivel.border}`} alt="" />
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )
}

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