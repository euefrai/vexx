"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import PageHeader from "@/components/PageHeader"
import { Trophy, Flame, Zap, Shield, Sparkles, Activity, ShieldAlert, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function Ranking() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState("semanal")

  useEffect(() => {
    carregarRanking()
  }, [abaAtiva])

  // Lógica de Patentes do Esquadrão
  function getPatente(xp = 0) {
    if (xp >= 8000) return { nome: "aura", cor: "text-rose-400", icon: Zap }
    if (xp >= 4000) return { nome: "no enemies", cor: "text-purple-400", icon: Shield }
    if (xp >= 2000) return { nome: "high cortisol", cor: "text-blue-400", icon: Activity }
    if (xp >= 1000) return { nome: "beta", cor: "text-amber-400", icon: Sparkles }
    if (xp >= 500) return { nome: "frango", cor: "text-emerald-400", icon: Trophy }
    return { nome: "recruta", cor: "text-zinc-500", icon: ShieldAlert }
  }

  async function carregarRanking() {
    setLoading(true)
    try {
      if (abaAtiva === "semanal") {
        // Ranking da semana por KM
        const agora = new Date()
        const inicioSemana = new Date(agora)
        inicioSemana.setDate(agora.getDate() - agora.getDay())
        inicioSemana.setHours(0, 0, 0, 0)

        const { data: runs } = await supabase
          .from("runs")
          .select("user_id, distancia")
          .gte("created_at", inicioSemana.toISOString())

        const kmPorUsuario = {}
        if (runs) {
          runs.forEach(run => {
            kmPorUsuario[run.user_id] = (kmPorUsuario[run.user_id] || 0) + (run.distancia || 0)
          })
        }

        const idsUnicos = Object.keys(kmPorUsuario)
        if (idsUnicos.length === 0) {
          setUsuarios([])
          setLoading(false)
          return
        }

        const { data: infoUsuarios } = await supabase
          .from("usuarios")
          .select("id, username, foto, xp")
          .in("id", idsUnicos)

        const ranking = Object.entries(kmPorUsuario)
          .map(([id, km]) => {
            const user = infoUsuarios?.find(u => u.id === id)
            return {
              id,
              username: user?.username || "Recruta",
              foto: user?.foto,
              valor: Math.round(km * 10) / 10,
              xp: user?.xp || 0,
              tipo: "km"
            }
          })
          .sort((a, b) => b.valor - a.valor)

        setUsuarios(ranking)
      } else if (abaAtiva === "level") {
        const { data, error } = await supabase
          .from("usuarios")
          .select("id, username, foto, xp")
          .order("xp", { ascending: false })
          .limit(20)
        if (error) throw error
        setUsuarios(data || [])
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
        if (idsUsuarios.length === 0) {
          setUsuarios([])
          setLoading(false)
          return
        }

        const { data: infoUsuarios, error: errorUser } = await supabase
          .from("usuarios")
          .select("id, username, foto, xp")
          .in("id", idsUsuarios)

        const formatado = rankingPesos.map(item => {
          const user = infoUsuarios?.find(u => u.id === item.usuario_id)
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
    <div className="max-w-md mx-auto p-4 pb-32 min-h-screen bg-zinc-950 text-zinc-100 font-sans relative">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />

      <PageHeader 
        icon={<Trophy className="w-7 h-7 text-orange-400" />} 
        title="Ranking" 
        subtitle="Os atletas de elite do VEXX" 
        color="orange" 
      />

      {/* TABS */}
      <div className="flex gap-2.5 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <button 
          onClick={() => setAbaAtiva("semanal")}
          className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 border ${
            abaAtiva === 'semanal' 
              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
              : 'bg-zinc-900/40 text-zinc-400 border-zinc-900/80 hover:bg-zinc-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5" /> Semanal (KM)
        </button>
        <button 
          onClick={() => setAbaAtiva("level")}
          className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 border ${
            abaAtiva === 'level' 
              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
              : 'bg-zinc-900/40 text-zinc-400 border-zinc-900/80 hover:bg-zinc-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Geral (XP)
        </button>
        <button 
          onClick={() => setAbaAtiva("peso")}
          className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 border ${
            abaAtiva === 'peso' 
              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
              : 'bg-zinc-900/40 text-zinc-400 border-zinc-900/80 hover:bg-zinc-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Força Bruta (KG)
        </button>
      </div>

      {abaAtiva === 'semanal' && (
        <div className="mb-6 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-center">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Desafio Semanal de Distância</p>
          <p className="text-[11px] text-zinc-400 mt-1">Registre suas corridas esta semana para subir na classificação e liderar o esquadrão.</p>
        </div>
      )}

      <div className="space-y-3.5">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5 text-zinc-500" />
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Nenhuma atividade registrada ainda nesta categoria.</p>
          </div>
        ) : (
          usuarios.map((user, index) => {
            const patente = getPatente(user.xp || 0)
            const nivel = Math.floor((user.xp || 0) / 500) + 1
            const PatenteIcon = patente.icon

            return (
              <div 
                key={index} 
                className={`relative flex items-center justify-between p-4 rounded-xl border ${
                  index === 0 
                    ? 'bg-gradient-to-r from-orange-500/10 to-zinc-900/40 border-orange-500/30 shadow-lg shadow-orange-500/5 scale-[1.01]' 
                    : 'bg-zinc-900/20 border-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-11 h-11 rounded-full border-2 overflow-hidden bg-zinc-950 ${
                      index === 0 ? 'border-orange-500' : 'border-zinc-800'
                    }`}>
                      {user.foto ? (
                        <img src={user.foto} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600 text-xs">U</div>
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-zinc-950 text-white rounded-lg px-1.5 py-0.5 text-[8px] font-black border border-zinc-900">
                      {index + 1}º
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wide flex items-center gap-1.5 text-zinc-200">
                      {user.username}
                      <PatenteIcon className={`w-3.5 h-3.5 ${patente.cor}`} />
                    </h4>
                    <p className={`text-[8px] font-bold uppercase tracking-wider ${patente.cor}`}>
                      {patente.nome} • NÍVEL {nivel}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-zinc-100 font-extrabold text-xs uppercase tracking-wide">
                    {abaAtiva === 'semanal' 
                      ? `${user.valor || 0} km` 
                      : abaAtiva === 'level' 
                        ? `${user.xp || 0} XP` 
                        : `${user.valor || 0} kg`}
                  </p>
                  <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-wider">
                    {abaAtiva === 'semanal' ? 'Volume' : abaAtiva === 'level' ? 'Pontuação' : 'Carga Total'}
                  </p>
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