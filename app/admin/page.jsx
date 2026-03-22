"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/Navbar"
import AdminGuard from "@/components/AdminGuard"

export default function AdminMaster() {
  const [abaAtiva, setAbaAtiva] = useState("arsenal") // 'arsenal' ou 'vigilancia'

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
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h1 className="text-green-500 text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">
            CENTRAL DE COMANDO
          </h1>
          <div className="flex justify-center gap-4 mt-6 border-b border-zinc-800 pb-4">
            <button 
              onClick={() => setAbaAtiva('arsenal')}
              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-t-lg transition-all ${abaAtiva === 'arsenal' ? 'bg-green-600 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              [ 01. Gestão de Arsenal ]
            </button>
            <button 
              onClick={() => setAbaAtiva('vigilancia')}
              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-t-lg transition-all ${abaAtiva === 'vigilancia' ? 'bg-red-600 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              [ 02. Vigilância & Logs ]
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6">
          <AnimatePresence mode="wait">
            {abaAtiva === 'arsenal' ? (
              <motion.div key="arsenal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                
                {/* BUSCA DE USUÁRIOS */}
                <section className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 mb-8">
                  <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Moderação Rápida
                  </h2>
                  <div className="flex gap-2 mb-4">
                    <input 
                      placeholder="BUSCAR @OPERADOR..." 
                      className="flex-1 bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500/50"
                      value={buscaUser} onChange={e => setBuscaUser(e.target.value)}
                    />
                    <button onClick={buscarUsuarios} className="bg-white text-black px-6 rounded-xl font-black text-[10px] uppercase italic">
                      {loadingUsers ? "..." : "Localizar"}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {usuarios.map(u => (
                      <div key={u.id} className="p-4 bg-black/60 border border-zinc-800 rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="font-black text-green-500 italic">@{u.username}</p>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">XP: {u.xp} | STATUS: {u.status}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => modularXP(u.id, u.xp, 100)} className="bg-zinc-800 hover:bg-green-600 p-2 rounded-lg text-[9px] font-black transition">+100 XP</button>
                          <select 
                            className="bg-zinc-800 text-[9px] font-black p-2 rounded-lg outline-none"
                            onChange={(e) => {
                              const { error } = supabase.from("usuarios").update({ titulo_manual: e.target.value }).eq("id", u.id)
                              if(!error) alert("Título Manual Atribuído")
                            }}
                            value={u.titulo_manual || ""}
                          >
                            <option value="">AUTO-RANK</option>
                            {ranks.map(r => <option key={r.id} value={r.nome}>{r.nome}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* FORJAR TÍTULOS */}
                <section className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 mb-8">
                  <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Forjar Novo Título
                  </h2>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <input placeholder="NOME" className="col-span-2 bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase" 
                      value={novoRank.nome} onChange={e => setNovoRank({...novoRank, nome: e.target.value.toUpperCase()})}/>
                    <input placeholder="ICON" className="bg-black border border-zinc-800 p-3 rounded-xl text-center" 
                      value={novoRank.icone} onChange={e => setNovoRank({...novoRank, icone: e.target.value})}/>
                    <input type="color" className="w-full h-full bg-transparent cursor-pointer" 
                      value={novoRank.cor_texto} onChange={e => setNovoRank({...novoRank, cor_texto: e.target.value})}/>
                  </div>
                  <button onClick={salvarRank} className="w-full bg-green-500 text-black font-black py-3 rounded-xl text-[10px] uppercase italic">
                    PUBLICAR NO ARSENAL
                  </button>
                </section>

              </motion.div>
            ) : (
              <motion.div key="vigilancia" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="font-mono">
                
                <div className="mb-6 flex gap-4 items-center">
                  <input 
                    placeholder="FILTRAR POR CODINOME..." 
                    className="flex-1 bg-zinc-900 border border-zinc-800 p-3 text-xs focus:border-red-600 outline-none"
                    value={buscaLog} onChange={(e) => setBuscaLog(e.target.value)}
                  />
                  <button onClick={carregarLogs} className="bg-red-600 text-black px-4 py-3 text-[10px] font-black uppercase">Refresh</button>
                </div>

                <div className="space-y-3">
                  {loadingLogs ? <p className="text-red-500 animate-pulse text-center">ESCANEANDO REDE...</p> : 
                    logsFiltrados.map((log) => (
                      <div key={log.id} className={`border-l-4 p-4 ${log.usuarios?.status !== 'ativo' ? 'bg-red-950/20 border-red-600' : 'bg-zinc-900/40 border-zinc-700'}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-zinc-600">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                              <span className="font-black text-red-500 uppercase">@{log.usuarios?.username}</span>
                              <span className="bg-zinc-800 px-2 py-0.5 font-bold">{log.tipo_evento}</span>
                            </div>
                            <p className="text-xs mt-2 text-zinc-300 italic">"{log.descricao}"</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <div className="flex flex-col gap-1">
                              <button onClick={() => modularXP(log.usuario_id, log.usuarios.xp, -100)} className="bg-zinc-800 hover:bg-red-600 text-[8px] font-bold p-1">-100XP</button>
                              <button onClick={() => modularXP(log.usuario_id, log.usuarios.xp, 100)} className="bg-zinc-800 hover:bg-green-600 text-[8px] font-bold p-1">+100XP</button>
                            </div>
                            <div className="flex flex-col gap-1">
                              {log.usuarios?.status === 'ativo' ? (
                                <button onClick={() => alterarStatus(log.usuario_id, 'banido')} className="bg-red-700 text-[8px] font-black p-1 uppercase">BAN</button>
                              ) : (
                                <button onClick={() => alterarStatus(log.usuario_id, 'ativo')} className="bg-green-600 text-[8px] font-black p-1 uppercase">UNBAN</button>
                              )}
                              {log.treino_id && (
                                <button onClick={() => deletarTreino(log.treino_id, log.id)} className="bg-zinc-700 text-[8px] font-black p-1 uppercase">DEL_TR</button>
                              )}
                            </div>
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