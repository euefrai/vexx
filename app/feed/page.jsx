"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import TreinoCard from "@/components/TreinoCard"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"
import BotaoFlutuante from "@/components/BotaoFlutuante"
import Link from "next/link"
import { useGamificacao } from "@/hooks/useGamificacao"
import { useRanks } from "@/hooks/useRanks" 
import { motion, AnimatePresence } from "framer-motion"

export default function Feed() {
  const [treinos, setTreinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [listaDeRanks, setListaDeRanks] = useState([])
  const [checkinFeito, setCheckinFeito] = useState(false)
  const [loadingCheckin, setLoadingCheckin] = useState(false)
  const [strike, setStrike] = useState(0)
  const [busca, setBusca] = useState("")
  
  const { adicionarXP } = useGamificacao()
  const { getRanks, calcularRank } = useRanks()

  // 1. INICIALIZAÇÃO UNIFICADA
  useEffect(() => {
    async function inicializarSistema() {
      try {
        setLoading(true)
        
        // Busca ranks dinâmicos do banco primeiro
        const ranksBuscados = await getRanks()
        setListaDeRanks(ranksBuscados)
        
        // Carrega treinos e status de checkin em paralelo
        await Promise.all([
          carregarTreinos(),
          verificarCheckinEStrike()
        ])
      } catch (error) {
        console.error("Erro na inicialização:", error)
      } finally {
        setLoading(false)
      }
    }
    inicializarSistema()
  }, [])

  // 2. LÓGICA DE DADOS
  async function carregarTreinos() {
    const { data, error } = await supabase
      .from("treinos")
      .select(`*, usuarios (*)`)
      .order("created_at", { ascending: false })
    
    if (!error) setTreinos(data || [])
  }

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
        let d = new Date()
        d.setHours(0, 0, 0, 0)

        if (!datasSet.has(d.toISOString().split('T')[0])) {
          d.setDate(d.getDate() - 1)
        }

        while (datasSet.has(d.toISOString().split('T')[0])) {
          contador++
          d.setDate(d.getDate() - 1)
        }
        setStrike(contador)
      }
    } catch (e) { console.error(e) }
  }

  async function realizarCheckin() {
    if (loadingCheckin) return
    setLoadingCheckin(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (checkinFeito) {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
        await supabase.from("registros_treino").delete().eq("usuario_id", user.id).gte("created_at", hoje.toISOString())
        setCheckinFeito(false)
      } else {
        await supabase.from("registros_treino").insert([{ usuario_id: user.id }])
        setCheckinFeito(true)
        if (adicionarXP) await adicionarXP(user.id, 50)
      }
      verificarCheckinEStrike()
    } catch (e) { alert(e.message) } finally { setLoadingCheckin(false) }
  }

  const treinosFiltrados = treinos.filter(t => 
    t.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    t.grupo?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-24 min-h-screen bg-black font-sans text-white">
        <PageHeader icon="🏠" title="Feed" subtitle="Acompanhe os treinos da sua squad" color="green" />
        
        {/* HEADER */}
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

        {/* CARD DE CHECK-IN */}
        <div className={`mb-8 p-6 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden ${
          checkinFeito ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-900 border-green-500/30 shadow-[0_10px_40px_rgba(34,197,94,0.05)]'
        }`}>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-black uppercase italic text-sm tracking-tighter ${checkinFeito ? 'text-zinc-500' : 'text-green-500'}`}>
                  {checkinFeito ? "Treino Confirmado" : "Missão do Dia"}
                </h3>
                
                <AnimatePresence>
                  {strike > 0 && (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                      <motion.span animate={{ scale: [1, 1.2, 1], filter: ["drop-shadow(0 0 2px #f97316)", "drop-shadow(0 0 8px #f97316)", "drop-shadow(0 0 2px #f97316)"] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-[12px]">🔥</motion.span>
                      <span className="text-orange-500 text-[9px] font-black italic">{strike}D STREAK</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-white text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">
                {checkinFeito ? "PAGAMENTO RECEBIDO" : "PAGUE O PREÇO HOJE"}
              </p>
            </div>
            
            <button onClick={realizarCheckin} className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase italic transition-all active:scale-95 ${checkinFeito ? "bg-zinc-800 text-zinc-500 border border-zinc-700" : "bg-green-500 text-black shadow-lg"}`}>
              {loadingCheckin ? "..." : checkinFeito ? "CANCELAR" : "MARCAR CHECK-IN"}
            </button>
          </div>
          {!checkinFeito && (
            <motion.div animate={{ opacity: [0.05, 0.15, 0.05] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent pointer-events-none" />
          )}
        </div>

        {/* BUSCA */}
        <div className="relative mb-8">
          <input type="text" placeholder="LOCALIZAR OPERAÇÃO..." value={busca} onChange={(e) => setBusca(e.target.value)}
                 className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest text-white placeholder:text-zinc-700 outline-none focus:border-green-500/50 transition-all uppercase" />
        </div>

        {/* FEED */}
        <div className="space-y-6">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Relatórios de Campo</p>
          
          {loading ? (
            <div className="text-center py-20 flex flex-col items-center gap-3">
               <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
               <span className="text-zinc-600 font-black text-[9px] uppercase tracking-[0.2em]">Sincronizando Arsenal...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {treinosFiltrados.map(t => {
                const autor = t.usuarios;
                const status = calcularRank(autor?.xp || 0, listaDeRanks);

                return (
                  <div key={t.id} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-[2rem] hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <Link href={`/perfil?id=${autor?.id}`} className="relative active:scale-90 transition-transform">
                        <img 
                          src={autor?.foto || "https://via.placeholder.com/150"} 
                          className="w-11 h-11 rounded-full object-cover border-2 shadow-lg"
                          style={{ borderColor: status.cor_border || status.cor_texto }}
                        />
                        <div style={{ backgroundColor: status.cor_bg || status.cor_texto }} className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-black text-[7px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                          LVL {autor?.nivel || 1}
                        </div>
                      </Link>

                      <div className="flex flex-col">
                        <Link href={`/perfil?id=${autor?.id}`} className="text-[11px] font-black text-white uppercase italic leading-none hover:text-green-500 transition-colors">
                          @{autor?.username || "Guerreiro"}
                        </Link>
                        <span style={{ color: status.cor_texto }} className="text-[9px] font-black uppercase mt-0.5 tracking-tight">
                          {status.nome}
                        </span>
                        <span className="text-[8px] text-zinc-600 uppercase font-bold mt-1">
                          {t.grupo} • {new Date(t.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <TreinoCard treino={t} hideHeader={true} /> 
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <footer className="mt-20 mb-8 text-center opacity-30">
          <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.2em]">SQUAD SYSTEM v2.0 // @eu.efrai</p>
        </footer>
      </div>
      <BotaoFlutuante />
      <Navbar />
    </>
  )
}