"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function useAuth(requireAuth = true) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const verificarAutenticacao = async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser()

        if (!isMounted) return

        if (authError) {
          setError(authError.message)
          setUser(null)
          if (requireAuth) {
            router.push("/login")
          }
          return
        }

        if (!data?.user) {
          setUser(null)
          if (requireAuth) {
            router.push("/login")
          }
          return
        }

        setUser(data.user)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        setError(err.message)
        if (requireAuth) {
          router.push("/login")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    verificarAutenticacao()

    return () => {
      isMounted = false
    }
  }, [router, requireAuth])

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push("/")
    } catch (err) {
      setError(err.message)
    }
  }

  return {
    user,
    loading,
    error,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.user_metadata?.role === "admin",
  }
}

