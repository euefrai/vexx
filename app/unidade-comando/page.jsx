"use client"
import { useState, useEffect, useRef } from "react"
import Navbar from "@/components/Navbar"

export default function UnidadeComando() {
  const [chat, setChat] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  // 🧠 MEMÓRIA LONGA: Carrega o histórico ao abrir a página
  useEffect(() => {
    const memoriaSalva = localStorage.getItem("vexx_chat_memory")
    if (memoriaSalva) {
      setChat(JSON.parse(memoriaSalva))
    }
  }, [])

  // 💾 SALVAR MEMÓRIA: Salva no localStorage a cada nova mensagem
  useEffect(() => {
    if (chat.length > 0) {
      localStorage.setItem("vexx_chat_memory", JSON.stringify(chat))
    }
    // Auto-scroll para a última mensagem
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, [chat])

  async function falarComComando() {
    if (!input.trim() || loading) return
    
    const novaMensagem = { role: "user", content: input }
    const novoHistorico = [...chat, novaMensagem]
    
    setChat(novoHistorico)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/inteligencia-campo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historico: novoHistorico }) 
      })
      
      const data = await res.json()
      
      if (data.resposta) {
        setChat(prev => [...prev, { role: "assistant", content: data.resposta }])
      } else {
        throw new Error("Resposta vazia")
      }
    } catch (err) {
      alert("Falha na comunicação com a base. Verifique sua conexão.")
    } finally {
      setLoading(false)
    }
  }

  const limparMemoria = () => {
    if(confirm("Deseja apagar todo o histórico da Unidade de Comando?")) {
      localStorage.removeItem("vexx_chat_memory")
      setChat([])
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-32">
      <header className="flex justify-between items-center mt-6 mb-10 max-w-md mx-auto">
        <button onClick={limparMemoria} className="text-[8px] text-zinc-600 font-black border border-zinc-900 p-2 rounded-lg uppercase hover:bg-zinc-900">Reset Log</button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-red-600 italic uppercase tracking-tighter">UNIDADE DE COMANDO</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Inteligência de Campo</p>
        </div>
        <div className="w-12" /> {/* Equilíbrio visual */}
      </header>

      <div className="max-w-md mx-auto space-y-4 mb-20">
        {chat.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <p className="text-xs font-black uppercase tracking-widest italic">Aguardando ordens...</p>
          </div>
        )}

        {chat.map((msg, i) => (
          <div key={i} className={`p-4 rounded-2xl max-w-[90%] animate-in fade-in slide-in-from-bottom-2 ${
            msg.role === "user" 
              ? "ml-auto bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-100" 
              : "mr-auto bg-red-600/5 border border-red-900/30 text-sm leading-relaxed text-red-50"
          }`}>
            <p className={`text-[8px] uppercase font-black mb-1 ${msg.role === "user" ? "text-zinc-500" : "text-red-500"}`}>
              {msg.role === "user" ? "Operador / Paul" : "Comandante VEXX"}
            </p>
            {msg.content}
          </div>
        ))}
        
        {loading && (
          <div className="mr-auto bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800 animate-pulse">
            <p className="text-red-600 text-[8px] font-black uppercase">Sincronizando Resposta...</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4">
        <div className="max-w-md mx-auto flex gap-2 bg-zinc-900/90 backdrop-blur-md p-2 rounded-2xl border border-red-600/20 shadow-2xl">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && falarComComando()}
            placeholder="Relatório de campo ou dúvida..."
            className="flex-1 bg-transparent p-2 outline-none text-sm font-bold placeholder:text-zinc-700"
          />
          <button 
            onClick={falarComComando} 
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-black italic text-xs transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "..." : "ENVIAR"}
          </button>
        </div>
      </div>
      <Navbar />
    </div>
  )
}