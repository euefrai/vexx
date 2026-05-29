"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { X, LayoutDashboard, Flame, FlaskConical, MessageSquare, Users, Trophy, ShieldAlert } from "lucide-react"
import { usePathname } from "next/navigation"

export default function MobileDrawer({ isOpen, onClose, isAdmin, userId }) {
  const pathname = usePathname()

  const isActive = (path) => pathname.startsWith(path) ? "text-emerald-400 font-bold bg-emerald-500/5 border-l-2 border-emerald-500" : "text-zinc-400"

  const menuItems = [
    { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { href: "/curiosidades", icon: <Flame size={18} />, label: "Curiosidades" },
    { href: "/lab", icon: <FlaskConical size={18} />, label: "Laboratório" },
    { href: "/forum", icon: <MessageSquare size={18} />, label: "Fórum" },
    { href: "/social", icon: <Users size={18} />, label: "Social" },
    { href: "/ranking", icon: <Trophy size={18} />, label: "Ranking Semanal" },
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[40]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 140 }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-900/60 z-[50] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 p-5 border-b border-zinc-900/60 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md">
              <h2 className="text-md font-extrabold text-emerald-400 uppercase tracking-widest">VEXX SQUAD</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer text-zinc-400 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-1.5">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-zinc-900/60 font-semibold text-xs tracking-wider uppercase border border-transparent ${isActive(item.href)}`}
                >
                  <span className="flex items-center justify-center">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Divisor */}
              <div className="h-px bg-zinc-900/60 my-4" />

              {/* Admin */}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl transition-all duration-200 hover:bg-red-950/20 border border-transparent hover:border-red-900/20 flex items-center gap-3.5 text-red-400 font-bold uppercase text-xs tracking-wider"
                >
                  <span className="flex items-center justify-center"><ShieldAlert size={18} /></span>
                  <span>Painel Admin</span>
                </Link>
              )}

              {/* Sobre */}
              <div className="px-4 py-4 text-[10px] text-zinc-600 mt-6 pt-4 border-t border-zinc-900/60 font-medium">
                <p className="font-bold mb-1 text-zinc-500">VEXX ATHLETICS v2.0</p>
                <p>Consistência supera intensidade. © 2026</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
