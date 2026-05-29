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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center px-6 fade-in relative">
      {/* Efeito de luz de fundo sutil */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xs text-center z-10">
        <h1 className="text-3xl font-extrabold uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">Bem-vindo</h1>
        <p className="text-zinc-400 text-sm font-medium mb-8">Faça login para ver seus treinos</p>
      </div>

      {erros.geral && (
        <div className="w-full max-w-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-4 text-xs font-semibold z-10">
          {erros.geral}
        </div>
      )}

      <form onSubmit={fazerLogin} className="w-full max-w-xs flex flex-col z-10">
        <div className="mb-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            className={`w-full bg-zinc-900/50 border p-3.5 rounded-xl text-sm font-medium focus:outline-none transition-all duration-300 backdrop-blur-md placeholder:text-zinc-500 ${
              erros.email
                ? "border-red-500/30 focus:border-red-500 bg-red-500/5"
                : "border-zinc-800 focus:border-emerald-500/70 focus:bg-zinc-900"
            }`}
            onChange={(e) => {
              setEmail(e.target.value)
              setErros({ ...erros, email: "" }) // Limpar erro ao digitar
            }}
          />
          {erros.email && <p className="text-red-400 text-xs mt-1 font-semibold pl-1">{erros.email}</p>}
        </div>

        <div className="mb-6">
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            className={`w-full bg-zinc-900/50 border p-3.5 rounded-xl text-sm font-medium focus:outline-none transition-all duration-300 backdrop-blur-md placeholder:text-zinc-500 ${
              erros.senha
                ? "border-red-500/30 focus:border-red-500 bg-red-500/5"
                : "border-zinc-800 focus:border-emerald-500/70 focus:bg-zinc-900"
            }`}
            onChange={(e) => {
              setSenha(e.target.value)
              setErros({ ...erros, senha: "" }) // Limpar erro ao digitar
            }}
          />
          {erros.senha && <p className="text-red-400 text-xs mt-1 font-semibold pl-1">{erros.senha}</p>}
        </div>

        <button
          type="submit"
          disabled={carregando}
          className={`bg-emerald-500 text-zinc-950 font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all duration-300 cursor-pointer ${
            carregando ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/20 hover:-translate-y-0.5 active:scale-98"
          }`}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-8 text-center z-10">
        <p className="text-zinc-400 text-sm font-medium">
          Ainda não tem uma conta?{" "}
          <span
            className="text-emerald-400 font-bold cursor-pointer hover:underline"
            onClick={() => router.push("/cadastro")}
          >
            Cadastre-se
          </span>
        </p>
      </div>
    </div>
  )
}