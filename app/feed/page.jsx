"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { offlineManager } from "@/lib/offlineManager"
import TreinoCard from "@/components/TreinoCard"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"
import BotaoFlutuante from "@/components/BotaoFlutuante"
import { MotivacaoDoDia } from "@/components/MotivacaoDoDia"
import Link from "next/link"
import { useGamificacao } from "@/hooks/useGamificacao"
import { useRanks } from "@/hooks/useRanks" 
import { motion, AnimatePresence } from "framer-motion"

const SEED_TREINOS = [
  {
    id: "seed-treino-1",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    titulo: "PROTOCOLO PUSH DAY CIÊNCIA DO HIPERTROFIA",
    grupo: "Push Day",
    autor: "science_fitness",
    descricao: "Supino Reto com Barra: 3x6 (Alta Tensão Mecânica)\nDesenvolvimento Militar: 3x8 (Empurrão Vertical)\nSupino Inclinado com Halteres: 3x10 (Sobrecarga Progressiva)\nElevação Lateral com Cabo: 4x12 (Foco em Tensão Constante)\nTríceps Testa com Barra W: 3x10 (Alongamento Muscular)\nTríceps Corda no Pulley: 3x12 (Foco em Contração Máxima)",
    usuarios: {
      id: "seed-user-1",
      username: "science_fitness",
      foto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      xp: 2400,
      nivel: 5
    }
  },
  {
    id: "seed-treino-2",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    titulo: "PROTOCOLO ARNOLD CLÁSSICO (PEITO & COSTAS)",
    grupo: "Peito",
    autor: "arnold_legacy",
    descricao: "Supino Reto com Barra: 5x8 (Volume de Choque)\nBarra Fixa Pronada: 5x Falha (Estiramento Dorsal)\nSupino Inclinado com Halteres: 4x10 (Foco Superior)\nRemada Curvada com Barra: 4x10 (Espessura de Tronco)\nCrucifixo Reto: 4x12 (Foco em Contração Isolada)\nPull-Over com Haltere: 4x15 (Expansão Torácica)",
    usuarios: {
      id: "seed-user-2",
      username: "arnold_legacy",
      foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80",
      xp: 4500,
      nivel: 9
    }
  },
  {
    id: "seed-treino-3",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    titulo: "PERNAS DO EXTERMINADOR (TOM PLATZ METRIC)",
    grupo: "Perna",
    autor: "platz_legs",
    descricao: "Agachamento Livre com Barra: 5x12 (Volume Extremo Platz)\nLeg Press 45: 4x15 (Sobrecarga Tensional)\nStiff com Barra: 4x10 (Estiramento Isquiotibial)\nFlexora Deitado: 4x12 (Contração Isolada de Posterior)\nExtensora: 3x20 (Exaustão Metabólica Terminal)\nGêmeos em Pé: 5x15 (Foco em Amplitude Completa)",
    usuarios: {
      id: "seed-user-3",
      username: "platz_legs",
      foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      xp: 3800,
      nivel: 8
    }
  },
  {
    id: "seed-treino-4",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    titulo: "PROTOCOLO PULL DAY LATS LENDÁRIOS",
    grupo: "Pull Day",
    autor: "yates_hit",
    descricao: "Levantamento Terra: 3x5 (Poder e Densidade Posterior)\nPuxada Alta com Pegada Supinada: 3x8 (Fibras Inferiores)\nRemada Cavalinho: 3x10 (Espessura Dorsal de Elite)\nCrucifixo Invertido com Halteres: 4x12 (Deltoide Posterior)\nRosca Direta com Barra: 3x8 (Tensão Pura de Bíceps)\nRosca Martelo com Halteres: 3x12 (Braquiorradial)",
    usuarios: {
      id: "seed-user-4",
      username: "yates_hit",
      foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      xp: 5000,
      nivel: 10
    }
  },
  {
    id: "seed-treino-5",
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    titulo: "CARDIO TÁTICO LISS PARA MÁXIMA QUEIMA",
    grupo: "Cardio",
    autor: "cardio_commander",
    descricao: "Aquecimento em Trote Leve: 5 minutos\nCorrida Aeróbica Zona 2: 45 minutos (65-75% FC Max)\nCaminhada de Desaceleração: 5 minutos\nAbdominal Prancha Estática: 3x60 segundos",
    usuarios: {
      id: "seed-user-5",
      username: "cardio_commander",
      foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      xp: 2900,
      nivel: 6
    }
  }
];

