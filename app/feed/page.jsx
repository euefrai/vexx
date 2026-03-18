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
        
        {/* HEADER REFINADO */}
        <div className="flex justify-between items-center mb-8 mt-4">
          <div>
            <h1 className="text-green-500 text-3xl font-black italic uppercase tracking-tighter leading-none">
              ELITE SQUAD
            </h1>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-1">Status: Operacional</p>
          </div>
          <Link href="/mensagens">
            <span className="text-[10px] bg-zinc-900 text-zinc-300 px-4 py-2 rounded-full font-black border border-zinc-800 flex items-center gap-2 cursor-pointer transition-all active:scale-95 hover:border-green-500/50">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              CHAT
            </span>
          </Link>
        </div>

        {/* CARD DE CHECK-IN ESTILO "ORDEM DE MISSÃO" */}
        <div className={`mb-8 p-6 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden ${
          checkinFeito 
          ? 'bg-zinc-900/40 border-zinc-800' 
          : 'bg-zinc-900 border-green-500/30 shadow-[0_10px_40px_rgba(34,197,94,0.05)]'
        }`}>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-black uppercase italic text-sm tracking-tighter ${checkinFeito ? 'text-zinc-500' : 'text-green-500'}`}>
                  {checkinFeito ? "Treino Confirmado" : "Missão do Dia"}
                </h3>
                {strike > 0 && (
                  <span className="bg-orange-500 text-black text-[9px] font-black px-2 py-0.5 rounded italic">
                    {strike}D STREAK
                  </span>
                )}
              </div>
              <p className="text-white text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">
                {checkinFeito ? "PAGAMENTO RECEBIDO" : "PAGUE O PREÇO HOJE"}
              </p>
            </div>
            
            <button
              onClick={realizarCheckin}
              className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase italic transition-all active:scale-95 ${
                checkinFeito 
                ? "bg-zinc-800 text-zinc-500 border border-zinc-700" 
                : "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              }`}
            >
              {loadingCheckin ? "..." : checkinFeito ? "CANCELAR" : "MARCAR CHECK-IN"}
            </button>
          </div>
        </div>

        {/* BUSCA TÁTICA */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="text-zinc-600 text-xs">⚡</span>
          </div>
          <input 
            type="text"
            placeholder="LOCALIZAR OPERAÇÃO..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-11 text-[10px] font-black tracking-widest text-white placeholder:text-zinc-700 outline-none focus:border-green-500/50 transition-all uppercase"
          />
        </div>

        {/* LISTA DE TREINOS */}
        <div className="space-y-6">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Relatórios de Campo</p>
          {loading ? (
            <div className="text-center py-20 flex flex-col items-center gap-3">
               <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
               <span className="text-zinc-600 font-black text-[9px] uppercase tracking-[0.2em]">Sincronizando Arsenal...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {treinosFiltrados.length > 0 ? (
                treinosFiltrados.map(t => <TreinoCard key={t.id} treino={t}/>)
              ) : (
                <div className="text-center py-10 border border-dashed border-zinc-900 rounded-[2rem]">
                  <p className="text-zinc-700 font-bold text-xs uppercase">Nenhuma operação encontrada</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <footer className="mt-20 mb-8 text-center">
          <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.2em]">
            SQUAD SYSTEM v2.0 // @eu.efrai
          </p>
        </footer>
      </div>
      <BotaoFlutuante />
      <Navbar />
    </>
  )
}