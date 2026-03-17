"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import TreinoCard from "@/components/TreinoCard"

export default function PerfilPublico() {
  const { id } = useParams()
  const router = useRouter()
  
  const [perfil, setPerfil] = useState(null)
  const [treinos, setTreinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [souEu, setSouEu] = useState(false)
  const [stats, setStats] = useState({ seguidores: 0, seguindo: 0 })
  const [seguindoStatus, setSeguindoStatus] = useState(false)

  useEffect(() => {
    carregarPerfil()
  }, [id])

  async function carregarPerfil() {
    try {
      setLoading(true)
      
      // 1. Verifica sessão e se o perfil é do próprio usuário
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser?.id === id) {
        setSouEu(true)
      } else if (authUser) {
        // Verifica se eu já sigo esse usuário
        const { data: followData } = await supabase
          .from("seguidores")
          .select("*")
          .eq("seguidor_id", authUser.id)
          .eq("seguido_id", id)
          .single()
        
        if (followData) setSeguindoStatus(true)
      }

      // 2. Busca dados do usuário (Username, Foto, Nível)
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", id)
        .single()

      if (userError) throw userError
      setPerfil(userData)

      // 3. Busca os treinos postados
      const { data: treinosData } = await supabase
        .from("treinos")
        .select("*")
        .eq("usuario_id", id)
        .order("created_at", { ascending: false })
      
      setTreinos(treinosData || [])

      // 4. Busca Contadores (Seguidores e Seguindo)
      const { count: segCount } = await supabase
        .from("seguidores")
        .select("*", { count: 'exact', head: true })
        .eq("seguido_id", id)

      const { count: followingCount } = await supabase
        .from("seguidores")
        .select("*", { count: 'exact', head: true })
        .eq("seguidor_id", id)

      setStats({ 
        seguidores: segCount || 0, 
        seguindo: followingCount || 0 
      })

    } catch (err) {
      console.error("Erro ao carregar perfil:", err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleSeguir() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push("/login")
        return
      }

      if (seguindoStatus) {
        // Lógica para Deixar de Seguir
        const { error } = await supabase
          .from("seguidores")
          .delete()
          .eq("seguidor_id", authUser.id)
          .eq("seguido_id", id)

        if (error) throw error
        
        setSeguindoStatus(false)
        setStats(prev => ({ ...prev, seguidores: Math.max(0, prev.seguidores - 1) }))
      } else {
        // Lógica para Seguir
        const { error } = await supabase
          .from("seguidores")
          .insert({
            seguidor_id: authUser.id,
            seguido_id: id
          })

        if (error) throw error
        
        setSeguindoStatus(true)
        setStats(prev => ({ ...prev, seguidores: prev.seguidores + 1 }))
      }
    } catch (err) {
      console.error("Erro na ação de seguir:", err)
      alert("Erro ao processar: " + err.message)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center font-black italic animate-pulse">
      RASTREANDO GUERREIRO...
    </div>
  )

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="text-zinc-500 font-bold text-xs uppercase tracking-tighter">← Voltar</button>
          <h1 className="text-lg font-black uppercase italic text-green-500">Elite Squad</h1>
          <div className="w-10"></div>
        </div>

        {/* INFO DO PERFIL */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <img 
              src={perfil?.foto || "https://via.placeholder.com/150"} 
              className="w-24 h-24 rounded-full object-cover border-2 border-green-500 p-1 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[9px] font-black px-3 py-0.5 rounded-full">
              LVL {perfil?.nivel || 1}
            </div>
          </div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter">@{perfil?.username || "Guerreiro"}</h2>
          
          {souEu ? (
            <button 
              onClick={() => router.push('/perfil')} 
              className="mt-4 w-full py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-black uppercase"
            >
              Editar Meu Perfil
            </button>
          ) : (
            <button 
              onClick={toggleSeguir}
              className={`mt-4 w-full py-2 rounded-lg text-[10px] font-black uppercase transition-all shadow-lg ${
                seguindoStatus 
                ? 'bg-zinc-800 text-white border border-zinc-700' 
                : 'bg-green-500 text-black shadow-green-500/20'
              }`}
            >
              {seguindoStatus ? "Seguindo" : "Seguir +"}
            </button>
          )}
        </div>

        {/* ESTATÍSTICAS (3 COLUNAS) */}
        <div className="flex justify-around w-full py-4 border-y border-zinc-900 my-6 bg-zinc-950/40 rounded-2xl">
          <div className="text-center">
            <p className="font-black text-lg leading-none">{treinos.length}</p>
            <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Posts</p>
          </div>
          <div className="text-center border-x border-zinc-900 px-8">
            <p className="font-black text-lg leading-none">{stats.seguidores}</p>
            <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="font-black text-lg leading-none">{stats.seguindo}</p>
            <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Seguindo</p>
          </div>
        </div>

        {/* FEED */}
        <div className="flex items-center gap-2 mb-4 ml-1">
          <div className="h-[2px] w-4 bg-green-500"></div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Linha do Tempo</h3>
        </div>

        <div className="space-y-4">
          {treinos.length > 0 ? (
            treinos.map(t => (
              <TreinoCard key={t.id} treino={t} />
            ))
          ) : (
            <p className="text-center py-10 text-zinc-600 text-xs italic font-bold uppercase">Nenhum treino registrado ainda.</p>
          )}
        </div>

      </div>
      <Navbar />
    </>
  )
}