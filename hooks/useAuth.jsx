"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function useAuth(){

 const router = useRouter()

 useEffect(()=>{

  verificar()

 },[])

 async function verificar(){

  const { data } = await supabase.auth.getUser()

  if(!data.user){
   router.push("/login")
  }

 }

}