"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { offlineManager } from "@/lib/offlineManager"
import { useGamificacao } from "@/hooks/useGamificacao"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"
import { Users, Sparkles, Trophy, Plus, LogOut, CheckCircle, ShieldAlert, Send, Trash2 } from "lucide-react"
import { motion } from "framer-motion"

const HOUR = 1000 * 60 * 60

export default function SocialPage() {
  const [user, setUser] = useState(null)
  const [stories, setStories] = useState([])
  const [challenges, setChallenges] = useState([])
  const [squads, setSquads] = useState([])
  const [squadMemberships, setSquadMemberships] = useState([])
  const [challengeMemberships, setChallengeMemberships] = useState({})
  const [error, setError] = useState("")

  const [storyText, setStoryText] = useState("")
  const [storyMedia, setStoryMedia] = useState("")
  const [challenge, setChallenge] = useState({ title: "", description: "", goal: "", reward: "" })
  const [squad, setSquad] = useState({ name: "", description: "", capacity: 12 })

  const { avaliarEConquistar } = useGamificacao()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      carregarStories()
      carregarChallenges()
      carregarSquads()
      carregarSquadMemberships(user?.id)
      carregarChallengeMemberships(user?.id)
    }
    init()
  }, [])

  useEffect(() => {
    const handleSyncComplete = async () => {
      console.log("[Social] Evento de sincronização offline recebido. Atualizando esquadrões...")
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        carregarStories()
        carregarChallenges()
        carregarSquads()
        carregarSquadMemberships(user.id)
        carregarChallengeMemberships(user.id)
      }
    }

    window.addEventListener("vexx_offline_sync_complete", handleSyncComplete)
    return () => window.removeEventListener("vexx_offline_sync_complete", handleSyncComplete)
  }, [])

  async function carregarStories() {
    try {
      const agora = new Date().toISOString()
      const { data, error } = await supabase
        .from("stories")
        .select("*, usuarios:usuario_id (username, foto)")
        .gt("expires_at", agora)
        .order("created_at", { ascending: false })

      if (error) throw error
      setStories(data || [])
    } catch (err) {
      console.log("Banco sem stories, carregando fallback local no social...")
      const localStories = JSON.parse(localStorage.getItem("vexx_stories") || "[]")
      setStories(localStories.filter(s => new Date(s.expires_at) > new Date()))
    }
  }

  async function carregarChallenges() {
    try {
      const { data, error } = await supabase
        .from("challenges")
        .select("*, usuarios:owner_id (username, foto)")
        .eq("status", "open")
        .order("created_at", { ascending: false })

      if (error) throw error
      setChallenges(data || [])
    } catch (err) {
      console.log("Banco sem challenges, carregando fallback local no social...")
      const localChallenges = JSON.parse(localStorage.getItem("vexx_challenges") || "[]")
      setChallenges(localChallenges.filter(c => c.status === "open"))
    }
  }

  async function carregarSquads() {
    try {
      const { data, error } = await supabase
        .from("squads")
        .select("*, squad_members (usuario_id)")
        .order("created_at", { ascending: false })

      if (error) throw error
      setSquads(data || [])
    } catch (err) {
      console.log("Banco sem squads, carregando fallback local no social...")
      const localSquads = JSON.parse(localStorage.getItem("vexx_squads") || "[]")
      setSquads(localSquads)
    }
  }

  async function carregarSquadMemberships(usrId) {
    if (!usrId) return
    try {
      const { data, error } = await supabase
        .from("squad_members")
        .select("squad_id")
        .eq("usuario_id", usrId)
      
      if (error) throw error
      setSquadMemberships(data?.map((m) => m.squad_id) || [])
    } catch (err) {
      const memberships = JSON.parse(localStorage.getItem(`vexx_squad_members_${usrId}`) || "[]")
      setSquadMemberships(memberships)
    }
  }

  async function carregarChallengeMemberships(usrId) {
    if (!usrId) return
    try {
      const { data, error } = await supabase
        .from("challenge_participants")
        .select("challenge_id, status")
        .eq("usuario_id", usrId)
      
      if (error) throw error
      const mapping = {}
      data?.forEach(m => {
        mapping[m.challenge_id] = m.status
      })
      setChallengeMemberships(mapping)
    } catch (err) {
      const mapping = JSON.parse(localStorage.getItem(`vexx_challenge_memberships_${usrId}`) || "{}")
      setChallengeMemberships(mapping)
    }
  }

  async function joinChallenge(challengeId) {
    if (!user) return setError("Faça login para entrar no desafio")
    try {
      const { error } = await supabase.from("challenge_participants").insert([{ challenge_id: challengeId, usuario_id: user.id, status: "joined" }])
      if (error) throw error
      setChallengeMemberships(prev => ({ ...prev, [challengeId]: "joined" }))
      
      // Avaliar gamificação
      await avaliarEConquistar(user.id, "challenge_accept")
    } catch (err) {
      console.log("Entrando no desafio localmente...")
      const local = JSON.parse(localStorage.getItem(`vexx_challenge_memberships_${user.id}`) || "{}")
      local[challengeId] = "joined"
      localStorage.setItem(`vexx_challenge_memberships_${user.id}`, JSON.stringify(local))
      setChallengeMemberships(prev => ({ ...prev, [challengeId]: "joined" }))

      // Enfileirar mutação
      offlineManager.addMutation("challenge_participants", "insert", {
        challenge_id: challengeId,
        usuario_id: user.id,
        status: "joined"
      })

      await avaliarEConquistar(user.id, "challenge_accept")
    }
  }

  async function completeChallenge(challengeId) {
    if (!user) return setError("Faça login para concluir o desafio")
    try {
      const { error } = await supabase
        .from("challenge_participants")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("challenge_id", challengeId)
        .eq("usuario_id", user.id)
      
      if (error) throw error
      setChallengeMemberships(prev => ({ ...prev, [challengeId]: "completed" }))
      
      // Avaliar conquistas e conceder prêmio
      await avaliarEConquistar(user.id, "challenge_complete")
      
      // Registrar no histórico de conclusões locais para contagem
      const localCompletes = JSON.parse(localStorage.getItem(`vexx_challenge_completes_${user.id}`) || "[]")
      if (!localCompletes.includes(challengeId)) {
        localStorage.setItem(`vexx_challenge_completes_${user.id}`, JSON.stringify([...localCompletes, challengeId]))
      }
    } catch (err) {
      console.log("Concluindo desafio localmente...")
      const local = JSON.parse(localStorage.getItem(`vexx_challenge_memberships_${user.id}`) || "{}")
      local[challengeId] = "completed"
      localStorage.setItem(`vexx_challenge_memberships_${user.id}`, JSON.stringify(local))
      setChallengeMemberships(prev => ({ ...prev, [challengeId]: "completed" }))

      const localCompletes = JSON.parse(localStorage.getItem(`vexx_challenge_completes_${user.id}`) || "[]")
      if (!localCompletes.includes(challengeId)) {
        localStorage.setItem(`vexx_challenge_completes_${user.id}`, JSON.stringify([...localCompletes, challengeId]))
      }

      // Enfileirar mutação
      offlineManager.addMutation("challenge_participants", "update", {
        status: "completed",
        completed_at: new Date().toISOString()
      }, [
        { type: "eq", column: "challenge_id", value: challengeId },
        { type: "eq", column: "usuario_id", value: user.id }
      ])

      await avaliarEConquistar(user.id, "challenge_complete")
    }
  }

  async function publicarStory() {
    if (!user) return setError("Faça login para publicar um story")
    if (!storyText.trim()) return setError("Escreva algo para o story")

    try {
      const expires = new Date(Date.now() + 24 * HOUR).toISOString()
      const { error } = await supabase.from("stories").insert([{ usuario_id: user.id, text: storyText, media_url: storyMedia || null, expires_at: expires }])
      if (error) throw error
      setStoryText("")
      setStoryMedia("")
      carregarStories()
      await avaliarEConquistar(user.id, "story")
    } catch (err) {
      console.log("Salvando story localmente no social...")
      const expires = new Date(Date.now() + 24 * HOUR).toISOString()
      const localStories = JSON.parse(localStorage.getItem("vexx_stories") || "[]")
      
      const novoItem = {
        id: `story-${Date.now()}`,
        usuario_id: user.id,
        text: storyText,
        media_url: storyMedia || null,
        created_at: new Date().toISOString(),
        expires_at: expires,
        usuarios: { username: user.email?.split("@")[0] || "atleta", foto: null }
      }
      
      const atualizados = [novoItem, ...localStories]
      localStorage.setItem("vexx_stories", JSON.stringify(atualizados))
      setStories(atualizados.filter(s => new Date(s.expires_at) > new Date()))

      // Enfileirar mutação na fila unificada
      offlineManager.addMutation("stories", "insert", {
        usuario_id: user.id,
        text: storyText,
        media_url: storyMedia || null,
        expires_at: expires
      })
      
      setStoryText("")
      setStoryMedia("")
      setError("")
      await avaliarEConquistar(user.id, "story")
    }
  }

  async function excluirStory(storyId) {
    if (!storyId) return
    const confirmacao = window.confirm("Deseja realmente excluir este story?")
    if (!confirmacao) return

    try {
      if (!navigator.onLine) {
        throw new Error("Offline")
      }

      // Online: Deleta diretamente do Supabase
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", storyId)

      if (error) throw error

      // Atualiza o estado local
      setStories(prev => prev.filter(s => s.id !== storyId))
    } catch (err) {
      console.log("Falha ao deletar online no Social, deletando localmente...", err.message)

      // Atualiza de forma otimista o estado
      setStories(prev => prev.filter(s => s.id !== storyId))

      // Remove do LocalStorage
      const localStories = JSON.parse(localStorage.getItem("vexx_stories") || "[]")
      const atualizados = localStories.filter(s => s.id !== storyId)
      localStorage.setItem("vexx_stories", JSON.stringify(atualizados))

      // Enfileira na fila offline do offlineManager
      offlineManager.addMutation("stories", "delete", null, [
        { type: "eq", column: "id", value: storyId }
      ])
    }
  }

  async function criarChallenge() {
    if (!user) return setError("Faça login para criar um desafio")
    if (!challenge.title.trim()) return setError("Título do desafio é obrigatório")

    try {
      const { error } = await supabase.from("challenges").insert([{ ...challenge, owner_id: user.id, status: "open" }])
      if (error) throw error
      setChallenge({ title: "", description: "", goal: "", reward: "" })
      carregarChallenges()
    } catch (err) {
      console.log("Salvando desafio localmente no social...")
      const localChallenges = JSON.parse(localStorage.getItem("vexx_challenges") || "[]")
      const novoItem = {
        ...challenge,
        id: `challenge-${Date.now()}`,
        owner_id: user.id,
        status: "open",
        created_at: new Date().toISOString(),
        usuarios: { username: user.email?.split("@")[0] || "atleta", foto: null }
      }
      
      const atualizados = [novoItem, ...localChallenges]
      localStorage.setItem("vexx_challenges", JSON.stringify(atualizados))
      setChallenges(atualizados.filter(c => c.status === "open"))

      // Enfileirar mutação offline
      offlineManager.addMutation("challenges", "insert", {
        title: challenge.title,
        description: challenge.description,
        goal: challenge.goal,
        reward: challenge.reward,
        owner_id: user.id,
        status: "open"
      })
      
      setChallenge({ title: "", description: "", goal: "", reward: "" })
      setError("")
    }
  }

  async function criarSquad() {
    if (!user) return setError("Faça login para criar uma squad")
    if (!squad.name.trim()) return setError("Nome da squad é obrigatório")

    try {
      const { data, error } = await supabase.from("squads").insert([{ ...squad, owner_id: user.id }]).select("id").single()
      if (error) throw error
      await supabase.from("squad_members").insert([{ squad_id: data.id, usuario_id: user.id }])
      setSquad({ name: "", description: "", capacity: 12 })
      carregarSquads()
      carregarSquadMemberships(user.id)
      await avaliarEConquistar(user.id, "squad_create")
      await avaliarEConquistar(user.id, "squad_join")
    } catch (err) {
      console.log("Salvando squad localmente no social...")
      const localSquads = JSON.parse(localStorage.getItem("vexx_squads") || "[]")
      
      // Gerar UUID de cliente real para preservar a chave estrangeira na fila offline
      const squadUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const novoItem = {
        ...squad,
        id: squadUuid,
        owner_id: user.id,
        created_at: new Date().toISOString(),
        squad_members: [{ usuario_id: user.id }]
      }
      
      const atualizados = [novoItem, ...localSquads]
      localStorage.setItem("vexx_squads", JSON.stringify(atualizados))
      
      // Adicionar membro local
      const localMemberships = JSON.parse(localStorage.getItem(`vexx_squad_members_${user.id}`) || "[]")
      const membershipsAtualizado = [...localMemberships, squadUuid]
      localStorage.setItem(`vexx_squad_members_${user.id}`, JSON.stringify(membershipsAtualizado))

      // Enfileirar mutações táticas correlacionadas
      offlineManager.addMutation("squads", "insert", {
        id: squadUuid,
        name: squad.name,
        description: squad.description,
        capacity: squad.capacity,
        owner_id: user.id
      })
      offlineManager.addMutation("squad_members", "insert", {
        squad_id: squadUuid,
        usuario_id: user.id
      })
      
      setSquad({ name: "", description: "", capacity: 12 })
      setSquads(atualizados)
      setSquadMemberships(membershipsAtualizado)
      setError("")
      await avaliarEConquistar(user.id, "squad_create")
      await avaliarEConquistar(user.id, "squad_join")
    }
  }

  async function joinSquad(squadId) {
    if (!user) return setError("Faça login para entrar em uma squad")
    const isMember = squadMemberships.includes(squadId)
    if (isMember) return

    const targetSquad = squads.find(s => s.id === squadId)
    const count = targetSquad?.squad_members?.length || 0

    try {
      const { error } = await supabase.from("squad_members").insert([{ squad_id: squadId, usuario_id: user.id }])
      if (error) throw error
      setSquadMemberships((prev) => [...prev, squadId])
      carregarSquads()
      await avaliarEConquistar(user.id, "squad_join", { membrosCount: count + 1 })
    } catch (err) {
      console.log("Entrando em squad localmente...")
      const localMemberships = JSON.parse(localStorage.getItem(`vexx_squad_members_${user.id}`) || "[]")
      const membershipsAtualizado = [...localMemberships, squadId]
      localStorage.setItem(`vexx_squad_members_${user.id}`, JSON.stringify(membershipsAtualizado))
      
      // Atualizar contagem na squad local
      const localSquads = JSON.parse(localStorage.getItem("vexx_squads") || "[]")
      const squadsAtualizados = localSquads.map(s => {
        if (s.id === squadId) {
          const membersList = s.squad_members || []
          return { ...s, squad_members: [...membersList, { usuario_id: user.id }] }
        }
        return s
      })
      localStorage.setItem("vexx_squads", JSON.stringify(squadsAtualizados))

      // Enfileirar mutação
      offlineManager.addMutation("squad_members", "insert", {
        squad_id: squadId,
        usuario_id: user.id
      })
      
      setSquadMemberships(membershipsAtualizado)
      setSquads(squadsAtualizados)
      setError("")
      await avaliarEConquistar(user.id, "squad_join", { membrosCount: count + 1 })
    }
  }

  async function leaveSquad(squadId) {
    if (!user) return setError("Faça login para sair da squad")
    try {
      const { error } = await supabase.from("squad_members").delete().eq("squad_id", squadId).eq("usuario_id", user.id)
      if (error) throw error
      setSquadMemberships((prev) => prev.filter((id) => id !== squadId))
      carregarSquads()
    } catch (err) {
      console.log("Saindo de squad localmente...")
      const localMemberships = JSON.parse(localStorage.getItem(`vexx_squad_members_${user.id}`) || "[]")
      const membershipsAtualizado = localMemberships.filter(id => id !== squadId)
      localStorage.setItem(`vexx_squad_members_${user.id}`, JSON.stringify(membershipsAtualizado))
      
      // Atualizar contagem na squad local
      const localSquads = JSON.parse(localStorage.getItem("vexx_squads") || "[]")
      const squadsAtualizados = localSquads.map(s => {
        if (s.id === squadId) {
          const membersList = s.squad_members || []
          return { ...s, squad_members: membersList.filter(m => m.usuario_id !== user.id) }
        }
        return s
      })
      localStorage.setItem("vexx_squads", JSON.stringify(squadsAtualizados))

      // Enfileirar deleção
      offlineManager.addMutation("squad_members", "delete", null, [
        { type: "eq", column: "squad_id", value: squadId },
        { type: "eq", column: "usuario_id", value: user.id }
      ])
      
      setSquadMemberships(membershipsAtualizado)
      setSquads(squadsAtualizados)
      setError("")
    }
  }

  const storiesAtivas = useMemo(() => stories.filter((s) => new Date(s.expires_at) > new Date()), [stories])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-32 relative">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

      <PageHeader 
        icon={<Users className="w-7 h-7 text-emerald-400" />} 
        title="Social" 
        subtitle="Stories, Desafios e Squads" 
        color="green" 
      />

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* STORIES */}
      <section className="mb-8 p-5 bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-zinc-900">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" /> Stories (24h)
        </h2>
        <div className="flex flex-col gap-3 mb-5">
          <textarea 
            value={storyText} 
            onChange={(e) => setStoryText(e.target.value)} 
            placeholder="Compartilhe algo rápido com a squad..." 
            className="bg-zinc-950 border border-zinc-900/80 p-3.5 rounded-xl text-xs outline-none text-zinc-100 placeholder-zinc-600 focus:border-zinc-800 transition duration-300" 
            rows={3} 
          />
          <input 
            value={storyMedia} 
            onChange={(e) => setStoryMedia(e.target.value)} 
            placeholder="URL da imagem ou vídeo (opcional)" 
            className="bg-zinc-950 border border-zinc-900/80 p-3.5 rounded-xl text-xs outline-none text-zinc-100 placeholder-zinc-600 focus:border-zinc-800 transition duration-300" 
          />
          <button 
            onClick={publicarStory} 
            className="bg-emerald-500 hover:bg-emerald-600 text-black py-2.5 rounded-xl font-extrabold uppercase text-[10px] tracking-wider transition duration-300 flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Publicar Story
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {storiesAtivas.length === 0 && (
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider col-span-full py-4 text-center">Nenhum story ativo no momento</p>
          )}
          {storiesAtivas.map((s) => (
            <div key={s.id} className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-900/80 flex flex-col justify-between relative group hover:border-zinc-800 transition-all duration-300">              
              {s.usuario_id === user?.id && (
                <button
                  onClick={() => excluirStory(s.id)}
                  className="absolute top-2.5 right-2.5 text-zinc-650 hover:text-rose-500 active:scale-90 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Excluir Story"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <div>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-2">@{s.usuarios?.username || "anon"}</p>
                <p className="text-xs text-zinc-300 font-medium leading-relaxed mb-3 break-words">{s.text}</p>
              </div>
              {s.media_url && (
                <img src={s.media_url} alt="story" className="w-full h-24 object-cover rounded-lg mb-2" />
              )}
              <p className="text-[8px] text-zinc-600 font-semibold uppercase tracking-wider">Expira {new Date(s.expires_at).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DESAFIOS */}
      <section className="mb-8 p-5 bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-zinc-900">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Desafios da Squad
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input 
            value={challenge.title} 
            onChange={(e) => setChallenge((v) => ({ ...v, title: e.target.value }))} 
            placeholder="Título do Desafio" 
            className="bg-zinc-950 border border-zinc-900/80 p-3.5 rounded-xl text-xs outline-none text-zinc-100 placeholder-zinc-600 focus:border-zinc-800" 
          />
          <input 
            value={challenge.goal} 
            onChange={(e) => setChallenge((v) => ({ ...v, goal: e.target.value }))} 
            placeholder="Meta (ex: Corrida de 10km)" 
            className="bg-zinc-950 border border-zinc-900/80 p-3.5 rounded-xl text-xs outline-none text-zinc-100 placeholder-zinc-600 focus:border-zinc-800" 
          />
          <input 
            value={challenge.reward} 
            onChange={(e) => setChallenge((v) => ({ ...v, reward: e.target.value }))} 
            placeholder="Recompensa (ex: Badge Gold)" 
            className="bg-zinc-950 border border-zinc-900/80 p-3.5 rounded-xl text-xs outline-none text-zinc-100 placeholder-zinc-600 focus:border-zinc-800" 
          />
          <button 
            onClick={criarChallenge} 
            className="bg-amber-500 hover:bg-amber-600 text-black p-3.5 rounded-xl font-extrabold uppercase text-[10px] tracking-wider transition duration-300 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Criar Desafio
          </button>
        </div>
        <textarea 
          value={challenge.description} 
          onChange={(e) => setChallenge((v) => ({ ...v, description: e.target.value }))} 
          placeholder="Descrição detalhada do desafio..." 
          className="bg-zinc-950 border border-zinc-900/80 p-3.5 rounded-xl text-xs outline-none text-zinc-100 placeholder-zinc-600 focus:border-zinc-800 w-full mb-4" 
          rows={2} 
        />

        <div className="space-y-3.5">
          {challenges.length === 0 && (
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider py-4 text-center">Nenhum desafio ativo no momento</p>
          )}
          {challenges.map((c) => (
            <div key={c.id} className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/80 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">@{c.usuarios?.username || "anon"}</p>
                  <p className="font-extrabold uppercase tracking-wide text-zinc-200 text-sm">{c.title}</p>
                </div>
                <span className="text-[9px] font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                  {c.status}
                </span>
              </div>
              <p className="text-zinc-400 text-xs font-medium leading-relaxed mb-3">{c.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider pt-2 border-t border-zinc-900 mb-3">
                <span>Meta: <span className="text-zinc-300">{c.goal}</span></span>
                <span>Recompensa: <span className="text-amber-400">{c.reward}</span></span>
              </div>

              {/* Botões de Ação do Desafio */}
              <div className="flex gap-2">
                {!challengeMemberships[c.id] ? (
                  <button 
                    onClick={() => joinChallenge(c.id)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition duration-300 cursor-pointer"
                  >
                    Participar do Desafio 🎯
                  </button>
                ) : challengeMemberships[c.id] === "joined" ? (
                  <button 
                    onClick={() => completeChallenge(c.id)}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition duration-300 shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    Marcar como Concluído 🎖️
                  </button>
                ) : (
                  <div className="flex-1 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-center">
                    Desafio Concluído! 🏆
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SQUADS */}
      <section className="mb-8 p-5 bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-zinc-900">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" /> Esquadrões (Squads)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input 
            value={squad.name} 
            onChange={(e) => setSquad((v) => ({ ...v, name: e.target.value }))} 
            placeholder="Nome da Squad" 
            className="bg-zinc-950 border border-zinc-900/80 p-3.5 rounded-xl text-xs outline-none text-zinc-100 placeholder-zinc-600 focus:border-zinc-800" 
          />
          <input 
            value={squad.capacity} 
            type="number" 
            onChange={(e) => setSquad((v) => ({ ...v, capacity: Number(e.target.value) }))} 
            placeholder="Capacidade Máxima" 
            className="bg-zinc-950 border border-zinc-900/80 p-3.5 rounded-xl text-xs outline-none text-zinc-100 placeholder-zinc-600 focus:border-zinc-800" 
          />
        </div>
        <textarea 
          value={squad.description} 
          onChange={(e) => setSquad((v) => ({ ...v, description: e.target.value }))} 
          placeholder="Descrição e objetivos da Squad..." 
          className="bg-zinc-950 border border-zinc-900/80 p-3.5 rounded-xl text-xs outline-none text-zinc-100 placeholder-zinc-600 focus:border-zinc-800 w-full mb-3" 
          rows={2} 
        />
        <button 
          onClick={criarSquad} 
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-black p-3.5 rounded-xl font-extrabold uppercase text-[10px] tracking-wider transition duration-300 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Criar Squad
        </button>

        <div className="mt-6 space-y-4">
          {squads.length === 0 && (
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider py-4 text-center">Nenhuma squad disponível no momento</p>
          )}
          {squads.map((s) => {
            const isMember = squadMemberships.includes(s.id)
            const count = s.squad_members?.length || 0
            return (
              <div key={s.id} className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/80">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">@{s.owner_id === user?.id ? "sua squad" : "liderança"}</p>
                    <p className="font-extrabold uppercase tracking-wide text-zinc-200 text-sm">{s.name}</p>
                  </div>
                  <span className="text-[10px] font-extrabold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-zinc-400">
                    {count} / {s.capacity} membros
                  </span>
                </div>
                <p className="text-zinc-400 text-xs font-medium leading-relaxed mb-4">{s.description}</p>
                <button
                  onClick={() => (isMember ? leaveSquad(s.id) : (count < s.capacity ? joinSquad(s.id) : null))}
                  disabled={!isMember && count >= s.capacity}
                  className={`w-full py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition duration-300 flex items-center justify-center gap-1.5 ${
                    isMember 
                      ? "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-black" 
                      : count >= s.capacity 
                        ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-900" 
                        : "bg-emerald-500 hover:bg-emerald-600 text-black"
                  }`}
                >
                  {isMember ? (
                    <>
                      <LogOut className="w-3.5 h-3.5" /> Sair da Squad
                    </>
                  ) : count >= s.capacity ? (
                    "Esquadrão Lotado"
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Entrar na Squad
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <Navbar />
    </div>
  )
}

