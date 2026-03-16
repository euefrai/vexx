"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function BotaoFlutuante(){

 const router = useRouter()

 return(

 <motion.button
  whileTap={{scale:0.9}}
  whileHover={{scale:1.1}}
  onClick={()=>router.push("/novo-treino")}
  className="fixed bottom-20 right-5 bg-green-400 text-black w-14 h-14 rounded-full text-3xl shadow-xl"
 >
  +
 </motion.button>

 )

}