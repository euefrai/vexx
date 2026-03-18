"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function Configuracoes() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [foto, setFoto] = useState("")
  
  // NOVOS ESTADOS BIOMÉTRICOS
  const [peso, setPeso] = useState("")
  const [altura, setAltura] = useState("")
  const [sexo, setSexo] = useState("")

  const router = useRouter()

  useEffect(() => {
    carregarPerfil()
  }, [])

  async function carregarPerfil() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push("/login")

    const { data } = await supabase.from("usuarios").select("*").eq("id", user.id).single()
    if (data) {
      setUsername(data.username || "")
      setBio(data.bio || "")
      setFoto(data.foto || "")
      setPeso(data.peso || "")
      setAltura(data.altura || "")
      setSexo(data.sexo || "")
    }
  }

  // Lógica de classificação de IMC para feedback visual imediato
  const getInfoIMC = () => {
    if (!peso || !altura) return { texto: "Aguardando dados...", cor: "text-zinc-500" }
    const imc = peso / (altura * altura)
    if (imc < 18.5) return { texto: "Abaixo do Peso", cor: "text-blue-400" }
    if (imc < 25) return { texto: "Peso Ideal (Soldado de Elite)", cor: "text-green-500" }
    if (imc < 30) return { texto: "Sobrepeso", cor: "text-yellow-500" }
    return { texto: "Obesidade (Foco no Treino!)", cor: "text-red-500" }
  }

  async function handleUpload(event) {
    try {
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!event.target.files || event.target.files.length === 0) return
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('fotos').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('fotos').getPublicUrl(fileName)
      setFoto(publicUrl)
    } catch (error) {
      alert("Erro no upload")
    } finally {
      setUploading(false)
    }
  }

  async function salvarPerfil() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from("usuarios")
        .update({ 
          username, 
          bio, 
          foto,
          peso: parseFloat(peso) || null,
          altura: parseFloat(altura) || null,
          sexo
        })
        .eq("id", user.id)

      if (error) throw error
      alert("Perfil atualizado! ⚡")
      router.push("/perfil")
    } catch (error) {
      alert("Erro ao salvar: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 pb-24 text-white min-h-screen bg-black font-sans">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => router.back()} className="text-zinc-500 font-bold hover:text-white transition-colors">← VOLTAR</button>
        <h1 className="text-xl font-black uppercase italic text-green-500 tracking-tighter">Configurações</h1>
      </div>

      <div className="space-y-6">
        
        {/* AVATAR */}
        <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-zinc-800 flex flex-col items-center shadow-2xl">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-green-500 p-1">
               <img src={foto || "https://via.placeholder.com/150"} className={`w-full h-full rounded-full object-cover ${uploading ? 'opacity-30' : 'opacity-100'}`} />
            </div>
          </div>
          <label className="bg-green-500 text-black px-6 py-2 rounded-full font-black text-[10px] uppercase italic cursor-pointer active:scale-95 transition-all">
            {uploading ? "CARREGANDO..." : "ALTERAR FOTO"}
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

        {/* INFO PESSOAL */}
        <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-800 space-y-4">
          <h3 className="text-[10px] font-black uppercase text-green-500 mb-2 ml-2 tracking-widest">Bioestatística</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-600 mb-1 block ml-2">Peso (kg)</label>
              <input 
                type="number" 
                placeholder="75.5"
                value={peso} 
                onChange={(e) => setPeso(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-green-500 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-600 mb-1 block ml-2">Altura (m)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="1.80"
                value={altura} 
                onChange={(e) => setAltura(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-green-500 text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-600 mb-1 block ml-2">Sexo</label>
            <select 
              value={sexo} 
              onChange={(e) => setSexo(e.target.value)}
              className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-green-500 text-white font-bold appearance-none"
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>

          <div className="pt-2 px-2">
            <p className="text-[9px] font-black uppercase text-zinc-500">Status Atual:</p>
            <p className={`text-xs font-black uppercase italic ${getInfoIMC().cor}`}>{getInfoIMC().texto}</p>
          </div>
        </div>

        {/* NOME E BIO */}
        <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-800 space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-600 mb-2 block ml-2">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-green-500 text-white font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-600 mb-2 block ml-2">Sua Missão (Bio)</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              rows="3"
              maxLength="100"
              placeholder="Ex: Treinando para ser minha melhor versão."
              className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-green-500 text-white font-medium resize-none"
            />
            <p className="text-[9px] text-zinc-700 mt-2 text-right uppercase font-bold tracking-widest">{bio.length}/100</p>
          </div>
        </div>

        <button 
          onClick={salvarPerfil}
          disabled={loading || uploading}
          className="w-full bg-green-500 text-black font-black py-5 rounded-[2rem] uppercase italic text-sm shadow-[0_10px_30px_rgba(34,197,94,0.2)] active:scale-95 transition-all"
        >
          {loading ? "SALVANDO..." : "CONFIRMAR ALTERAÇÕES"}
        </button>

      </div>
      <Navbar />
    </div>
  )
}