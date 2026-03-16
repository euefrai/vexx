"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function NovoKO() {
  const router = useRouter()
  const [legenda, setLegenda] = useState("")
  const [arquivo, setArquivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // Função para lidar com a escolha do arquivo e gerar o preview
  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      setArquivo(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  async function postar() {
    if (!arquivo || !legenda) {
      alert("Selecione uma mídia e escreva uma legenda!")
      return
    }

    setEnviando(true)

    try {
      // 1. Pega o ID do usuário atual
      const { data: { user } } = await supabase.auth.getUser()

      // 2. Define o nome do arquivo e o tipo (image ou video)
      const extensao = arquivo.name.split('.').pop()
      const tipo = arquivo.type.startsWith('video') ? 'video' : 'image'
      const nomeArquivo = `${user.id}-${Date.now()}.${extensao}`

      // 3. Upload para o bucket 'fotos' (ou crie um chamado 'midia')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("fotos")
        .upload(nomeArquivo, arquivo)

      if (uploadError) throw uploadError

      // 4. Pega a URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from("fotos")
        .getPublicUrl(nomeArquivo)

      // 5. Salva os dados na tabela 'posts_ko'
      const { error: postError } = await supabase
        .from("posts_ko")
        .insert({
          user_id: user.id,
          legenda: legenda,
          midia_url: publicUrl,
          tipo: tipo
        })

      if (postError) throw postError

      alert("K.O. postado com sucesso! 🔥")
      router.push("/ko")
    } catch (err) {
      alert("Erro ao postar: " + err.message)
      console.error(err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <div className="max-w-md mx-auto p-6 pb-24 text-white min-h-screen bg-black">
        <h1 className="text-2xl font-bold mb-8">Novo Nocaute 🥊</h1>

        <div className="flex flex-col gap-6">
          
          {/* ÁREA DE PREVIEW / UPLOAD */}
          <div className="relative w-full aspect-square bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden">
            {preview ? (
              arquivo.type.startsWith('video') ? (
                <video src={preview} className="w-full h-full object-cover" controls />
              ) : (
                <img src={preview} className="w-full h-full object-cover" alt="Preview" />
              )
            ) : (
              <label className="flex flex-col items-center cursor-pointer">
                <span className="text-4xl mb-2">📸</span>
                <span className="text-zinc-500 text-sm font-medium">Toque para selecionar</span>
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
            
            {preview && (
              <button
                disabled={salvando} 
                onClick={() => { setPreview(null); setArquivo(null); }}
                className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* INPUT DE LEGENDA */}
          <textarea
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            placeholder="Escreva algo sobre esse K.O..."
            className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 focus:border-green-500 outline-none resize-none h-32"
          />

          {/* BOTÃO POSTAR */}
          <button
            onClick={postar}
            disabled={enviando}
            className={`w-full py-4 rounded-2xl font-bold text-black transition-all ${
              enviando ? "bg-zinc-700 opacity-50" : "bg-green-500 hover:bg-green-400 active:scale-95"
            }`}
          >
            {enviando ? "Lançando..." : "POSTAR K.O. 🔥"}
          </button>

        </div>
      </div>
      <Navbar />
    </>
  )
}