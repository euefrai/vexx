"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/Navbar"
import AdminGuard from "@/components/AdminGuard"
import PageHeader from "@/components/PageHeader"
import { BADGES_CATALOG } from "@/hooks/useGamificacao"
import { 
  Shield, Users, Trophy, Flame, Zap, Sparkles, Activity, Trash2, Plus, 
  Search, ShieldAlert, Award, Calendar, Check, X, RefreshCw, BarChart2,
  Wrench, Settings, Trash, AlertTriangle, UserCheck, ShieldCheck
} from "lucide-react"

export default function AdminMaster() {
  const [abaAtiva, setAbaAtiva] = useState("overview") 

  // --- ESTADOS GLOBAIS DE MÉTRICAS ---
  const [metricas, setMetricas] = useState({ usuarios: 0, squads: 0, corridas: 0, desafios: 0 })
  const [loadingMetricas, setLoadingMetricas] = useState(true)

  // --- ESTADOS GESTÃO (ARSENAL) ---
  const [ranks, setRanks] = useState([])
  const [loadingRanks, setLoadingRanks] = useState(true)
  const [novoRank, setNovoRank] = useState({ 
    nome: "", icone: "🎖️", xp_minimo: 0, trofeus_min: 0, trofeus_max: 9999,
    cor_texto: "#ffffff", cor_bg: "#18181b", cor_border: "#27272a" 
  })

  // --- GESTÃO DE OPERADORES (USUÁRIOS) ---
  const [buscaUser, setBuscaUser] = useState("")
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserXp, setSelectedUserXp] = useState({}) // Stores custom XP value for input fields by user ID

  // --- GESTÃO DE DESAFIOS E SQUADS ---
  const [challengesList, setChallengesList] = useState([])
  const [squadsList, setSquadsList] = useState([])
  const [loadingDesafiosSquads, setLoadingDesafiosSquads] = useState(false)
  const [squadExpandida, setSquadExpandida] = useState(null)

  // --- GESTÃO DE CONQUISTAS (CONQUISTAS) ---
  const [selectedUserIdConquistas, setSelectedUserIdConquistas] = useState("")
  const [userConquistasList, setUserConquistasList] = useState([])
  const [loadingUserConquistas, setLoadingUserConquistas] = useState(false)
  const [conquistaParaDar, setConquistaParaDar] = useState("")

  // --- GESTÃO LOGS (VIGILÂNCIA) ---
  const [logs, setLogs] = useState([])
  const [buscaLog, setBuscaLog] = useState("")
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    if (abaAtiva === "overview") carregarMetricasGlobais()
    if (abaAtiva === "usuarios") carregarUsuarios()
    if (abaAtiva === "arsenal") carregarDadosArsenal()
    if (abaAtiva === "desafios_squads") carregarDadosDesafiosESquads()
    if (abaAtiva === "vigilancia") carregarLogs()
    if (abaAtiva === "conquistas") carregarUsuarios()
  }, [abaAtiva])

  useEffect(() => {
    if (selectedUserIdConquistas) {
      carregarConquistasDoUsuario(selectedUserIdConquistas)
    } else {
      setUserConquistasList([])
    }
  }, [selectedUserIdConquistas])


  // --- CARREGAR METRICAS GLOBAIS ---
  async function carregarMetricasGlobais() {
    setLoadingMetricas(true)
    try {
      const uCountPromise = supabase.from("usuarios").select("id", { count: "exact", head: true }).then(r => r.count || 0).catch(() => 0);
      
      const sCountPromise = supabase.from("squads").select("id", { count: "exact", head: true }).then(r => r.count || 0).catch(() => {
        const local = JSON.parse(localStorage.getItem("vexx_squads") || "[]");
        return local.length;
      });
      
      const rCountPromise = supabase.from("runs").select("id", { count: "exact", head: true }).then(r => r.count || 0).catch(() => {
        const local = JSON.parse(localStorage.getItem("vexx_runs") || "[]");
        return local.length;
      });
      
      const cCountPromise = supabase.from("challenges").select("id", { count: "exact", head: true }).then(r => r.count || 0).catch(() => {
        const local = JSON.parse(localStorage.getItem("vexx_challenges") || "[]");
        return local.length;
      });

      const [usuarios, squads, corridas, desafios] = await Promise.all([
        uCountPromise,
        sCountPromise,
        rCountPromise,
        cCountPromise
      ]);

      setMetricas({
        usuarios,
        squads,
        corridas,
        desafios
      })
    } catch (err) {
      console.error("Erro ao carregar metricas:", err)
    } finally {
      setLoadingMetricas(false)
    }
  }

  // --- CARREGAR USUÁRIOS (OPERADORES) ---
  async function carregarUsuarios() {
    setLoadingUsers(true)
    try {
      let query = supabase
        .from("usuarios")
        .select("id, username, xp, status, titulo_manual, is_admin, foto")
        .order("username", { ascending: true })

      if (buscaUser.trim()) {
        query = query.ilike("username", `%${buscaUser}%`)
      }

      const { data, error } = await query.limit(50)
      if (error) throw error
      setUsuarios(data || [])
    } catch (err) {
      console.error("Erro carregar usuarios:", err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // --- ALTERAR PERMISSÕES ADMIN ---
  async function toggleAdmin(uid, isCurrentlyAdmin) {
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ is_admin: !isCurrentlyAdmin })
        .eq("id", uid)

      if (error) throw error
      alert(`Permissão administrativa alterada com sucesso!`)
      carregarUsuarios()
    } catch (err) {
      console.error(err)
      alert("Falha ao alterar privilégios admin")
    }
  }

  // --- MODULAR XP DIRETO E PRECISO ---
  async function modularXPAvançado(uid, novoXPValue) {
    const val = parseInt(novoXPValue)
    if (isNaN(val) || val < 0) return alert("Por favor, defina um valor numérico válido para o XP")
    
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ xp: val })
        .eq("id", uid)

      if (error) throw error
      alert("XP operacional atualizado!")
      carregarUsuarios()
    } catch (err) {
      console.error(err)
      alert("Erro ao modular XP")
    }
  }

  // --- GESTÃO DE DESAFIOS E SQUADS ---
  async function carregarDadosDesafiosESquads() {
    setLoadingDesafiosSquads(true)
    try {
      // 1. Buscar challenges e squads de forma plana
      const [challengesRes, squadsRes] = await Promise.all([
        supabase.from("challenges").select("*").order("created_at", { ascending: false }),
        supabase.from("squads").select("*, squad_members (usuario_id)").order("created_at", { ascending: false })
      ])

      if (challengesRes.error) throw challengesRes.error
      if (squadsRes.error) throw squadsRes.error

      const rawChallenges = challengesRes.data || []
      const rawSquads = squadsRes.data || []

      // 2. Extrair proprietários (owners) e membros únicos de ambas as tabelas
      const allUserIds = new Set()
      rawChallenges.forEach(c => { if (c.owner_id) allUserIds.add(c.owner_id) })
      rawSquads.forEach(s => {
        if (s.owner_id) allUserIds.add(s.owner_id)
        s.squad_members?.forEach(m => {
          if (m.usuario_id) allUserIds.add(m.usuario_id)
        })
      })

      const userIdsArray = Array.from(allUserIds)

      let perfisMap = {}
      if (userIdsArray.length > 0) {
        const { data: perfis, error: perfisErr } = await supabase
          .from("usuarios")
          .select("id, username")
          .in("id", userIdsArray)

        if (perfisErr) throw perfisErr

        perfis?.forEach(p => {
          perfisMap[p.id] = p
        })
      }

      // 3. Mapear perfis na memória
      const mappedChallenges = rawChallenges.map(c => ({
        ...c,
        usuarios: c.owner_id ? (perfisMap[c.owner_id] || { username: "atleta" }) : { username: "atleta" }
      }))

      const mappedSquads = rawSquads.map(s => ({
        ...s,
        usuarios: s.owner_id ? (perfisMap[s.owner_id] || { username: "líder" }) : { username: "líder" },
        membros: (s.squad_members || []).map(m => ({
          usuario_id: m.usuario_id,
          username: perfisMap[m.usuario_id]?.username || "operador"
        }))
      }))

      setChallengesList(mappedChallenges)
      setSquadsList(mappedSquads)
    } catch (err) {
      console.error("Erro ao carregar dados de desafios/squads no admin:", err)
    } finally {
      setLoadingDesafiosSquads(false)
    }
  }

  async function removerMembroSquad(squadId, usuarioId) {
    if (!confirm("Remover este membro da Squad?")) return
    try {
      const { error } = await supabase
        .from("squad_members")
        .delete()
        .eq("squad_id", squadId)
        .eq("usuario_id", usuarioId)

      if (error) throw error
      alert("Membro removido com sucesso!")
      carregarDadosDesafiosESquads()
    } catch (err) {
      console.error("Erro ao remover membro da squad:", err)
      alert("Erro ao remover membro da squad")
    }
  }

  // --- GESTÃO DE CONQUISTAS (CONQUISTAS) ---
  async function carregarConquistasDoUsuario(uid) {
    if (!uid) return
    setLoadingUserConquistas(true)
    try {
      const { data, error } = await supabase
        .from("usuarios_conquistas")
        .select("id, conquista_id, created_at")
        .eq("usuario_id", uid)

      if (error) throw error
      setUserConquistasList(data || [])
    } catch (err) {
      console.error("Erro ao carregar conquistas do usuário:", err)
    } finally {
      setLoadingUserConquistas(false)
    }
  }

  async function concederConquista(uid, conquistaId) {
    if (!uid || !conquistaId) return alert("Selecione um operador e uma conquista!")
    const badge = BADGES_CATALOG[conquistaId]
    if (!badge) return alert("Conquista não encontrada no catálogo!")

    const jaPossui = userConquistasList.some(c => c.conquista_id === conquistaId)
    if (jaPossui) return alert("Este operador já possui esta conquista!")

    try {
      // 1. Inserir conquista
      const { error: insErr } = await supabase
        .from("usuarios_conquistas")
        .insert({ usuario_id: uid, conquista_id: conquistaId })

      if (insErr) throw insErr

      // 2. Adicionar recompensa de XP e recalcular nível
      const { data: userProfile, error: profileErr } = await supabase
        .from("usuarios")
        .select("xp")
        .eq("id", uid)
        .single()

      if (profileErr) throw profileErr

      const novoXP = (userProfile?.xp || 0) + badge.reward
      const novoNivel = Math.floor(novoXP / 500) + 1

      const { error: xpErr } = await supabase
        .from("usuarios")
        .update({ xp: novoXP, nivel: novoNivel })
        .eq("id", uid)

      if (xpErr) throw xpErr

      // 3. Registrar log de atividade
      await supabase.from("logs_atividades").insert({
        usuario_id: uid,
        tipo_evento: "conquista_concedida",
        descricao: `Comando concedeu manualmente a conquista "${badge.nome}" (+${badge.reward} XP)`
      })

      alert(`Conquista "${badge.nome}" concedida com sucesso! +${badge.reward} XP adicionados.`)
      
      carregarConquistasDoUsuario(uid)
      carregarUsuarios()
    } catch (err) {
      console.error("Erro ao conceder conquista:", err)
      alert("Falha ao conceder conquista")
    }
  }

  async function revogarConquista(uid, conquistaId, registroId) {
    if (!confirm("Revogar esta conquista? O XP correspondente NÃO será removido automaticamente para evitar níveis negativos ou inconsistências (ajuste o XP manualmente se necessário). Deseja prosseguir?")) return
    const badge = BADGES_CATALOG[conquistaId]

    try {
      const { error } = await supabase
        .from("usuarios_conquistas")
        .delete()
        .eq("id", registroId)

      if (error) throw error

      // Registrar log de atividade
      await supabase.from("logs_atividades").insert({
        usuario_id: uid,
        tipo_evento: "conquista_revogada",
        descricao: `Comando revogou manualmente a conquista "${badge?.nome || conquistaId}"`
      })

      alert("Conquista revogada com sucesso!")
      carregarConquistasDoUsuario(uid)
      carregarUsuarios()
    } catch (err) {
      console.error("Erro ao revogar conquista:", err)
      alert("Falha ao revogar conquista")
    }
  }


  async function alternarStatusDesafio(id, statusAtual) {
    const novoStatus = statusAtual === "open" ? "closed" : "open"
    try {
      await supabase.from("challenges").update({ status: novoStatus }).eq("id", id)
      carregarDadosDesafiosESquads()
    } catch (err) {
      console.error(err)
    }
  }

  async function deletarDesafio(id) {
    if (!confirm("Remover este desafio do VEXX permanentemente?")) return
    try {
      await supabase.from("challenges").delete().eq("id", id)
      carregarDadosDesafiosESquads()
    } catch (err) {
      console.error(err)
    }
  }

  async function deletarSquad(id) {
    if (!confirm("Destruir esta Squad permanentemente? Todos os membros serão removidos.")) return
    try {
      await supabase.from("squad_members").delete().eq("squad_id", id)
      await supabase.from("squads").delete().eq("id", id)
      carregarDadosDesafiosESquads()
    } catch (err) {
      console.error(err)
    }
  }

  async function ajustarCapacidadeSquad(id, capAtual, delta) {
    const novaCap = Math.max(2, capAtual + delta)
    try {
      await supabase.from("squads").update({ capacity: novaCap }).eq("id", id)
      carregarDadosDesafiosESquads()
    } catch (err) {
      console.error(err)
    }
  }

  // --- FUNÇÕES ARSENAL ---
  async function carregarDadosArsenal() {
    try {
      setLoadingRanks(true)
      const { data } = await supabase.from("ranks_custom").select("*").order("xp_minimo", { ascending: true })
      setRanks(data || [])
    } finally { setLoadingRanks(false) }
  }

  async function salvarRank() {
    if (!novoRank.nome) return alert("Insira o nome do título!")
    const { error } = await supabase.from("ranks_custom").insert([novoRank])
    if (!error) {
      alert("Patente forjada com sucesso! 🔥")
      setNovoRank({ nome: "", icone: "🎖️", xp_minimo: 0, trofeus_min: 0, trofeus_max: 9999, cor_texto: "#ffffff", cor_bg: "#18181b", cor_border: "#27272a" })
      carregarDadosArsenal()
    }
  }

  async function deletarRank(id) {
    if(!confirm("Remover esta patente do arsenal ativo?")) return
    await supabase.from("ranks_custom").delete().eq("id", id)
    carregarDadosArsenal()
  }

  // --- FUNÇÕES VIGILÂNCIA & PUNIÇÃO ---
  async function carregarLogs() {
    setLoadingLogs(true)
    const { data } = await supabase.from("logs_atividades").select("*, usuarios (id, username, status, xp)").order("created_at", { ascending: false })
    setLogs(data || [])
    setLoadingLogs(false)
  }

  async function expurgarLogsAntigos() {
    if (!confirm("Expurgar logs com mais de 30 dias para otimizar o Supabase? Esta ação não pode ser desfeita.")) return
    try {
      const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { error } = await supabase
        .from("logs_atividades")
        .delete()
        .lt("created_at", trintaDiasAtras)

      if (error) throw error
      alert("Logs antigos expurgados!")
      carregarLogs()
    } catch (err) {
      console.error(err)
      alert("Falha ao expurgar logs")
    }
  }

  async function alterarStatus(uid, novoStatus) {
    const { error } = await supabase.from("usuarios").update({ status: novoStatus }).eq("id", uid)
    if (!error) {
      alert(`Status de acesso alterado: ${novoStatus.toUpperCase()}`)
      carregarLogs()
      if (usuarios.length > 0) carregarUsuarios()
    }
  }

  async function modularXP(uid, xpAtual, qtd) {
    const novoXP = Math.max(0, (xpAtual || 0) + qtd)
    const { error } = await supabase.from("usuarios").update({ xp: novoXP }).eq("id", uid)
    if (!error) {
      carregarLogs()
      if (usuarios.length > 0) carregarUsuarios()
    }
  }

  async function deletarTreino(treinoId, logId) {
    if(!confirm("Remover este treino do banco de dados?")) return
    await supabase.from("treinos").delete().eq("id", treinoId)
    await supabase.from("logs_atividades").delete().eq("id", logId)
    setLogs(logs.filter(l => l.id !== logId))
  }

  const logsFiltrados = logs.filter(l => 
    l.usuarios?.username?.toLowerCase().includes(buscaLog.toLowerCase())
  )

  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-32 font-sans relative">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />

        <PageHeader 
          icon={<Shield className="w-7 h-7 text-rose-400 animate-pulse" />} 
          title="Comando" 
          subtitle="Central de controle administrativo VEXX" 
          color="red" 
        />

        {/* NAVEGAÇÃO DE ABAS OPERACIONAIS */}
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-900">
            {[
              { id: "overview", label: "Visão Geral", icon: BarChart2, activeColor: "border-blue-500/30 bg-blue-500/5 text-blue-400" },
              { id: "usuarios", label: "Operadores", icon: Users, activeColor: "border-indigo-500/30 bg-indigo-500/5 text-indigo-400" },
              { id: "arsenal", label: "Arsenal Ranks", icon: Trophy, activeColor: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
              { id: "desafios_squads", label: "Desafios & Squads", icon: Award, activeColor: "border-amber-500/30 bg-amber-500/5 text-amber-400" },
              { id: "conquistas", label: "Conquistas", icon: Sparkles, activeColor: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400" },
              { id: "vigilancia", label: "Vigilância Logs", icon: ShieldAlert, activeColor: "border-rose-500/30 bg-rose-500/5 text-rose-400" }
            ].map(tab => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all duration-300 flex items-center gap-2 border ${
                    abaAtiva === tab.id 
                      ? tab.activeColor 
                      : "bg-zinc-900/30 text-zinc-500 border-zinc-900/60 hover:bg-zinc-900/60 hover:text-zinc-300"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          <AnimatePresence mode="wait">
            
            {/* 1. VISÃO GERAL (OVERVIEW) */}
            {abaAtiva === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {loadingMetricas ? (
                  <div className="flex justify-center py-20">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-5 flex flex-col justify-between">
                        <Users className="w-5 h-5 text-blue-400 mb-3" />
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Atletas Cadastrados</p>
                          <p className="text-3xl font-extrabold text-white mt-1">{metricas.usuarios}</p>
                        </div>
                      </div>
                      <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-5 flex flex-col justify-between">
                        <Flame className="w-5 h-5 text-indigo-400 mb-3" />
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Squads Ativas</p>
                          <p className="text-3xl font-extrabold text-white mt-1">{metricas.squads}</p>
                        </div>
                      </div>
                      <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-5 flex flex-col justify-between">
                        <Activity className="w-5 h-5 text-emerald-400 mb-3" />
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Corridas Registradas</p>
                          <p className="text-3xl font-extrabold text-white mt-1">{metricas.corridas}</p>
                        </div>
                      </div>
                      <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-5 flex flex-col justify-between">
                        <Trophy className="w-5 h-5 text-amber-400 mb-3" />
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Desafios Ativos</p>
                          <p className="text-3xl font-extrabold text-white mt-1">{metricas.desafios}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-6">
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-rose-400" /> Ações Rápidas do Administrador
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        <button onClick={() => setAbaAtiva("usuarios")} className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 hover:border-zinc-800 text-left transition duration-300">
                          <p className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1">Buscar & Ajustar Operadores</p>
                          <p className="text-[10px] text-zinc-500">Mudar patentes, adicionar ou remover XP e modular acessos em lote.</p>
                        </button>
                        <button onClick={() => setAbaAtiva("desafios_squads")} className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 hover:border-zinc-800 text-left transition duration-300">
                          <p className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1">Moderador de Desafios & Squads</p>
                          <p className="text-[10px] text-zinc-500">Excluir esquadrões, gerenciar/remover membros e moderar desafios ativos.</p>
                        </button>
                        <button onClick={() => setAbaAtiva("conquistas")} className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 hover:border-zinc-800 text-left transition duration-300">
                          <p className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1">Gestor de Conquistas</p>
                          <p className="text-[10px] text-zinc-500">Conceder ou revogar insígnias de operadores do catálogo de gamificação.</p>
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </motion.div>
            )}

            {/* 2. OPERADORES (GESTÃO USUÁRIOS) */}
            {abaAtiva === 'usuarios' && (
              <motion.div key="usuarios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex gap-3 mb-2">
                  <div className="relative flex-1">
                    <input 
                      placeholder="FILTRAR OPERADOR POR CODIDOME..." 
                      className="w-full bg-zinc-900/30 border border-zinc-900/80 p-3.5 rounded-xl text-xs outline-none text-zinc-100 placeholder-zinc-600 focus:border-zinc-800"
                      value={buscaUser} onChange={e => setBuscaUser(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && carregarUsuarios()}
                    />
                    <Search className="w-4 h-4 text-zinc-600 absolute right-4 top-1/2 -translate-y-1/2" />
                  </div>
                  <button onClick={carregarUsuarios} className="bg-indigo-500 hover:bg-indigo-600 text-black px-6 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition">
                    Filtrar
                  </button>
                </div>

                <div className="space-y-3.5">
                  {loadingUsers ? (
                    <div className="flex justify-center py-20">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : usuarios.length === 0 ? (
                    <div className="bg-zinc-900/10 border border-zinc-900/60 rounded-xl p-8 text-center">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Nenhum operador encontrado.</p>
                    </div>
                  ) : (
                    usuarios.map(u => (
                      <div key={u.id} className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900/80 rounded-xl p-4.5 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-full border-2 overflow-hidden bg-zinc-950 ${u.is_admin ? 'border-rose-500' : 'border-zinc-800'}`}>
                              {u.foto ? <img src={u.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">U</div>}
                            </div>
                            <div>
                              <p className="font-extrabold text-zinc-100 text-xs flex items-center gap-1.5">
                                @{u.username}
                                {u.is_admin && <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-lg uppercase tracking-wider">Admin</span>}
                              </p>
                              <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">XP Atual: {u.xp} | Patente: {u.titulo_manual || "Automática"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* STATUS BADGE */}
                            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                              u.status === 'ativo' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                            }`}>
                              {u.status}
                            </span>
                          </div>
                        </div>

                        {/* CONTROLES AVANÇADOS INLINE */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4.5 border-t border-zinc-900/80">
                          {/* 1. MUDAR ROLE ADMIN */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Privilégio Comando</label>
                            <button 
                              onClick={() => toggleAdmin(u.id, u.is_admin)}
                              className={`w-full py-2 px-3 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition border ${
                                u.is_admin 
                                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-black" 
                                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                              }`}
                            >
                              {u.is_admin ? "Remover Admin" : "Tornar Admin"}
                            </button>
                          </div>

                          {/* 2. MUDAR STATUS BAN */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Estado de Acesso</label>
                            <select 
                              value={u.status} 
                              onChange={(e) => alterarStatus(u.id, e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 text-[9px] font-extrabold p-2 rounded-lg outline-none uppercase tracking-wider focus:border-zinc-700"
                            >
                              <option value="ativo">OPERACIONAL (ATIVO)</option>
                              <option value="suspenso">SUSPENSO</option>
                              <option value="banido">BANIDO</option>
                            </select>
                          </div>

                          {/* 3. PATENTE MANUAL */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Patente Personalizada</label>
                            <select 
                              value={u.titulo_manual || ""}
                              onChange={async (e) => {
                                const { error } = await supabase.from("usuarios").update({ titulo_manual: e.target.value || null }).eq("id", u.id)
                                if (!error) {
                                  alert("Patente forjada ajustada!")
                                  carregarUsuarios()
                                }
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 text-[9px] font-extrabold p-2 rounded-lg outline-none uppercase tracking-wider focus:border-zinc-700"
                            >
                              <option value="">RANK AUTOMÁTICO</option>
                              {ranks.map(r => <option key={r.id} value={r.nome}>{r.nome}</option>)}
                            </select>
                          </div>

                          {/* 4. DEFINIR XP PRECISO */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Ajuste Granular de XP</label>
                            <div className="flex gap-1.5">
                              <input 
                                type="number" 
                                placeholder="NOVO XP..." 
                                className="flex-1 bg-zinc-950 border border-zinc-900 p-1.5 rounded-lg text-[10px] font-bold outline-none text-zinc-200"
                                value={selectedUserXp[u.id] !== undefined ? selectedUserXp[u.id] : ""}
                                onChange={e => setSelectedUserXp({...selectedUserXp, [u.id]: e.target.value})}
                              />
                              <button 
                                onClick={() => {
                                  modularXPAvançado(u.id, selectedUserXp[u.id])
                                  setSelectedUserXp({...selectedUserXp, [u.id]: ""})
                                }}
                                className="bg-indigo-500 hover:bg-indigo-600 text-black px-2.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition"
                              >
                                Fixar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* 3. ARSENAL (FORJA RANKS) */}
            {abaAtiva === 'arsenal' && (
              <motion.div key="arsenal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* FORJAR RANK */}
                  <div className="space-y-4 bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-5">
                    <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Forjar Patente Customizada
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Nome do Título</label>
                          <input placeholder="EX: GENERAL" className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-xs font-bold uppercase text-white outline-none" 
                            value={novoRank.nome} onChange={e => setNovoRank({...novoRank, nome: e.target.value.toUpperCase()})}/>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center block">Ícone</label>
                          <input placeholder="🎖️" className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-center text-lg outline-none" 
                            value={novoRank.icone} onChange={e => setNovoRank({...novoRank, icone: e.target.value})}/>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">XP Mínimo</label>
                          <input type="number" className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-xs font-bold outline-none" 
                            value={novoRank.xp_minimo} onChange={e => setNovoRank({...novoRank, xp_minimo: parseInt(e.target.value) || 0})}/>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Cor do Texto</label>
                           <div className="flex gap-2 items-center bg-zinc-950 border border-zinc-900 p-1.5 rounded-xl">
                             <input type="color" className="w-full h-8 bg-transparent cursor-pointer border-none" 
                              value={novoRank.cor_texto} onChange={e => setNovoRank({...novoRank, cor_texto: e.target.value})}/>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Troféus Mín.</label>
                          <input type="number" className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-xs font-bold outline-none" 
                            value={novoRank.trofeus_min} onChange={e => setNovoRank({...novoRank, trofeus_min: parseInt(e.target.value) || 0})}/>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Troféus Máx.</label>
                          <input type="number" className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-xs font-bold outline-none" 
                            value={novoRank.trofeus_max} onChange={e => setNovoRank({...novoRank, trofeus_max: parseInt(e.target.value) || 9999})}/>
                        </div>
                      </div>

                      {/* PREVIEW CONTAINER */}
                      <div className="p-4 rounded-xl border border-zinc-900 flex items-center justify-center gap-3 bg-zinc-950/80">
                         <span className="text-xl">{novoRank.icone}</span>
                         <span className="font-extrabold italic uppercase tracking-wider text-sm" style={{ color: novoRank.cor_texto }}>{novoRank.nome || "PREVIEW"}</span>
                      </div>

                      <button onClick={salvarRank} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold py-3.5 rounded-xl text-[10px] uppercase tracking-wider transition">
                        Integrar Patente ao Arsenal
                      </button>
                    </div>
                  </div>

                  {/* LISTA RANKS */}
                  <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-5">
                    <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Patentes Operacionais</h2>
                    <div className="space-y-3.5">
                      {loadingRanks ? (
                        <p className="text-center py-10 animate-pulse text-zinc-600 text-[10px] uppercase font-bold tracking-wider">Carregando arsenal...</p>
                      ) : ranks.length === 0 ? (
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider text-center py-8">Nenhuma patente cadastrada.</p>
                      ) : (
                        ranks.map(r => (
                          <div key={r.id} className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl flex justify-between items-center border-l-4" style={{ borderLeftColor: r.cor_texto }}>
                             <div className="flex items-center gap-3">
                               <span className="text-lg">{r.icone}</span>
                               <div>
                                 <p className="font-extrabold italic text-sm uppercase tracking-wider" style={{ color: r.cor_texto }}>{r.nome}</p>
                                 <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">XP Mínimo: {r.xp_minimo} | 🏆 {r.trofeus_min} - {r.trofeus_max}</p>
                               </div>
                             </div>
                             <button onClick={() => deletarRank(r.id)} className="text-zinc-600 hover:text-rose-500 transition duration-300">
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* 4. DESAFIOS & SQUADS */}
            {abaAtiva === 'desafios_squads' && (
              <motion.div key="desafios_squads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* MODERAÇÃO DESAFIOS */}
                  <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-5 space-y-4">
                    <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="w-4 h-4" /> Moderar Desafios
                    </h2>

                    <div className="space-y-3.5">
                      {loadingDesafiosSquads ? (
                        <div className="flex justify-center py-10">
                          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : challengesList.length === 0 ? (
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider text-center py-8">Nenhum desafio no sistema.</p>
                      ) : (
                        challengesList.map(c => (
                          <div key={c.id} className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl flex flex-col justify-between gap-3">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Líder: @{c.usuarios?.username || "anon"}</p>
                                <p className="font-extrabold uppercase text-zinc-200 text-xs mt-1">{c.title}</p>
                              </div>
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-lg uppercase tracking-wider ${
                                c.status === "open" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500 border border-zinc-800"
                              }`}>
                                {c.status}
                              </span>
                            </div>

                            <div className="flex justify-between items-center border-t border-zinc-900/80 pt-3">
                              <button 
                                onClick={() => alternarStatusDesafio(c.id, c.status)}
                                className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 hover:text-white transition duration-300"
                              >
                                {c.status === "open" ? "Fechar Desafio" : "Reabrir Desafio"}
                              </button>
                              <button 
                                onClick={() => deletarDesafio(c.id)}
                                className="text-zinc-600 hover:text-rose-500 transition duration-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* MODERAÇÃO SQUADS */}
                  <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-5 space-y-4">
                    <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4" /> Moderar Squads (Esquadrões)
                    </h2>

                    <div className="space-y-3.5">
                      {loadingDesafiosSquads ? (
                        <div className="flex justify-center py-10">
                          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : squadsList.length === 0 ? (
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider text-center py-8">Nenhuma squad no sistema.</p>
                      ) : (
                        squadsList.map(s => {
                          const count = s.squad_members?.length || 0
                          return (
                            <div key={s.id} className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl flex flex-col gap-3">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Fundador: @{s.usuarios?.username || "anon"}</p>
                                  <p className="font-extrabold uppercase text-zinc-200 text-xs mt-1">{s.name}</p>
                                </div>
                                <span className="text-[9px] font-extrabold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-zinc-400">
                                  {count} / {s.capacity} membros
                                </span>
                              </div>

                              <div className="flex justify-between items-center border-t border-zinc-900/80 pt-3">
                                <div className="flex gap-2 items-center">
                                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Capacidade:</span>
                                  <button onClick={() => ajustarCapacidadeSquad(s.id, s.capacity, -2)} className="bg-zinc-900 border border-zinc-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">-2</button>
                                  <button onClick={() => ajustarCapacidadeSquad(s.id, s.capacity, 2)} className="bg-zinc-900 border border-zinc-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">+2</button>
                                </div>
                                <button 
                                  onClick={() => deletarSquad(s.id)}
                                  className="text-zinc-600 hover:text-rose-500 transition duration-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* PAINEL DE MEMBROS EXPANSIBILIZADO */}
                              <div className="border-t border-zinc-900/50 pt-2 mt-1">
                                <button
                                  onClick={() => setSquadExpandida(squadExpandida === s.id ? null : s.id)}
                                  className="w-full text-center text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 py-1.5 bg-zinc-900/20 rounded-lg hover:bg-zinc-900/40 transition flex items-center justify-center gap-1"
                                >
                                  {squadExpandida === s.id ? "Ocultar Membros" : "Ver Membros da Squad"}
                                </button>

                                <AnimatePresence>
                                  {squadExpandida === s.id && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-3.5 space-y-2 overflow-hidden"
                                    >
                                      {(!s.membros || s.membros.length === 0) ? (
                                        <p className="text-zinc-600 text-[8px] uppercase tracking-wider text-center py-2">Nenhum membro extra nesta squad.</p>
                                      ) : (
                                        s.membros.map(m => (
                                          <div key={m.usuario_id} className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg border border-zinc-900/50">
                                            <span className="text-[10px] font-bold text-zinc-300">@{m.username}</span>
                                            {m.usuario_id !== s.owner_id ? (
                                              <button
                                                onClick={() => removerMembroSquad(s.id, m.usuario_id)}
                                                className="text-[8px] font-extrabold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded hover:bg-rose-500 hover:text-black transition"
                                              >
                                                Remover
                                              </button>
                                            ) : (
                                              <span className="text-[8px] font-extrabold uppercase tracking-wider bg-zinc-905 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded">Líder</span>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          )
                        })

                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* 5. GESTÃO DE CONQUISTAS (CONQUISTAS) */}
            {abaAtiva === 'conquistas' && (
              <motion.div key="conquistas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* CONCEDER CONQUISTA */}
                  <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-5 space-y-4">
                    <h2 className="text-xs font-bold text-yellow-450 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400" /> Conceder Conquista Manual
                    </h2>

                    <div className="space-y-4">
                      {/* 1. SELECIONAR OPERADOR */}
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Selecionar Operador</label>
                        <select
                          value={selectedUserIdConquistas}
                          onChange={e => setSelectedUserIdConquistas(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 text-xs font-bold p-3 rounded-xl outline-none uppercase tracking-wider text-white focus:border-zinc-800"
                        >
                          <option value="">-- SELECIONE UM OPERADOR --</option>
                          {usuarios.map(u => (
                            <option key={u.id} value={u.id}>
                              @{u.username} (XP: {u.xp})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. SELECIONAR BADGE */}
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Selecionar Medalha / Conquista</label>
                        <select
                          value={conquistaParaDar}
                          onChange={e => setConquistaParaDar(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 text-xs font-bold p-3 rounded-xl outline-none uppercase tracking-wider text-white focus:border-zinc-800"
                        >
                          <option value="">-- SELECIONE UMA CONQUISTA --</option>
                          {Object.entries(BADGES_CATALOG).map(([key, b]) => (
                            <option key={key} value={key}>
                              {b.icon} {b.nome} (+{b.reward} XP - {b.categoria})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* PREVIEW DA CONQUISTA SELECIONADA */}
                      {conquistaParaDar && BADGES_CATALOG[conquistaParaDar] && (
                        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/80 flex items-center gap-3.5">
                          <span className="text-2xl">{BADGES_CATALOG[conquistaParaDar].icon}</span>
                          <div>
                            <p className="font-extrabold uppercase text-xs text-white">{BADGES_CATALOG[conquistaParaDar].nome}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{BADGES_CATALOG[conquistaParaDar].descricao}</p>
                            <p className="text-[8px] font-bold text-yellow-500 uppercase tracking-wider mt-1">Recompensa: +{BADGES_CATALOG[conquistaParaDar].reward} XP</p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => concederConquista(selectedUserIdConquistas, conquistaParaDar)}
                        disabled={!selectedUserIdConquistas || !conquistaParaDar}
                        className="w-full bg-yellow-500 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-850 hover:bg-yellow-600 text-black font-extrabold py-3.5 rounded-xl text-[10px] uppercase tracking-wider transition"
                      >
                        Conceder Conquista & Recompensa
                      </button>
                    </div>
                  </div>

                  {/* VISUALIZAR / REVOGAR CONQUISTAS */}
                  <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-900 rounded-xl p-5 space-y-4">
                    <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Conquistas Ativas do Operador
                    </h2>

                    {!selectedUserIdConquistas ? (
                      <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider text-center py-12">
                        Selecione um operador na coluna ao lado para auditar suas conquistas.
                      </p>
                    ) : loadingUserConquistas ? (
                      <div className="flex justify-center py-12">
                        <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : userConquistasList.length === 0 ? (
                      <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider text-center py-12">
                        Este operador ainda não possui nenhuma conquista no registro.
                      </p>
                    ) : (
                      <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-none">
                        {userConquistasList.map(item => {
                          const badge = BADGES_CATALOG[item.conquista_id] || {
                            nome: item.conquista_id,
                            descricao: "Conquista personalizada / desconhecida",
                            icon: "🏅"
                          }
                          return (
                            <div key={item.id} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl flex justify-between items-center gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{badge.icon}</span>
                                <div>
                                  <p className="font-extrabold uppercase text-zinc-200 text-xs">{badge.nome}</p>
                                  <p className="text-[9px] text-zinc-500">{badge.descricao}</p>
                                  <p className="text-[8px] text-zinc-650 font-bold uppercase mt-0.5">Adquirida em: {new Date(item.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => revogarConquista(selectedUserIdConquistas, item.conquista_id, item.id)}
                                className="text-zinc-600 hover:text-rose-500 transition duration-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* 6. VIGILÂNCIA & LOGS */}
            {abaAtiva === 'vigilancia' && (
              <motion.div key="vigilancia" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <input 
                      placeholder="FILTRAR REGISTROS POR OPERADOR..." 
                      className="w-full bg-zinc-900/30 border border-zinc-900/80 p-3.5 text-xs outline-none text-zinc-100 placeholder-zinc-600 pl-10 rounded-xl focus:border-zinc-800"
                      value={buscaLog} onChange={(e) => setBuscaLog(e.target.value)}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-xs">@</span>
                  </div>
                  
                  <button onClick={carregarLogs} className="bg-rose-500 hover:bg-rose-600 text-black px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition duration-300 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Recarregar
                  </button>

                  <button onClick={expurgarLogsAntigos} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-rose-400 px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition duration-300 flex items-center gap-1.5">
                    <Trash className="w-3.5 h-3.5" /> Expurgar (+30d)
                  </button>
                </div>

                <div className="space-y-3.5 font-mono">
                  {loadingLogs ? (
                    <p className="text-rose-500 animate-pulse text-center py-20 text-[10px] font-bold uppercase tracking-widest">Escaneando conexões de rede...</p>
                  ) : logsFiltrados.length === 0 ? (
                    <div className="bg-zinc-900/10 border border-zinc-900/60 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-1">
                      <AlertTriangle className="w-5 h-5 text-zinc-600" />
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Nenhum log operacional registrado.</p>
                    </div>
                  ) : (
                    logsFiltrados.map((log) => (
                      <div key={log.id} className={`border-l-4 p-5 rounded-xl transition-all ${log.usuarios?.status !== 'ativo' ? 'bg-rose-500/5 border-rose-500/40 shadow-[inset_0_0_20px_rgba(220,38,38,0.02)]' : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700'}`}>
                        <div className="flex justify-between items-start gap-6">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center flex-wrap gap-2.5 text-[9px]">
                              <span className="text-zinc-600">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                              <span className="font-bold text-rose-400 uppercase tracking-wide text-xs">@{log.usuarios?.username || "anon"}</span>
                              <span className="bg-zinc-900/80 text-zinc-400 px-2 py-0.5 rounded border border-zinc-850 uppercase text-[8px] font-bold">{log.tipo_evento}</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed font-medium">"{log.descricao}"</p>
                            <div className="flex gap-4 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                               <span>XP: <span className="text-zinc-300">{log.usuarios?.xp || 0}</span></span>
                               <span>Estado: <span className={log.usuarios?.status === 'ativo' ? 'text-emerald-400' : 'text-rose-400'}>{log.usuarios?.status?.toUpperCase()}</span></span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {/* AJUSTE XP RÁPIDO */}
                            <div className="flex flex-col gap-1">
                              <button onClick={() => modularXP(log.usuario_id, log.usuarios.xp, -500)} className="bg-zinc-900 hover:bg-rose-500 hover:text-black border border-zinc-850 text-[8px] font-extrabold p-1.5 rounded transition duration-300">-500</button>
                              <button onClick={() => modularXP(log.usuario_id, log.usuarios.xp, 500)} className="bg-zinc-900 hover:bg-emerald-500 hover:text-black border border-zinc-850 text-[8px] font-extrabold p-1.5 rounded transition duration-300">+500</button>
                            </div>
                            
                            {/* ACESSO RÁPIDO */}
                            <div className="flex flex-col gap-1">
                              {log.usuarios?.status === 'ativo' ? (
                                <button onClick={() => alterarStatus(log.usuario_id, 'banido')} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-black text-[8px] font-extrabold p-1.5 uppercase h-full rounded transition duration-300 flex items-center justify-center">BAN</button>
                              ) : (
                                <button onClick={() => alterarStatus(log.usuario_id, 'ativo')} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black text-[8px] font-extrabold p-1.5 uppercase h-full rounded transition duration-300 flex items-center justify-center">UNBAN</button>
                              )}
                            </div>
                            
                            {/* DELETAR TREINO */}
                            {log.treino_id && (
                              <button onClick={() => deletarTreino(log.treino_id, log.id)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-[8px] font-extrabold p-2 uppercase rounded transition duration-300 flex items-center justify-center text-zinc-400 hover:text-white">DEL</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <Navbar />
      </div>
    </AdminGuard>
  )
}