"use client"


import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import TreinoCard from "@/components/TreinoCard"
import PageHeader from "@/components/PageHeader"
import Navbar from "@/components/Navbar"
import BotaoFlutuante from "@/components/BotaoFlutuante"
import { MotivacaoDoDia } from "@/components/MotivacaoDoDia"
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
      <div className="max-w-md mx-auto p-4 pb-24 min-h-screen bg-zinc-950 font-sans text-zinc-100 relative">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

        <PageHeader icon="🏠" title="Feed" subtitle="Acompanhe os treinos da sua squad" color="green" />
        
        {/* MOTIVAÇÃO DO DIA */}
        <div className="mb-6 mt-2.5">
          <MotivacaoDoDia />
        </div>
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 mt-2.5 px-2">
          <div>
            <h1 className="text-zinc-100 text-lg font-extrabold uppercase tracking-wider">
              VEXX SQUAD
            </h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.25em] mt-0.5">SQUAD STATUS: OPERACIONAL</p>
          </div>
          <Link href="/mensagens">
            <span className="text-[9px] bg-zinc-900/60 text-zinc-300 px-3.5 py-2 rounded-xl font-bold border border-zinc-900 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 hover:border-emerald-500/20 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              CHAT
            </span>
          </Link>
        </div>

        {/* CARD DE CHECK-IN */}
        <div className={`mb-6 p-5 rounded-xl border transition-all duration-500 relative overflow-hidden ${
          checkinFeito 
            ? 'bg-zinc-900/10 border-zinc-900/60' 
            : 'bg-zinc-900/30 border-emerald-500/10 shadow-lg shadow-emerald-950/5'
        }`}>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-extrabold uppercase text-[11px] tracking-wider ${checkinFeito ? 'text-zinc-500' : 'text-emerald-400'}`}>
                  {checkinFeito ? "Treino Confirmado" : "Missão do Dia"}
                </h3>
                
                <AnimatePresence>
                  {strike > 0 && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                      <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-[10px]">🔥</motion.span>
                      <span className="text-orange-500 text-[8px] font-bold tracking-wide">{strike}D STREAK</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-zinc-300 text-[9px] font-bold uppercase tracking-widest mt-1 opacity-70">
                {checkinFeito ? "PAGAMENTO RECEBIDO" : "PAGUE O PREÇO HOJE"}
              </p>
            </div>
            
            <button 
              onClick={realizarCheckin} 
              className={`px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                checkinFeito 
                  ? "bg-zinc-900 text-zinc-500 border border-zinc-800/80 hover:bg-zinc-850" 
                  : "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-950/20 hover:bg-emerald-400"
              }`}
            >
              {loadingCheckin ? "..." : checkinFeito ? "CANCELAR" : "MARCAR CHECK-IN"}
            </button>
          </div>
          {!checkinFeito && (
            <motion.div animate={{ opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
          )}
        </div>

        {/* BUSCA */}
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Localizar operação..." 
            value={busca} 
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-zinc-900/30 border border-zinc-900 rounded-xl py-3.5 px-4 text-xs font-semibold tracking-wide text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-emerald-500/30 focus:bg-zinc-900/50 transition-all placeholder:font-medium placeholder:uppercase" 
          />
        </div>

        {/* FEED */}
        <div className="space-y-4">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Relatórios de Campo</p>
          
          {loading ? (
            <div className="text-center py-20 flex flex-col items-center gap-3">
               <div className="w-5 h-5 border border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
               <span className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest">Sincronizando Arsenal...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {treinosFiltrados.length === 0 ? (
                <p className="text-center text-xs text-zinc-600 py-10 uppercase tracking-wider font-semibold">Nenhuma operação localizada.</p>
              ) : (
                treinosFiltrados.map(t => {
                  const autor = t.usuarios;
                  const status = calcularRank(autor?.xp || 0, listaDeRanks);

                  return (
                    <div key={t.id} className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 hover:border-zinc-800/80 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3.5">
                        <Link href={`/perfil?id=${autor?.id}`} className="relative active:scale-95 transition-transform flex-shrink-0">
                          <img 
                            src={autor?.foto || "/avatar-padrao.png"} 
                            className="w-10 h-10 rounded-full object-cover border"
                            style={{ borderColor: status.cor_border || status.cor_texto }}
                          />
                          <div style={{ backgroundColor: status.cor_bg || status.cor_texto }} className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-zinc-950 text-[7px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                            LV {autor?.nivel || 1}
                          </div>
                        </Link>

                        <div className="flex flex-col">
                          <Link href={`/perfil?id=${autor?.id}`} className="text-xs font-bold text-zinc-200 uppercase leading-none hover:text-emerald-400 transition-colors">
                            @{autor?.username || "Guerreiro"}
                          </Link>
                          <span style={{ color: status.cor_texto }} className="text-[9px] font-bold uppercase mt-1 tracking-wide">
                            {status.nome}
                          </span>
                          <span className="text-[8px] text-zinc-600 uppercase font-semibold mt-0.5">
                            {t.grupo} • {new Date(t.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <TreinoCard treino={t} hideHeader={true} /> 
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        <footer className="mt-20 mb-8 text-center opacity-30">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">SQUAD SYSTEM v2.0 // VEXX ATHLETICS</p>
        </footer>
      </div>
      <BotaoFlutuante />
      <Navbar />
    </>
  )
}