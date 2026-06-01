"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/PageHeader"
import { useRanks } from "@/hooks/useRanks"
import { Search, Award, MessageSquare, ChevronRight, Sparkles, Flame, TrendingUp } from "lucide-react"

export default function Explorar() {
  const [busca, setBusca] = useState("")
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLogado, setUserLogado] = useState(null)
  const [listaDeRanks, setListaDeRanks] = useState([])
  const router = useRouter()

  const tagsTendencias = [
    "#Hipertrofia", 
    "#Cardio", 
    "#Calistenia", 
    "#Força", 
    "#Nutrição", 
    "#Definição"
  ]

  const { getRanks, calcularRank } = useRanks()

  useEffect(() => {
    const carregarUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserLogado(user)
    }
    
    const carregarRanks = async () => {
      try {
        const ranks = await getRanks()
        setListaDeRanks(ranks)
      } catch (err) {
        console.error("Erro ao carregar ranks:", err)
      }
    }

    carregarUser()
    carregarRanks()
  }, [])

  useEffect(() => {
    const timer = setTimeout(carregarUsuarios, 400)
    return () => clearTimeout(timer)
  }, [busca])

  async function carregarUsuarios() {
    setLoading(true)
    try {
      let query = supabase
        .from("usuarios")
        .select("id, username, foto, bio, xp, nivel")

      if (busca.length >= 1) {
        const termo = busca.startsWith("#") ? busca.slice(1) : busca
        query = query.or(`username.ilike.%${termo}%,bio.ilike.%${termo}%`)
      } else {
        query = query.limit(20).order('username', { ascending: true })
      }

      const { data, error } = await query
      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error("Erro ao buscar usuários:", error.message)
    } finally {
      setLoading(false)
    }
  }

  // Obter rank com segurança de fallback
  const obterRankUsuario = (xp) => {
    if (listaDeRanks && listaDeRanks.length > 0) {
      return calcularRank(xp || 0, listaDeRanks)
    }
    // Fallback padrão
    const defaultRanks = [
      { nome: "Recruta", cor_texto: "#a1a1aa", cor_border: "#27272a", cor_bg: "#18181b" },
      { nome: "Soldado", cor_texto: "#10b981", cor_border: "#047857", cor_bg: "#064e3b" },
      { nome: "Cabo", cor_texto: "#3b82f6", cor_border: "#1d4ed8", cor_bg: "#1e3a8a" },
      { nome: "Sargento", cor_texto: "#8b5cf6", cor_border: "#6d28d9", cor_bg: "#4c1d95" },
      { nome: "General", cor_texto: "#f59e0b", cor_border: "#b45309", cor_bg: "#78350f" }
    ]
    const xpNum = xp || 0
    if (xpNum < 1000) return defaultRanks[0]
    if (xpNum < 2500) return defaultRanks[1]
    if (xpNum < 5000) return defaultRanks[2]
    if (xpNum < 8000) return defaultRanks[3]
    return defaultRanks[4]
  }

  // Função para navegar para o chat sem disparar o clique do Link do perfil
  const irParaChat = (e, destinatarioId) => {
    e.preventDefault() // Evita que abra o perfil
    router.push(`/mensagens/${destinatarioId}`)
  }

  const handleTagClick = (tag) => {
    if (busca === tag) {
      setBusca("") // Limpa se clicar na mesma tag
    } else {
      setBusca(tag)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[250px] h-[250px] bg-green-500/5 blur-[100px] rounded-full pointer-events-none" />

      <PageHeader icon="🔍" title="Explorar" subtitle="Descubra novos usuários e tendências" color="purple" />

      {/* CARD DE RANKING GLOBAL REMODELADO */}
      <Link href="/ranking" className="block mb-6">
        <motion.div 
          whileHover={{ scale: 1.01, borderColor: "rgba(245, 158, 11, 0.4)" }}
          whileTap={{ scale: 0.99 }}
          className="p-5 rounded-[2rem] bg-gradient-to-br from-zinc-900/80 via-black to-zinc-950 border border-amber-500/10 flex items-center justify-between overflow-hidden relative group shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md"
        >
          {/* Neon copper/gold glow overlay */}
          <div className="absolute -inset-px bg-gradient-to-r from-amber-500/20 via-yellow-500/5 to-amber-700/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-4.5 relative z-10">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(191,149,63,0.35)] relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <Award className="w-6.5 h-6.5 text-zinc-950 stroke-[2]" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-black uppercase italic tracking-wider text-zinc-100 flex items-center gap-1.5">
                  Ranking Global <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 animate-pulse" />
                </p>
              </div>
              <p className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-wide mt-1">
                Acesse a elite operacional do VEXX SQUAD
              </p>
            </div>
          </div>
          
          <div className="relative z-10 bg-zinc-900/90 p-2.5 rounded-full border border-zinc-800 text-amber-500 group-hover:text-yellow-400 transition-colors group-hover:border-amber-500/20">
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </div>
        </motion.div>
      </Link>

      {/* STICKY SEARCH & CATEGORIES */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-xl py-3 z-30 -mx-4 px-4 border-b border-zinc-950">
        {/* INPUT DE PESQUISA PREMIUM COM ÍCONE */}
        <div className="relative mb-3.5">
          <div className="absolute inset-y-0 left-4.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input 
            placeholder="Buscar guerreiro ou tag..."
            className="w-full pl-12 pr-5 py-4 bg-zinc-950 border border-zinc-900 rounded-[1.5rem] outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] text-xs font-semibold placeholder:text-zinc-600"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca && (
            <button 
              onClick={() => setBusca("")}
              className="absolute inset-y-0 right-4 flex items-center text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
            >
              Limpar
            </button>
          )}
        </div>

        {/* TENDÊNCIAS / HASHTAGS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          <div className="flex items-center gap-1.5 text-[8.5px] font-black uppercase text-zinc-500 shrink-0 select-none mr-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
            <span>Filtros</span>
          </div>
          {tagsTendencias.map((tag) => {
            const ativa = busca === tag
            return (
              <motion.button
                key={tag}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleTagClick(tag)}
                className={`px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 transition-all cursor-pointer ${
                  ativa 
                    ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_12px_rgba(147,51,234,0.35)]" 
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {tag}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* RESULTADOS / LISTAGEM */}
      <div className="mt-5 space-y-3.5">
        <div className="flex items-center justify-between px-1.5">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
            {busca ? `Resultado da busca (${usuarios.length})` : "Combatentes Ativos"}
          </p>
          {!busca && (
            <span className="text-[7.5px] font-black bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-wider">
              Recentes
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3.5">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-600 font-black text-[9px] uppercase tracking-widest animate-pulse">Consultando Arquivos...</span>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <AnimatePresence>
              {usuarios.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 bg-zinc-900/10 rounded-[1.8rem] border border-dashed border-zinc-900 p-8"
                >
                  <Flame className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-[11px] font-extrabold uppercase tracking-wider">Nenhum combatente localizado.</p>
                  <p className="text-zinc-650 text-[9px] mt-1 font-semibold">Tente outro nome ou use um filtro de categoria.</p>
                </motion.div>
              ) : (
                usuarios.map((u, idx) => {
                  const status = obterRankUsuario(u.xp)
                  const nivelCalculado = u.nivel || Math.floor((u.xp || 0) / 500) + 1

                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.4) }}
                      className="block"
                    >
                      <Link href={`/perfil?id=${u.id}`}>
                        <div className="flex items-center justify-between bg-zinc-900/20 hover:bg-zinc-900/40 p-4.5 rounded-[1.5rem] border border-zinc-900/80 hover:border-zinc-800 active:scale-[0.98] transition-all relative overflow-hidden group">
                          {/* Radial hover light */}
                          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/2 blur-[30px] rounded-full pointer-events-none group-hover:bg-purple-500/5 transition-all duration-300" />
                          
                          <div className="flex items-center gap-4 relative z-10">
                            {/* Avatar com borda colorida do Rank */}
                            <div 
                              className="w-13 h-13 rounded-full overflow-hidden border-2 flex-shrink-0 bg-zinc-950 relative"
                              style={{ borderColor: status.cor_border || status.cor_texto }}
                            >
                              <img 
                                src={u.foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"} 
                                className="w-full h-full object-cover" 
                                alt={u.username}
                              />
                            </div>

                            <div className="flex flex-col">
                              <p className="font-black text-zinc-100 text-[13.5px] tracking-tight group-hover:text-purple-400 transition-colors">
                                @{u.username}
                              </p>
                              
                              {/* Ranks e Níveis Dinâmicos */}
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span 
                                  className="text-[7.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                  style={{ 
                                    color: status.cor_texto,
                                    backgroundColor: (status.cor_bg || status.cor_texto) + "18",
                                    border: `1px solid ${(status.cor_border || status.cor_texto)}20`
                                  }}
                                >
                                  {status.nome}
                                </span>
                                <span className="text-[7.5px] font-black bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-850 uppercase tracking-widest">
                                  LVL {nivelCalculado}
                                </span>
                              </div>

                              <p className="text-[9.5px] text-zinc-500 font-semibold truncate max-w-[170px] mt-1.5 uppercase">
                                {u.bio || "Agente Operacional Vexx"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 relative z-10 shrink-0">
                            {/* BOTÃO DE MENSAGEM */}
                            {userLogado?.id !== u.id && (
                              <button 
                                onClick={(e) => irParaChat(e, u.id)}
                                className="p-3 bg-zinc-950/80 hover:bg-purple-600 hover:text-white rounded-xl border border-zinc-900 hover:border-purple-500 transition-all text-zinc-400 active:scale-90"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}

                            <div className="bg-zinc-950/40 text-zinc-600 border border-zinc-900/60 p-2.5 rounded-xl group-hover:text-purple-400 group-hover:border-purple-500/20 transition-all">
                              <ChevronRight className="w-4 h-4 stroke-[2]" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <footer className="mt-12 mb-6 text-center">
        <p className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.25em] opacity-40">
          © 2026 @vexx.squad - Central de Discovery
        </p>
      </footer>

      <Navbar />
    </div>
  )
}