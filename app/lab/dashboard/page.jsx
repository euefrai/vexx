"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function Dashboard() {
  const [calorias, setCalorias] = useState(0)
  const [proteina, setProteina] = useState(0)

  const META_CALORIAS = 2000
  const META_PROTEINA = 150

  useEffect(() => {
    const macros = JSON.parse(localStorage.getItem("elite_macros_history")) || []

    const totalCal = macros.reduce((acc, item) => acc + item.calorias, 0)
    const totalProt = macros.reduce((acc, item) => acc + item.proteina, 0)

    setCalorias(totalCal)
    setProteina(totalProt)
  }, [])

  const progressoCal = Math.min((calorias / META_CALORIAS) * 100, 100)
  const progressoProt = Math.min((proteina / META_PROTEINA) * 100, 100)

  // 🧠 IA OFFLINE SIMPLES
  function getMensagem() {
    if (proteina < META_PROTEINA * 0.5)
      return "⚠️ Proteína muito baixa hoje"
    if (calorias > META_CALORIAS)
      return "🔥 Você passou das calorias"
    if (proteina >= META_PROTEINA)
      return "💪 Meta de proteína batida!"
    return "🚀 Continue firme no treino"
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-28">

      <h1 className="text-2xl font-black text-green-500 mb-6">
        DASHBOARD
      </h1>

      {/* 🧠 RESUMO */}
      <div className="bg-zinc-900 p-4 rounded-2xl mb-6">
        <p className="text-xs text-zinc-500 mb-2">Resumo do dia</p>

        <p className="text-sm">
          🔥 {calorias} / {META_CALORIAS} kcal
        </p>

        <div className="w-full h-2 bg-zinc-800 rounded-full mt-1 mb-3">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${progressoCal}%` }}
          />
        </div>

        <p className="text-sm">
          🍗 {proteina} / {META_PROTEINA}g proteína
        </p>

        <div className="w-full h-2 bg-zinc-800 rounded-full mt-1">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${progressoProt}%` }}
          />
        </div>

        {/* IA */}
        <p className="text-xs text-green-400 mt-3">
          {getMensagem()}
        </p>
      </div>

      {/* 🧩 GRID */}
      <div className="grid grid-cols-2 gap-4">

        <Card titulo="CRONÔMETRO" link="/lab/cronometro" emoji="⏱️" cor="border-blue-500" />
        <Card titulo="DESCANSO" link="/lab/descanso" emoji="⏳" cor="border-orange-500" />
        <Card titulo="IMC" link="/lab/imc" emoji="⚖️" cor="border-green-500" />
        <Card titulo="1RM" link="/lab/rpm" emoji="⚡" cor="border-purple-500" />
        <Card titulo="MACROS" link="/lab/macros" emoji="🍗" cor="border-red-500" />
        <Card titulo="METABOLISMO" link="/lab/tmb" emoji="🔥" cor="border-yellow-500" />

      </div>
    </div>
  )
}

function Card({ titulo, link, emoji, cor }) {
  return (
    <Link href={link}>
      <div className={`
        p-5 rounded-2xl 
        border ${cor}
        bg-zinc-900 
        active:scale-95 transition-all
      `}>
        <div className="text-2xl mb-2">{emoji}</div>
        <p className="font-bold text-sm">{titulo}</p>
      </div>
    </Link>
  )
}