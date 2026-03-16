"use client"

import { motion } from "framer-motion"
import { useState,useEffect } from "react"
import { supabase } from "../lib/supabase"

export default function TreinoCard({treino}){

 const [likes,setLikes] = useState(0)

 useEffect(()=>{
  carregarLikes()
 },[])

 async function carregarLikes(){

  const { data } = await supabase
  .from("likes")
  .select("*")
  .eq("treino_id",treino.id)

  setLikes(data.length)
 }

 async function curtir(){

  const user = await supabase.auth.getUser()

  await supabase.from("likes").insert({
   treino_id:treino.id,
   user_id:user.data.user.id
  })

  setLikes(likes+1)
 }

 return(

 <motion.div
 initial={{opacity:0,y:20}}
 animate={{opacity:1,y:0}}
 transition={{duration:0.4}}
 whileHover={{scale:1.02}}
 className="bg-zinc-900 p-5 rounded-2xl mb-4 shadow-lg border border-zinc-800"
 >

 <h2 className="text-green-400 text-lg font-semibold">
 {treino.titulo}
 </h2>

 <p className="text-zinc-300 mt-2 whitespace-pre-line">
 {treino.descricao}
 </p>

 <div className="flex items-center justify-between mt-4">

  <button
  onClick={curtir}
  className="text-red-400 hover:scale-110 transition"
  >
  ❤️ {likes}
  </button>

 </div>

 </motion.div>

 )
}