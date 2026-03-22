"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { usePathname } from "next/navigation"
import NotificationBell from "@/components/notifications/NotificationBell"

export default function Navbar() {
  const pathname = usePathname()
  const constraintsRef = useRef(null) // Referência para limitar o arrasto à tela
  const [fotoPerfil, setFotoPerfil] = useState(null)
  const [userId, setUserId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function carregarDados() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          
          const { data } = await supabase
            .from("usuarios")
            .select("foto, is_admin")
            .eq("id", user.id)
            .single()
          
          if (data) {
            if (data.foto) setFotoPerfil(data.foto)
            if (data.is_admin) setIsAdmin(true)
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      }
    }
    carregarDados()
  }, [])

  const isActive = (path) =>
    pathname.startsWith(path) 
      ? "text-green-400 scale-110"
      : "text-zinc-500"

  return (
    <>
      {/* AREA DE ARRASTO - Ocupa a tela toda para permitir mover o QG livremente */}
      {isAdmin && (
        <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[60]">
          <motion.div
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            whileTap={{ scale: 0.9, cursor: "grabbing" }}
            className="pointer-events-auto absolute bottom-24 right-6" // Posição inicial (acima da nav)
          >
            <Link href="/admin">
              <button className="bg-red-600 border-2 border-red-400 text-white text-[10px] font-black px-3 py-2 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse uppercase flex items-center justify-center gap-1">
                <span className="text-xs">🚨</span> QG
              </button>
            </Link>
          </motion.div>
        </div>
      )}

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

            {/* Notificações (Squad) */}
            <div className="flex flex-col items-center justify-center gap-1">
               {userId && <NotificationBell userId={userId} />}
               <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-500">Squad</span>
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
        {/* Espaçamento inferior (Safe Area) */}
        <div className="h-4 bg-zinc-950/80 backdrop-blur-xl"></div>
      </nav>
    </>
  )
}