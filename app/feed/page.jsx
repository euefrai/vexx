"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import TreinoCard from "@/components/TreinoCard"
import Navbar from "@/components/Navbar"
import BotaoFlutuante from "@/components/BotaoFlutuante"
import Link from "next/link"
import { useGamificacao } from "@/hooks/useGamificacao"

export default function Feed() {
  const [treinos, setTreinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkinFeito, setCheckinFeito] = useState(false)
  const [loadingCheckin, setLoadingCheckin] = useState(false)
  const [strike, setStrike] = useState(0) 
  const [busca, setBusca] = useState("")
  const { adicionarXP } = useGamificacao()

  useEffect(() => {
    carregar()
    verificarCheckinEStrike()
  }, [])

  const treinosFiltrados = treinos.filter(treino => 
    treino.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    treino.grupo?.toLowerCase().includes(busca.toLowerCase())
  )

  async function verificarCheckinEStrike() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
        const datasUnicas = Array.from(datasSet)
        
        let contador = 0
        let dataVerificar = new Date()
        dataVerificar.setHours(0, 0, 0, 0)

        if (!datasSet.has(dataVerificar.toISOString().split('T')[0])) {
           dataVerificar.setDate(dataVerificar.getDate() - 1)
        }

        while (datasSet.has(dataVerificar.toISOString().split('T')[0])) {
          contador++
          dataVerificar.setDate(dataVerificar.getDate() - 1)
        }
        setStrike(contador)
      }
    } catch (error) {
      console.error("Erro ao verificar progresso:", error)
    }
  }

  async function realizarCheckin() {
    if (loadingCheckin) return
    setLoadingCheckin(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      if (checkinFeito) {
        await supabase
          .from("registros_treino")
          .delete()
          .eq("usuario_id", user.id)
          .gte("created_at", hoje.toISOString())
        
        setCheckinFeito(false)
        alert("Check-in removido!")
      } else {
        const { error } = await supabase
          .from("registros_treino")
          .insert([{ usuario_id: user.id }])

        if (error) throw error

        setCheckinFeito(true)
        if (adicionarXP) await adicionarXP(user.id, 50)
        alert("MISSÃO CUMPRIDA! 🔥")
      }
      verificarCheckinEStrike()
    } catch (error) {
      alert(`Erro: ${error.message}`)
    } finally {
      setLoadingCheckin(false)
    }
  }

  async function carregar() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("treinos")
        .select(`*, usuarios (username, foto)`)
        .order("created_at", { ascending: false })
      if (!error) setTreinos(data || []) 
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 min-h-screen bg-black font-sans text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-green-500 text-2xl font-black italic uppercase tracking-tighter">Elite Squad</h1>
          <Link href="/mensagens">
            <span className="text-[10px] bg-zinc-900 text-zinc-500 px-3 py-1 rounded-full font-bold border border-zinc-800 flex items-center gap-2 cursor-pointer transition-all active:scale-95">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              COMUNIDADE
            </span>
          </Link>
        </div>

        {/* CARD DE CHECK-IN COM STRIKE */}
        <div className={`mb-8 p-6 rounded-[2.5rem] border transition-all duration-500 ${
          checkinFeito 
          ? 'bg-zinc-900/40 border-zinc-800' 
          : 'bg-gradient-to-br from-green-500/20 to-black border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-black uppercase italic text-sm ${checkinFeito ? 'text-zinc-500' : 'text-green-500'}`}>
                  {checkinFeito ? "Treino Confirmado" : "Missão do Dia"}
                </h3>
                {strike > 0 && (
                  <span className="bg-orange-500/20 text-orange-500 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-500/30">
                    🔥 {strike} {strike === 1 ? 'DIA' : 'DIAS'}
                  </span>
                )}
              </div>
              <p className="text-white text-[10px] font-bold uppercase tracking-widest mt-1">
                {checkinFeito ? "DESEJA CANCELAR?" : "MANTER A OFENSIVA"}
              </p>
            </div>
            
            <button
              onClick={realizarCheckin}
              className={`px-8 py-3 rounded-2xl font-black text-xs uppercase italic transition-all active:scale-95 ${
                checkinFeito 
                ? "bg-zinc-800 text-zinc-400 border border-zinc-700" 
                : "bg-green-500 text-black shadow-[0_5px_15px_rgba(34,197,94,0.4)]"
              }`}
            >
              {loadingCheckin ? "..." : checkinFeito ? "CONCLUÍDO" : "PAGAR TREINO"}
            </button>
          </div>
        </div>

        {/* BUSCA */}
        <div className="relative mb-6">
          <input 
            type="text"
            placeholder="Buscar treino..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-11 text-xs text-white placeholder:text-zinc-600 outline-none"
          />
        </div>

        {/* LISTA DE TREINOS */}
        {loading ? (
          <div className="text-center py-20 animate-pulse text-zinc-600 font-black text-[10px] uppercase">Carregando Arsenal...</div>
        ) : (
          <div className="space-y-4">
            {treinosFiltrados.map(t => <TreinoCard key={t.id} treino={t}/>)}
          </div>
        )}

        {/* RODAPÉ DE COPYRIGHT */}
        <footer className="mt-16 mb-8 text-center">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] opacity-50">
            © 2026 @eu.efrai - Todos os direitos reservados.
          </p>
        </footer>
      </div>
      <BotaoFlutuante />
      <Navbar />
    </>
  )
}