export default function Feed() {
  const [treinos, setTreinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [listaDeRanks, setListaDeRanks] = useState([])
  const [checkinFeito, setCheckinFeito] = useState(false)
  const [loadingCheckin, setLoadingCheckin] = useState(false)
  const [strike, setStrike] = useState(0)
  const [busca, setBusca] = useState("")
  const [filtroGrupo, setFiltroGrupo] = useState("Todos")
  const [filtroIntensidade, setFiltroIntensidade] = useState("Todos")
  const [filtroPeriodo, setFiltroPeriodo] = useState("Todos")
  const [showFiltros, setShowFiltros] = useState(false)

  // Stories e Desafios
  const [stories, setStories] = useState([])
  const [challenges, setChallenges] = useState([])
  const [showStoryModal, setShowStoryModal] = useState(false)
  const [activeStoryIdx, setActiveStoryIdx] = useState(null)
  
  // Criação de Story
  const [novoStoryText, setNovoStoryText] = useState("")
  const [novoStoryMedia, setNovoStoryMedia] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const [showCreateStory, setShowCreateStory] = useState(false)

  // Gestos de Deslizar (Swipe) para Stories
  const [touchStartX, setTouchStartX] = useState(0)
  
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

  useEffect(() => {
    const handleSyncComplete = async () => {
      console.log("[Feed] Evento de sincronização offline recebido. Atualizando relatórios...")
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        carregarTreinos()
        verificarCheckinEStrike(user)
        carregarStoriesEChallenges(user)
      }
    }

    window.addEventListener("vexx_offline_sync_complete", handleSyncComplete)
    return () => window.removeEventListener("vexx_offline_sync_complete", handleSyncComplete)
  }, [])

  // 2. LÓGICA DE DADOS
  async function carregarTreinos() {
    try {
      const { data, error } = await supabase
        .from("treinos")
        .select(`*, usuarios (*)`)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      
      // Combinar os treinos do banco com os treinos seed científicos oficiais
      const todosTreinos = [...(data || []), ...SEED_TREINOS]
      // Ordenar por data
      todosTreinos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setTreinos(todosTreinos)
    } catch (err) {
      console.log("Banco offline. Carregando treinos locais e treinos seed...", err.message)
      const localTreinos = JSON.parse(localStorage.getItem("vexx_treinos") || "[]")
      const todosTreinos = [...localTreinos, ...SEED_TREINOS]
      todosTreinos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setTreinos(todosTreinos)
    }
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
      setStories(validStories)
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

  // --- ARQUIVO LOCAL DE UPLOAD E LEITURA EM BASE64 ---
  const handleStoryFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result
      setNovoStoryMedia(base64)
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
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
      setImagePreview("")
      setShowCreateStory(false)
      await carregarStoriesEChallenges(user)
    } catch (err) {
      console.log("Gravando story no LocalStorage de fallback...")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const expires = new Date(Date.now() + 24 * 3600000).toISOString()
      const localStories = JSON.parse(localStorage.getItem("vexx_stories") || "[]")

      const { data: userData } = await supabase
        .from("usuarios")
        .select("username, foto")
        .eq("id", user.id)
        .single()

      const novoItem = {
        id: `story-${Date.now()}`,
        usuario_id: user.id,
        text: novoStoryText,
        media_url: novoStoryMedia || null,
        created_at: new Date().toISOString(),
        expires_at: expires,
        usuarios: { 
          username: userData?.username || user.email?.split("@")[0] || "atleta", 
          foto: userData?.foto || null 
        }
      }

      const atualizados = [novoItem, ...localStories]
      localStorage.setItem("vexx_stories", JSON.stringify(atualizados))
      setStories(atualizados.filter(s => new Date(s.expires_at) > new Date()))

      // Registrar mutação na fila unificada offline
      offlineManager.addMutation("stories", "insert", {
        usuario_id: user.id,
        text: novoStoryText,
        media_url: novoStoryMedia || null,
        expires_at: expires
      })

      setNovoStoryText("")
      setNovoStoryMedia("")
      setImagePreview("")
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

      if (!navigator.onLine) {
        // Modo offline ativo
        if (checkinFeito) {
          const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
          offlineManager.addMutation("registros_treino", "delete", null, [
            { type: "eq", column: "usuario_id", value: user.id },
            { type: "gte", column: "created_at", value: hoje.toISOString() }
          ])
          setCheckinFeito(false)
          setStrike(prev => Math.max(0, prev - 1))
        } else {
          offlineManager.addMutation("registros_treino", "insert", { usuario_id: user.id })
          setCheckinFeito(true)
          setStrike(prev => prev + 1)
        }
        return
      }

      if (checkinFeito) {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
        const { error } = await supabase.from("registros_treino").delete().eq("usuario_id", user.id).gte("created_at", hoje.toISOString())
        if (error) throw error
        setCheckinFeito(false)
      } else {
        const { error } = await supabase.from("registros_treino").insert([{ usuario_id: user.id }])
        if (error) throw error
        setCheckinFeito(true)
        if (adicionarXP) await adicionarXP(user.id, 50)
      }
      verificarCheckinEStrike(user)
    } catch (e) {
      console.error("Falha ao registrar check-in:", e)
      // Fallback para erro de rede
      if (e.message?.includes("Failed to fetch") || e.message?.includes("network") || e.status === 0) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          if (checkinFeito) {
            const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
            offlineManager.addMutation("registros_treino", "delete", null, [
              { type: "eq", column: "usuario_id", value: user.id },
              { type: "gte", column: "created_at", value: hoje.toISOString() }
            ])
            setCheckinFeito(false)
            setStrike(prev => Math.max(0, prev - 1))
          } else {
            offlineManager.addMutation("registros_treino", "insert", { usuario_id: user.id })
            setCheckinFeito(true)
            setStrike(prev => prev + 1)
          }
        }
      } else {
        alert(e.message)
      }
    } finally {
      setLoadingCheckin(false)
    }
  }

  const treinosFiltrados = useMemo(() => {
    return treinos.filter(t => {
      // 1. Busca por texto
      const bateBusca = !busca || 
        t.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
        t.grupo?.toLowerCase().includes(busca.toLowerCase()) ||
        t.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
        t.usuarios?.username?.toLowerCase().includes(busca.toLowerCase());

      // 2. Filtro de Grupo Muscular / Tipo
      const bateGrupo = filtroGrupo === "Todos" || t.grupo === filtroGrupo;

      // 3. Filtro de Intensidade
      // Inferimos a intensidade a partir do tamanho da descrição ou do peso na descrição
      let intensidadeTreino = "Moderado";
      const totalItens = t.descricao?.split("\n").length || 1;
      if (totalItens <= 3) intensidadeTreino = "Leve";
      else if (totalItens >= 6) intensidadeTreino = "Intenso";
      
      const bateIntensidade = filtroIntensidade === "Todos" || intensidadeTreino === filtroIntensidade;

      // 4. Filtro de Período (Dia)
      let batePeriodo = true;
      if (filtroPeriodo !== "Todos") {
        const dataTreino = new Date(t.created_at);
        const agora = new Date();
        const diferencaDias = (agora - dataTreino) / (1000 * 60 * 60 * 24);
        
        if (filtroPeriodo === "Hoje") {
          batePeriodo = diferencaDias < 1;
        } else if (filtroPeriodo === "3dias") {
          batePeriodo = diferencaDias <= 3;
        } else if (filtroPeriodo === "semana") {
          batePeriodo = diferencaDias <= 7;
        }
      }

      return bateBusca && bateGrupo && bateIntensidade && batePeriodo;
    });
  }, [treinos, busca, filtroGrupo, filtroIntensidade, filtroPeriodo]);

  // --- NAVEGAÇÃO DOS STORIES (ESTILO INSTAGRAM/WHATSAPP) ---
  const nextStory = useCallback(() => {
    if (activeStoryIdx < stories.length - 1) {
      setActiveStoryIdx(prev => prev + 1)
    } else {
      setShowStoryModal(false)
      setActiveStoryIdx(null)
    }
  }, [activeStoryIdx, stories.length])

  const prevStory = useCallback(() => {
    if (activeStoryIdx > 0) {
      setActiveStoryIdx(prev => prev - 1)
    }
  }, [activeStoryIdx])

  const handleTouchStart = (e) => {
    setTouchStartX(e.changedTouches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX
    const diffX = touchStartX - touchEndX
    
    if (diffX > 50) {
      // Deslizar para a esquerda -> Próximo Story
      nextStory()
    } else if (diffX < -50) {
      // Deslizar para a direita -> Story Anterior
      prevStory()
    }
  }

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
                      src={st.usuarios?.foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} 
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
              <div key={ch.id || idx} className="bg-black/35 border border-zinc-900 p-4 rounded-2xl relative">
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
                  ? "bg-zinc-900 text-zinc-500 border border-zinc-800/80 hover:bg-zinc-800" 
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

        {/* BUSCA E FILTROS PREMIUM */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Localizar operação..." 
                value={busca} 
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-zinc-900/30 border border-zinc-900 rounded-xl py-3.5 px-4 text-xs font-semibold tracking-wide text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-emerald-500/30 focus:bg-zinc-900/50 transition-all placeholder:font-medium placeholder:uppercase" 
              />
            </div>
            <button 
              onClick={() => setShowFiltros(prev => !prev)}
              className={`px-4 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                showFiltros || filtroGrupo !== "Todos" || filtroIntensidade !== "Todos" || filtroPeriodo !== "Todos"
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "bg-zinc-900/30 border-zinc-900 text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              Filtros {showFiltros ? "▲" : "▼"}
            </button>
          </div>

          <AnimatePresence>
            {showFiltros && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 space-y-4"
              >
                {/* Filtro 1: Grupo Muscular (Tipo) */}
                <div>
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Foco Operacional (Tipo)</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {["Todos", "Full Body", "Push Day", "Pull Day", "Cardio", "Peito", "Costas", "Ombro", "Perna", "Bíceps", "Tríceps"].map((grupo) => (
                      <button
                        key={grupo}
                        onClick={() => setFiltroGrupo(grupo)}
                        className={`px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                          filtroGrupo === grupo
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : "bg-zinc-950/60 border-zinc-850 text-zinc-450 hover:bg-zinc-900"
                        }`}
                      >
                        {grupo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro 2: Intensidade */}
                <div>
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Intensidade Científica</label>
                  <div className="flex gap-2">
                    {["Todos", "Leve", "Moderado", "Intenso"].map((int) => (
                      <button
                        key={int}
                        onClick={() => setFiltroIntensidade(int)}
                        className={`flex-1 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          filtroIntensidade === int
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : "bg-zinc-950/60 border-zinc-850 text-zinc-450 hover:bg-zinc-900"
                        }`}
                      >
                        {int}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro 3: Período (Dia) */}
                <div>
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Período de Atividade</label>
                  <div className="flex gap-2">
                    {[
                      { id: "Todos", label: "Qualquer Data" },
                      { id: "Hoje", label: "Hoje" },
                      { id: "3dias", label: "3 Dias" },
                      { id: "semana", label: "7 Dias" }
                    ].map((per) => (
                      <button
                        key={per.id}
                        onClick={() => setFiltroPeriodo(per.id)}
                        className={`flex-1 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          filtroPeriodo === per.id
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : "bg-zinc-950/60 border-zinc-850 text-zinc-450 hover:bg-zinc-900"
                        }`}
                      >
                        {per.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botão Limpar Filtros */}
                {(filtroGrupo !== "Todos" || filtroIntensidade !== "Todos" || filtroPeriodo !== "Todos") && (
                  <button
                    onClick={() => {
                      setFiltroGrupo("Todos");
                      setFiltroIntensidade("Todos");
                      setFiltroPeriodo("Todos");
                    }}
                    className="w-full py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-black rounded-xl text-[8px] font-black uppercase tracking-widest transition duration-300 cursor-pointer"
                  >
                    Resetar Filtros Táticos
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* MODAL STORY VIEWER FULLSCREEN (INSTAGRAM/WHATSAPP GESTURES) */}
      <AnimatePresence>
        {showStoryModal && activeStoryIdx !== null && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[500] flex flex-col justify-between p-4"
          >
            {/* Tap Gestures Overlay (Left 30% goes back, Right 70% goes forward) */}
            <div className="absolute inset-x-0 top-20 bottom-16 z-[501] flex select-none">
              <div 
                onClick={(e) => { e.stopPropagation(); prevStory(); }}
                className="w-[30%] h-full cursor-pointer active:bg-white/5 transition-all"
                title="Story Anterior"
              />
              <div 
                onClick={(e) => { e.stopPropagation(); nextStory(); }}
                className="w-[70%] h-full cursor-pointer active:bg-white/5 transition-all"
                title="Próximo Story"
              />
            </div>

            {/* Header com foto do usuário e barra de progresso */}
            <div className="w-full max-w-md mx-auto space-y-4 pt-4 relative z-[502]">
              {/* Barra de progresso */}
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 6, ease: "linear" }}
                  onAnimationComplete={nextStory}
                  className="h-full bg-emerald-500"
                  key={activeStoryIdx} // Reseta a animação ao mudar de story
                />
              </div>

              {/* Informações do Atleta */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-emerald-500/50 overflow-hidden bg-zinc-900">
                    <img 
                      src={stories[activeStoryIdx]?.usuarios?.foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} 
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
                  className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white font-black hover:bg-zinc-800 border border-zinc-800 pointer-events-auto"
                  style={{ position: 'relative', zIndex: 600 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Conteúdo Central */}
            <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center py-6 relative z-[502] pointer-events-none">
              {stories[activeStoryIdx]?.media_url && (
                <div className="w-full h-[50vh] max-h-[380px] rounded-3xl overflow-hidden mb-6 border border-zinc-900 shadow-2xl bg-zinc-950">
                  <img 
                    src={stories[activeStoryIdx].media_url} 
                    className="w-full h-full object-cover" 
                    alt="media" 
                  />
                </div>
              )}
              
              <div className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl w-full text-center backdrop-blur-sm">
                <p className="text-sm font-bold text-white leading-relaxed">
                  {stories[activeStoryIdx]?.text}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="w-full max-w-md mx-auto text-center pb-6 relative z-[502]">
              <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest">
                VEXX ATHLETICS STORIES // Expira em 24h
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CRIAÇÃO DE STORY COM UPLOAD DE IMAGEM FÍSICA (REPLACED RAW URL INPUT) */}
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
                onClick={() => { setShowCreateStory(false); setImagePreview(""); setNovoStoryMedia(""); }}
                className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center border border-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4.5">
              <textarea 
                value={novoStoryText}
                onChange={(e) => setNovoStoryText(e.target.value)}
                placeholder="O que está acontecendo no treino hoje?"
                className="w-full bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl text-xs font-semibold outline-none text-zinc-100 focus:border-emerald-500 transition-all placeholder:text-zinc-650 resize-none"
                rows={3}
              />

              {/* 📷 FILE IMAGE UPLOADER & THUMBNAIL PREVIEW */}
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block px-1">
                  Mídia do Story (Upload Local)
                </label>
                
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950 flex items-center justify-center">
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Story preview" />
                    <button
                      type="button"
                      onClick={() => { setNovoStoryMedia(""); setImagePreview(""); }}
                      className="absolute top-2 right-2 bg-black/85 text-red-500 border border-red-500/25 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wide shadow-md active:scale-95 transition-transform"
                    >
                      ✕ Remover
                    </button>
                  </div>
                ) : (
                  <label className="w-full border border-dashed border-zinc-800 hover:border-emerald-500/50 py-7 rounded-2xl font-black bg-zinc-900/30 hover:bg-emerald-500/5 transition-all duration-300 uppercase italic text-[9px] tracking-widest flex flex-col items-center justify-center gap-2 cursor-pointer text-zinc-400">
                    <span className="text-xl">📷</span>
                    <span>SELECIONAR FOTO DO TREINO</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleStoryFileChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              <button 
                onClick={publicarStoryFeed}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.25)] mt-3 cursor-pointer"
              >
                Publicar Story 🔥
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