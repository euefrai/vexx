"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BADGES_DESBLOQUEAVEIS = {
  "primeira-corrida": {
    icon: "🏃",
    nome: "Debutante",
    descricao: "Completar primeira corrida",
  },
  "streak-7": {
    icon: "🔥",
    nome: "Semana de Fogo",
    descricao: "7 dias seguidos com atividade",
  },
  "km-100": {
    icon: "🚀",
    nome: "Centistas",
    descricao: "Completar 100 km totais",
  },
  "treino-10": {
    icon: "💪",
    nome: "Musculação",
    descricao: "Completar 10 treinos",
  },
};

export function AchievementNotification({ badgeId, onClose }) {
  const badge = BADGES_DESBLOQUEAVEIS[badgeId];

  if (!badge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.8 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
      >
        <div className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/50 rounded-lg p-4 shadow-2xl max-w-xs">
          <div className="text-center">
            <motion.p
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-5xl mb-2"
            >
              {badge.icon}
            </motion.p>
            <p className="font-bold text-yellow-300 text-lg">Nova Conquista!</p>
            <p className="font-black text-white text-2xl mt-1">{badge.nome}</p>
            <p className="text-sm text-gray-300 mt-2">{badge.descricao}</p>
            <motion.p
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-3xl mt-3">
              ✨
            </motion.p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
