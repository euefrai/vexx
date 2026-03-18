"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Mostra o alerta após 3 segundos para não ser invasivo logo de cara
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === "accepted") {
      console.log("Usuário aceitou a instalação")
    }
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[100]"
        >
          <div className="bg-zinc-900 border-2 border-green-500 rounded-3xl p-5 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0">
                ⚡
              </div>
              <div>
                <p className="text-xs font-black uppercase italic text-white leading-none">VEXX SQUAD APP</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Instale para acesso rápido e offline</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleInstall}
                className="bg-green-500 text-black text-[10px] font-black uppercase px-4 py-2 rounded-xl active:scale-95 transition-all"
              >
                Instalar
              </button>
              <button 
                onClick={() => setShowPrompt(false)}
                className="text-zinc-600 text-[9px] font-bold uppercase hover:text-white"
              >
                Agora não
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}