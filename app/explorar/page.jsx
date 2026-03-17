"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Navbar from "@/components/Navbar"

export default function Explorar() {
  const [busca, setBusca] = useState("")
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Chamamos a busca sempre que o termo mudar
    const timer = setTimeout(carregarUsuarios, 400)
    return () => clearTimeout(timer)
  }, [busca])

  async function carregarUsuarios() {
    setLoading(true)
    try {
      let query = supabase
        .from("usuarios")
        .select("id, username, foto, bio")

      // Se houver busca, filtra. Se não, traz todos (limitado a 20 por performance)
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
      
      {/* BARRA DE BUSCA */}
      <div className="sticky top-0 bg-black py-2 z-10">
        <input 
          placeholder="Buscar @username..."
          className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-[1.5rem] outline-none focus:border-green-500 transition-colors shadow-2xl"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* LISTA DE USUÁRIOS */}
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
                <Link href={`/perfil/${u.id}`} key={u.id} className="block">
                  <div className="flex items-center justify-between bg-zinc-900/40 p-4 rounded-[1.2rem] border border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700 active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-4">
                      {/* Foto do Usuário */}
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-800">
                        <img 
                          src={u.foto || "https://via.placeholder.com/150"} 
                          className="w-full h-full object-cover" 
                          alt={u.username}
                        />
                      </div>
                      {/* Nome e Bio */}
                      <div className="flex flex-col">
                        <p className="font-black text-white text-sm">@{u.username}</p>
                        <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                          {u.bio || "Membro da Elite Squad"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Botão de Ver Perfil Visual */}
                    <div className="bg-green-500/10 text-green-500 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </>
        )}
      </div>

      <Navbar />
    </div>
  )
}