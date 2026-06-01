import { supabase } from "./supabase"
import { toast } from "react-toastify"

const QUEUE_KEY = "vexx_offline_queue"

export const offlineManager = {
  isSyncing: false,

  // Retorna todos os itens na fila
  getQueue() {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]")
    } catch (e) {
      console.error("Erro ao ler fila offline:", e)
      return []
    }
  },

  // Salva a fila no LocalStorage
  saveQueue(queue) {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    } catch (e) {
      console.error("Erro ao salvar fila offline:", e)
    }
  },

  // Limpa a fila
  clearQueue() {
    this.saveQueue([])
  },

  // Adiciona uma nova mutação à fila
  addMutation(table, action, payload, filters = null) {
    const queue = this.getQueue()
    const newMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      table,
      action,
      payload,
      filters,
      timestamp: new Date().toISOString()
    }
    queue.push(newMutation)
    this.saveQueue(queue)
    console.log(`[OfflineManager] Operação enfileirada no local: ${action} em ${table}`, newMutation)
    
    // Exibe notificação de salvamento offline sutil
    toast.info("Ação guardada localmente. Será sincronizada ao restabelecer sinal.", {
      toastId: "offline-mutation-warn",
      autoClose: 4000,
      theme: "dark"
    })
    
    return newMutation
  },

  // Sincroniza todas as mutações pendentes com o Supabase de forma sequencial
  async syncQueue() {
    if (typeof window === "undefined") return
    if (!navigator.onLine) return
    if (this.isSyncing) {
      console.log("[OfflineManager] Sincronização já em andamento. Ignorando chamada duplicada.")
      return
    }

    const queue = this.getQueue()
    if (queue.length === 0) return

    // Garantir que a sessão do Supabase está carregada e ativa antes de sincronizar
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn("[OfflineManager] Sessão ativa não localizada no Supabase. Aguardando login/restauração da sessão para sincronizar.")
      return
    }

    this.isSyncing = true
    console.log(`[OfflineManager] Iniciando sincronização de ${queue.length} operações pendentes...`)
    
    const toastId = toast.loading("Sinal restabelecido! Sincronizando dados táticos com o arsenal...", {
      theme: "dark"
    })

    let successCount = 0
    let failedCount = 0
    const remainingQueue = []

    try {
      for (const item of queue) {
        try {
          let query = supabase.from(item.table)

          if (item.action === "insert") {
            query = query.insert(item.payload)
          } else if (item.action === "delete") {
            query = query.delete()
            if (item.filters) {
              item.filters.forEach(f => {
                if (f.type === "eq") query = query.eq(f.column, f.value)
                if (f.type === "gte") query = query.gte(f.column, f.value)
              })
            }
          } else if (item.action === "update") {
            query = query.update(item.payload)
            if (item.filters) {
              item.filters.forEach(f => {
                if (f.type === "eq") query = query.eq(f.column, f.value)
              })
            }
          }

          const { error } = await query

          if (error) {
            console.error(`[OfflineManager] Erro da API ao sincronizar mutação ${item.id}:`, error)
            
            const isNetworkError = error.message?.includes("Failed to fetch") || error.status === 0 || error.message?.includes("network")
            const isAuthError = error.status === 401 || error.status === 403 || error.message?.toLowerCase().includes("permission") || error.message?.toLowerCase().includes("unauthorized") || error.message?.toLowerCase().includes("jwt")

            if (isNetworkError || isAuthError) {
              console.log(`[OfflineManager] Mutação ${item.id} retida na fila devido a erro de rede ou autenticação temporária (Status: ${error.status}).`)
              remainingQueue.push(item)
              failedCount++
            } else {
              // Se for erro permanente de regra de negócio (ex: coluna inválida, tipo de dados errado), descartamos para não travar a fila
              console.warn(`[OfflineManager] Descartando mutação inválida ${item.id} por erro permanente.`)
              successCount++
            }
          } else {
            console.log(`[OfflineManager] Mutação ${item.id} sincronizada com sucesso.`)
            successCount++
          }
        } catch (err) {
          console.error(`[OfflineManager] Falha ao processar mutação ${item.id}:`, err)
          remainingQueue.push(item)
          failedCount++
        }
      }

      this.saveQueue(remainingQueue)

      if (successCount > 0 && failedCount === 0) {
        toast.update(toastId, {
          render: `Arsenal atualizado! ${successCount} operações sincronizadas com sucesso.`,
          type: "success",
          isLoading: false,
          autoClose: 4000
        })
        window.dispatchEvent(new CustomEvent("vexx_offline_sync_complete"))
      } else if (successCount > 0 && failedCount > 0) {
        toast.update(toastId, {
          render: `Sincronização parcial: ${successCount} salvas, ${failedCount} pendentes por oscilação de rede ou autenticação.`,
          type: "warning",
          isLoading: false,
          autoClose: 5000
        })
        window.dispatchEvent(new CustomEvent("vexx_offline_sync_complete"))
      } else {
        toast.dismiss(toastId)
      }
    } finally {
      this.isSyncing = false
    }
  }
}
