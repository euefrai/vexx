"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase" // Ajuste o caminho conforme seu projeto

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // 1. Carregar notificações iniciais
  useEffect(() => {
    if (!userId) return

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, from_user:profiles(username, avatar_url)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
    }

    fetchNotifications()

    // 2. Escutar em Realtime
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Adiciona a nova notificação no topo da lista
          setNotifications((prev) => [payload.new, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = async () => {
    if (unreadCount === 0) return
    
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (!error) setUnreadCount(0)
  }

  return { notifications, unreadCount, markAsRead }
}