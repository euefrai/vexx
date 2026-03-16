"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Cadastro(){

 const router = useRouter()

 const [email,setEmail] = useState("")
 const [senha,setSenha] = useState("")

 async function cadastrar(){

  const { error } = await supabase.auth.signUp({
   email: email,
   password: senha
  })

  if(!error){
   alert("Conta criada com sucesso!")
   router.push("/login")
  }else{
   alert(error.message)
  }

 }

 return(

  <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-6">

   <h1 className="text-3xl mb-6">
    Criar conta
   </h1>

   <input
    type="email"
    placeholder="Email"
    className="bg-gray-900 p-3 rounded mb-3 w-full max-w-xs"
    onChange={(e)=>setEmail(e.target.value)}
   />

   <input
    type="password"
    placeholder="Senha"
    className="bg-gray-900 p-3 rounded mb-4 w-full max-w-xs"
    onChange={(e)=>setSenha(e.target.value)}
   />

   <button
    onClick={cadastrar}
    disabled={salvando}
    className="bg-green-500 text-black font-bold py-3 px-6 rounded-xl"
   >
    Criar conta
   </button>

  </div>

 )

}