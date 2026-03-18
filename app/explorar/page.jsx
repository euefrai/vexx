"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function Explorar() {
  const [busca, setBusca] = useState("")
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLogado, setUserLogado] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const carregarUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserLogado(user)
    }
    carregarUser()
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
        .select("id, username, foto, bio")

      if (busca.length >= 1) {
        query = query.ilike("username", `%${busca}%`)
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

  // Função para navegar para o chat sem disparar o clique do Link do perfil
  const irParaChat = (e, destinatarioId) => {
    e.preventDefault() // Evita que abra o perfil
    router.push(`/chat/${destinatarioId}`)
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-black italic uppercase text-green-500">
          🔍 Explorar
        </h1>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
          Encontre novos parceiros de treino
        </p>
      </div>

      <Link href="/ranking">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="mb-6 p-4 rounded-[2rem] bg-gradient-to-br from-zinc-900 to-black border border-green-500/30 flex items-center justify-between overflow-hidden relative group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[40px] rounded-full group-hover:bg-green-500/20 transition-all" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              🏆
            </div>
            <div>
              <p className="text-sm font-black uppercase italic tracking-tighter text-white">Ranking Global</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Veja quem são os generais da squad</p>
            </div>
          </div>
          
          <div className="relative z-10 bg-zinc-800/50 p-2 rounded-full border border-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-green-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </motion.div>
      </Link>
      
      <div className="sticky top-0 bg-black/80 backdrop-blur-md py-2 z-10">
        <input 
          placeholder="Buscar @username..."
          className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-[1.5rem] outline-none focus:border-green-500 transition-colors shadow-2xl text-sm"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {usuarios.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 font-bold uppercase text-xs">
                Nenhum guerreiro encontrado.
              </div>
            ) : (
              usuarios.map(u => (
                <Link href={`/perfil?id=${u.id}`} key={u.id} className="block">
                  <div className="flex items-center justify-between bg-zinc-900/40 p-4 rounded-[1.2rem] border border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700 active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-800">
                        <img 
                          src={u.foto || "https://via.placeholder.com/150"} 
                          className="w-full h-full object-cover" 
                          alt={u.username}
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="font-black text-white text-sm">@{u.username}</p>
                        <p className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                          {u.bio || "Membro da Elite Squad"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* BOTÃO DE MENSAGEM */}
                      {userLogado?.id !== u.id && (
                        <button 
                          onClick={(e) => irParaChat(e, u.id)}
                          className="p-2.5 bg-zinc-800 hover:bg-green-500 hover:text-black rounded-xl border border-zinc-700 transition-all text-zinc-400"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.14 6.337.408 1.15.15 1.986 1.144 1.986 2.31v5.737c0 1.166-.836 2.16-1.986 2.31-2.075.27-4.19.408-6.337.408-2.147 0-4.262-.14-6.337-.408-1.15-.15-1.986-1.144-1.986-2.31V4.968c0-1.166.836-2.16 1.986-2.31ZM2.25 12.75a.75.75 0 0 1 .75.75v3a2.25 2.25 0 0 0 2.25 2.25h1.5a.75.75 0 0 1 0 1.5h-1.5A3.75 3.75 0 0 1 1.5 16.5v-3a.75.75 0 0 1 .75-.75Zm19.5 0a.75.75 0 0 1 .75.75v3a3.75 3.75 0 0 1-3.75 3.75h-1.5a.75.75 0 0 1 0-1.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-3a.75.75 0 0 1 .75-.75Z" />
                            <path d="M15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                          </svg>
                        </button>
                      )}

                      <div className="bg-green-500/10 text-green-500 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </>
        )}
      </div>

      <footer className="mt-12 mb-6 text-center">
        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] opacity-50">
          © 2026 @eu.efrai - Todos os direitos reservados.
        </p>
      </footer>

      <Navbar />
    </div>
  )
}