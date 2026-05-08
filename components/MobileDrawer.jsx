"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { X } from "lucide-react"
import { usePathname } from "next/navigation"

export default function MobileDrawer({ isOpen, onClose, isAdmin, userId }) {
  const pathname = usePathname()

  const isActive = (path) => pathname.startsWith(path) ? "text-green-400 font-black" : "text-zinc-300"

  const menuItems = [
    { href: "/dashboard", icon: "📊", label: "Dashboard" },
    { href: "/curiosidades", icon: "📈", label: "Curiosidades" },
    { href: "/lab", icon: "🧪", label: "Laboratório" },
    { href: "/forum", icon: "💬", label: "Fórum" },
    { href: "/social", icon: "📱", label: "Social" },
    { href: "/ranking", icon: "🏆", label: "Ranking Semanal" },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[40]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 z-[50] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/80 backdrop-blur">
              <h2 className="text-lg font-black text-green-400 italic">VEXX SQUAD</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`block px-4 py-3 rounded-lg transition-all duration-200 hover:bg-zinc-800 flex items-center gap-3 ${isActive(item.href)}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm uppercase font-bold tracking-tight">{item.label}</span>
                </Link>
              ))}

              {/* Divisor */}
              <div className="h-px bg-zinc-800 my-4" />

              {/* Admin */}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="px-4 py-3 rounded-lg transition-all duration-200 hover:bg-red-900/30 flex items-center gap-3 text-red-400 font-black uppercase text-sm"
                >
                  <span className="text-lg">🚨</span>
                  <span>Painel Admin</span>
                </Link>
              )}

              {/* Sobre */}
              <div className="px-4 py-4 text-xs text-zinc-500 mt-4 pt-4 border-t border-zinc-800">
                <p className="font-bold mb-1">VEXX SQUAD v2.0</p>
                <p>"Treino difícil, combate fácil." © 2026</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
