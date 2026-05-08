"use client"

import React, { useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ToastContext } from "@/context/ToastContext"

export function ToastContainer() {
  const context = useContext(ToastContext)

  if (!context) {
    return null
  }

  const { toasts, removeToast } = context

  const getColors = (type) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-500",
          border: "border-green-400",
          icon: "✓",
        }
      case "error":
        return {
          bg: "bg-red-500",
          border: "border-red-400",
          icon: "✕",
        }
      case "warning":
        return {
          bg: "bg-yellow-500",
          border: "border-yellow-400",
          icon: "⚠",
        }
      case "info":
      default:
        return {
          bg: "bg-blue-500",
          border: "border-blue-400",
          icon: "ℹ",
        }
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const colors = getColors(toast.type)
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, x: 400 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ duration: 0.3 }}
              className={`${colors.bg} text-white px-4 py-3 rounded-lg shadow-lg mb-2 flex items-center gap-3 pointer-events-auto cursor-pointer`}
              onClick={() => removeToast(toast.id)}
            >
              <span className="text-lg font-bold">{colors.icon}</span>
              <span>{toast.message}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeToast(toast.id)
                }}
                className="ml-2 text-white hover:opacity-70"
              >
                ×
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
