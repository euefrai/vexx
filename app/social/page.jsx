"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"

const HOUR = 1000 * 60 * 60

export default function SocialPage() {
  const [user, setUser] = useState(null)
  const [stories, setStories] = useState([])
  const [challenges, setChallenges] = useState([])
  const [squads, setSquads] = useState([])
  const [squadMemberships, setSquadMemberships] = useState([])
  const [error, setError] = useState("")

  const [storyText, setStoryText] = useState("")
  const [storyMedia, setStoryMedia] = useState("")
  const [challenge, setChallenge] = useState({ title: "", description: "", goal: "", reward: "" })
  const [squad, setSquad] = useState({ name: "", description: "", capacity: 12 })

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      carregarStories()
      carregarChallenges()
      carregarSquads()
      carregarSquadMemberships(user?.id)
    }
    init()
  }, [])

  async function carregarStories() {
    try {
      const agora = new Date().toISOString()
      const { data, error } = await supabase
        .from("stories")
        .select("*, usuarios (username, foto)")
        .gt("expires_at", agora)
        .order("created_at", { ascending: false })

      if (error) throw error
      setStories(data || [])
    } catch (err) {
      console.error("Erro carregar stories:", err)
      setError("Falha carregar stories")
    }
  }

  async function carregarChallenges() {
    try {
      const { data, error } = await supabase
        .from("challenges")
        .select(`*, usuarios (username, foto)`)
        .eq("status", "open")
        .order("created_at", { ascending: false })

      if (error) throw error
      setChallenges(data || [])
    } catch (err) {
      console.error("Erro carregar challenges:", err)
      setError("Falha carregar challenges")
    }
  }

  async function carregarSquads() {
    try {
      const { data, error } = await supabase
        .from("squads")
        .select(`*, squad_members (usuario_id)`)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSquads(data || [])
    } catch (err) {
      console.error("Erro carregar squads:", err)
      setError("Falha carregar squads")
    }
  }

  async function carregarSquadMemberships(usrId) {
    if (!usrId) return
    const { data } = await supabase
      .from("squad_members")
      .select("squad_id")
      .eq("usuario_id", usrId)

    setSquadMemberships(data?.map((m) => m.squad_id) || [])
  }

  async function publicarStory() {
    if (!user) return setError("Faça login para publicar story")
    if (!storyText.trim()) return setError("Escreva algo para o story")

    try {
      const expires = new Date(Date.now() + 24 * HOUR).toISOString()
      const { error } = await supabase.from("stories").insert([{ usuario_id: user.id, text: storyText, media_url: storyMedia || null, expires_at: expires }])
      if (error) throw error
      setStoryText("")
      setStoryMedia("")
      carregarStories()
    } catch (err) {
      console.error("Erro publicar story:", err)
      setError("Falha publicar story")
    }
  }

  async function criarChallenge() {
    if (!user) return setError("Faça login para criar desafio")
    if (!challenge.title.trim()) return setError("Título do desafio obrigatório")

    try {
      const { error } = await supabase.from("challenges").insert([{ ...challenge, owner_id: user.id, status: "open" }])
      if (error) throw error
      setChallenge({ title: "", description: "", goal: "", reward: "" })
      carregarChallenges()
    } catch (err) {
      console.error("Erro criar challenge:", err)
      setError("Falha criar desafio")
    }
  }

  async function criarSquad() {
    if (!user) return setError("Faça login para criar squad")
    if (!squad.name.trim()) return setError("Nome da squad obrigatório")

    try {
      const { data, error } = await supabase.from("squads").insert([{ ...squad, owner_id: user.id }]).select("id").single()
      if (error) throw error
      await supabase.from("squad_members").insert([{ squad_id: data.id, usuario_id: user.id }])
      setSquad({ name: "", description: "", capacity: 12 })
      carregarSquads()
      carregarSquadMemberships(user.id)
    } catch (err) {
      console.error("Erro criar squad:", err)
      setError("Falha criar squad")
    }
  }

  async function joinSquad(squadId) {
    if (!user) return setError("Faça login para entrar em squad")
    const isMember = squadMemberships.includes(squadId)
    if (isMember) return

    try {
      await supabase.from("squad_members").insert([{ squad_id: squadId, usuario_id: user.id }])
      setSquadMemberships((prev) => [...prev, squadId])
      carregarSquads()
    } catch (err) {
      console.error("Erro entrar em squad:", err)
      setError("Falha entrar em squad")
    }
  }

  async function leaveSquad(squadId) {
    if (!user) return setError("Faça login para sair de squad")
    try {
      await supabase.from("squad_members").delete().eq("squad_id", squadId).eq("usuario_id", user.id)
      setSquadMemberships((prev) => prev.filter((id) => id !== squadId))
      carregarSquads()
    } catch (err) {
      console.error("Erro sair de squad:", err)
      setError("Falha ao sair de squad")
    }
  }

  const storiesAtivas = useMemo(() => stories.filter((s) => new Date(s.expires_at) > new Date()), [stories])

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-32">
      <PageHeader icon="📱" title="Social" subtitle="Stories, Desafios e Squads" color="green" />

      {error && <div className="text-red-400 mb-4 text-sm font-black">{error}</div>}

      <section className="mb-8 p-4 bg-zinc-900/70 rounded-3xl border border-zinc-800">
        <h2 className="text-sm font-black uppercase text-zinc-300 mb-2">Stories (24h)</h2>
        <div className="flex flex-col gap-2 mb-3">
          <textarea value={storyText} onChange={(e) => setStoryText(e.target.value)} placeholder="Compartilhe algo rápido..." className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm outline-none" rows={3} />
          <input value={storyMedia} onChange={(e) => setStoryMedia(e.target.value)} placeholder="URL da mídia (opcional)" className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm outline-none" />
          <button onClick={publicarStory} className="bg-green-500 text-black py-2 rounded-xl font-black uppercase text-xs hover:brightness-110 transition">Publicar Story</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {storiesAtivas.length === 0 && <p className="text-zinc-400 text-xs">Nenhuma story ativa.</p>}
          {storiesAtivas.map((s) => (
            <div key={s.id} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">              
              <p className="text-[10px] text-zinc-400 uppercase mb-1">@{s.usuarios?.username || "Anon"}</p>
              <p className="text-sm text-white mb-2 truncate">{s.text}</p>
              {s.media_url && <img src={s.media_url} alt="story" className="w-full h-24 object-cover rounded-lg" />}
              <p className="text-[9px] text-zinc-500 mt-2">Expira {new Date(s.expires_at).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 p-4 bg-zinc-900/70 rounded-3xl border border-zinc-800">
        <h2 className="text-sm font-black uppercase text-zinc-300 mb-2">Desafios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input value={challenge.title} onChange={(e) => setChallenge((v) => ({ ...v, title: e.target.value }))} placeholder="Título" className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm" />
          <input value={challenge.goal} onChange={(e) => setChallenge((v) => ({ ...v, goal: e.target.value }))} placeholder="Meta" className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm" />
          <input value={challenge.reward} onChange={(e) => setChallenge((v) => ({ ...v, reward: e.target.value }))} placeholder="Recompensa" className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm" />
          <button onClick={criarChallenge} className="bg-blue-500 text-black p-3 rounded-xl font-black uppercase text-xs hover:brightness-110 transition">Criar Challenge</button>
        </div>
        <textarea value={challenge.description} onChange={(e) => setChallenge((v) => ({ ...v, description: e.target.value }))} placeholder="Descrição do desafio" className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm mb-3" rows={2} />

        <div className="space-y-2">
          {challenges.length === 0 && <p className="text-zinc-400 text-xs">Nenhum desafio aberto.</p>}
          {challenges.map((c) => (
            <div key={c.id} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-zinc-400">@{c.usuarios?.username}</p>
                  <p className="font-black uppercase text-white text-sm">{c.title}</p>
                </div>
                <span className="text-[9px] text-emerald-400 uppercase">{c.status}</span>
              </div>
              <p className="text-zinc-300 text-xs mt-1">{c.description}</p>
              <p className="text-emerald-300 text-[10px] mt-1">Meta: {c.goal} • Recompensa: {c.reward}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 p-4 bg-zinc-900/70 rounded-3xl border border-zinc-800">
        <h2 className="text-sm font-black uppercase text-zinc-300 mb-2">Squads</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input value={squad.name} onChange={(e) => setSquad((v) => ({ ...v, name: e.target.value }))} placeholder="Nome da Squad" className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm" />
          <input value={squad.capacity} type="number" onChange={(e) => setSquad((v) => ({ ...v, capacity: Number(e.target.value) }))} placeholder="Capacidade" className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm" />
        </div>
        <textarea value={squad.description} onChange={(e) => setSquad((v) => ({ ...v, description: e.target.value }))} placeholder="Descrição" className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm mb-3" rows={2} />
        <button onClick={criarSquad} className="bg-indigo-500 text-black p-3 rounded-xl font-black uppercase text-xs hover:brightness-110 transition">Criar Squad</button>

        <div className="mt-4 space-y-3">
          {squads.length === 0 && <p className="text-zinc-400 text-xs">Nenhuma squad disponível.</p>}
          {squads.map((s) => {
            const isMember = squadMemberships.includes(s.id)
            const count = s.squad_members?.length || 0
            return (
              <div key={s.id} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400">@{s.owner_id === user?.id ? "Você" : "Líder"}</p>
                    <p className="font-black uppercase text-white text-sm">{s.name}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400">{count}/{s.capacity}</span>
                </div>
                <p className="text-zinc-300 text-xs mt-1">{s.description}</p>
                <button
                  onClick={() => (isMember ? leaveSquad(s.id) : (count < s.capacity ? joinSquad(s.id) : null))}
                  disabled={!isMember && count >= s.capacity}
                  className={`mt-2 w-full py-2 rounded-xl text-xs font-black uppercase transition ${isMember ? "bg-red-500 text-black" : "bg-emerald-500 text-black hover:brightness-110"}`}
                >
                  {isMember ? "Sair da Squad" : count >= s.capacity ? "Lotada" : "Entrar na Squad"}
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
