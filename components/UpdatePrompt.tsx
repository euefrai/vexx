"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    // Verifica se o Service Worker tem uma atualização pendente
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const sw = navigator.serviceWorker;

      sw.addEventListener("controllerchange", () => {
        // Recarrega a página automaticamente quando o novo SW assume o controle
        window.location.reload();
      });

      // Checa se já existe um worker esperando (waiting)
      sw.getRegistration().then((reg) => {
        if (reg?.waiting) {
          setShowUpdate(true);
        }

        // Escuta por novas atualizações encontradas enquanto o app está aberto
        reg?.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });
      });
    }
  }, [])

  const handleUpdate = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        // Envia mensagem para o Service Worker pular a espera e ativar
        reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
      });
    }
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-6 left-4 right-4 z-[110]"
        >
          <div className="bg-green-500 text-black rounded-2xl p-4 shadow-[0_10px_40px_rgba(34,197,94,0.4)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🚀</span>
              <div>
                <p className="text-[10px] font-black uppercase italic leading-none">Nova versão disponível</p>
                <p className="text-[9px] font-bold uppercase opacity-80 mt-1">Atualize para as últimas melhorias</p>
              </div>
            </div>
            
            <button 
              onClick={handleUpdate}
              className="bg-black text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl active:scale-95 transition-all shadow-lg"
            >
              Atualizar Agora
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}