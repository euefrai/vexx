"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import TreinoCard from "@/components/TreinoCard"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"
import BotaoFlutuante from "@/components/BotaoFlutuante"
import { MotivacaoDoDia } from "@/components/MotivacaoDoDia"
import Link from "next/link"
import { useGamificacao } from "@/hooks/useGamificacao"
import { useRanks } from "@/hooks/useRanks" 
import { motion, AnimatePresence } from "framer-motion"

export default function Feed() {
  const [treinos, setTreinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [listaDeRanks, setListaDeRanks] = useState([])
  const [checkinFeito, setCheckinFeito] = useState(false)
  const [loadingCheckin, setLoadingCheckin] = useState(false)
  const [strike, setStrike] = useState(0)
  const [busca, setBusca] = useState("")

  // Stories e Desafios
  const [stories, setStories] = useState([])
  const [challenges, setChallenges] = useState([])
  const [showStoryModal, setShowStoryModal] = useState(false)
  const [activeStoryIdx, setActiveStoryIdx] = useState(null)
  const [novoStoryText, setNovoStoryText] = useState("")
  const [novoStoryMedia, setNovoStoryMedia] = useState("")
  const [showCreateStory, setShowCreateStory] = useState(false)
  
  const { adicionarXP } = useGamificacao()
  const { getRanks, calcularRank } = useRanks()

  // 1. INICIALIZAÇÃO UNIFICADA
  useEffect(() => {
    async function inicializarSistema() {
      try {
        setLoading(true)
        
        // Busca ranks dinâmicos do banco primeiro
        const ranksBuscados = await getRanks()
        setListaDeRanks(ranksBuscados)
        
        const { data: { user } } = await supabase.auth.getUser()
        
        // Carrega treinos, checkins, stories e desafios em paralelo
        await Promise.all([
          carregarTreinos(),
          verificarCheckinEStrike(user),
          carregarStoriesEChallenges(user)
        ])
      } catch (error) {
        console.error("Erro na inicialização:", error)
      } finally {
        setLoading(false)
      }
    }
    inicializarSistema()
  }, [])

  // 2. LÓGICA DE DADOS
  async function carregarTreinos() {
    const { data, error } = await supabase
      .from("treinos")
      .select(`*, usuarios (*)`)
      .order("created_at", { ascending: false })
    
    if (!error) setTreinos(data || [])
  }

  async function carregarStoriesEChallenges(user) {
    if (!user) return
    const agora = new Date().toISOString()

    // 1. Carregar Stories
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("*, usuarios:usuario_id (username, foto)")
        .gt("expires_at", agora)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setStories(data || [])
    } catch (err) {
      console.log("Banco sem stories, carregando fallback local...", err.message)
      const localStories = JSON.parse(localStorage.getItem("vexx_stories") || "[]")
      const validStories = localStories.filter(s => new Date(s.expires_at) > new Date())

      if (validStories.length === 0) {
        const mockStories = [
          {
            id: "story-1",
            usuario_id: "user-2",
            text: "Correndo 12km sob chuva forte na manhã de hoje! Superação total.",
            media_url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=300&auto=format&fit=crop&q=80",
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            usuarios: { username: "runner_speed", foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" }
          },
          {
            id: "story-2",
            usuario_id: "user-3",
            text: "Carga máxima batida no terra hoje! 180kg operacionais.",
            media_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80",
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            usuarios: { username: "iron_beast", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" }
          }
        ]
        localStorage.setItem("vexx_stories", JSON.stringify(mockStories))
        setStories(mockStories)
      } else {
        setStories(validStories)
      }
    }

    // 2. Carregar Challenges
    try {
      const { data, error } = await supabase
        .from("challenges")
        .select("*, usuarios:owner_id (username, foto)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setChallenges(data || [])
    } catch (err) {
      console.log("Banco sem challenges, carregando fallback local...", err.message)
      const localChallenges = JSON.parse(localStorage.getItem("vexx_challenges") || "[]")
      const openChallenges = localChallenges.filter(c => c.status === "open")

      if (openChallenges.length === 0) {
        const mockChallenges = [
          {
            id: "challenge-1",
            title: "Desafio 10K Cidade Neon",
            description: "Corra 10km acumulados nas ruas esta semana. Badge especial desbloqueada.",
            goal: "Corrida de 10km acumulados",
            reward: "1000 XP & Badge Cidade Neon",
            status: "open",
            owner_id: "user-2",
            usuarios: { username: "runner_speed", foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" }
          },
          {
            id: "challenge-2",
            title: "Operação Cardio Supremo",
            description: "Realize pelo menos 45 minutos de cardio contínuo em ritmo abaixo de 5:30/km.",
            goal: "Cardio 45 min ritmo < 5:30",
            reward: "800 XP & Medalha Ouro Cardio",
            status: "open",
            owner_id: "user-3",
            usuarios: { username: "iron_beast", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" }
          }
        ]
        localStorage.setItem("vexx_challenges", JSON.stringify(mockChallenges))
        setChallenges(mockChallenges)
      } else {
        setChallenges(openChallenges)
      }
    }
  }

  async function publicarStoryFeed() {
    if (!novoStoryText.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const expires = new Date(Date.now() + 24 * 3600000).toISOString()
      const novoItem = {
        usuario_id: user.id,
        text: novoStoryText,
        media_url: novoStoryMedia || null,
        expires_at: expires
      }

      const { error } = await supabase.from("stories").insert([novoItem])
      if (error) throw error

      setNovoStoryText("")
      setNovoStoryMedia("")
      setShowCreateStory(false)
      await carregarStoriesEChallenges(user)
    } catch (err) {
      console.log("Gravando story no LocalStorage de fallback...")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const expires = new Date(Date.now() + 24 * 3600000).toISOString()
      const localStories = JSON.parse(localStorage.getItem("vexx_stories") || "[]")

      const novoItem = {
        id: `story-${Date.now()}`,
        usuario_id: user.id,
        text: novoStoryText,
        media_url: novoStoryMedia || null,
        created_at: new Date().toISOString(),
        expires_at: expires,
        usuarios: { username: user.email.split("@")[0], foto: null }
      }

      const atualizados = [novoItem, ...localStories]
      localStorage.setItem("vexx_stories", JSON.stringify(atualizados))
      setStories(atualizados.filter(s => new Date(s.expires_at) > new Date()))

      setNovoStoryText("")
      setNovoStoryMedia("")
      setShowCreateStory(false)
    }
  }

  async function verificarCheckinEStrike(user) {
    try {
      if (!user) return

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const { data: hojeData } = await supabase
        .from("registros_treino")
        .select("id")
        .eq("usuario_id", user.id)
        .gte("created_at", hoje.toISOString())
        .maybeSingle()

      setCheckinFeito(!!hojeData)

      const { data: historico } = await supabase
        .from("registros_treino")
        .select("created_at")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false })

      if (historico && historico.length > 0) {
        const datasSet = new Set(historico.map(r => r.created_at.split('T')[0]))
        let contador = 0
        let d = new Date()
        d.setHours(0, 0, 0, 0)

        if (!datasSet.has(d.toISOString().split('T')[0])) {
          d.setDate(d.getDate() - 1)
        }

        while (datasSet.has(d.toISOString().split('T')[0])) {
          contador++
          d.setDate(d.getDate() - 1)
        }
        setStrike(contador)
      }
    } catch (e) { console.error(e) }
  }

  async function realizarCheckin() {
    if (loadingCheckin) return
    setLoadingCheckin(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (checkinFeito) {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
        await supabase.from("registros_treino").delete().eq("usuario_id", user.id).gte("created_at", hoje.toISOString())
        setCheckinFeito(false)
      } else {
        await supabase.from("registros_treino").insert([{ usuario_id: user.id }])
        setCheckinFeito(true)
        if (adicionarXP) await adicionarXP(user.id, 50)
      }
      verificarCheckinEStrike(user)
    } catch (e) { alert(e.message) } finally { setLoadingCheckin(false) }
  }

  const treinosFiltrados = treinos.filter(t => 
    t.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    t.grupo?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 min-h-screen bg-zinc-950 font-sans text-zinc-100 relative">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

        <PageHeader icon="🏠" title="Feed" subtitle="Acompanhe os treinos da sua squad" color="green" />
        
        {/* CARROSSEL DE STORIES PREMIUM */}
        <div className="mb-6 mt-2.5">
          <h2 className="text-[9px] font-black uppercase text-zinc-500 mb-3.5 tracking-widest ml-1">
            Stories Ativos (24H)
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2.5 no-scrollbar items-center px-1">
            {/* Botão Adicionar Story */}
            <button 
              onClick={() => setShowCreateStory(true)}
              className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full p-[3px] border-2 border-dashed border-emerald-500/50 bg-zinc-900/60 flex items-center justify-center shadow-lg relative">
                <span className="text-emerald-400 font-extrabold text-2xl">+</span>
              </div>
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider mt-0.5">
                Publicar
              </span>
            </button>

            {stories.map((st, idx) => (
              <button
                key={st.id || idx}
                onClick={() => { setActiveStoryIdx(idx); setShowStoryModal(true); }}
                className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full p-[3.5px] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg relative">
                  <div className="w-full h-full rounded-full border border-black overflow-hidden bg-zinc-900">
                    <img 
                      src={st.usuarios?.foto || "https://via.placeholder.com/150"} 
                      className="w-full h-full object-cover"
                      alt={st.usuarios?.username}
                    />
                  </div>
                </div>
                <span className="text-[8px] font-extrabold text-zinc-400 truncate w-16 text-center mt-0.5">
                  @{st.usuarios?.username || "atleta"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* MOTIVAÇÃO DO DIA */}
        <div className="mb-6">
          <MotivacaoDoDia />
        </div>
        
        {/* HEADER DE COMANDO */}
        <div className="flex justify-between items-center mb-6 px-2">
          <div>
            <h1 className="text-zinc-100 text-lg font-extrabold uppercase tracking-wider">
              VEXX SQUAD
            </h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.25em] mt-0.5">STATUS DO SINAL: ATIVO</p>
          </div>
          <Link href="/mensagens">
            <span className="text-[9px] bg-zinc-900/60 text-zinc-300 px-3.5 py-2 rounded-xl font-bold border border-zinc-900 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 hover:border-emerald-500/20 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              CHAT
            </span>
          </Link>
        </div>

        {/* ARENA DE DESAFIOS WIDGET */}
        <div className="mb-6 p-5 bg-gradient-to-br from-zinc-900/35 to-zinc-950/80 border border-zinc-900 rounded-3xl relative overflow-hidden backdrop-blur-md">
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
              <h3 className="font-black text-[10px] text-amber-400 uppercase tracking-widest">
                Arena de Desafios
              </h3>
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Participe e multiplique seus pontos de XP</p>
            </div>
            <span className="text-[8px] font-black bg-amber-500/10 border border-amber-500/25 text-amber-400 px-2.5 py-0.5 rounded-lg uppercase">
              {challenges.length} Ativos
            </span>
          </div>

          <div className="space-y-3">
            {challenges.slice(0, 2).map((ch, idx) => (
              <div key={ch.id || idx} className="bg-black/35 border border-zinc-850/50 p-4 rounded-2xl relative">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-xs font-black uppercase italic text-zinc-200">{ch.title}</h4>
                    <p className="text-[9px] text-zinc-400 mt-1 leading-relaxed font-medium">{ch.description}</p>
                  </div>
                  <button 
                    onClick={() => alert(`Inscrição confirmada na missão "${ch.title}"!`)}
                    className="shrink-0 text-[8px] font-black bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-xl transition-all active:scale-95 uppercase tracking-wider"
                  >
                    Entrar
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-[8px] font-extrabold uppercase tracking-wider text-zinc-500 mt-3 pt-2.5 border-t border-zinc-900/60">
                  <span>Meta: <span className="text-zinc-300">{ch.goal}</span></span>
                  <span className="text-amber-400">XP: {ch.reward}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD DE CHECK-IN */}
        <div className={`mb-6 p-5 rounded-xl border transition-all duration-500 relative overflow-hidden ${
          checkinFeito 
            ? 'bg-zinc-900/10 border-zinc-900/60' 
            : 'bg-zinc-900/30 border-emerald-500/10 shadow-lg shadow-emerald-950/5'
        }`}>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-extrabold uppercase text-[11px] tracking-wider ${checkinFeito ? 'text-zinc-500' : 'text-emerald-400'}`}>
                  {checkinFeito ? "Treino Confirmado" : "Missão do Dia"}
                </h3>
                
                <AnimatePresence>
                  {strike > 0 && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                      <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-[10px]">🔥</motion.span>
                      <span className="text-orange-500 text-[8px] font-bold tracking-wide">{strike}D STREAK</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-zinc-300 text-[9px] font-bold uppercase tracking-widest mt-1 opacity-70">
                {checkinFeito ? "PAGAMENTO RECEBIDO" : "PAGUE O PREÇO HOJE"}
              </p>
            </div>
            
            <button 
              onClick={realizarCheckin} 
              className={`px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                checkinFeito 
                  ? "bg-zinc-900 text-zinc-500 border border-zinc-800/80 hover:bg-zinc-850" 
                  : "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-950/20 hover:bg-emerald-400"
              }`}
            >
              {loadingCheckin ? "..." : checkinFeito ? "CANCELAR" : "MARCAR CHECK-IN"}
            </button>
          </div>
          {!checkinFeito && (
            <motion.div animate={{ opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
          )}
        </div>

        {/* BUSCA */}
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Localizar operação..." 
            value={busca} 
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-zinc-900/30 border border-zinc-900 rounded-xl py-3.5 px-4 text-xs font-semibold tracking-wide text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-emerald-500/30 focus:bg-zinc-900/50 transition-all placeholder:font-medium placeholder:uppercase" 
          />
        </div>

        {/* FEED */}
        <div className="space-y-4">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Relatórios de Campo</p>
          
          {loading ? (
            <div className="text-center py-20 flex flex-col items-center gap-3">
               <div className="w-5 h-5 border border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
               <span className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest">Sincronizando Arsenal...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {treinosFiltrados.length === 0 ? (
                <p className="text-center text-xs text-zinc-600 py-10 uppercase tracking-wider font-semibold">Nenhuma operação localizada.</p>
              ) : (
                treinosFiltrados.map(t => {
                  const autor = t.usuarios;
                  const status = calcularRank(autor?.xp || 0, listaDeRanks);

                  return (
                    <div key={t.id} className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 hover:border-zinc-800/80 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3.5">
                        <Link href={`/perfil?id=${autor?.id}`} className="relative active:scale-95 transition-transform flex-shrink-0">
                          <img 
                            src={autor?.foto || "/avatar-padrao.png"} 
                            className="w-10 h-10 rounded-full object-cover border"
                            style={{ borderColor: status.cor_border || status.cor_texto }}
                          />
                          <div style={{ backgroundColor: status.cor_bg || status.cor_texto }} className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-zinc-950 text-[7px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                            LV {autor?.nivel || 1}
                          </div>
                        </Link>

                        <div className="flex flex-col">
                          <Link href={`/perfil?id=${autor?.id}`} className="text-xs font-bold text-zinc-200 uppercase leading-none hover:text-emerald-400 transition-colors">
                            @{autor?.username || "Guerreiro"}
                          </Link>
                          <span style={{ color: status.cor_texto }} className="text-[9px] font-bold uppercase mt-1 tracking-wide">
                            {status.nome}
                          </span>
                          <span className="text-[8px] text-zinc-600 uppercase font-semibold mt-0.5">
                            {t.grupo} • {new Date(t.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <TreinoCard treino={t} hideHeader={true} /> 
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        <footer className="mt-20 mb-8 text-center opacity-30">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">SQUAD SYSTEM v2.0 // VEXX ATHLETICS</p>
        </footer>
      </div>

      {/* MODAL STORY VIEWER FULLSCREEN */}
      <AnimatePresence>
        {showStoryModal && activeStoryIdx !== null && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[500] flex flex-col justify-between p-4"
          >
            {/* Header com foto do usuário e barra de progresso */}
            <div className="w-full max-w-md mx-auto space-y-4 pt-4">
              {/* Barra de progresso */}
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 6, ease: "linear" }}
                  onAnimationComplete={() => {
                    if (activeStoryIdx < stories.length - 1) {
                      setActiveStoryIdx(activeStoryIdx + 1);
                    } else {
                      setShowStoryModal(false);
                      setActiveStoryIdx(null);
                    }
                  }}
                  className="h-full bg-emerald-500"
                  key={activeStoryIdx} // Reseta a animação ao mudar de story
                />
              </div>

              {/* Informações do Atleta */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-emerald-500/50 overflow-hidden bg-zinc-900">
                    <img 
                      src={stories[activeStoryIdx]?.usuarios?.foto || "https://via.placeholder.com/150"} 
                      className="w-full h-full object-cover" 
                      alt="avatar" 
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase italic">@{stories[activeStoryIdx]?.usuarios?.username || "anon"}</h3>
                    <p className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">Story Atleta</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowStoryModal(false); setActiveStoryIdx(null); }}
                  className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white font-black hover:bg-zinc-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Conteúdo Central */}
            <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center py-6">
              {stories[activeStoryIdx]?.media_url && (
                <div className="w-full h-[50vh] max-h-[380px] rounded-3xl overflow-hidden mb-6 border border-zinc-900 shadow-2xl bg-zinc-950">
                  <img 
                    src={stories[activeStoryIdx].media_url} 
                    className="w-full h-full object-cover" 
                    alt="media" 
                  />
                </div>
              )}
              
              <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-2xl w-full text-center backdrop-blur-sm">
                <p className="text-sm font-bold text-white leading-relaxed">
                  {stories[activeStoryIdx]?.text}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="w-full max-w-md mx-auto text-center pb-6">
              <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest">
                VEXX ATHLETICS STORIES // Expira em 24h
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CRIAÇÃO DE STORY */}
      <AnimatePresence>
        {showCreateStory && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 bg-zinc-950 border-t border-zinc-900 rounded-t-[2.5rem] z-[450] p-6 pb-10 max-w-md mx-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-black italic text-emerald-400 uppercase">Novo Story</h2>
              <button 
                onClick={() => setShowCreateStory(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <textarea 
                value={novoStoryText}
                onChange={(e) => setNovoStoryText(e.target.value)}
                placeholder="O que está acontecendo no treino hoje?"
                className="w-full bg-zinc-900 border border-zinc-850 p-4 rounded-2xl text-xs font-semibold outline-none text-zinc-100 focus:border-emerald-500 transition-all placeholder:text-zinc-600"
                rows={3}
              />

              <input 
                value={novoStoryMedia}
                onChange={(e) => setNovoStoryMedia(e.target.value)}
                placeholder="Link da imagem/foto (opcional)"
                className="w-full bg-zinc-900 border border-zinc-850 p-4 rounded-2xl text-xs font-semibold outline-none text-zinc-100 focus:border-emerald-500 transition-all placeholder:text-zinc-600"
              />

              <button 
                onClick={publicarStoryFeed}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-wider rounded-2xl transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              >
                Publicar Story
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BotaoFlutuante />
      <Navbar />
    </>
  )
}