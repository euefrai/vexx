"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import TreinoCard from "@/components/TreinoCard"

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

  const xpParaProximoNivel = 500

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Carrega Perfil completo (incluindo XP e Nível que adicionamos no banco)
      const { data: profileData } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (profileData) {
        setPerfil(profileData)
        setUsername(profileData.username || "")
        setFoto(profileData.foto || "")
      }

      // Carrega os treinos do usuário
      const { data: treinosData } = await supabase
        .from("treinos")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })

      setTreinos(treinosData || [])

      // Conta o total de likes recebidos nos treinos
      if (treinosData?.length > 0) {
        const ids = treinosData.map(t => t.id)
        const { count } = await supabase
          .from("likes")
          .select("*", { count: 'exact', head: true })
          .in("treino_id", ids)
        setLikes(count || 0)
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    } finally {
      setLoading(false)
    }
  }

  async function salvarPerfil() {
    setSalvando(true)
    let urlFoto = foto

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (arquivo) {
        const nomeArquivo = `${authUser.id}-${Date.now()}`
        await supabase.storage.from("fotos").upload(nomeArquivo, arquivo)
        const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(nomeArquivo)
        urlFoto = urlData.publicUrl
      }

      // O upsert garante que o registro seja criado ou atualizado
      const { error: updateError } = await supabase
        .from("usuarios")
        .upsert({
          id: authUser.id,
          username: username,
          foto: urlFoto,
          updated_at: new Date()
        })

      if (updateError) throw updateError

      alert("Perfil atualizado com sucesso! 🔥")
      setEditando(false)
      carregarDados() // Atualiza a tela com os novos dados
    } catch (err) {
      alert("Erro ao salvar: " + err.message)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center font-black italic">
      CARREGANDO STATUS...
    </div>
  )

  // Lógica da Barra de XP
  const xpAtualNoNivel = perfil?.xp % xpParaProximoNivel || 0
  const progresso = (xpAtualNoNivel / xpParaProximoNivel) * 100

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 text-white min-h-screen bg-black font-sans">
        
        {/* HEADER COM CONFIGURAÇÕES */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-black uppercase italic tracking-tighter text-green-500">Elite Squad</h1>
          <button 
            onClick={() => setEditando(true)} 
            className="p-2 bg-zinc-900 rounded-full border border-zinc-800 hover:scale-110 transition-transform"
          >
            ⚙️
          </button>
        </div>

        {/* AVATAR E NÍVEL */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <img 
              src={foto || "https://via.placeholder.com/150"} 
              className="w-32 h-32 rounded-full object-cover border-4 border-green-500 p-1 shadow-[0_0_25px_rgba(34,197,94,0.2)]"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-black px-4 py-1 rounded-full shadow-lg">
              LVL {perfil?.nivel || 1}
            </div>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">{username || "Guerreiro"}</h2>
        </div>

        {/* CARD DE XP */}
        <div className="bg-zinc-900 p-5 rounded-[2rem] border border-zinc-800 mb-8 shadow-2xl">
          <div className="flex justify-between items-end mb-3">
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Progressão de XP</span>
            <span className="text-[10px] text-zinc-400 font-bold">{xpAtualNoNivel} / {xpParaProximoNivel} XP</span>
          </div>
          
          <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-zinc-800 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.4)]"
              style={{ width: `${progresso}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-zinc-600 mt-3 text-center font-bold uppercase tracking-tighter">
            Ganhe XP postando treinos e nocauteando no K.O.
          </p>
        </div>

        {/* ESTATÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 text-center">
            <p className="text-2xl font-black">{treinos.length}</p>
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Treinos</p>
          </div>
          <div className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 text-center">
            <p className="text-2xl font-black">{likes}</p>
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Likes</p>
          </div>
        </div>

        {/* HISTÓRICO */}
        <h3 className="text-xs font-black uppercase tracking-widest mb-4 ml-2 text-zinc-400">Minhas Atividades</h3>
        <div className="space-y-4">
          {treinos.length > 0 ? (
            treinos.map(t => <TreinoCard key={t.id} treino={t} />)
          ) : (
            <p className="text-center text-zinc-700 py-10 text-sm italic font-medium">Nenhum registro encontrado...</p>
          )}
        </div>

        {/* MODAL DE EDIÇÃO (OVERLAY) */}
        {editando && (
          <div className="fixed inset-0 bg-black/95 z-50 flex flex-col p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Configurações</h2>
              <button onClick={() => setEditando(false)} className="text-4xl text-zinc-500 hover:text-white">&times;</button>
            </div>

            <div className="flex flex-col items-center mb-10">
              <div className="relative group overflow-hidden rounded-full border-2 border-dashed border-zinc-700 p-1">
                <img src={foto || "https://via.placeholder.com/150"} className="w-24 h-24 rounded-full object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-tighter">Mudar Foto</div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setArquivo(e.target.files[0])} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-zinc-500 font-black mb-2 block uppercase ml-1">Nickname</label>
                <input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="w-full p-5 bg-zinc-900 rounded-2xl border border-zinc-800 outline-none focus:border-green-500 text-sm font-bold" 
                  placeholder="Seu nome de guerra..." 
                />
              </div>

              <button 
                onClick={salvarPerfil} 
                disabled={salvando} 
                className="w-full bg-green-500 text-black font-black py-5 rounded-2xl shadow-xl shadow-green-500/10 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
              >
                {salvando ? "PROCESSANDO..." : "SALVAR ALTERAÇÕES"}
              </button>
            </div>
          </div>
        )}

      </div>
      <Navbar />
    </>
  )
}