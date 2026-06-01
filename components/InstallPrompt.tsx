"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // 1. Detectar se já está em modo PWA instalado (Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                         || (navigator as any).standalone;
    
    if (isStandalone) return; // Se já estiver instalado, não faz nada

    // 2. Detectar se é iOS (Safari)
    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(checkIOS)

    if (checkIOS) {
      // Mostra o prompt com instruções específicas para iOS após 5 segundos
      const timer = setTimeout(() => {
        setShowPrompt(true)
        setShowIOSInstructions(true)
      }, 5000)
      return () => clearTimeout(timer)
    } else {
      // 3. Ouvir evento padrão do Chrome/Android/Desktop
      const handler = (e: any) => {
        e.preventDefault()
        setDeferredPrompt(e)
        // Mostra o alerta após 3 segundos
        setTimeout(() => setShowPrompt(true), 3000)
      }

      window.addEventListener("beforeinstallprompt", handler)
      return () => window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === "accepted") {
      // Usuário aceitou a instalação
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
          {showIOSInstructions ? (
            // Layout de instruções táticas para iOS / iPhone
            <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-5 shadow-[0_0_30px_rgba(168,85,247,0.25)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0">
                    🍎
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase italic text-white leading-none">VEXX SQUAD NO IOS</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Instale o aplicativo no seu iPhone</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPrompt(false)}
                  className="text-zinc-500 text-xs font-bold uppercase hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-black/40 border border-zinc-850 rounded-2xl p-4 text-[10px] uppercase font-bold text-zinc-300 leading-relaxed space-y-2">
                <p className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 text-[8px] font-black">1</span>
                  Toque no botão de <span className="text-purple-400 font-black">Compartilhar</span> na barra do Safari (ícone <span className="inline-block px-1 bg-zinc-800 rounded font-sans text-xs">⎋</span> ou quadrado com seta para cima).
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 text-[8px] font-black">2</span>
                  Role para baixo e selecione a opção <span className="text-purple-400 font-black">"Adicionar à Tela de Início"</span>.
                </p>
              </div>
            </div>
          ) : (
            // Layout padrão do Android/Windows/Chrome
            <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5 shadow-[0_0_30px_rgba(34,197,94,0.25)] flex items-center justify-between gap-4">
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
                  className="bg-green-500 text-black text-[10px] font-black uppercase px-4 py-2 rounded-xl active:scale-95 transition-all cursor-pointer font-extrabold"
                >
                  Instalar
                </button>
                <button 
                  onClick={() => setShowPrompt(false)}
                  className="text-zinc-500 text-[9px] font-bold uppercase hover:text-white cursor-pointer"
                >
                  Agora não
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}