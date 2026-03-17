"use client"

import { useState } from "react" // Adicione esta linha!
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function NovoKO() {
  const router = useRouter()
  const [legenda, setLegenda] = useState("")
  const [arquivo, setArquivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [enviando, setEnviando] = useState(false)

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
      const { data: { user } } = await supabase.auth.getUser()

      const extensao = arquivo.name.split('.').pop()
      const tipo = arquivo.type.startsWith('video') ? 'video' : 'image'
      const nomeArquivo = `${user.id}-${Date.now()}.${extensao}`

      const { error: uploadError } = await supabase.storage
        .from("fotos")
        .upload(nomeArquivo, arquivo)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("fotos")
        .getPublicUrl(nomeArquivo)

      // ✅ CORREÇÃO: Usando 'user.id' que já foi capturado acima e enviando para a coluna 'usuario_id'
      const { error: postError } = await supabase
        .from("posts_ko")
        .insert({
          usuario_id: user.id, // Antes estava 'usuario_id: usuario_id', o que causava o erro de 'not defined'
          legenda: legenda,
          midia_url: publicUrl,
          tipo: tipo
        })

      if (postError) throw postError

      alert("K.O. postado com sucesso! 🔥")
      router.push("/ko")
    } catch (err) {
      alert("Erro ao postar: " + err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <div className="max-w-md mx-auto p-6 pb-24 text-white min-h-screen bg-black">
        <h1 className="text-2xl font-black uppercase italic text-green-500 mb-8 tracking-tighter">Novo Nocaute 🥊</h1>

        <div className="flex flex-col gap-6">
          
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
                <span className="text-zinc-500 text-sm font-black uppercase tracking-widest">Toque para selecionar</span>
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
            
            {preview && (
              <button
                // ✅ CORREÇÃO: Trocado 'salvando' por 'enviando'
                disabled={enviando} 
                onClick={() => { setPreview(null); setArquivo(null); }}
                className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <textarea
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            placeholder="Escreva algo sobre esse K.O..."
            className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 focus:border-green-500 outline-none resize-none h-32 font-bold"
          />

          <button
            onClick={postar}
            disabled={enviando}
            className={`w-full py-5 rounded-2xl font-black text-black transition-all uppercase tracking-widest ${
              enviando ? "bg-zinc-700 opacity-50 cursor-not-allowed" : "bg-green-500 hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-500/20"
            }`}
          >
            {enviando ? "LANÇANDO..." : "POSTAR K.O. 🔥"}
          </button>

        </div>
      </div>
      <Navbar />
    </>
  )
}