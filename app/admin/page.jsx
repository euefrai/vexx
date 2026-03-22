"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import AdminGuard from "@/components/AdminGuard"

export default function AdminPage() {
  const [ranks, setRanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [novoRank, setNovoRank] = useState({ 
    nome: "", 
    xp_minimo: 0, 
    cor_texto: "text-white", 
    cor_bg: "bg-zinc-800", 
    cor_border: "border-zinc-700" 
  })

  useEffect(() => { 
    carregarDados() 
  }, [])

  async function carregarDados() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from("ranks_custom")
        .select("*")
        .order("xp_minimo", { ascending: true })
      setRanks(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function salvarRank() {
    if (!novoRank.nome) return alert("Dê um nome ao título, Comandante!")
    
    const { error } = await supabase.from("ranks_custom").insert([novoRank])
    
    if (error) {
      alert("Erro ao forjar título: " + error.message)
    } else {
      alert("Novo título forjado e publicado no sistema! 🔥")
      setNovoRank({ ...novoRank, nome: "", xp_minimo: 0 }) // Limpa o form
      carregarDados()
    }
  }

  return (
    <AdminGuard>
      <div className="max-w-md mx-auto p-6 bg-black min-h-screen text-white pb-24 font-sans">
        
        {/* HEADER DO QG */}
        <div className="mb-8 mt-4">
          <h1 className="text-green-500 text-2xl font-black italic uppercase tracking-tighter leading-none">
            CENTRAL DE COMANDO
          </h1>
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-1">
            Acesso Restrito: Nível Admin
          </p>
        </div>
        
        {/* FORMULÁRIO DE TÍTULOS */}
        <section className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800 mb-8 shadow-xl">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Forjar Novo Título
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 mb-1 block">Patente / Nome</label>
              <input 
                placeholder="EX: LENDÁRIO" 
                value={novoRank.nome}
                className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-xs font-bold uppercase outline-none focus:border-green-500/50 transition-all"
                onChange={e => setNovoRank({...novoRank, nome: e.target.value.toUpperCase()})}
              />
            </div>

            <div>
              <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 mb-1 block">XP Necessário</label>
              <input 
                type="number" 
                placeholder="0" 
                value={novoRank.xp_minimo}
                className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-xs font-bold outline-none focus:border-green-500/50 transition-all"
                onChange={e => setNovoRank({...novoRank, xp_minimo: parseInt(e.target.value) || 0})}
              />
            </div>

            <button 
              onClick={salvarRank} 
              className="w-full bg-green-500 text-black font-black py-4 rounded-2xl text-[10px] uppercase italic hover:bg-white transition-all active:scale-95 shadow-lg shadow-green-500/10"
            >
              PUBLICAR NO ARSENAL
            </button>
          </div>
        </section>

        {/* LISTA DE TÍTULOS ATUAIS */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">
            Títulos em Operação ({ranks.length})
          </h2>
          
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-10 opacity-20 text-[10px] font-black uppercase tracking-widest">Sincronizando...</div>
            ) : (
              ranks.map(r => (
                <div 
                  key={r.id} 
                  className={`p-4 rounded-2xl border ${r.cor_border} ${r.cor_bg} bg-opacity-10 flex justify-between items-center transition-all hover:scale-[1.02]`}
                >
                  <div className="flex flex-col">
                    <span className={`font-black italic text-sm ${r.cor_texto}`}>{r.nome}</span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Status: Ativo</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black block leading-none">{r.xp_minimo}</span>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase">XP REQUERIDO</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <Navbar />
      </div>
    </AdminGuard>
  )
}