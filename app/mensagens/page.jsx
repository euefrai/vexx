"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import PageHeader from "@/components/PageHeader"

export default function ListaMensagens() {
  const [abaAtiva, setAbaAtiva] = useState("diretas")
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

      // 3. Carregar Esquadrões (Squads) do Usuário com Fallback robusto
      await carregarEsquadroes(user)

    } catch (error) {
      console.error("Erro ao carregar dados de mensagens:", error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarEsquadroes(user) {
    try {
      // Tenta carregar do Supabase
      const { data, error } = await supabase
        .from("squad_members")
        .select(`
          squad_id,
          squads (
            id,
            name,
            description,
            capacity,
            owner_id
          )
        `)
        .eq("usuario_id", user.id)
      
      if (error) throw error

      if (data && data.length > 0) {
        setSquads(data.map(m => m.squads).filter(Boolean))
      } else {
        setSquads([])
      }
    } catch (err) {
      console.log("Banco Supabase offline ou sem tabelas de squads, carregando fallback local...", err.message)
      
      // Fallback LocalStorage
      const localSquads = JSON.parse(localStorage.getItem("vexx_squads") || "[]")
      const localMemberships = JSON.parse(localStorage.getItem(`vexx_squad_members_${user.id}`) || "[]")
      
      const minhasSquads = localSquads.filter(s => s.owner_id === user.id || localMemberships.includes(s.id))
      
      // Se não tiver nenhuma cadastrada localmente, populamos duas squads fictícias premium padrão
      if (minhasSquads.length === 0) {
        const mockSquads = [
          { id: "squad-alpha-tactical", name: "Alpha Tactical", description: "Esquadrão focado em treinos de corrida de alta intensidade e maratonas de rua.", capacity: 12, owner_id: user.id },
          { id: "squad-iron-body", name: "Iron Body Builders", description: "Operações táticas de calistenia pesada, musculação e ganho de força bruta.", capacity: 15, owner_id: "outro" }
        ]
        localStorage.setItem("vexx_squads", JSON.stringify(mockSquads))
        localStorage.setItem(`vexx_squad_members_${user.id}`, JSON.stringify(["squad-alpha-tactical", "squad-iron-body"]))
        setSquads(mockSquads)
      } else {
        setSquads(minhasSquads)
      }
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-md mx-auto p-4 pb-24">
        <PageHeader icon="💌" title="Mensagens" subtitle="Comunique-se direto com sua squad" color="blue" />

        {/* SELETOR DE ABAS TÁTICO */}
        <div className="flex bg-zinc-900/40 p-1 rounded-2xl border border-zinc-800/80 mb-6 backdrop-blur-md">
          <button 
            onClick={() => setAbaAtiva("diretas")} 
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${abaAtiva === "diretas" ? "bg-blue-500 text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Mensagens Diretas
          </button>
          <button 
            onClick={() => setAbaAtiva("esquadroes")} 
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${abaAtiva === "esquadroes" ? "bg-blue-500 text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Meus Esquadrões
          </button>
        </div>

        {/* ABA: MENSAGENS DIRETAS */}
        {abaAtiva === "diretas" && (
          <div>
            {/* CARROSSEL DE QUEM EU SIGO */}
            {!loading && seguindo.length > 0 && (
              <div className="mb-8">
                <h2 className="text-[10px] font-black uppercase text-zinc-600 mb-3 tracking-widest ml-1">
                  Iniciar nova conversa
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {seguindo.map(u => (
                    <Link href={`/mensagens/${u.id}`} key={u.id} className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-16 h-16 rounded-full p-0.5 border-2 border-green-500/30 overflow-hidden bg-zinc-900 shrink-0">
                        <img 
                          src={u.foto || "https://via.placeholder.com/150"} 
                          className="w-full h-full rounded-full object-cover"
                          alt={u.username}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-500 truncate w-16 text-center">
                        @{u.username}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* LISTA DE CONVERSAS ATIVAS */}
            <h2 className="text-[10px] font-black uppercase text-zinc-600 mb-3 tracking-widest ml-1">Conversas Recentes</h2>
            
            {loading ? (
              <div className="flex justify-center py-20 animate-pulse text-zinc-500 font-bold uppercase text-[10px]">
                Sincronizando...
              </div>
            ) : (
              <div className="space-y-3">
                {conversas.length === 0 ? (
                  <div className="text-center py-10 bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-800">
                    <p className="text-zinc-600 text-xs font-bold uppercase">Sem histórico recente.</p>
                  </div>
                ) : (
                  conversas.map(chat => (
                    <Link href={`/mensagens/${chat.id}`} key={chat.id} className="block group">
                      <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-[1.5rem] border border-zinc-800/50 group-hover:bg-zinc-900 transition-all active:scale-[0.98]">
                        <div className="relative shrink-0 w-14 h-14">
                          <img 
                            src={chat.foto || "https://via.placeholder.com/150"} 
                            className="w-full h-full rounded-full object-cover border border-zinc-700" 
                            alt={chat.username}
                          />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-lg"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-black text-sm truncate uppercase italic text-white">{chat.username}</h3>
                            <span className="text-[9px] font-bold text-zinc-600">{chat.data}</span>
                          </div>
                          <p className="text-xs text-zinc-400 truncate font-medium">{chat.ultimaMsg}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ABA: ESQUADRÕES */}
        {abaAtiva === "esquadroes" && (
          <div>
            <h2 className="text-[10px] font-black uppercase text-zinc-600 mb-3 tracking-widest ml-1">Canais Operacionais</h2>
            
            {loading ? (
              <div className="flex justify-center py-20 animate-pulse text-zinc-500 font-bold uppercase text-[10px]">
                Sincronizando Esquadrões...
              </div>
            ) : (
              <div className="space-y-3">
                {squads.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-zinc-800 p-6">
                    <p className="text-zinc-600 text-xs font-bold uppercase mb-2">Você não faz parte de nenhuma squad.</p>
                    <Link href="/social">
                      <span className="inline-block text-[9px] bg-blue-500 text-black font-black uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 cursor-pointer">
                        Explorar Esquadrões
                      </span>
                    </Link>
                  </div>
                ) : (
                  squads.map(sq => (
                    <Link href={`/mensagens/squad/${sq.id}`} key={sq.id} className="block group">
                      <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-[1.5rem] border border-zinc-800/50 group-hover:bg-zinc-900 transition-all active:scale-[0.98]">
                        <div className="relative shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-600/30 rounded-full flex items-center justify-center border border-blue-500/30 shadow-md">
                          <span className="text-blue-400 text-base font-black italic uppercase">
                            {sq.name ? sq.name.substring(0, 2) : "SQ"}
                          </span>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-black rounded-full shadow-lg animate-pulse"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-black text-sm truncate uppercase italic text-white">{sq.name}</h3>
                            <span className="text-[8px] font-black bg-blue-500/10 border border-blue-500/25 text-blue-400 px-2 py-0.5 rounded uppercase">
                              Membro
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 truncate font-medium">{sq.description || "Canal de comunicação do esquadrão."}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <footer className="mt-16 mb-8 text-center">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] opacity-50">
            © 2026 @eu.efrai - Todos os direitos reservados.
          </p>
        </footer>
      </div>

      <Navbar />
    </div>
  )
}