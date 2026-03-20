"use client"
import { useState } from "react"
import Navbar from "@/components/Navbar"

export default function UnidadeComando() {
  const [chat, setChat] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function falarComComando() {
    if (!input.trim()) return
    const userMsg = { role: "user", content: input }
    setChat(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/inteligencia-campo", {
        method: "POST",
        body: JSON.stringify({ mensagem: input })
      })
      const data = await res.json()
      setChat(prev => [...prev, { role: "assistant", content: data.resposta }])
    } catch (err) {
      alert("Falha na comunicação com a base.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-32">
      <header className="text-center mt-6 mb-10">
        <h1 className="text-2xl font-black text-red-600 italic uppercase tracking-tighter">UNIDADE DE COMANDO</h1>
        <p className="text-[10px] text-zinc-500 font-bold uppercase">Consultoria de Protocolos e Suplementação</p>
      </header>

      <div className="max-w-md mx-auto space-y-4 mb-20">
        {chat.map((msg, i) => (
          <div key={i} className={`p-4 rounded-2xl max-w-[85%] ${
            msg.role === "user" ? "ml-auto bg-zinc-800 text-sm font-bold" : "mr-auto bg-red-600/10 border border-red-600/30 text-sm leading-relaxed"
          }`}>
            <p className="text-[8px] opacity-50 uppercase font-black mb-1">{msg.role === "user" ? "Operador" : "Comandante"}</p>
            {msg.content}
          </div>
        ))}
        {loading && <p className="text-red-600 animate-pulse text-xs font-black uppercase">Sincronizando resposta...</p>}
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4">
        <div className="max-w-md mx-auto flex gap-2 bg-zinc-900 p-2 rounded-2xl border border-red-600/20">
          <input 
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Pergunte sobre suplementos ou protocolos..."
            className="flex-1 bg-transparent p-2 outline-none text-sm font-bold"
          />
          <button onClick={falarComComando} className="bg-red-600 px-4 py-2 rounded-xl font-black italic text-xs">ENVIAR</button>
        </div>
      </div>
      <Navbar />
    </div>
  )
}