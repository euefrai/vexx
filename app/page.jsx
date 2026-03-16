"use client"

import { useRouter } from "next/navigation"

export default function Home(){

 const router = useRouter()

 function irLogin(){
  router.push("/login")
 }

 function irCadastro(){
  router.push("/cadastro")
 }

 return(

  <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-6">

   <h1 className="text-4xl font-bold mb-4 text-center">
    Bem-vindo ao Vexx 💪
   </h1>

   <p className="text-gray-400 text-center max-w-md mb-8">
    O Vexx é uma rede social fitness onde você pode registrar seus treinos,
    acompanhar sua evolução e compartilhar resultados com outras pessoas.
   </p>

   <div className="flex flex-col gap-4 w-full max-w-xs">

    <button
     onClick={irLogin}
     className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl"
    >
     Entrar
    </button>

    <button
     onClick={irCadastro}
     className="border border-gray-700 py-3 rounded-xl"
    >
     Criar conta
    </button>

   </div>

   <p className="text-gray-600 text-sm mt-10 text-center">
    Registre seus treinos. Supere seus limites. Evolua todos os dias.
   </p>

  </div>

 )

}