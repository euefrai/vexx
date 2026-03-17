"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()
  const [fotoPerfil, setFotoPerfil] = useState(null)

  useEffect(() => {
    async function carregarFoto() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from("usuarios")
            .select("foto")
            .eq("id", user.id)
            .single()
          
          if (data?.foto) setFotoPerfil(data.foto)
        }
      } catch (err) {
        console.error("Erro ao carregar foto:", err)
      }
    }
    carregarFoto()
  }, [])

  const isActive = (path) =>
    pathname === path
      ? "text-green-400 scale-110"
      : "text-zinc-500"

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center">

          {/* Feed */}
          <Link href="/feed" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/feed')}`}>
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-semibold uppercase tracking-tighter">Feed</span>
          </Link>

          {/* Explorar */}
          <Link href="/explorar" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/explorar')}`}>
            <span className="text-xl">🔍</span>
            <span className="text-[10px] font-semibold uppercase tracking-tighter">Explorar</span>
          </Link>

          {/* Treino */}
          <Link href="/novo-treino" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/novo-treino')}`}>
            <span className="text-xl">🏋️</span>
            <span className="text-[10px] font-semibold uppercase tracking-tighter">Treino</span>
          </Link>

          {/* Perfil - TRAVA FIXA DE TAMANHO */}
          <Link href="/perfil" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/perfil')}`}>
            <div 
              style={{ 
                width: '28px', 
                height: '28px', 
                minWidth: '28px', 
                minHeight: '28px' 
              }} 
              className={`rounded-full overflow-hidden border-2 transition-all duration-300 flex items-center justify-center ${
                pathname === '/perfil' 
                  ? 'border-green-400 ring-2 ring-green-400/20' 
                  : 'border-zinc-700'
              }`}
            >
              <img 
                src={fotoPerfil || "https://via.placeholder.com/150"} 
                alt="Perfil"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-tighter">Perfil</span>
          </Link>

        </div>
      </div>
      <div className="h-4 bg-zinc-950/80 backdrop-blur-xl"></div>
    </nav>
  )
}