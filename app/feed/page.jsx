"use client"


import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import TreinoCard from "@/components/TreinoCard"
import Navbar from "@/components/Navbar"
import BotaoFlutuante from "@/components/BotaoFlutuante"
import useAuth from "@/hooks/useAuth"

export default function Feed(){

 const [treinos,setTreinos] = useState([])
 const [loading,setLoading] = useState(true)

 useEffect(()=>{
  carregar()
 },[])

 async function carregar(){

  const { data, error } = await supabase
   .from("treinos")
   .select("*")
   .order("created_at",{ascending:false})

  if(error){
   console.log("Erro ao carregar treinos:", error)
  } else {
   setTreinos(data)
  }

  setLoading(false)
 }

 return(

  <>
   <div className="max-w-md mx-auto p-4 pb-24">

    <h1 className="text-white text-2xl mb-6">
     💪 Feed de Treinos
    </h1>

    {loading && (
     <p className="text-zinc-400">
      carregando treinos...
     </p>
    )}

    {!loading && treinos.length === 0 && (
     <p className="text-zinc-400">
      nenhum treino postado ainda.
     </p>
    )}

    {treinos?.map(t => (
     <TreinoCard key={t.id} treino={t}/>
    ))}

   </div>

   <BotaoFlutuante/>
   <Navbar/>

  </>
 )
}