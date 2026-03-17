"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import TreinoCard from "@/components/TreinoCard"
import Link from "next/link"

export default function Perfil() {
  const [perfil, setPerfil] = useState(null)
  const [username, setUsername] = useState("")
  const [foto, setFoto] = useState("")
  const [arquivo, setArquivo] = useState(null)
  const [treinos, setTreinos] = useState([])
  const [likes, setLikes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState(false)

  // Estados para Seguidores
  const [seguidoresCount, setSeguidoresCount] = useState(0)
  const [seguindoCount, setSeguindoCount] = useState(0)
  const [modalLista, setModalLista] = useState({ aberto: false, titulo: "", lista: [] })

  const xpParaProximoNivel = 500

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // 1. Carrega Perfil
      const { data: profileData } = await supabase.from("usuarios").select("*").eq("id", authUser.id).single()
      if (profileData) {
        setPerfil(profileData)
        setUsername(profileData.username || "")
        setFoto(profileData.foto || "")
      }

      // 2. Carrega os treinos
      const { data: treinosData } = await supabase.from("treinos").select("*").eq("usuario_id", authUser.id).order("created_at", { ascending: false })
      setTreinos(treinosData || [])

      // 3. Conta likes recebidos
      if (treinosData?.length > 0) {
        const ids = treinosData.map(t => t.id)
        const { count } = await supabase.from("likes").select("*", { count: 'exact', head: true }).in("treino_id", ids)
        setLikes(count || 0)
      }

      // 4. Carregar contagem de Seguidores/Seguindo
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

  // Função para abrir a lista de seguidores ou seguindo
  async function abrirLista(tipo) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    let query;

    if (tipo === "seguidores") {
      // Busca quem me segue (traz dados de quem é o seguidor)
      query = supabase.from("seguidores").select("usuarios!seguidores_seguidor_id_fkey(id, username, foto)").eq("seguido_id", authUser.id)
    } else {
      // Busca quem eu sigo (traz dados de quem está sendo seguido)
      query = supabase.from("seguidores").select("usuarios!seguidores_seguido_id_fkey(id, username, foto)").eq("seguidor_id", authUser.id)
    }

    const { data } = await query
    const listaFormatada = data?.map(item => item.usuarios) || []
    setModalLista({ aberto: true, titulo: tipo === "seguidores" ? "Seguidores" : "Seguindo", lista: listaFormatada })
  }

  // ... (mantenha sua função salvarPerfil igual)

  const xpAtualNoNivel = perfil?.xp % xpParaProximoNivel || 0
  const progresso = (xpAtualNoNivel / xpParaProximoNivel) * 100

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-black uppercase italic tracking-tighter text-green-500">Elite Squad</h1>
          <button onClick={() => setEditando(true)} className="p-2 bg-zinc-900 rounded-full border border-zinc-800">⚙️</button>
        </div>

        {/* HEADER PERFIL */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <img src={foto || "https://via.placeholder.com/150"} className="w-28 h-28 rounded-full object-cover border-4 border-green-500 p-1" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-black px-4 py-1 rounded-full">LVL {perfil?.nivel || 1}</div>
          </div>
          <h2 className="text-2xl font-black uppercase italic">{username || "Guerreiro"}</h2>
        </div>

        {/* STATUS DE SEGUIDORES */}
        <div className="flex justify-center gap-8 mb-8 border-y border-zinc-900 py-4">
          <button onClick={() => abrirLista('seguidores')} className="text-center">
            <p className="text-xl font-black text-white">{seguidoresCount}</p>
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Seguidores</p>
          </button>
          <button onClick={() => abrirLista('seguindo')} className="text-center">
            <p className="text-xl font-black text-white">{seguindoCount}</p>
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Seguindo</p>
          </button>
        </div>

        {/* PROGRESSO XP */}
        <div className="bg-zinc-900 p-5 rounded-[2rem] border border-zinc-800 mb-8 shadow-2xl">
          <div className="flex justify-between items-end mb-3 text-[10px] font-black uppercase">
            <span className="text-green-500">Progressão de XP</span>
            <span className="text-zinc-400">{xpAtualNoNivel} / {xpParaProximoNivel} XP</span>
          </div>
          <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-zinc-800 p-[2px]">
            <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-1000" style={{ width: `${progresso}%` }}></div>
          </div>
        </div>

        {/* GRID DE ATRIBUTOS */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 text-center">
            <p className="text-2xl font-black">{treinos.length}</p>
            <p className="text-zinc-500 text-[10px] uppercase font-black">Treinos</p>
          </div>
          <div className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 text-center">
            <p className="text-2xl font-black">{likes}</p>
            <p className="text-zinc-500 text-[10px] uppercase font-black">Likes</p>
          </div>
        </div>

        <h3 className="text-xs font-black uppercase tracking-widest mb-4 ml-2 text-zinc-400">Minhas Atividades</h3>
        <div className="space-y-4">
          {treinos.map(t => <TreinoCard key={t.id} treino={t} />)}
        </div>

        {/* MODAL DE LISTA (Seguidores/Seguindo) */}
        {modalLista.aberto && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-end animate-in slide-in-from-bottom duration-300">
            <div className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-[2.5rem] p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase italic text-green-500">{modalLista.titulo}</h3>
                <button onClick={() => setModalLista({ ...modalLista, aberto: false })} className="text-2xl text-zinc-500">&times;</button>
              </div>
              <div className="space-y-4">
                {modalLista.lista.length > 0 ? modalLista.lista.map(u => (
                  <Link href={`/perfil/${u.id}`} key={u.id} className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800">
                    <img src={u.foto || "https://via.placeholder.com/150"} className="w-10 h-10 rounded-full object-cover border border-green-500/30" />
                    <p className="font-bold text-sm text-white">@{u.username}</p>
                  </Link>
                )) : <p className="text-center text-zinc-600 py-10 font-bold uppercase text-xs tracking-widest">Vazio...</p>}
              </div>
            </div>
          </div>
        )}

        {/* ... (mantenha seu modal de configurações aqui) */}
      </div>
      <Navbar />
    </>
  )
}