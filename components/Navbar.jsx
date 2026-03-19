"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { usePathname } from "next/navigation"
import NotificationBell from "@/components/notifications/NotificationBell" // Importando o sino

export default function Navbar() {
  const pathname = usePathname()
  const [fotoPerfil, setFotoPerfil] = useState(null)
  const [userId, setUserId] = useState<string | null>(null) // Estado para o ID do usuário

  useEffect(() => {
    async function carregarDados() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id) // Guarda o ID para o NotificationBell
          
          const { data } = await supabase
            .from("usuarios")
            .select("foto")
            .eq("id", user.id)
            .single()
          
          if (data?.foto) setFotoPerfil(data.foto)
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      }
    }
    carregarDados()
  }, [])

  const isActive = (path: string) =>
    pathname.startsWith(path) 
      ? "text-green-400 scale-110"
      : "text-zinc-500"

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center gap-2">

          {/* Lab */}
          <Link href="/lab" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/lab')}`}>
            <span className="text-xl">🧪</span>
            <span className="text-[9px] font-black uppercase tracking-tighter text-inherit">Lab</span>
          </Link>

          {/* Feed */}
          <Link href="/feed" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/feed')}`}>
            <span className="text-xl">🏠</span>
            <span className="text-[9px] font-black uppercase tracking-tighter text-inherit">Feed</span>
          </Link>

          {/* Explorar */}
          <Link href="/explorar" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/explorar')}`}>
            <span className="text-xl">🔍</span>
            <span className="text-[9px] font-black uppercase tracking-tighter text-inherit">Explorar</span>
          </Link>

          {/* Fórum */}
          <Link href="/forum" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/forum')}`}>
            <span className="text-xl">💬</span>
            <span className="text-[9px] font-black uppercase tracking-tighter text-inherit">Fórum</span>
          </Link>

          {/* Treino */}
          <Link href="/novo-treino" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/novo-treino')}`}>
            <span className="text-xl">🏋️</span>
            <span className="text-[9px] font-black uppercase tracking-tighter text-inherit">Treino</span>
          </Link>

          {/* NOTIFICAÇÕES - Adicionado Aqui */}
          <div className="flex flex-col items-center justify-center">
             {userId && <NotificationBell userId={userId} />}
             <span className={`text-[9px] font-black uppercase tracking-tighter ${unreadCount > 0 ? 'text-green-400' : 'text-zinc-500'}`}>Squad</span>
          </div>

          {/* Perfil */}
          <Link href="/perfil" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/perfil')}`}>
            <div 
              style={{ width: '24px', height: '24px' }} 
              className={`rounded-full overflow-hidden border-2 transition-all duration-300 flex items-center justify-center ${
                pathname === '/perfil' ? 'border-green-400' : 'border-zinc-700'
              }`}
            >
              <img 
                src={fotoPerfil || "/avatar-padrao.png"} 
                alt="Perfil"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter text-inherit">Perfil</span>
          </Link>

        </div>
      </div>
      <div className="h-4 bg-zinc-950/80 backdrop-blur-xl"></div>
    </nav>
  )
}