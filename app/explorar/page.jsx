"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Navbar from "@/components/Navbar"

export default function Explorar() {
  const [busca, setBusca] = useState("")
  const [usuarios, setUsuarios] = useState([])

  async function buscarUsuarios() {
    if (busca.length < 2) return setUsuarios([])
    
    const { data } = await supabase
      .from("usuarios")
      .select("id, username, foto")
      .ilike("username", `%${busca}%`) // Busca parcial (Ex: "efra" acha "efrain")
      .limit(10)

    setUsuarios(data || [])
  }

  useEffect(() => {
    const timer = setTimeout(buscarUsuarios, 500) // Debounce para não travar o banco
    return () => clearTimeout(timer)
  }, [busca])

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">
      <h1 className="text-2xl font-black italic uppercase text-green-500 mb-6">Explorar</h1>
      
      <input 
        placeholder="Buscar guerreiros..."
        className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-2xl mb-6 outline-none focus:border-green-500"
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="space-y-4">
        {usuarios.map(u => (
          <Link href={`/perfil/${u.id}`} key={u.id}>
            <div className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 active:scale-95 transition-all">
              <img src={u.foto || "/placeholder.png"} className="w-12 h-12 rounded-full object-cover border border-green-500/50" />
              <p className="font-bold">@{u.username}</p>
            </div>
          </Link>
        ))}
      </div>
      <Navbar />
    </div>
  )
}