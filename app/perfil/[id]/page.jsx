"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import TreinoCard from "@/components/TreinoCard"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export default function PerfilPublico() {
  const { id } = useParams()
  const router = useRouter()
  
  const [perfil, setPerfil] = useState(null)
  const [treinos, setTreinos] = useState([])
  const [treinosCurtidos, setTreinosCurtidos] = useState([])
  const [postagens, setPostagens] = useState([]) 
  const [listaSeguidores, setListaSeguidores] = useState([])
  const [listaSeguindo, setListaSeguindo] = useState([])
  const [loading, setLoading] = useState(true)
  const [souEu, setSouEu] = useState(false) // Controla a exibição dos botões
  const [stats, setStats] = useState({ seguidores: 0, seguindo: 0 })
  const [seguindoStatus, setSeguindoStatus] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState("treinos")
  const [imagemSelecionada, setImagemSelecionada] = useState(null)

  const getInfoIMC = () => {
    if (!perfil?.peso || !perfil?.altura) return { valor: "--", label: "Sem dados", cor: "text-zinc-500" }
    const imc = (perfil.peso / (perfil.altura * perfil.altura)).toFixed(1)
    if (imc < 18.5) return { valor: imc, label: "Abaixo", cor: "text-blue-400" }
    if (imc < 25) return { valor: imc, label: "Ideal", cor: "text-green-500" }
    if (imc < 30) return { valor: imc, label: "Sobrepeso", cor: "text-yellow-500" }
    return { valor: imc, label: "Obesidade", cor: "text-red-500" }
  }

  useEffect(() => {
    if (id) carregarPerfil()
  }, [id])

  async function carregarPerfil() {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      // VERIFICAÇÃO CRÍTICA: Compara o ID da URL com o ID logado
      if (authUser && id) {
        if (authUser.id === id) {
          setSouEu(true)
        } else {
          setSouEu(false)
          // Verifica se já segue
          const { data: followData } = await supabase
            .from("seguidores")
            .select("*")
            .eq("seguidor_id", authUser.id)
            .eq("seguido_id", id)
            .single()
          if (followData) setSeguindoStatus(true)
        }
      }

      // Resto do carregamento...
      const { data: userData } = await supabase.from("usuarios").select("*").eq("id", id).single()
      if (userData) {
        setPerfil(userData)
        const { data: treinosData } = await supabase.from("treinos").select("*").eq("usuario_id", id).order("created_at", { ascending: false })
        const treinosComPerfil = treinosData?.map(t => ({ ...t, usuarios: userData })) || []
        setTreinos(treinosComPerfil)

        const { data: postsData } = await supabase.from("postagens").select("*").eq("usuario_id", id).order("created_at", { ascending: false })
        setPostagens(postsData || [])
      }

      const { data: curtidasData } = await supabase.from("likes").select("treino_id, treinos(*, usuarios(*))").eq("user_id", id)
      const curtidosFormatados = curtidasData?.map(item => item.treinos).filter(Boolean) || []
      setTreinosCurtidos(curtidosFormatados)

      const { data: segData } = await supabase.from("seguidores").select("usuarios!seguidores_seguidor_id_fkey(id, username, foto)").eq("seguido_id", id)
      setListaSeguidores(segData?.map(s => s.usuarios) || [])

      const { data: seguindoData } = await supabase.from("seguidores").select("usuarios!seguidores_seguido_id_fkey(id, username, foto)").eq("seguidor_id", id)
      setListaSeguindo(seguindoData?.map(s => s.usuarios) || [])

      setStats({ seguidores: segData?.length || 0, seguindo: seguindoData?.length || 0 })

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleSeguir() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return router.push("/login")
      if (seguindoStatus) {
        await supabase.from("seguidores").delete().eq("seguidor_id", authUser.id).eq("seguido_id", id)
        setSeguindoStatus(false)
        setStats(prev => ({ ...prev, seguidores: Math.max(0, prev.seguidores - 1) }))
      } else {
        await supabase.from("seguidores").insert({ seguidor_id: authUser.id, seguido_id: id })
        setSeguindoStatus(true)
        setStats(prev => ({ ...prev, seguidores: prev.seguidores + 1 }))
      }
    } catch (err) { console.error(err) }
  }

  const RenderListaUsuarios = ({ lista }) => (
    <div className="space-y-3">
      {lista.length > 0 ? lista.map(u => (
        <Link href={`/perfil/${u.id}`} key={u.id} className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50 active:scale-95 transition-all">
          <img src={u.foto || "https://via.placeholder.com/150"} className="w-10 h-10 rounded-full object-cover border border-green-500/30" />
          <span className="text-sm font-black uppercase italic text-zinc-200">@{u.username}</span>
        </Link>
      )) : <p className="text-center py-10 text-zinc-700 text-[10px] font-black uppercase italic">Vazio.</p>}
    </div>
  )

  const infoIMC = getInfoIMC()

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-black italic animate-pulse">RASTREANDO GUERREIRO...</div>

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">← Voltar</button>
          <h1 className="text-lg font-black uppercase italic text-green-500 tracking-tighter shadow-green-500/10">Dossiê de Guerra</h1>
          <div className="w-10"></div>
        </div>

        {/* INFO DO PERFIL */}
        <div className="flex flex-col items-center mb-6 bg-zinc-900/30 p-6 rounded-[2.5rem] border border-zinc-800/50 shadow-xl">
          <div className="flex gap-2 mb-4">
             <div className="bg-green-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase italic">LVL {perfil?.nivel || 1}</div>
             <div className="bg-zinc-800 text-zinc-400 text-[9px] font-black px-3 py-1 rounded-full uppercase italic">
                {perfil?.sexo === 'masculino' ? '♂ Masc' : perfil?.sexo === 'feminino' ? '♀ Fem' : '◈'}
             </div>
          </div>

          <img src={perfil?.foto || "https://via.placeholder.com/150"} className="w-24 h-24 rounded-full object-cover border-4 border-green-500 p-1 mb-4 shadow-lg shadow-green-500/20" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">@{perfil?.username}</h2>
          {perfil?.bio && <p className="text-zinc-500 text-xs italic mt-2 px-4 text-center">"{perfil.bio}"</p>}

          <div className="grid grid-cols-3 gap-3 w-full mt-6 pt-6 border-t border-zinc-800/50">
             <div className="text-center">
                <p className="text-sm font-black">{perfil?.peso || "--"}kg</p>
                <p className="text-[8px] text-zinc-600 uppercase font-black">Peso</p>
             </div>
             <div className="text-center border-x border-zinc-800/50">
                <p className={`text-sm font-black ${infoIMC.cor}`}>{infoIMC.valor}</p>
                <p className="text-[8px] text-zinc-600 uppercase font-black">IMC</p>
             </div>
             <div className="text-center">
                <p className="text-sm font-black">{perfil?.altura || "--"}m</p>
                <p className="text-[8px] text-zinc-600 uppercase font-black">Altura</p>
             </div>
          </div>

          {/* BOTÕES: SÓ APARECEM SE NÃO FOR O MEU PERFIL */}
          {!souEu && (
            <div className="flex gap-2 w-full mt-6">
              <button 
                onClick={toggleSeguir} 
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg ${
                  seguindoStatus 
                  ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' 
                  : 'bg-green-500 text-black shadow-green-500/20'
                }`}
              >
                {seguindoStatus ? "Seguindo" : "Seguir +"}
              </button>
              
              <button 
                onClick={() => router.push(`/chat/${id}`)}
                className="px-6 py-3 bg-zinc-800 text-zinc-400 rounded-2xl border border-zinc-700 hover:bg-green-500 hover:text-black transition-all"
              >
                💬
              </button>
            </div>
          )}
        </div>

        {/* STATS */}
        <div className="flex justify-around mb-8 px-4">
            <button onClick={() => setAbaAtiva("seguidores")} className="text-center">
                <p className={`font-black text-lg leading-none ${abaAtiva === "seguidores" ? "text-green-500" : "text-white"}`}>{stats.seguidores}</p>
                <p className="text-[8px] text-zinc-600 uppercase font-bold mt-1">Recrutas</p>
            </button>
            <button onClick={() => setAbaAtiva("seguindo")} className="text-center">
                <p className={`font-black text-lg leading-none ${abaAtiva === "seguindo" ? "text-green-500" : "text-white"}`}>{stats.seguindo}</p>
                <p className="text-[8px] text-zinc-600 uppercase font-bold mt-1">Seguindo</p>
            </button>
        </div>

        {/* SELETOR DE ABAS */}
        <div className="flex bg-zinc-900/50 p-1 rounded-2xl mb-6 border border-zinc-800/50 overflow-x-auto no-scrollbar">
          <button onClick={() => setAbaAtiva("treinos")} className={`flex-1 min-w-[80px] py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${abaAtiva === "treinos" ? "bg-green-500 text-black shadow-md" : "text-zinc-500"}`}>Arsenal</button>
          <button onClick={() => setAbaAtiva("fotos")} className={`flex-1 min-w-[80px] py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${abaAtiva === "fotos" ? "bg-green-500 text-black shadow-md" : "text-zinc-500"}`}>Registros</button>
          <button onClick={() => setAbaAtiva("curtidos")} className={`flex-1 min-w-[80px] py-3 rounded-xl text-[8px] font-black uppercase italic transition-all ${abaAtiva === "curtidos" ? "bg-green-500 text-black shadow-md" : "text-zinc-500"}`}>Salvos</button>
        </div>

        {/* CONTEÚDO */}
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            {abaAtiva === "treinos" && (
              <motion.div key="treinos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {treinos.length > 0 ? treinos.map(t => <TreinoCard key={t.id} treino={t} />) : <p className="text-center py-10 text-zinc-700 text-[10px] font-bold uppercase italic">Vazio.</p>}
              </motion.div>
            )}
            
            {abaAtiva === "fotos" && (
              <motion.div key="fotos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col space-y-4">
                {postagens.length > 0 ? postagens.map(p => (
                  <div key={p.id} className="bg-zinc-900/50 rounded-3xl p-4 border border-zinc-800/50">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={perfil?.foto || "https://via.placeholder.com/150"} className="w-8 h-8 rounded-full object-cover border border-green-500" />
                      <span className="text-[10px] font-black uppercase italic tracking-tighter">@{perfil?.username}</span>
                    </div>
                    <img 
                      src={p.imagem_url} 
                      onClick={() => setImagemSelecionada(p.imagem_url)} 
                      className="w-full aspect-square object-cover rounded-2xl border border-zinc-800 cursor-pointer active:scale-[0.98] transition-transform" 
                    />
                  </div>
                )) : <p className="text-center py-10 text-zinc-700 text-[10px] font-bold uppercase italic">Sem registros visuais.</p>}
              </motion.div>
            )}

            {abaAtiva === "curtidos" && (
              <motion.div key="curtidos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {treinosCurtidos.length > 0 ? treinosCurtidos.map(t => <TreinoCard key={t.id} treino={t} />) : <p className="text-center py-10 text-zinc-700 text-[10px] font-bold uppercase italic">Nenhuma referência salva.</p>}
              </motion.div>
            )}

            {abaAtiva === "seguidores" && <motion.div key="seg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><RenderListaUsuarios lista={listaSeguidores} /></motion.div>}
            {abaAtiva === "seguindo" && <motion.div key="segui" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><RenderListaUsuarios lista={listaSeguindo} /></motion.div>}
            
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {imagemSelecionada && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setImagemSelecionada(null)} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <img src={imagemSelecionada} className="max-w-full max-h-[80vh] rounded-3xl border border-zinc-800 shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
    </>
  )
}