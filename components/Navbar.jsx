"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()

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
            <span className="text-[10px] font-semibold">Feed</span>
          </Link>

          {/* K.O */}
          <Link href="/ko" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/ko')}`}>
            <span className="text-xl">🔥</span>
            <span className="text-[10px] font-semibold">K.O</span>
          </Link>

          {/* BOTÃO CENTRAL (POST) */}
          <Link
            href="/novo-ko"
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-black text-2xl font-bold shadow-lg shadow-green-500/30 transition-transform active:scale-90"
          >
            +
          </Link>

          {/* Explorar (IGUAL INSTAGRAM) */}
          <Link href="/explorar" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/explorar')}`}>
            <span className="text-xl">🔍</span>
            <span className="text-[10px] font-semibold">Explorar</span>
          </Link>

          {/* Treino */}
          <Link href="/novo-treino" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/novo-treino')}`}>
            <span className="text-xl">🏋️</span>
            <span className="text-[10px] font-semibold">Treino</span>
          </Link>

          {/* Perfil */}
          <Link href="/perfil" className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive('/perfil')}`}>
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-semibold">Perfil</span>
          </Link>

          

        </div>
      </div>

      <div className="h-4 bg-zinc-950/80 backdrop-blur-xl"></div>
    </nav>
  )
}