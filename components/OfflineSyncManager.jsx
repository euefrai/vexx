"use client"

import { useEffect } from "react"
import { toast } from "react-toastify"
import { offlineManager } from "@/lib/offlineManager"
import { supabase } from "@/lib/supabase"

export default function OfflineSyncManager() {
  useEffect(() => {
    // Tratador de conexão restabelecida (Online)
    const handleOnline = () => {
      toast.dismiss("network-offline-warn")
      offlineManager.syncQueue()
    }

    // Tratador de conexão perdida (Offline)
    const handleOffline = () => {
      toast.warning(
        "Sinal de rede perdido. O modo offline tático está ativo para registrar seus treinos localmente.",
        {
          toastId: "network-offline-warn",
          autoClose: false,
          theme: "dark",
          closeOnClick: false,
          closeButton: false,
          draggable: false
        }
      )
    }

    // Registrar ouvintes no escopo global
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Estado inicial de carregamento da aplicação
    if (!navigator.onLine) {
      handleOffline()
    }

    // Ouvinte para mudanças no estado de autenticação (garante sessão carregada)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[OfflineSyncManager] Evento Auth: ${event}`)
      if (session && navigator.onLine) {
        console.log("[OfflineSyncManager] Sessão autenticada ativa. Tentando sincronizar...")
        offlineManager.syncQueue()
      }
    })

    // Limpeza de ouvintes
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  return null
}
