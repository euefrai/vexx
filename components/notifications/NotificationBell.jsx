"use client"
import { useState } from "react"
import { Bell } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNotifications } from "@/hooks/useNotifications"
import NotificationItem from "./NotificationItem"

export default function NotificationBell({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead } = useNotifications(userId)

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) markAsRead()
  }

  return (
    <div className="relative">
      {/* Ícone do Sino */}
      <button onClick={handleToggle} className="relative p-2 text-zinc-400 hover:text-green-500 transition-colors active:scale-90">
        <Bell size={24} strokeWidth={2.5} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-black"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-green-500/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md">
                <h3 className="text-[10px] font-black uppercase italic text-green-500 tracking-tighter">Relatórios de Campo</h3>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-black/20">
                {notifications.length > 0 ? (
                  notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
                ) : (
                  <div className="p-8 text-center text-[10px] text-zinc-500 font-bold uppercase italic">
                    Nenhuma atividade recente na squad...
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}