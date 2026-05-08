"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function useAuth(){
 const [isAuthenticated, setIsAuthenticated] = useState(false)
 const [loading, setLoading] = useState(true)
 const router = useRouter()

 useEffect(()=>{

  verificar()

 },[])

 async function verificar(){

  const { data } = await supabase.auth.getUser()

  if(!data.user){
   router.push("/login")
   setIsAuthenticated(false)
  } else {
   setIsAuthenticated(true)
  }
  setLoading(false)

 }

 return { isAuthenticated, loading }

}