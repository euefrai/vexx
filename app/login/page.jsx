"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { validarLogin, MENSAGENS_SUCESSO } from "@/utils/validators"

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [erros, setErros] = useState({})

  async function fazerLogin(e) {
    e.preventDefault()

    // Validar inputs
    const validacao = validarLogin(email, senha)
    setErros(validacao.erros)

    if (!validacao.valido) {
      toast.error("Por favor, corrija os erros")
      return
    }

    setCarregando(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      })

      if (error) {
        toast.error(error.message || "Erro ao fazer login")
        setErros({ geral: error.message })
      } else {
        toast.success(MENSAGENS_SUCESSO.loginSucesso)
        // Login com sucesso! Manda para o Feed
        setTimeout(() => {
          router.push("/feed")
        }, 500)
      }
    } catch (err) {
      toast.error(err.message || "Erro desconhecido")
      setErros({ geral: err.message })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-xs text-center">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo</h1>
        <p className="text-zinc-500 mb-8">Faça login para ver seus treinos</p>
      </div>

      {erros.geral && (
        <div className="w-full max-w-xs bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-sm">
          {erros.geral}
        </div>
      )}

      <form onSubmit={fazerLogin} className="w-full max-w-xs flex flex-col">
        <div className="mb-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            className={`w-full bg-zinc-900 border p-3 rounded-xl focus:outline-none transition-colors ${
              erros.email
                ? "border-red-500 focus:border-red-600"
                : "border-zinc-800 focus:border-green-500"
            }`}
            onChange={(e) => {
              setEmail(e.target.value)
              setErros({ ...erros, email: "" }) // Limpar erro ao digitar
            }}
          />
          {erros.email && <p className="text-red-500 text-xs mt-1">{erros.email}</p>}
        </div>

        <div className="mb-6">
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            className={`w-full bg-zinc-900 border p-3 rounded-xl focus:outline-none transition-colors ${
              erros.senha
                ? "border-red-500 focus:border-red-600"
                : "border-zinc-800 focus:border-green-500"
            }`}
            onChange={(e) => {
              setSenha(e.target.value)
              setErros({ ...erros, senha: "" }) // Limpar erro ao digitar
            }}
          />
          {erros.senha && <p className="text-red-500 text-xs mt-1">{erros.senha}</p>}
        </div>

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
            onClick={() => router.push("/cadastro")}
          >
            Cadastre-se
          </span>
        </p>
      </div>
    </div>
  )
}