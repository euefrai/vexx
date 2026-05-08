"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Share2, Home, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

// Confetti component
function Confetti({ isVisible }) {
  const confettis = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2.5 + Math.random() * 0.5,
  }));

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none">
      {confettis.map((conf) => (
        <motion.div
          key={conf.id}
          className="absolute w-2 h-2 bg-gradient-to-br from-green-400 to-cyan-400 rounded-full"
          style={{ left: `${conf.left}%`, top: "-10px" }}
          animate={{
            y: window.innerHeight + 20,
            x: (Math.random() - 0.5) * 200,
            opacity: [1, 1, 0],
            rotate: 360,
          }}
          transition={{
            duration: conf.duration,
            delay: conf.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

export function CelebracaoModal({
  isOpen,
  onClose,
  dados = {
    distancia: 5,
    tempo: "30:45",
    calorias: 450,
    velocidadeMedia: 9.8,
  },
}) {
  const [compartilhando, setCompartilhando] = useState(false);

  const handleCompartilhar = async () => {
    setCompartilhando(true);
    // Aqui você pode integrar com social/compartilhamento
    setTimeout(() => {
      setCompartilhando(false);
      alert("Corrida compartilhada com sucesso! 🎉");
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Confetti isVisible={isOpen} />
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-green-500/50 rounded-2xl p-6 max-w-sm w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20 }}
            >
              {/* Header animado */}
              <motion.div
                className="text-center mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-6xl mb-2">🏆</p>
                <h2 className="text-2xl font-bold text-green-400">Parabéns!</h2>
                <p className="text-gray-300 text-sm mt-1">Você completou uma corrida incrível!</p>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.div
                  className="bg-green-500/20 rounded-lg p-3 text-center border border-green-500/30"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-xs text-gray-400">Distância</p>
                  <p className="text-xl font-bold text-green-400">{dados.distancia} km</p>
                </motion.div>
                <motion.div
                  className="bg-cyan-500/20 rounded-lg p-3 text-center border border-cyan-500/30"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-xs text-gray-400">Tempo</p>
                  <p className="text-xl font-bold text-cyan-400">{dados.tempo}</p>
                </motion.div>
                <motion.div
                  className="bg-orange-500/20 rounded-lg p-3 text-center border border-orange-500/30"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs text-gray-400">Calorias</p>
                  <p className="text-xl font-bold text-orange-400">{dados.calorias}</p>
                </motion.div>
                <motion.div
                  className="bg-pink-500/20 rounded-lg p-3 text-center border border-pink-500/30"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs text-gray-400">Vel. Média</p>
                  <p className="text-xl font-bold text-pink-400">{dados.velocidadeMedia} km/h</p>
                </motion.div>
              </div>

              {/* Reward */}
              <motion.div
                className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 mb-6 border border-yellow-500/30 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs text-gray-300 mb-1">Você ganhou</p>
                <p className="text-3xl font-bold text-yellow-400">+500 XP 🎉</p>
              </motion.div>

              {/* Botões */}
              <div className="space-y-3">
                <motion.button
                  onClick={handleCompartilhar}
                  disabled={compartilhando}
                  className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Share2 className="w-5 h-5" />
                  {compartilhando ? "Compartilhando..." : "Compartilhar com amigos"}
                </motion.button>

                <motion.button
                  onClick={onClose}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Home className="w-5 h-5" />
                  Voltar ao Home
                </motion.button>
              </div>

              {/* Dica */}
              <motion.p
                className="text-xs text-gray-500 text-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                ✨ Mantém a consistência para desbloquear badges!
              </motion.p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
