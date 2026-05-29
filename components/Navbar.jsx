"use client"

import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { usePathname } from "next/navigation"
import NotificationBell from "@/components/notifications/NotificationBell"
import MobileDrawer from "@/components/MobileDrawer"
import { Home, Dumbbell, Activity, Search, Menu } from "lucide-react"

// Cache para dados do usuário para evitar chamadas repetidas
const userDataCache = new Map()

function Navbar() {
  const pathname = usePathname()
  const constraintsRef = useRef(null)
  const [fotoPerfil, setFotoPerfil] = useState(null)
  const [userId, setUserId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // 🔄 Carregar dados do usuário UMA VEZ
  useEffect(() => {
    let isMounted = true

    async function carregarDados() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && isMounted) {
          setUserId(user.id)

          // Verificar cache primeiro
          if (userDataCache.has(user.id)) {
            const cached = userDataCache.get(user.id)
            setFotoPerfil(cached.foto)
            setIsAdmin(cached.is_admin)
            return
          }

          // Se não estiver em cache, buscar
          const { data } = await supabase
            .from("usuarios")
            .select("foto, is_admin")
            .eq("id", user.id)
            .single()

          if (data && isMounted) {
            // Salvar em cache
            userDataCache.set(user.id, data)
            
            if (data.foto) setFotoPerfil(data.foto)
            if (data.is_admin) setIsAdmin(true)
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      }
    }

    carregarDados()

    return () => {
      isMounted = false
    }
  }, []) // Vazio, executa UMA VEZ

  // 📍 Memoizar função isActive
  const isActive = useCallback((path) => {
    if (pathname.startsWith(path)) {
      return "text-emerald-400 scale-105"
    }
    return "text-zinc-500 hover:text-zinc-300"
  }, [pathname])

  // 🎯 Memoizar função que tira drawer
  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false)
  }, [])

  // 🎯 Memoizar função que abre drawer
  const handleDrawerOpen = useCallback(() => {
    setIsDrawerOpen(true)
  }, [])

  // Avatar memoizado
  const AvatarImage = useMemo(() => {
    return (
      <img
        src={fotoPerfil || "/avatar-padrao.png"}
        alt="Perfil"
        className="w-full h-full object-cover rounded-full"
      />
    )
  }, [fotoPerfil])

  return (
    <>
      {/* MOBILE DRAWER */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} isAdmin={isAdmin} userId={userId} />

      {/* ADMIN QG FLUTUANTE */}
      {isAdmin && (
        <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[60]">
          <motion.div
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            whileTap={{ scale: 0.95, cursor: "grabbing" }}
            className="pointer-events-auto absolute bottom-24 right-6"
          >
            <Link href="/admin">
              <button className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-3.5 py-1.5 rounded-full flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/20 cursor-pointer backdrop-blur hover:bg-red-500/25 transition-all">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> PAINEL QG
              </button>
            </Link>
          </motion.div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-zinc-950/75 backdrop-blur-xl border-t border-zinc-900/60 px-4 py-2">
          <div className="max-w-md mx-auto flex justify-between items-center gap-2">

            {/* HOME/FEED */}
            <Link href="/feed" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/feed')}`}>
              <Home size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-inherit">Feed</span>
            </Link>

            {/* TREINO */}
            <Link href="/novo-treino" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/novo-treino')}`}>
              <Dumbbell size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-inherit">Treino</span>
            </Link>

            {/* RUN - DESTAQUE */}
            <Link href="/run" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/run')}`}>
              <motion.div
                animate={{ scale: isActive('/run') ? [1, 1.05, 1] : 1 }}
                transition={{ duration: 1.5, repeat: isActive('/run') ? Infinity : 0 }}
                className="text-emerald-400"
              >
                <Activity size={20} />
              </motion.div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-inherit">Run</span>
            </Link>

            {/* EXPLORAR */}
            <Link href="/explorar" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/explorar')}`}>
              <Search size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-inherit">Explorar</span>
            </Link>

            {/* PERFIL */}
            <Link href="/perfil" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/perfil')}`}>
              <div
                style={{ width: '22px', height: '22px' }}
                className={`rounded-full overflow-hidden border transition-all duration-300 flex items-center justify-center ${
                  pathname === '/perfil' ? 'border-emerald-400 shadow-md shadow-emerald-950/50' : 'border-zinc-700'
                }`}
              >
                {AvatarImage}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-inherit">Perfil</span>
            </Link>

            {/* MENU / MAIS */}
            <button
              onClick={handleDrawerOpen}
              className="flex flex-col items-center gap-1 transition-all duration-200 hover:text-emerald-400 text-zinc-500 cursor-pointer"
            >
              <Menu size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Menu</span>
            </button>

          </div>

          {/* Notificações - Posicionadas no topo */}
          {userId && (
            <div className="absolute -top-12 right-4">
              <NotificationBell userId={userId} />
            </div>
          )}
        </div>
        {/* Safe Area */}
        <div className="h-4 bg-zinc-950/75 backdrop-blur-xl"></div>
      </nav>
    </>
  )
}

// Memoizar o componente inteiro
export default memo(Navbar)