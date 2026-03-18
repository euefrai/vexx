"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Navbar from "@/components/Navbar"

export default function ListaMensagens() {
  const [conversas, setConversas] = useState([])
  const [seguindo, setSeguindo] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Carregar quem o usuário segue
      const { data: seguindoData } = await supabase
        .from("seguidores")
        .select("usuarios!seguidores_seguido_id_fkey(id, username, foto)")
        .eq("seguidor_id", user.id)
      
      setSeguindo(seguindoData?.map(s => s.usuarios) || [])

      // Carregar histórico de mensagens
      const { data: mensagensData, error } = await supabase
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

      if (error) throw error

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
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-md mx-auto p-4 pb-24">
        
        <div className="flex flex-col mb-6">
          <h1 className="text-2xl font-black italic uppercase text-green-500 tracking-tighter">Mensagens</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Quartel General • Comunicações</p>
        </div>

        {/* CARROSSEL DE QUEM EU SIGO */}
        {!loading && seguindo.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[10px] font-black uppercase text-zinc-600 mb-3 tracking-widest ml-1">
              Iniciar nova conversa
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {seguindo.map(u => (
                // AJUSTADO: Rota para /mensagens/[id]
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
                // AJUSTADO: Rota para /mensagens/[id]
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