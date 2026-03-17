"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"

export default function Ranking() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState("level")

  useEffect(() => {
    carregarRanking()
  }, [abaAtiva])

  // Lógica de Patentes do Esquadrão
  function getPatente(xp = 0) {
    if (xp >= 8000) return { nome: "aura", cor: "text-red-500", icon: "⚡" }
    if (xp >= 4000) return { nome: "no have enemies", cor: "text-purple-500", icon: "🛡️" }
    if (xp >= 2000) return { nome: "high cortisol", cor: "text-blue-500", icon: "🦅" }
    if (xp >= 1000) return { nome: "beta", cor: "text-yellow-500", icon: "⚔️" }
    if (xp >= 500) return { nome: "frango", cor: "text-green-500", icon: "🎖️" }
    return { nome: "RECRUTA", cor: "text-zinc-500", icon: "🔰" }
  }

  async function carregarRanking() {
    setLoading(true)
    try {
      if (abaAtiva === "level") {
        const { data, error } = await supabase
          .from("usuarios")
          .select("id, username, foto, xp")
          .order("xp", { ascending: false })
          .limit(20)
        if (error) throw error
        setUsuarios(data)
      } else {
        const { data: registros, error: errorReg } = await supabase
          .from("registros_treino")
          .select("peso, usuario_id, created_at")
          .not("peso", "is", null)
          .order("created_at", { ascending: false })

        if (errorReg) throw errorReg

        const somaRecentePorUsuario = {}
        const ultimaDataProcessada = {}

        registros.forEach(reg => {
          const dataTreino = reg.created_at.split('T')[0]
          const user_id = reg.usuario_id
          const peso = Number(reg.peso) || 0

          if (!ultimaDataProcessada[user_id]) {
            ultimaDataProcessada[user_id] = dataTreino
            somaRecentePorUsuario[user_id] = peso
          } 
          else if (ultimaDataProcessada[user_id] === dataTreino) {
            somaRecentePorUsuario[user_id] += peso
          }
        })

        const rankingPesos = Object.entries(somaRecentePorUsuario)
          .map(([id, total]) => ({ usuario_id: id, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 20)

        const idsUsuarios = rankingPesos.map(r => r.usuario_id)
        const { data: infoUsuarios, error: errorUser } = await supabase
          .from("usuarios")
          .select("id, username, foto, xp")
          .in("id", idsUsuarios)

        const formatado = rankingPesos.map(item => {
          const user = infoUsuarios.find(u => u.id === item.usuario_id)
          return {
            username: user?.username || "Recruta",
            foto: user?.foto,
            valor: item.total,
            xp: user?.xp || 0
          }
        })

        setUsuarios(formatado)
      }
    } catch (error) {
      console.error("Erro no Ranking:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-24 min-h-screen bg-black text-white font-sans">
      <header className="py-6 flex flex-col items-center">
        <div className="bg-green-500/10 p-3 rounded-full mb-3 border border-green-500/20">
          <span className="text-2xl">🏆</span>
        </div>
        <h1 className="text-white text-2xl font-black italic uppercase tracking-tighter">
          Hall da <span className="text-green-500">Elite</span>
        </h1>
      </header>

      {/* TABS */}
      <div className="flex bg-zinc-900/50 p-1.5 rounded-[2rem] mb-8 border border-zinc-800 backdrop-blur-sm">
        <button 
          onClick={() => setAbaAtiva("level")}
          className={`flex-1 py-3 rounded-[1.5rem] font-black text-[10px] uppercase italic transition-all duration-300 ${abaAtiva === 'level' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-zinc-500 hover:text-white'}`}
        >
          Ranking XP
        </button>
        <button 
          onClick={() => setAbaAtiva("peso")}
          className={`flex-1 py-3 rounded-[1.5rem] font-black text-[10px] uppercase italic transition-all duration-300 ${abaAtiva === 'peso' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-zinc-500 hover:text-white'}`}
        >
          Força Bruta
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          usuarios.map((user, index) => {
            const patente = getPatente(user.xp || 0)
            {/* CORREÇÃO DA CONTA AQUI: dividido por 500 */}
            const nivel = Math.floor((user.xp || 0) / 500) + 1

            return (
              <div 
                key={index} 
                className={`relative flex items-center justify-between p-4 rounded-[2rem] border overflow-hidden ${
                  index === 0 ? 'bg-gradient-to-r from-green-500/20 to-zinc-900 border-green-500/40' : 'bg-zinc-900/30 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full border-2 overflow-hidden bg-zinc-800 ${index === 0 ? 'border-green-500 scale-110 shadow-lg' : 'border-zinc-700'}`}>
                      {user.foto ? <img src={user.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">👤</div>}
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-black rounded-full px-1.5 py-0.5 text-[8px] font-black border border-zinc-800">
                      {index + 1}º
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-xs uppercase italic tracking-wide flex items-center gap-2 text-white">
                      {user.username}
                      <span className="text-[10px]">{patente.icon}</span>
                    </h4>
                    <p className={`text-[8px] font-black tracking-[0.15em] ${patente.cor}`}>
                      {patente.nome} • NIVEL {nivel}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-white font-black text-xs italic">
                    {abaAtiva === 'level' ? `${user.xp || 0} XP` : `${user.valor || 0} KG`}
                  </p>
                  <p className="text-zinc-600 text-[8px] font-bold uppercase">ARSENAL</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Navbar />
    </div>
  )
}