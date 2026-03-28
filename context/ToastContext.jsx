"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

// Contexto para gerenciar toasts
const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now()
    const toast = { id, message, type }

    setToasts((prev) => [...prev, toast])

    // Auto-remove após duração
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

// Hook para usar toasts
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider")
  }

  return {
    success: (message, duration) => context.addToast(message, "success", duration),
    error: (message, duration) => context.addToast(message, "error", duration),
    info: (message, duration) => context.addToast(message, "info", duration),
    warning: (message, duration) => context.addToast(message, "warning", duration),
    remove: context.removeToast,
  }
}
