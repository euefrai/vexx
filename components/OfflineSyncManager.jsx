"use client"

import { useEffect } from "react"
import { toast } from "react-toastify"
import { offlineManager } from "@/lib/offlineManager"

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
    } else {
      // Tentar sincronizar qualquer resquício na fila ao carregar a página
      offlineManager.syncQueue()
    }

    // Limpeza de ouvintes
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return null
}
