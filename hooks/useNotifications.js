"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const fetchNotifications = async () => {
      // Ajustado para buscar da sua tabela 'usuarios' e coluna 'foto'
      const { data } = await supabase
        .from("notifications")
        .select("*, from_user:usuarios(username, foto)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
    }

    fetchNotifications()

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