"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import AdminGuard from "@/components/AdminGuard"

export default function AdminPage() {
  // Estados de Títulos
  const [ranks, setRanks] = useState([])
  const [loadingRanks, setLoadingRanks] = useState(true)
  const [novoRank, setNovoRank] = useState({ 
    nome: "", 
    icone: "⭐", // Novo campo para o Emoji
    xp_minimo: 0, 
    trofeus_min: 0, 
    trofeus_max: 9999,
    cor_texto: "#ffffff", 
    cor_bg: "#27272a", 
    cor_border: "#3f3f46" 
  })

  // Estados de Usuários
  const [buscaUser, setBuscaUser] = useState("")
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    try {
      setLoadingRanks(true)
      const { data } = await supabase
        .from("ranks_custom")
        .select("*")
        .order("xp_minimo", { ascending: true })
      setRanks(data || [])
    } finally {
      setLoadingRanks(false)
    }
  }

  async function salvarRank() {
    if (!novoRank.nome) return alert("Dê um nome ao título, Comandante!")
    
    const { error } = await supabase.from("ranks_custom").insert([novoRank])
    
    if (error) {
      alert("Erro ao forjar título: " + error.message)
    } else {
      alert("Novo título forjado! 🔥")
      // Reseta o formulário
      setNovoRank({ 
        nome: "", 
        icone: "⭐", 
        xp_minimo: 0, 
        trofeus_min: 0, 
        trofeus_max: 9999, 
        cor_texto: "#ffffff", 
        cor_bg: "#27272a", 
        cor_border: "#3f3f46" 
      })
      carregarDados()
    }
  }

  async function buscarUsuarios() {
    if (!buscaUser) return
    setLoadingUsers(true)
    const { data } = await supabase
      .from("usuarios")
      .select("id, username, xp, titulo_manual")
      .ilike("username", `%${buscaUser}%`)
      .limit(5)
    setUsuarios(data || [])
    setLoadingUsers(false)
  }

  async function atualizarUsuario(id, dados) {
    const { error } = await supabase.from("usuarios").update(dados).eq("id", id)
    if (!error) {
      alert("Operador atualizado!")
      buscarUsuarios()
    } else {
      alert("Erro: " + error.message)
    }
  }

  return (
    <AdminGuard>
      <div className="max-w-md mx-auto p-6 bg-black min-h-screen text-white pb-32 font-sans">
        
        {/* HEADER */}
        <div className="mb-8 mt-4 text-center">
          <h1 className="text-green-500 text-3xl font-black italic uppercase tracking-tighter leading-none">
            CENTRAL DE COMANDO
          </h1>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-2">
            Acesso Restrito: Nível Admin
          </p>
        </div>

        {/* 1. GESTÃO DE USUÁRIOS (Inalterado) */}
        <section className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800 mb-8 shadow-xl">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Controle de Operadores
          </h2>
          <div className="flex gap-2 mb-4">
            <input 
              placeholder="BUSCAR @USER..." 
              className="flex-1 bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500/50"
              value={buscaUser}
              onChange={e => setBuscaUser(e.target.value)}
            />
            <button onClick={buscarUsuarios} className="bg-white text-black px-4 rounded-xl font-black text-[10px] uppercase italic">
              {loadingUsers ? "..." : "Buscar"}
            </button>
          </div>

          <div className="space-y-4">
            {usuarios.map(u => (
              <div key={u.id} className="p-4 bg-black/40 border border-zinc-800 rounded-2xl">
                <p className="font-black text-green-500 mb-3 italic">@{u.username}</p>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button onClick={() => atualizarUsuario(u.id, { xp: (u.xp || 0) + 100 })} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-[9px] font-black p-2 rounded-lg transition-all">+100 XP</button>
                    <button onClick={() => atualizarUsuario(u.id, { xp: (u.xp || 0) + 1000 })} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-[9px] font-black p-2 rounded-lg transition-all">+1000 XP</button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-600 uppercase ml-1">Atribuir Título Especial</label>
                    <select 
                      className="w-full bg-zinc-800 text-[10px] font-black p-2 rounded-lg outline-none"
                      onChange={(e) => atualizarUsuario(u.id, { titulo_manual: e.target.value })}
                      value={u.titulo_manual || ""}
                    >
                      <option value="">CÁLCULO AUTOMÁTICO</option>
                      {ranks.map(r => <option key={r.id} value={r.nome}>{r.nome}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. FORJAR TÍTULOS - ATUALIZADO COM ÍCONE */}
        <section className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800 mb-8 shadow-xl">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Forjar Novo Título
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                placeholder="NOME" 
                value={novoRank.nome}
                className="flex-[3] bg-black border border-zinc-800 p-4 rounded-2xl text-xs font-bold uppercase outline-none focus:border-green-500/50"
                onChange={e => setNovoRank({...novoRank, nome: e.target.value.toUpperCase()})}
              />
              <input 
                placeholder="ICON" 
                value={novoRank.icone}
                className="flex-1 bg-black border border-zinc-800 p-4 rounded-2xl text-center text-lg outline-none focus:border-green-500/50"
                onChange={e => setNovoRank({...novoRank, icone: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 mb-1 block">XP Mínimo</label>
                <input type="number" value={novoRank.xp_minimo} className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold outline-none" 
                  onChange={e => setNovoRank({...novoRank, xp_minimo: parseInt(e.target.value) || 0})}/>
              </div>
              <div>
                <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 mb-1 block">Cor do Texto</label>
                <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded-xl h-[46px]">
                  <input type="color" className="w-full h-full bg-transparent cursor-pointer" value={novoRank.cor_texto}
                    onChange={e => setNovoRank({...novoRank, cor_texto: e.target.value})}/>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 mb-1 block">🏆 Mínimo</label>
                <input type="number" value={novoRank.trofeus_min} className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold outline-none" 
                  onChange={e => setNovoRank({...novoRank, trofeus_min: parseInt(e.target.value) || 0})}/>
              </div>
              <div>
                <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 mb-1 block">🏆 Máximo</label>
                <input type="number" value={novoRank.trofeus_max} className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold outline-none" 
                  onChange={e => setNovoRank({...novoRank, trofeus_max: parseInt(e.target.value) || 0})}/>
              </div>
            </div>

            <button onClick={salvarRank} className="w-full bg-green-500 text-black font-black py-4 rounded-2xl text-[10px] uppercase italic shadow-lg shadow-green-500/10 active:scale-95 transition-all">
              PUBLICAR NO ARSENAL
            </button>
          </div>
        </section>

        {/* LISTA DE TÍTULOS - ATUALIZADO PARA EXIBIR ÍCONE */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Títulos em Operação</h2>
          <div className="space-y-2">
            {loadingRanks ? <p className="text-center text-[10px] animate-pulse">CARREGANDO...</p> : ranks.map(r => (
              <div key={r.id} style={{ borderColor: r.cor_border, backgroundColor: r.cor_bg }} className="p-4 rounded-2xl border flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{r.icone || "🎖️"}</span>
                  <div>
                    <span style={{ color: r.cor_texto }} className="font-black italic text-sm">{r.nome}</span>
                    <p className="text-[7px] font-bold text-zinc-500 uppercase mt-1">XP: {r.xp_minimo}+ | 🏆: {r.trofeus_min}-{r.trofeus_max}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Navbar />
      </div>
    </AdminGuard>
  )
}