// components/AchievementNotification.jsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BADGES_CATALOG } from "@/hooks/useGamificacao";

export function AchievementNotification({ badgeId, onClose }) {
  const badge = BADGES_CATALOG[badgeId];

  if (!badge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -80, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -60, scale: 0.95 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] w-full max-w-xs px-4"
      >
        <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-zinc-950 border-2 border-yellow-500/40 backdrop-blur-md rounded-2xl p-4.5 shadow-2xl flex items-center gap-3.5 relative overflow-hidden">
          {/* Brilho sutil */}
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />
          
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="text-4xl select-none shrink-0"
          >
            {badge.icon}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-yellow-400 uppercase tracking-widest leading-none mb-1">Nova Conquista!</p>
            <p className="font-extrabold text-white text-xs uppercase tracking-wide truncate">{badge.nome}</p>
            <p className="text-[9px] text-zinc-400 font-medium leading-tight mt-1 line-clamp-2">{badge.descricao}</p>
            <p className="text-[9px] text-yellow-500 font-extrabold uppercase tracking-wider mt-1.5 flex items-center gap-1">
              <span>★</span> +{badge.reward} XP
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-650 hover:text-white transition duration-200 p-1 rounded-full text-xs"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
