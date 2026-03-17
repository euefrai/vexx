"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import TreinoCard from "@/components/TreinoCard"
import Navbar from "@/components/Navbar"
import BotaoFlutuante from "@/components/BotaoFlutuante"
import Link from "next/link" // Adicionado para navegação

export default function Feed() {
  const [treinos, setTreinos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from("treinos")
        .select(`
          *,
          usuarios (username, foto)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTreinos(data || []) 
      
    } catch (error) {
      console.error("Erro detalhado ao carregar treinos:", error.message || error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 min-h-screen bg-black">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-green-500 text-2xl font-black italic uppercase tracking-tighter">
            Elite Squad
          </h1>
          
          {/* LINK PARA MENSAGENS */}
          <Link href="/mensagens">
            <span className="text-[10px] bg-zinc-900 text-zinc-500 px-3 py-1 rounded-full font-bold border border-zinc-800 active:scale-95 transition-all hover:text-green-500 hover:border-green-500/50 cursor-pointer flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              COMUNIDADE
            </span>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div>
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest animate-pulse">
              Sincronizando...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {treinos.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/30 rounded-[2rem] border border-dashed border-zinc-800 text-zinc-600 font-bold uppercase text-xs">
                Nenhum treino postado ainda.
              </div>
            ) : (
              treinos.map(t => <TreinoCard key={t.id} treino={t}/>)
            )}
          </div>
        )}
      </div>
      <BotaoFlutuante />
      <Navbar />
    </>
  )
}