"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

export default function Cadastro() {
  const router = useRouter()

  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [senhaConfirm, setSenhaConfirm] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState({})

  async function cadastrar(e) {
    e.preventDefault()

    if (!nome || !email || !senha || !senhaConfirm) {
      toast.error("Preencha todos os campos!")
      return
    }

    if (senha !== senhaConfirm) {
      toast.error("As senhas não coincidem")
      setErros({ senhaConfirm: "As senhas devem ser iguais" })
      return
    }

    setSalvando(true)

    try {
      const { data: usuarioExistente } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase())
        .single()

      if (usuarioExistente) {
        toast.error("Este email já está registrado")
        setErros({ email: "Email já existe" })
        setSalvando(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: {
            nome: nome.trim(),
          },
        },
      })

      if (error) {
        toast.error(error.message || "Erro ao cadastrar")
        setErros({ geral: error.message })
        setSalvando(false)
        return
      }

      toast.success("Conta criada com sucesso! Verifique seu e-mail se necessário.")
      router.push("/login")
    } catch (error) {
      toast.error("Erro ao cadastrar: " + error.message)
      setErros({ geral: error.message })
    } finally {
      setSalvando(false)
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

      {erros.geral && (
        <div className="w-full max-w-xs bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-sm">
          {erros.geral}
        </div>
      )}

      <form onSubmit={cadastrar} className="w-full max-w-xs flex flex-col gap-3">
        <div>
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            className={`w-full bg-zinc-900 border p-4 rounded-2xl focus:outline-none transition-colors font-medium ${
              erros.nome
                ? "border-red-500 focus:border-red-600"
                : "border-zinc-800 focus:border-green-500"
            }`}
            onChange={(e) => {
              setNome(e.target.value)
              setErros({ ...erros, nome: "" })
            }}
          />
          {erros.nome && <p className="text-red-500 text-xs mt-1">{erros.nome}</p>}
        </div>

        <div>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            className={`w-full bg-zinc-900 border p-4 rounded-2xl focus:outline-none transition-colors font-medium ${
              erros.email
                ? "border-red-500 focus:border-red-600"
                : "border-zinc-800 focus:border-green-500"
            }`}
            onChange={(e) => {
              setEmail(e.target.value)
              setErros({ ...erros, email: "" })
            }}
          />
          {erros.email && <p className="text-red-500 text-xs mt-1">{erros.email}</p>}
        </div>

        <div>
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            className={`w-full bg-zinc-900 border p-4 rounded-2xl focus:outline-none transition-colors font-medium ${
              erros.senha
                ? "border-red-500 focus:border-red-600"
                : "border-zinc-800 focus:border-green-500"
            }`}
            onChange={(e) => {
              setSenha(e.target.value)
              setErros({ ...erros, senha: "" })
            }}
          />
          {erros.senha && <p className="text-red-500 text-xs mt-1">{erros.senha}</p>}
        </div>

        <div>
          <input
            type="password"
            placeholder="Confirmar senha"
            value={senhaConfirm}
            className={`w-full bg-zinc-900 border p-4 rounded-2xl focus:outline-none transition-colors font-medium ${
              erros.senhaConfirm
                ? "border-red-500 focus:border-red-600"
                : "border-zinc-800 focus:border-green-500"
            }`}
            onChange={(e) => {
              setSenhaConfirm(e.target.value)
              setErros({ ...erros, senhaConfirm: "" })
            }}
          />
          {erros.senhaConfirm && <p className="text-red-500 text-xs mt-1">{erros.senhaConfirm}</p>}
        </div>

        <button
          type="submit"
          disabled={salvando}
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
      </form>
    </div>
  )
}