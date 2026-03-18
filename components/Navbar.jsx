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
    pathname.startsWith(path) 
      ? "text-green-400 scale-110"
      : "text-zinc-500"

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center gap-2">

          {/* Lab (Ferramentas) - AGORA EM PRIMEIRO */}
          <Link href="/lab" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/lab')}`}>
            <span className="text-xl">🧪</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">Lab</span>
          </Link>

          {/* Feed - AGORA EM SEGUNDO */}
          <Link href="/feed" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/feed')}`}>
            <span className="text-xl">🏠</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">Feed</span>
          </Link>

          {/* Explorar */}
          <Link href="/explorar" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/explorar')}`}>
            <span className="text-xl">🔍</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">Explorar</span>
          </Link>

          {/* Fórum */}
          <Link href="/forum" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/forum')}`}>
            <span className="text-xl">💬</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">Fórum</span>
          </Link>

          {/* Treino */}
          <Link href="/novo-treino" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/novo-treino')}`}>
            <span className="text-xl">🏋️</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">Treino</span>
          </Link>

          {/* Perfil */}
          <Link href="/perfil" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/perfil')}`}>
            <div 
              style={{ width: '24px', height: '24px' }} 
              className={`rounded-full overflow-hidden border-2 transition-all duration-300 flex items-center justify-center ${
                pathname === '/perfil' ? 'border-green-400' : 'border-zinc-700'
              }`}
            >
              <img 
                src={fotoPerfil || "https://via.placeholder.com/150"} 
                alt="Perfil"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Perfil</span>
          </Link>

        </div>
      </div>
      <div className="h-4 bg-zinc-950/80 backdrop-blur-xl"></div>
    </nav>
  )
}