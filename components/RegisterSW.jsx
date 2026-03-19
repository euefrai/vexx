"use client"

import { useEffect } from "react"

export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.hostname !== "localhost") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registrado com sucesso:", reg.scope))
        .catch((err) => console.error("Falha ao registrar SW:", err))
    }
  }, [])

  return null // Este componente não renderiza nada visualmente
}