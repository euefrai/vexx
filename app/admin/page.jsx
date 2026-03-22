"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/Navbar"
import AdminGuard from "@/components/AdminGuard"

export default function AdminMaster() {
  const [abaAtiva, setAbaAtiva] = useState("arsenal") 

  // --- ESTADOS GESTÃO (ARSENAL) ---
  const [ranks, setRanks] = useState([])
  const [loadingRanks, setLoadingRanks] = useState(true)
  const [novoRank, setNovoRank] = useState({ 
    nome: "", icone: "⭐", xp_minimo: 0, trofeus_min: 0, trofeus_max: 9999,
    cor_texto: "#ffffff", cor_bg: "#27272a", cor_border: "#3f3f46" 
  })
  const [buscaUser, setBuscaUser] = useState("")
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // --- ESTADOS LOGS (VIGILÂNCIA) ---
  const [logs, setLogs] = useState([])
  const [buscaLog, setBuscaLog] = useState("")
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    carregarDadosArsenal()
    carregarLogs()
  }, [])

  // --- FUNÇÕES ARSENAL ---
  async function carregarDadosArsenal() {
    try {
      setLoadingRanks(true)
      const { data } = await supabase.from("ranks_custom").select("*").order("xp_minimo", { ascending: true })
      setRanks(data || [])
    } finally { setLoadingRanks(false) }
  }

  async function salvarRank() {
    if (!novoRank.nome) return alert("Dê um nome ao título!")
    const { error } = await supabase.from("ranks_custom").insert([novoRank])
    if (!error) {
      alert("Novo título forjado! 🔥")
      setNovoRank({ nome: "", icone: "⭐", xp_minimo: 0, trofeus_min: 0, trofeus_max: 9999, cor_texto: "#ffffff", cor_bg: "#27272a", cor_border: "#3f3f46" })
      carregarDadosArsenal()
    }
  }

  async function deletarRank(id) {
    if(!confirm("Destruir este título permanentemente?")) return
    await supabase.from("ranks_custom").delete().eq("id", id)
    carregarDadosArsenal()
  }

  async function buscarUsuarios() {
    if (!buscaUser) return
    setLoadingUsers(true)
    const { data } = await supabase.from("usuarios").select("id, username, xp, status, titulo_manual").ilike("username", `%${buscaUser}%`).limit(5)
    setUsuarios(data || [])
    setLoadingUsers(false)
  }

  // --- FUNÇÕES VIGILÂNCIA & PUNIÇÃO ---
  async function carregarLogs() {
    setLoadingLogs(true)
    const { data } = await supabase.from("logs_atividades").select(`*, usuarios (id, username, status, xp)`).order("created_at", { ascending: false })
    setLogs(data || [])
    setLoadingLogs(false)
  }

  async function alterarStatus(uid, novoStatus) {
    const { error } = await supabase.from("usuarios").update({ status: novoStatus }).eq("id", uid)
    if (!error) {
      alert(`Status de @operador alterado: ${novoStatus.toUpperCase()}`)
      carregarLogs()
      if(usuarios.length > 0) buscarUsuarios()
    }
  }

  async function modularXP(uid, xpAtual, qtd) {
    const novoXP = Math.max(0, (xpAtual || 0) + qtd)
    const { error } = await supabase.from("usuarios").update({ xp: novoXP }).eq("id", uid)
    if (!error) {
      carregarLogs()
      if(usuarios.length > 0) buscarUsuarios()
    }
  }

  async function deletarTreino(treinoId, logId) {
    if(!confirm("Remover protocolo permanentemente?")) return
    await supabase.from("treinos").delete().eq("id", treinoId)
    await supabase.from("logs_atividades").delete().eq("id", logId)
    setLogs(logs.filter(l => l.id !== logId))
  }

  const logsFiltrados = logs
    .filter(l => l.usuarios?.username?.toLowerCase().includes(buscaLog.toLowerCase()))
    .sort((a, b) => (a.usuarios?.username || "").localeCompare(b.usuarios?.username || ""))

  return (
    <AdminGuard>
      <div className="min-h-screen bg-black text-white pb-32 font-sans">
        
        {/* HEADER UNIFICADO */}
        <div className="max-w-5xl mx-auto p-6 text-center">
          <h1 className="text-green-500 text-5xl font-black italic uppercase tracking-tighter leading-none mb-2 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            CENTRAL DE COMANDO
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-6">Controle de Arsenal e Vigilância de Rede</p>
          
          <div className="flex justify-center gap-4 border-b border-zinc-800 pb-4">
            <button 
              onClick={() => setAbaAtiva('arsenal')}
              className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-t-xl transition-all ${abaAtiva === 'arsenal' ? 'bg-zinc-800 text-green-500 border-b-2 border-green-500' : 'text-zinc-500 hover:text-white'}`}
            >
              [ 01. Gestão de Arsenal ]
            </button>
            <button 
              onClick={() => setAbaAtiva('vigilancia')}
              className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-t-xl transition-all ${abaAtiva === 'vigilancia' ? 'bg-zinc-800 text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-white'}`}
            >
              [ 02. Vigilância & Logs ]
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6">
          <AnimatePresence mode="wait">
            {abaAtiva === 'arsenal' ? (
              <motion.div key="arsenal" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                
                {/* GRID DE DUAS COLUNAS PARA O ARSENAL */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* COLUNA ESQUERDA: FORJA E USUÁRIOS */}
                  <div className="space-y-8">
                    {/* BUSCA DE USUÁRIOS */}
                    <section className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 backdrop-blur-sm">
                      <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></span> Promoção Manual
                      </h2>
                      <div className="flex gap-2 mb-4">
                        <input 
                          placeholder="BUSCAR @OPERADOR..." 
                          className="flex-1 bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500/50"
                          value={buscaUser} onChange={e => setBuscaUser(e.target.value)}
                        />
                        <button onClick={buscarUsuarios} className="bg-blue-600 text-white px-6 rounded-xl font-black text-[10px] uppercase italic hover:bg-blue-500 transition">
                          {loadingUsers ? "..." : "Localizar"}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {usuarios.map(u => (
                          <div key={u.id} className="p-4 bg-black/60 border border-zinc-800 rounded-2xl flex justify-between items-center group">
                            <div>
                              <p className="font-black text-zinc-100 italic group-hover:text-blue-400 transition">@{u.username}</p>
                              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">XP: {u.xp} | STATUS: {u.status}</p>
                            </div>
                            <select 
                              className="bg-zinc-800 text-[9px] font-black p-2 rounded-lg outline-none border border-zinc-700 focus:border-blue-500"
                              onChange={async (e) => {
                                const { error } = await supabase.from("usuarios").update({ titulo_manual: e.target.value }).eq("id", u.id)
                                if(!error) alert("Patente Alterada!")
                              }}
                              value={u.titulo_manual || ""}
                            >
                              <option value="">RANK AUTOMÁTICO</option>
                              {ranks.map(r => <option key={r.id} value={r.nome}>{r.nome}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* FORJAR TÍTULOS */}
                    <section className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 backdrop-blur-sm">
                      <h2 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span> Forjar Nova Patente
                      </h2>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <input placeholder="NOME DO TÍTULO" className="col-span-2 bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase text-white" 
                            value={novoRank.nome} onChange={e => setNovoRank({...novoRank, nome: e.target.value.toUpperCase()})}/>
                          <input placeholder="ÍCONE" className="bg-black border border-zinc-800 p-3 rounded-xl text-center text-lg" 
                            value={novoRank.icone} onChange={e => setNovoRank({...novoRank, icone: e.target.value})}/>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase px-1">XP Mínimo</label>
                            <input type="number" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold" 
                              value={novoRank.xp_minimo} onChange={e => setNovoRank({...novoRank, xp_minimo: parseInt(e.target.value)})}/>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[8px] font-bold text-zinc-500 uppercase px-1">Cor do Texto</label>
                             <div className="flex gap-2 items-center bg-black border border-zinc-800 p-1.5 rounded-xl">
                               <input type="color" className="w-full h-8 bg-transparent cursor-pointer" 
                                value={novoRank.cor_texto} onChange={e => setNovoRank({...novoRank, cor_texto: e.target.value})}/>
                             </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase px-1">Troféus Mín.</label>
                            <input type="number" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold text-yellow-500" 
                              value={novoRank.trofeus_min} onChange={e => setNovoRank({...novoRank, trofeus_min: parseInt(e.target.value)})}/>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase px-1">Troféus Máx.</label>
                            <input type="number" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold text-yellow-500" 
                              value={novoRank.trofeus_max} onChange={e => setNovoRank({...novoRank, trofeus_max: parseInt(e.target.value)})}/>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border-2 flex items-center justify-center gap-3" style={{ backgroundColor: novoRank.cor_bg, borderColor: novoRank.cor_border }}>
                           <span className="text-xl">{novoRank.icone}</span>
                           <span className="font-black italic uppercase tracking-tighter" style={{ color: novoRank.cor_texto }}>{novoRank.nome || "PREVIEW"}</span>
                        </div>

                        <button onClick={salvarRank} className="w-full bg-green-500 text-black font-black py-4 rounded-xl text-[10px] uppercase italic hover:bg-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                          ADICIONAR AO ARSENAL ATIVO
                        </button>
                      </div>
                    </section>
                  </div>

                  {/* COLUNA DIREITA: LISTA DE RANKS EXISTENTES */}
                  <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 backdrop-blur-sm">
                    <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       Patentes Cadastradas
                    </h2>
                    <div className="space-y-3">
                      {loadingRanks ? <p className="text-center py-10 animate-pulse text-zinc-600">Lendo Arquivos...</p> : 
                        ranks.map(r => (
                          <div key={r.id} className="p-4 bg-black/40 border border-zinc-800 rounded-2xl flex justify-between items-center border-l-4" style={{ borderLeftColor: r.cor_texto }}>
                             <div className="flex items-center gap-3">
                               <span className="text-xl">{r.icone}</span>
                               <div>
                                 <p className="font-black italic text-sm uppercase tracking-tighter" style={{ color: r.cor_texto }}>{r.nome}</p>
                                 <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">XP: {r.xp_minimo}+ | 🏆 {r.trofeus_min}-{r.trofeus_max}</p>
                               </div>
                             </div>
                             <button onClick={() => deletarRank(r.id)} className="text-zinc-700 hover:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                                </svg>
                             </button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div key="vigilancia" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="font-mono">
                
                {/* INTERFACE DE VIGILÂNCIA (IDÊNTICA À QUE VOCÊ GOSTOU) */}
                <div className="mb-6 flex gap-4 items-center">
                  <div className="relative flex-1">
                    <input 
                      placeholder="FILTRAR POR CODINOME..." 
                      className="w-full bg-zinc-900 border border-zinc-800 p-4 text-xs focus:border-red-600 outline-none pl-10"
                      value={buscaLog} onChange={(e) => setBuscaLog(e.target.value)}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 italic font-black">@</span>
                  </div>
                  <button onClick={carregarLogs} className="bg-red-600 text-black px-6 py-4 text-[10px] font-black uppercase hover:bg-white transition-colors">RESCAN</button>
                </div>

                <div className="space-y-4">
                  {loadingLogs ? <p className="text-red-500 animate-pulse text-center py-20 uppercase tracking-[0.5em]">Escaneando logs de rede...</p> : 
                    logsFiltrados.map((log) => (
                      <div key={log.id} className={`border-l-4 p-5 rounded-r-2xl transition-all ${log.usuarios?.status !== 'ativo' ? 'bg-red-950/20 border-red-600 shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]' : 'bg-zinc-900/40 border-zinc-700 hover:border-zinc-500'}`}>
                        <div className="flex justify-between items-start gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 text-[10px] mb-2">
                              <span className="text-zinc-600">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                              <span className="font-black text-red-500 uppercase tracking-tighter text-sm italic">@{log.usuarios?.username}</span>
                              <span className="bg-zinc-800 text-zinc-400 px-3 py-1 font-bold rounded-full border border-zinc-700">{log.tipo_evento}</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed font-medium">"{log.descricao}"</p>
                            <div className="flex gap-4 mt-3">
                               <span className="text-[9px] font-black text-zinc-500">XP ATUAL: <span className="text-white">{log.usuarios?.xp}</span></span>
                               <span className="text-[9px] font-black text-zinc-500">ESTADO: <span className={log.usuarios?.status === 'ativo' ? 'text-green-500' : 'text-red-500'}>{log.usuarios?.status?.toUpperCase()}</span></span>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            {/* AJUSTE RÁPIDO DE XP */}
                            <div className="flex flex-col gap-1">
                              <button onClick={() => modularXP(log.usuario_id, log.usuarios.xp, -500)} className="bg-zinc-800 hover:bg-red-600 text-[8px] font-black p-2 rounded transition-colors">-500</button>
                              <button onClick={() => modularXP(log.usuario_id, log.usuarios.xp, 500)} className="bg-zinc-800 hover:bg-green-600 text-[8px] font-black p-2 rounded transition-colors">+500</button>
                            </div>
                            {/* GESTÃO DE ACESSO */}
                            <div className="flex flex-col gap-1">
                              {log.usuarios?.status === 'ativo' ? (
                                <button onClick={() => alterarStatus(log.usuario_id, 'banido')} className="bg-red-700 hover:bg-red-500 text-[8px] font-black p-2 uppercase h-full rounded transition-all">BANIR</button>
                              ) : (
                                <button onClick={() => alterarStatus(log.usuario_id, 'ativo')} className="bg-green-600 hover:bg-green-400 text-[8px] font-black p-2 uppercase h-full rounded transition-all">UNBAN</button>
                              )}
                            </div>
                            {/* DELETAR CONTEÚDO */}
                            {log.treino_id && (
                              <button onClick={() => deletarTreino(log.treino_id, log.id)} className="bg-zinc-700 hover:bg-white hover:text-black text-[8px] font-black p-2 uppercase rounded transition-all">DEL_TR</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Navbar />
      </div>
    </AdminGuard>
  )
}