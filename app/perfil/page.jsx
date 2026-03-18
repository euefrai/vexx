"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import TreinoCard from "@/components/TreinoCard"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export default function Perfil() {
  const [perfil, setPerfil] = useState(null)
  const [treinos, setTreinos] = useState([])
  const [treinosCurtidos, setTreinosCurtidos] = useState([])
  const [postagens, setPostagens] = useState([]) 
  const [abaAtiva, setAbaAtiva] = useState("meus_treinos")
  const [likesRecebidos, setLikesRecebidos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false) // Estado para o upload
  const [seguidoresCount, setSeguidoresCount] = useState(0)
  const [seguindoCount, setSeguindoCount] = useState(0)

  // ... (Funções getInfoIMC e getStatusEvolucao mantidas iguais)
  const getInfoIMC = () => {
    if (!perfil?.peso || !perfil?.altura) return { valor: "--", label: "Sem dados", cor: "text-zinc-500" }
    const imc = (perfil.peso / (perfil.altura * perfil.altura)).toFixed(1)
    if (imc < 18.5) return { valor: imc, label: "Abaixo do Peso", cor: "text-blue-400" }
    if (imc < 25) return { valor: imc, label: "Peso Ideal", cor: "text-green-500" }
    if (imc < 30) return { valor: imc, label: "Sobrepeso", cor: "text-yellow-500" }
    return { valor: imc, label: "Obesidade", cor: "text-red-500" }
  }

  const infoIMC = getInfoIMC()

  function getStatusEvolucao(xp = 0) {
    if (xp >= 8000) return { nome: "aura", cor: "text-red-500", icon: "⚡", min: 8000, max: 20000 }
    if (xp >= 4000) return { nome: "no have enemies", cor: "text-purple-500", icon: "🛡️", min: 4000, max: 8000 }
    if (xp >= 2000) return { nome: "high cortisol", cor: "text-blue-500", icon: "🦅", min: 2000, max: 4000 }
    if (xp >= 1000) return { nome: "beta", cor: "text-yellow-500", icon: "⚔️", min: 1000, max: 2000 }
    if (xp >= 500) return { nome: "frango", cor: "text-green-500", icon: "🎖️", min: 500, max: 1000 }
    return { nome: "RECRUTA", cor: "text-zinc-500", icon: "🔰", min: 0, max: 500 }
  }

  const status = getStatusEvolucao(perfil?.xp || 0)
  const progresso = perfil ? Math.min(Math.max(((perfil.xp - status.min) / (status.max - status.min)) * 100, 0), 100) : 0

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profileData } = await supabase.from("usuarios").select("*").eq("id", authUser.id).single()
      if (profileData) setPerfil(profileData)

      const { data: treinosData } = await supabase.from("treinos").select(`*, usuarios (username, foto)`).eq("usuario_id", authUser.id).order("created_at", { ascending: false })
      setTreinos(treinosData || [])

      const { data: postsData } = await supabase.from("postagens").select("*").eq("usuario_id", authUser.id).order("created_at", { ascending: false })
      setPostagens(postsData || [])

      const { data: curtidosData } = await supabase.from("likes").select(`treinos (*, usuarios (username, foto))`).eq("user_id", authUser.id)
      setTreinosCurtidos(curtidosData?.map(item => item.treinos).filter(t => t !== null) || [])

      if (treinosData?.length > 0) {
        const ids = treinosData.map(t => t.id)
        const { count } = await supabase.from("likes").select("*", { count: 'exact', head: true }).in("treino_id", ids)
        setLikesRecebidos(count || 0)
      }

      const { count: cSeg } = await supabase.from("seguidores").select("*", { count: 'exact', head: true }).eq("seguido_id", authUser.id)
      const { count: cSeguindo } = await supabase.from("seguidores").select("*", { count: 'exact', head: true }).eq("seguidor_id", authUser.id)
      setSeguidoresCount(cSeg || 0)
      setSeguindoCount(cSeguindo || 0)
    } finally { setLoading(false) }
  }

  // NOVA FUNÇÃO: Upload de Registro
  async function handleUploadRegistro(event) {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      const { data: { user } } = await supabase.auth.getUser()
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload para o Storage (Certifique-se que o bucket 'registros' existe e é público)
      let { error: uploadError } = await supabase.storage
        .from('registros')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Pegar a URL pública
      const { data: { publicUrl } } = supabase.storage.from('registros').getPublicUrl(filePath)

      // 3. Salvar no Banco de Dados
      // No handleUploadRegistro, mude apenas a parte do insert para testar:
      const { error: dbError } = await supabase.from('postagens').insert([
        {
          usuario_id: user.id,
          imagem_url: publicUrl,
          legenda: "" // Adicionei a legenda vazia caso ela seja obrigatória na sua tabela
        }
      ])
      

      if (dbError) throw dbError

      // Atualizar a lista local
      carregarDados()
      alert("Registro de guerra salvo com sucesso!")
    } catch (error) {
      alert("Erro ao subir registro: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black uppercase text-[10px] animate-pulse">CARREGANDO PERFIL...</div>

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-black uppercase italic tracking-tighter text-green-500">
            Elite Squad / Perfil
          </h1>
          <Link href="/configuracoes" className="p-2 bg-zinc-900 rounded-full border border-zinc-800 active:scale-90 transition-transform">⚙️</Link>
        </div>

        {/* HEADER DASHBOARD */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-6 bg-zinc-900/40 p-6 rounded-[3rem] border border-zinc-800 relative overflow-hidden">
          <div className="mb-3 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/40 border border-white/5">
            <span className="text-sm">{status.icon}</span>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${status.cor}`}>{status.nome}</span>
          </div>

          <div className="relative mb-4">
            <img src={perfil?.foto || "https://via.placeholder.com/150"} className="w-28 h-28 rounded-full object-cover border-4 border-green-500 p-1 shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase">
              LVL {Math.floor((perfil?.xp || 0) / 500) + 1}
            </div>
          </div>

          <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{perfil?.username || "Guerreiro"}</h2>
          
          {perfil?.bio && (
            <p className="text-zinc-400 text-xs mt-3 px-6 text-center italic font-medium leading-relaxed">
              "{perfil.bio}"
            </p>
          )}

          <div className="grid grid-cols-3 gap-4 w-full mt-6 border-t border-zinc-800/50 pt-6">
            <div className="text-center">
              <p className="text-lg font-black">{perfil?.peso || "--"}<span className="text-[10px] text-zinc-500 ml-0.5">KG</span></p>
              <p className="text-[8px] text-zinc-500 uppercase font-black">Peso</p>
            </div>
            <div className="text-center bg-zinc-800/30 py-1 rounded-2xl border border-zinc-800/50">
              <p className={`text-lg font-black ${infoIMC.cor}`}>{infoIMC.valor}</p>
              <p className="text-[8px] text-zinc-500 uppercase font-black">IMC</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black">{perfil?.altura || "--"}<span className="text-[10px] text-zinc-500 ml-0.5">M</span></p>
              <p className="text-[8px] text-zinc-500 uppercase font-black">Altura</p>
            </div>
          </div>

          <div className="w-full mt-4 bg-black/40 rounded-2xl p-3 border border-zinc-800/50">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">Análise de Rank Físico</span>
                <span className={`text-[9px] font-black uppercase italic ${infoIMC.cor}`}>{infoIMC.label}</span>
             </div>
             <div className="flex w-full h-1 gap-1">
                <div className={`flex-1 rounded-full ${perfil?.peso && infoIMC.valor < 18.5 ? "bg-blue-400" : "bg-zinc-800"}`} />
                <div className={`flex-1 rounded-full ${perfil?.peso && infoIMC.valor >= 18.5 && infoIMC.valor < 25 ? "bg-green-500" : "bg-zinc-800"}`} />
                <div className={`flex-1 rounded-full ${perfil?.peso && infoIMC.valor >= 25 && infoIMC.valor < 30 ? "bg-yellow-500" : "bg-zinc-800"}`} />
                <div className={`flex-1 rounded-full ${perfil?.peso && infoIMC.valor >= 30 ? "bg-red-500" : "bg-zinc-800"}`} />
             </div>
          </div>

          <div className="flex gap-6 mt-6">
            <div className="text-center">
              <p className="text-sm font-black text-white">{seguidoresCount}</p>
              <p className="text-[9px] text-zinc-500 uppercase font-black">Seguidores</p>
            </div>
            <div className="w-[1px] h-6 bg-zinc-800 self-center" />
            <div className="text-center">
              <p className="text-sm font-black text-white">{seguindoCount}</p>
              <p className="text-[9px] text-zinc-500 uppercase font-black">Seguindo</p>
            </div>
          </div>
        </motion.div>
        
        {/* BARRA DE XP */}
        <div className="mb-8 px-2">
            <div className="flex justify-between items-end mb-1.5">
                <span className={`text-[9px] font-black uppercase ${status.cor}`}>Evolução de Rank</span>
                <span className="text-[9px] font-black text-zinc-500">{perfil?.xp || 0} / {status.max} XP</span>
            </div>
            <div className="h-2.5 bg-zinc-900 rounded-full border border-zinc-800 p-0.5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progresso}%` }} className="h-full bg-green-500 rounded-full" />
            </div>
        </div>

        {/* BARRA DE ABAS TÁTICA */}
        <div className="flex gap-2 mb-8">
          <button onClick={() => setAbaAtiva("meus_treinos")} className={`flex-1 flex flex-col items-center py-4 rounded-[1.5rem] border transition-all ${abaAtiva === "meus_treinos" ? "bg-green-500 border-green-400 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-zinc-900 border-zinc-800 text-white"}`}>
            <p className="text-lg font-black leading-none">{treinos.length}</p>
            <p className="text-[8px] uppercase font-black opacity-60 italic tracking-tighter">Arsenal</p>
          </button>
          
          <button onClick={() => setAbaAtiva("registros")} className={`flex-1 flex flex-col items-center py-4 rounded-[1.5rem] border transition-all ${abaAtiva === "registros" ? "bg-green-500 border-green-400 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-zinc-900 border-zinc-800 text-white"}`}>
            <p className="text-lg font-black leading-none">{postagens.length}</p>
            <p className="text-[8px] uppercase font-black opacity-60 italic tracking-tighter">Registros</p>
          </button>

          <button onClick={() => setAbaAtiva("curtidos")} className={`flex-1 flex flex-col items-center py-4 rounded-[1.5rem] border transition-all ${abaAtiva === "curtidos" ? "bg-green-500 border-green-400 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-zinc-900 border-zinc-800 text-white"}`}>
            <p className="text-lg font-black leading-none">{likesRecebidos}</p>
            <p className="text-[8px] uppercase font-black opacity-60 italic tracking-tighter">Respeito</p>
          </button>
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div key={abaAtiva} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              
              {/* ABA ARSENAL */}
              {abaAtiva === "meus_treinos" && (
                <div className="space-y-4">
                  {treinos.length > 0 ? treinos.map(t => <TreinoCard key={t.id} treino={t} />) : <p className="text-center text-zinc-700 py-10 text-[9px] font-black uppercase italic tracking-widest">Arsenal vazio.</p>}
                </div>
              )}

              {/* ABA REGISTROS (GRID) */}
              {abaAtiva === "registros" && (
                <div className="space-y-4">
                  {/* Botão de Upload Novo */}
                  <label className="block w-full cursor-pointer group">
                    <div className="flex items-center justify-center gap-2 w-full py-4 rounded-[1.5rem] border border-dashed border-zinc-700 bg-zinc-900/20 group-hover:border-green-500 transition-colors">
                      <span className="text-lg">{uploading ? "⏳" : "📸"}</span>
                      <span className="text-[10px] font-black uppercase italic text-zinc-500 group-hover:text-green-500">
                        {uploading ? "Enviando Prova..." : "Adicionar Novo Registro"}
                      </span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleUploadRegistro} disabled={uploading} className="hidden" />
                  </label>

                  {(perfil?.registros_publicos || true) ? (
                    <div className="grid grid-cols-3 gap-1 rounded-[2rem] overflow-hidden border border-zinc-900 bg-zinc-900/20 p-1">
                      {postagens.length > 0 ? (
                        postagens.map((post) => (
                          <motion.div whileTap={{ scale: 0.95 }} key={post.id} className="aspect-square relative group">
                            <img src={post.imagem_url} alt="Registro" className="w-full h-full object-cover rounded-lg" />
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-3 py-20 text-center">
                           <p className="text-[9px] font-black text-zinc-700 uppercase italic">Nenhum registro de guerra.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-20 text-center bg-zinc-900/40 rounded-[2rem] border border-zinc-800 border-dashed">
                       <p className="text-2xl mb-2">🔒</p>
                       <p className="text-[9px] font-black text-zinc-500 uppercase italic">Registros Privados</p>
                    </div>
                  )}
                </div>
              )}

              {/* ABA RESPEITO */}
              {abaAtiva === "curtidos" && (
                <div className="space-y-4">
                  {treinosCurtidos.length > 0 ? treinosCurtidos.map((t, idx) => <TreinoCard key={idx} treino={t} />) : <p className="text-center text-zinc-700 py-10 text-[9px] font-black uppercase italic tracking-widest">Nenhuma honra recebida.</p>}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
      <Navbar />
    </>
  )
 
}