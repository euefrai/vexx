"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import PageHeader from "@/components/PageHeader"
import { Search, MessageSquare, Users, MessageCircle, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Componente utilitário para renderizar foto ou iniciais do usuário com design premium
function RenderUserAvatar({ usuario, size = "w-12 h-12 text-xs" }) {
  if (usuario?.foto) {
    return (
      <div className={`${size} rounded-full border border-zinc-850 overflow-hidden shrink-0 bg-zinc-900`}>
        <img src={usuario.foto} className="w-full h-full object-cover" alt="avatar" />
      </div>
    )
  }
  
  const username = usuario?.username || "atleta"
  const initials = username.substring(0, 2).toUpperCase()
  return (
    <div className={`${size} rounded-full border border-zinc-850 overflow-hidden shrink-0 bg-zinc-900 flex items-center justify-center font-black tracking-tighter text-blue-400 select-none`}>
      {initials}
    </div>
  )
}

export default function ListaMensagens() {
  const [abaAtiva, setAbaAtiva] = useState("diretas")
  const [busca, setBusca] = useState("")
  const [conversas, setConversas] = useState([])
  const [seguindo, setSeguindo] = useState([])
  const [squads, setSquads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Carregar quem o usuário segue
      const { data: seguindoData } = await supabase
        .from("seguidores")
        .select("usuarios!seguidores_seguido_id_fkey(id, username, foto)")
        .eq("seguidor_id", user.id)
      
      setSeguindo(seguindoData?.map(s => s.usuarios) || [])

      // 2. Carregar histórico de mensagens diretas
      const { data: mensagensData, error: msgError } = await supabase
        .from("mensagens")
        .select(`
          texto,
          created_at,
          remetente_id,
          destinatario_id,
          remetente:usuarios!mensagens_remetente_id_fkey(id, username, foto),
          destinatario:usuarios!mensagens_destinatario_id_fkey(id, username, foto)
        `)
        .or(`remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
        .order("created_at", { ascending: false })

      if (!msgError && mensagensData) {
        const chatsAgrupados = {}
        mensagensData.forEach(msg => {
          const outroUser = msg.remetente_id === user.id ? msg.destinatario : msg.remetente
          if (outroUser && !chatsAgrupados[outroUser.id]) {
            chatsAgrupados[outroUser.id] = {
              id: outroUser.id,
              username: outroUser.username,
              foto: outroUser.foto,
              ultimaMsg: msg.texto,
              data: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          }
        })
        setConversas(Object.values(chatsAgrupados))
      }

      // 3. Carregar Esquadrões (Squads) do Usuário com Junções no Cliente
      await carregarEsquadroes(user)

    } catch (error) {
      console.error("Erro ao carregar dados de mensagens:", error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarEsquadroes(user) {
    try {
      // 1. Buscar membros de forma plana
      const { data: membersRes, error: membersErr } = await supabase
        .from("squad_members")
        .select("squad_id")
        .eq("usuario_id", user.id)
      
      if (membersErr) throw membersErr

      const squadIds = membersRes?.map(m => m.squad_id).filter(Boolean) || []
      
      let minhasSquads = []
      if (squadIds.length > 0) {
        // 2. Buscar squads em lote
        const { data: squadsRes, error: squadsErr } = await supabase
          .from("squads")
          .select("id, name, description, capacity, owner_id")
          .in("id", squadIds)
        
        if (squadsErr) throw squadsErr
        minhasSquads = squadsRes || []
      }

      setSquads(minhasSquads)
    } catch (err) {
      console.log("Banco Supabase offline ou sem tabelas de squads, carregando fallback local...", err.message)
      
      const localSquads = JSON.parse(localStorage.getItem("vexx_squads") || "[]")
      const localMemberships = JSON.parse(localStorage.getItem(`vexx_squad_members_${user.id}`) || "[]")
      
      const minhasSquads = localSquads.filter(s => s.owner_id === user.id || localMemberships.includes(s.id))
      setSquads(minhasSquads)
    }
  }

  // Filtragem dinâmica de chats e squads em tempo real
  const conversasFiltradas = useMemo(() => {
    return conversas.filter(c => c.username?.toLowerCase().includes(busca.toLowerCase()) || c.ultimaMsg?.toLowerCase().includes(busca.toLowerCase()))
  }, [conversas, busca])

  const squadsFiltrados = useMemo(() => {
    return squads.filter(s => s.name?.toLowerCase().includes(busca.toLowerCase()) || s.description?.toLowerCase().includes(busca.toLowerCase()))
  }, [squads, busca])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

      <div className="max-w-md mx-auto p-4 pb-28">
        <PageHeader icon={<MessageSquare className="w-7 h-7 text-blue-400" />} title="Mensagens" subtitle="Comunique-se direto com sua squad" color="blue" />

        {/* PESQUISA DE OPERAÇÃO EM TEMPO REAL */}
        <div className="relative mb-5 mt-2">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-600" />
          </span>
          <input 
            type="text" 
            placeholder="Localizar combatente ou esquadrão..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-zinc-900/35 border border-zinc-900 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-semibold tracking-wide text-zinc-200 placeholder:text-zinc-655 outline-none focus:border-blue-500/30 focus:bg-zinc-900/50 transition-all placeholder:font-medium placeholder:uppercase" 
          />
        </div>

        {/* SELETOR DE ABAS TÁTICO */}
        <div className="flex bg-zinc-900/40 p-1 rounded-2xl border border-zinc-900 mb-6 backdrop-blur-md relative z-10">
          <button 
            onClick={() => { setAbaAtiva("diretas"); setBusca(""); }} 
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border-none ${
              abaAtiva === "diretas" 
                ? "bg-blue-500 text-black shadow-lg shadow-blue-950/20" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Mensagens Diretas
          </button>
          <button 
            onClick={() => { setAbaAtiva("esquadroes"); setBusca(""); }} 
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border-none ${
              abaAtiva === "esquadroes" 
                ? "bg-blue-500 text-black shadow-lg shadow-blue-950/20" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Meus Esquadrões
          </button>
        </div>

        {/* ABA: MENSAGENS DIRETAS */}
        <AnimatePresence mode="wait">
          {abaAtiva === "diretas" && (
            <motion.div
              key="aba-diretas"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* CARROSSEL DE QUEM EU SIGO (INICIAR CONVERSA) */}
              {!loading && seguindo.length > 0 && !busca && (
                <div className="mb-6">
                  <h2 className="text-[9px] font-black uppercase text-zinc-500 mb-3 tracking-widest ml-1 block">
                    Iniciar nova conversa
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-1">
                    {seguindo.map(u => (
                      <Link href={`/mensagens/${u.id}`} key={u.id} className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform group text-decoration-none">
                        <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-blue-500/20 to-teal-500/20 group-hover:from-blue-500/40 group-hover:to-teal-500/40 transition-all overflow-hidden flex items-center justify-center shadow-lg relative">
                          <RenderUserAvatar usuario={u} size="w-full h-full" />
                        </div>
                        <span className="text-[8.5px] font-bold text-zinc-500 truncate w-16 text-center group-hover:text-zinc-300 transition-colors">
                          @{u.username}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* LISTA DE CONVERSAS ATIVAS */}
              <div className="flex justify-between items-center mb-3.5 ml-1">
                <h2 className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                  {busca ? "Resultados da Pesquisa" : "Conversas Recentes"}
                </h2>
                {conversas.length > 0 && (
                  <span className="text-[8px] font-bold uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">
                    {conversasFiltradas.length} Ativas
                  </span>
                )}
              </div>
              
              {loading ? (
                <div className="text-center py-20 flex flex-col items-center gap-3">
                   <div className="w-5 h-5 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest">Sincronizando Transmissões...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversasFiltradas.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/15 rounded-3xl border border-dashed border-zinc-900 p-6 flex flex-col items-center justify-center gap-3">
                      <span className="text-xl">💬</span>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                        {busca ? "Nenhum combatente localizado." : "Nenhuma transmissão recente aberta."}
                      </p>
                      {!busca && (
                        <Link href="/explorar">
                          <span className="text-[8.5px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 cursor-pointer block hover:bg-blue-500/15">
                            Explorar Atletas
                          </span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    conversasFiltradas.map(chat => (
                      <Link href={`/mensagens/${chat.id}`} key={chat.id} className="block group text-decoration-none">
                        <div className="flex items-center gap-4 bg-zinc-900/20 p-4 rounded-3xl border border-zinc-900 group-hover:border-zinc-800/80 group-hover:bg-zinc-900/40 transition-all duration-300 active:scale-[0.98]">
                          <div className="relative shrink-0 w-12 h-12">
                            <RenderUserAvatar usuario={chat} size="w-full h-full" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse"></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="font-black text-xs truncate uppercase italic text-zinc-100 group-hover:text-blue-400 transition-colors">@{chat.username}</h3>
                              <span className="text-[8px] font-black text-zinc-650 uppercase">{chat.data}</span>
                            </div>
                            <p className="text-xs text-zinc-400 truncate font-medium">{chat.ultimaMsg}</p>
                          </div>
                          
                          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ABA: ESQUADRÕES */}
          {abaAtiva === "esquadroes" && (
            <motion.div
              key="aba-esquadroes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex justify-between items-center mb-3.5 ml-1">
                <h2 className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Canais Operacionais</h2>
                {squads.length > 0 && (
                  <span className="text-[8px] font-bold uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">
                    {squadsFiltrados.length} Canais
                  </span>
                )}
              </div>
              
              {loading ? (
                <div className="text-center py-20 flex flex-col items-center gap-3">
                   <div className="w-5 h-5 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest">Sincronizando Esquadrões...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {squadsFiltrados.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/15 rounded-3xl border border-dashed border-zinc-900 p-6 flex flex-col items-center justify-center gap-3">
                      <span className="text-xl">🛡️</span>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                        {busca ? "Nenhum canal localizado." : "Você não faz parte de nenhuma squad ativa."}
                      </p>
                      {!busca && (
                        <div className="flex gap-2">
                          <Link href="/social" className="text-decoration-none">
                            <span className="text-[8.5px] bg-blue-500 text-black font-black uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 cursor-pointer block">
                              Explorar Esquadrões
                            </span>
                          </Link>
                          <Link href="/social" className="text-decoration-none">
                            <span className="text-[8.5px] bg-zinc-900 border border-zinc-800 text-zinc-350 font-black uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 cursor-pointer block hover:border-zinc-700">
                              Criar Squad
                            </span>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    squadsFiltrados.map(sq => (
                      <Link href={`/mensagens/squad/${sq.id}`} key={sq.id} className="block group text-decoration-none">
                        <div className="flex items-center gap-4 bg-zinc-900/20 p-4 rounded-3xl border border-zinc-900 group-hover:border-zinc-800/80 group-hover:bg-zinc-900/40 transition-all duration-300 active:scale-[0.98]">
                          <div className="relative shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-600/30 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-md">
                            <span className="text-blue-400 text-base font-black italic uppercase">
                              {sq.name ? sq.name.substring(0, 2) : "SQ"}
                            </span>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 border-2 border-zinc-950 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)] animate-pulse"></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="font-black text-xs truncate uppercase italic text-zinc-100 group-hover:text-blue-400 transition-colors">{sq.name}</h3>
                              <span className="text-[7px] font-black bg-blue-500/10 border border-blue-500/25 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wide">
                                Membro
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 truncate font-medium">{sq.description || "Canal de comunicação do esquadrão."}</p>
                          </div>
                          
                          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-16 mb-8 text-center opacity-35">
          <p className="text-[9px] text-zinc-650 font-bold uppercase tracking-[0.2em]">
            SQUAD SYSTEM v2.0 // VEXX ATHLETICS
          </p>
        </footer>
      </div>

      <Navbar />
    </div>
  )
}