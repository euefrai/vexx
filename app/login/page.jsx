"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function fazerLogin(e) {
    e.preventDefault() // Previne que a página recarregue
    
    if (!email || !senha) {
      alert("Por favor, preencha todos os campos.")
      return
    }

    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    })

    if (error) {
      alert("Erro ao entrar: " + error.message)
    } else {
      // Login com sucesso! Manda para o Feed
      router.push("/feed")
    }

    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-6">
      
      <div className="w-full max-w-xs text-center">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo</h1>
        <p className="text-zinc-500 mb-8">Faça login para ver seus treinos</p>
      </div>

      <form onSubmit={fazerLogin} className="w-full max-w-xs flex flex-col">
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl mb-3 focus:outline-none focus:border-green-500 transition-colors"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl mb-6 focus:outline-none focus:border-green-500 transition-colors"
          onChange={(e) => setSenha(e.target.value)}
        />

        <button
          type="submit"
          disabled={carregando}
          className={`bg-green-500 text-black font-bold py-3 rounded-xl transition-all ${
            carregando ? "opacity-50 cursor-not-allowed" : "hover:bg-green-400 active:scale-95"
          }`}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-zinc-400 text-sm">
          Ainda não tem uma conta?{" "}
          <span 
            className="text-green-500 font-semibold cursor-pointer hover:underline"
            onClick={() => router.push("/cadastro")} // Ajuste o caminho se sua pasta de cadastro for diferente
          >
            Cadastre-se
          </span>
        </p>
      </div>

    </div>
  )
}