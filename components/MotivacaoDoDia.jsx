"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const MOTIVACOES = [
  "Treino difícil, combate fácil 💪",
  "Seu corpo é um templo, cultive-o 🏛️",
  "Dor de hoje é ganho de amanhã 🔥",
  "A consistência bate o talento ⚡",
  "Você é capaz de mais do que pensa 🚀",
  "Cada corrida te aproxima da meta 🏃",
  "Campeões não são feitos, são forjados ⚔️",
  "Suor, dedicação, sucesso 💦",
  "Ninguém se motiva sozinho 👥",
  "Comece agora, mude amanhã 🎯",
  "Seu melhor está a frente 🌟",
  "Acredite que é possível 💫",
];

export function MotivacaoDoDia() {
  const [motivacao, setMotivacao] = useState("");

  useEffect(() => {
    const hoje = new Date().getDate();
    const indice = hoje % MOTIVACOES.length;
    setMotivacao(MOTIVACOES[indice]);
  }, []);

  if (!motivacao) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-lg p-3 text-center"
    >
      <p className="text-xs text-green-300 font-bold italic">💭 Motivação do Dia</p>
      <p className="text-sm font-black text-green-400 mt-1">{motivacao}</p>
    </motion.div>
  );
}
