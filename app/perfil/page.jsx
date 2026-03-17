"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import TreinoCard from "@/components/TreinoCard"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export default function Perfil() {
  const [perfil, setPerfil] = useState(null)
  const [username, setUsername] = useState("")
  const [foto, setFoto] = useState("")
  const [treinos, setTreinos] = useState([])
  const [treinosCurtidos, setTreinosCurtidos] = useState([])
  const [abaAtiva, setAbaAtiva] = useState("meus_treinos")
  const [likesRecebidos, setLikesRecebidos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [seguidoresCount, setSeguidoresCount] = useState(0)
  const [seguindoCount, setSeguindoCount] = useState(0)
  const [modalLista, setModalLista] = useState({ aberto: false, titulo: "", lista: [] })

  // LÓGICA DINÂMICA DE PATENTES E XP
  function getStatusEvolucao(xp = 0) {
 
    if (xp >= 8000) return { nome: "aura", cor: "text-red-500", icon: "⚡" }
    if (xp >= 4000) return { nome: "no have enemies", cor: "text-purple-500", icon: "🛡️" }
    if (xp >= 2000) return { nome: "high cortisol", cor: "text-blue-500", icon: "🦅" }
    if (xp >= 1000) return { nome: "beta", cor: "text-yellow-500", icon: "⚔️" }
    if (xp >= 500) return { nome: "frango", cor: "text-green-500", icon: "🎖️" }
    return { nome: "RECRUTA", cor: "text-zinc-500", icon: "🔰" }
  }

  const status = getStatusEvolucao(perfil?.xp || 0)
  
  // Cálculo de progresso baseado na faixa da patente atual
  const xpNaFaixa = (perfil?.xp || 0) - status.min
  const totalNecessarioNaFaixa = status.max - status.min
  const progresso = Math.min(Math.max((xpNaFaixa / totalNecessarioNaFaixa) * 100, 0), 100)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profileData } = await supabase.from("usuarios").select("*").eq("id", authUser.id).single()
      if (profileData) {
        setPerfil(profileData)
        setUsername(profileData.username || "")
        setFoto(profileData.foto || "")
      }

      const { data: treinosData } = await supabase.from("treinos").select("*").eq("usuario_id", authUser.id).order("created_at", { ascending: false })
      setTreinos(treinosData || [])

      const { data: curtidosData } = await supabase.from("likes").select("treinos(*)").eq("user_id", authUser.id)
      const listaCurtidos = curtidosData?.map(item => item.treinos).filter(t => t !== null) || []
      setTreinosCurtidos(listaCurtidos)

      if (treinosData?.length > 0) {
        const ids = treinosData.map(t => t.id)
        const { count } = await supabase.from("likes").select("*", { count: 'exact', head: true }).in("treino_id", ids)
        setLikesRecebidos(count || 0)
      }

      const { count: countSeguidores } = await supabase.from("seguidores").select("*", { count: 'exact', head: true }).eq("seguido_id", authUser.id)
      const { count: countSeguindo } = await supabase.from("seguidores").select("*", { count: 'exact', head: true }).eq("seguidor_id", authUser.id)
      
      setSeguidoresCount(countSeguidores || 0)
      setSeguindoCount(countSeguindo || 0)

    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    } finally {
      setLoading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ x: -20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }}
            className="text-xl font-black uppercase italic tracking-tighter text-green-500"
          >
            Elite Squad / Perfil
          </motion.h1>
          <Link href="/configuracoes" className="p-2 bg-zinc-900 rounded-full border border-zinc-800">⚙️</Link>
        </div>

        {/* HEADER DASHBOARD */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mb-8 bg-zinc-900/40 p-6 rounded-[3rem] border border-zinc-800 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full" />
          
          {/* PATENTE ACIMA DA FOTO */}
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-3 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm"
          >
            <span className="text-sm">{status.icon}</span>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${status.cor}`}>
              {status.nome}
            </span>
          </motion.div>

          <div className="relative mb-4">
            <motion.img 
              whileHover={{ scale: 1.05 }}
              src={foto || "https://via.placeholder.com/150"} 
              className="w-32 h-32 rounded-full object-cover border-4 border-green-500 p-1 shadow-[0_0_30px_rgba(34,197,94,0.4)]" 
            />
            <motion.div 
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-black px-5 py-1 rounded-full shadow-lg"
            >
              NÍVEL {Math.floor((perfil?.xp || 0) / 500) + 1}
            </motion.div>
          </div>

          <h2 className="text-3xl font-black uppercase italic tracking-tighter">{username || "Guerreiro"}</h2>

          {perfil?.bio && (
            <p className="text-zinc-400 text-sm mt-2 px-4 text-center italic font-medium leading-relaxed max-w-[280px]">
              "{perfil.bio}"
            </p>
          )}

          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-lg font-black text-white">{seguidoresCount}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-black">Seguidores</p>
            </div>
            <div className="w-[1px] h-8 bg-zinc-800 self-center" />
            <div className="text-center">
              <p className="text-lg font-black text-white">{seguindoCount}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-black">Seguindo</p>
            </div>
          </div>
        </motion.div>
        
        {/* BARRA DE XP DINÂMICA */}
        <motion.div variants={item} initial="hidden" animate="show" className="mb-8">
            <div className="flex justify-between items-end mb-2 px-2">
                <span className={`text-[10px] font-black uppercase ${status.cor}`}>Rumo ao próximo Rank</span>
                <span className="text-[10px] font-black text-zinc-400">
                  {perfil?.xp || 0} / {status.max} XP
                </span>
            </div>
            <div className="h-4 bg-zinc-900 rounded-full border border-zinc-800 p-1 overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progresso}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-green-600 via-green-400 to-green-300 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                />
            </div>
        </motion.div>

        {/* ATRIBUTOS RÁPIDOS */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 mb-10"
        >
          <motion.button 
            variants={item}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAbaAtiva("meus_treinos")}
            className={`flex flex-col items-center p-5 rounded-[2.5rem] border transition-all ${abaAtiva === "meus_treinos" ? "bg-green-500 border-green-400 text-black shadow-[0_10px_20px_rgba(34,197,94,0.2)]" : "bg-zinc-900 border-zinc-800 text-white"}`}
          >
            <span className="text-2xl mb-1">⚔️</span>
            <p className="text-2xl font-black">{treinos.length}</p>
            <p className={`text-[9px] uppercase font-black tracking-tighter ${abaAtiva === "meus_treinos" ? "text-black/60" : "text-zinc-500"}`}>Arsenal</p>
          </motion.button>

          <motion.button 
            variants={item}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAbaAtiva("curtidos")}
            className={`flex flex-col items-center p-5 rounded-[2.5rem] border transition-all ${abaAtiva === "curtidos" ? "bg-green-500 border-green-400 text-black shadow-[0_10px_20px_rgba(34,197,94,0.2)]" : "bg-zinc-900 border-zinc-800 text-white"}`}
          >
            <span className="text-2xl mb-1">⚡</span>
            <p className="text-2xl font-black">{likesRecebidos}</p>
            <p className={`text-[9px] uppercase font-black tracking-tighter ${abaAtiva === "curtidos" ? "text-black/60" : "text-zinc-500"}`}>Respeito</p>
          </motion.button>
        </motion.div>

        {/* FEED DO PERFIL */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6 px-2">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {abaAtiva === "meus_treinos" ? "Treinos Criados" : "Treinos Favoritos"}
            </h3>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={abaAtiva}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {abaAtiva === "meus_treinos" ? (
                treinos.length > 0 ? (
                  treinos.map(t => <TreinoCard key={t.id} treino={t} />)
                ) : (
                  <p className="text-center text-zinc-600 py-10 text-[10px] font-black uppercase">O arsenal está vazio.</p>
                )
              ) : (
                treinosCurtidos.length > 0 ? (
                  treinosCurtidos.map(t => <TreinoCard key={t.id} treino={t} />)
                ) : (
                  <p className="text-center text-zinc-600 py-10 text-[10px] font-black uppercase">Nenhum favorito encontrado.</p>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <Navbar />
    </>
  )
}