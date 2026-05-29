"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"
import { Users, Sparkles, Trophy, Plus, LogOut, CheckCircle, ShieldAlert, Send } from "lucide-react"
import { motion } from "framer-motion"

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
        .select("*, usuarios:usuario_id (username, foto)")
        .gt("expires_at", agora)
        .order("created_at", { ascending: false })

      if (error) throw error
      setStories(data || [])
    } catch (err) {
      console.error("Erro carregar stories:", err)
      setError("Falha ao carregar stories")
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
      console.error("Erro carregar challenges:", err)
      setError("Falha ao carregar desafios")
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
      console.error("Erro carregar squads:", err)
      setError("Falha ao carregar squads")
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
    if (!user) return setError("Faça login para publicar um story")
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
      setError("Falha ao publicar story")
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
      console.error("Erro criar challenge:", err)
      setError("Falha ao criar desafio")
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
    } catch (err) {
      console.error("Erro criar squad:", err)
      setError("Falha ao criar squad")
    }
  }

  async function joinSquad(squadId) {
    if (!user) return setError("Faça login para entrar em uma squad")
    const isMember = squadMemberships.includes(squadId)
    if (isMember) return

    try {
      await supabase.from("squad_members").insert([{ squad_id: squadId, usuario_id: user.id }])
      setSquadMemberships((prev) => [...prev, squadId])
      carregarSquads()
    } catch (err) {
      console.error("Erro entrar em squad:", err)
      setError("Falha ao entrar na squad")
    }
  }

  async function leaveSquad(squadId) {
    if (!user) return setError("Faça login para sair da squad")
    try {
      await supabase.from("squad_members").delete().eq("squad_id", squadId).eq("usuario_id", user.id)
      setSquadMemberships((prev) => prev.filter((id) => id !== squadId))
      carregarSquads()
    } catch (err) {
      console.error("Erro sair de squad:", err)
      setError("Falha ao sair da squad")
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
            <div key={s.id} className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-900/80 flex flex-col justify-between">              
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
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider pt-2 border-t border-zinc-900">
                <span>Meta: <span className="text-zinc-300">{c.goal}</span></span>
                <span>Recompensa: <span className="text-amber-400">{c.reward}</span></span>
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

