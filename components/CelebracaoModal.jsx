"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Share2, Home, Trophy, Target, Award, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";

// Confetti Animados Avançados (Cascata)
function Confetti({ isVisible }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isVisible) {
      const parts = Array.from({ length: 45 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 2.2 + Math.random() * 0.8,
        size: 4 + Math.random() * 6,
        color: ["#00ff9f", "#00e0ff", "#a855f7", "#ff3366", "#f59e0b"][Math.floor(Math.random() * 5)],
        rotate: Math.random() * 360,
      }));
      setParticles(parts);
    } else {
      setParticles([]);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded"
          style={{ 
            left: `${p.left}%`, 
            top: "-15px", 
            width: `${p.size}px`, 
            height: `${p.size}px`,
            backgroundColor: p.color
          }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 30 : 800,
            x: (Math.random() - 0.5) * 180,
            opacity: [1, 1, 0.4, 0],
            rotate: p.rotate + 360,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
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

  const handleCompartilhar = () => {
    setCompartilhando(true);
    setTimeout(() => {
      setCompartilhando(false);
      alert("Corrida e telemetria compartilhadas no feed do esquadrão! 🏆");
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Confetti isVisible={isOpen} />
          
          {/* Backdrop Escuro */}
          <motion.div
            className="fixed inset-0 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center z-[998] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Corpo do Modal Glassmorphic */}
            <motion.div
              className="bg-zinc-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl shadow-emerald-500/5 relative overflow-hidden text-center"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
            >
              {/* Brilho neon de fundo superior */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* 🏆 TROFÉU METÁLICO ROTATIVO (Framer Motion) */}
              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-zinc-950 shadow-2xl relative shadow-yellow-500/25 cursor-pointer"
                animate={{ 
                  rotateY: [0, 180, 360],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                whileHover={{ scale: 1.1 }}
              >
                {/* Glare effect */}
                <div className="absolute inset-1 bg-gradient-to-tr from-white/20 via-transparent to-transparent rounded-full pointer-events-none" />
                <Trophy size={42} className="text-zinc-950" fill="currentColor" />
              </motion.div>

              {/* Header com Animação Elástica */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-1 mb-6"
              >
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">TREINO CONCLUÍDO</h2>
                <p className="text-[10px] text-zinc-400 font-extrabold tracking-widest uppercase">VOCÊ CONQUISTOU A VITÓRIA</p>
              </motion.div>

              {/* Grid de Estatísticas Finais com Entradas Individuais */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                
                {/* Distância */}
                <motion.div
                  className="bg-zinc-950/50 border border-white/5 rounded-2xl p-3 text-center"
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Distância</p>
                  <p className="text-lg font-black text-emerald-400">{dados.distancia} <span className="text-[10px] font-bold text-zinc-500">km</span></p>
                </motion.div>

                {/* Tempo */}
                <motion.div
                  className="bg-zinc-950/50 border border-white/5 rounded-2xl p-3 text-center"
                  initial={{ x: 15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Tempo Total</p>
                  <p className="text-lg font-black text-blue-400">{dados.tempo}</p>
                </motion.div>

                {/* Calorias */}
                <motion.div
                  className="bg-zinc-950/50 border border-white/5 rounded-2xl p-3 text-center"
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Energia</p>
                  <p className="text-lg font-black text-orange-400">{dados.calorias} <span className="text-[10px] font-bold text-zinc-500">kcal</span></p>
                </motion.div>

                {/* Velocidade Média */}
                <motion.div
                  className="bg-zinc-950/50 border border-white/5 rounded-2xl p-3 text-center"
                  initial={{ x: 15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1">Vel. Média</p>
                  <p className="text-lg font-black text-purple-400">{dados.velocidadeMedia} <span className="text-[10px] font-bold text-zinc-500">km/h</span></p>
                </motion.div>
              </div>

              {/* Bloco de Premiação Gamificada (XP) */}
              <motion.div
                className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/25 rounded-2xl p-3.5 mb-6 text-center shadow-lg shadow-yellow-500/5 relative overflow-hidden"
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {/* Ícone de Raio Brilhante de fundo */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-10 text-yellow-400 pointer-events-none">
                  <ArrowUpRight size={50} />
                </div>
                
                <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-0.5">RECOMPENSA DE ATLETA</p>
                <p className="text-2xl font-black text-yellow-400 tracking-tight">+500 XP <span className="text-xs text-yellow-500 font-extrabold">GRAVADOS</span></p>
              </motion.div>

              {/* Botões de Ação */}
              <div className="space-y-2.5">
                <motion.button
                  onClick={handleCompartilhar}
                  disabled={compartilhando}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-zinc-950 font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-transform active:scale-98 text-xs uppercase tracking-wider"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Share2 className="w-4 h-4" />
                  {compartilhando ? "Sincronizando..." : "Compartilhar Rota"}
                </motion.button>

                <motion.button
                  onClick={onClose}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 border border-white/5 transition-transform active:scale-98 text-xs uppercase tracking-wider"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Home className="w-4 h-4" />
                  Retornar ao Home
                </motion.button>
              </div>

              {/* Rodapé / Dica */}
              <motion.p
                className="text-[9px] text-zinc-500 font-black uppercase tracking-wider mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                🔥 Mantenha a sequência para desbloquear patentes!
              </motion.p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
