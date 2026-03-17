"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Cadastro() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [salvando, setSalvando] = useState(false) // ✅ DEFINIDO PARA EVITAR O ERRO DE PRERENDER

  async function cadastrar() {
    if (!email || !senha) {
      alert("Preencha todos os campos!")
      return
    }

    setSalvando(true) // ✅ Trava o botão

    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: senha
      })

      if (error) throw error

      alert("Conta criada com sucesso! Verifique seu e-mail se necessário.")
      router.push("/login")
    } catch (error) {
      alert("Erro ao cadastrar: " + error.message)
    } finally {
      setSalvando(false) // ✅ Destrava o botão
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-6">
      
      <div className="w-full max-w-xs text-center mb-8">
        <h1 className="text-4xl font-black uppercase italic text-green-500 tracking-tighter mb-2">
          Elite Squad
        </h1>
        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
          Crie sua conta de guerreiro
        </p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="email"
          placeholder="E-mail"
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl focus:outline-none focus:border-green-500 transition-colors font-medium"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl focus:outline-none focus:border-green-500 transition-colors font-medium"
          onChange={(e) => setSenha(e.target.value)}
        />

        <button
          onClick={cadastrar}
          disabled={salvando} // ✅ AGORA A VARIÁVEL EXISTE!
          className={`mt-2 bg-green-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest transition-all ${
            salvando ? "opacity-50 cursor-not-allowed" : "hover:bg-green-400 active:scale-95 shadow-lg shadow-green-500/20"
          }`}
        >
          {salvando ? "PROCESSANDO..." : "CRIAR CONTA 🔥"}
        </button>

        <p className="text-center text-zinc-500 text-xs mt-6 font-bold uppercase">
          Já faz parte da elite?{" "}
          <span 
            className="text-green-500 cursor-pointer hover:underline"
            onClick={() => router.push("/login")}
          >
            Faça Login
          </span>
        </p>
      </div>
    </div>
  )
}