"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import Link from "next/link"

export default function Forum() {
  const [topicos, setTopicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [novaPergunta, setNovaPergunta] = useState("")

  useEffect(() => {
    buscarTopicos()
  }, [])

  async function buscarTopicos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("forum_topicos")
        .select(`
          id, 
          titulo, 
          created_at,
          usuarios:usuario_id (username, foto),
          forum_respostas (id)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro Supabase:", error.message)
        return
      }
      setTopicos(data || [])
    } catch (err) {
      console.error("Erro crítico:", err)
    } finally {
      setLoading(false)
    }
  }

  async function criarPergunta(e) {
    e.preventDefault()
    if (!novaPergunta.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Acesso negado. Identifique-se primeiro.")

    const { error } = await supabase
      .from("forum_topicos")
      .insert({ titulo: novaPergunta, usuario_id: user.id })

    if (!error) {
      setNovaPergunta("")
      buscarTopicos()
    } else {
      alert("Erro ao enviar: " + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      <div className="max-w-md mx-auto p-4">
        
        <div className="flex flex-col mb-8 pt-6">
          <h1 className="text-2xl font-black italic uppercase text-green-500 tracking-tighter">Centro de Inteligência</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Fórum • Briefing de Dúvidas</p>
        </div>

        <form onSubmit={criarPergunta} className="mb-10 bg-zinc-900/30 p-4 rounded-[2rem] border border-zinc-800 focus-within:border-green-500/50 transition-all">
          <textarea 
            value={novaPergunta}
            onChange={(e) => setNovaPergunta(e.target.value)}
            placeholder="QUAL SUA DÚVIDA DE TREINO OU DIETA?"
            className="w-full bg-transparent outline-none text-sm font-bold placeholder:text-zinc-700 resize-none h-20 px-2"
          />
          <div className="flex justify-end mt-2">
            <button type="submit" className="bg-green-500 text-black px-6 py-2 rounded-full font-black text-[10px] uppercase italic active:scale-95 transition-all">
              LANÇAR PERGUNTA
            </button>
          </div>
        </form>

        <h2 className="text-[10px] font-black uppercase text-zinc-600 mb-4 tracking-widest ml-1">Discussões Recentes</h2>

        {loading ? (
          <div className="text-center py-20 animate-pulse text-zinc-500 font-bold uppercase text-[10px]">Sincronizando Banco de Dados...</div>
        ) : (
          <div className="space-y-4">
            {topicos.map(topico => {
              const autor = Array.isArray(topico.usuarios) ? topico.usuarios[0] : topico.usuarios;
              
              return (
                <div key={topico.id} className="bg-zinc-900/40 p-5 rounded-[1.5rem] border border-zinc-800/50 hover:border-zinc-700 transition-all">
                  <Link href={`/forum/${topico.id}`} className="block group">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800">
                        <img 
                          src={autor?.foto || "https://via.placeholder.com/150"} 
                          className="w-full h-full object-cover" 
                          alt="" 
                        />
                      </div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">
                        @{autor?.username || "operador"}
                      </span>
                      <span className="text-[8px] text-zinc-700 font-bold ml-auto">
                        {new Date(topico.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-sm leading-tight text-white group-hover:text-green-500 transition-colors uppercase italic mb-4">
                      {topico.titulo}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4">
                    <div className="flex items-center gap-2 text-zinc-600 font-black text-[8px] uppercase">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.532a2.32 2.32 0 00-1.93 2.17c-.393 2.856-.393 5.738 0 8.594a2.32 2.32 0 001.93 2.17c2.14.352 4.334.532 6.57.532 2.236 0 4.43-.18 6.57-.532a2.32 2.32 0 001.93-2.17c.393-2.856.393-5.738 0-8.594a2.32 2.32 0 00-1.93-2.17A46.391 46.391 0 0010 2z" clipRule="evenodd" />
                      </svg>
                      {topico.forum_respostas?.length || 0} RESPOSTAS
                    </div>

                    {/* BOTÃO RESPONDER */}
                    <Link 
                      href={`/forum/${topico.id}`}
                      className="bg-zinc-800 hover:bg-green-500 hover:text-black text-zinc-400 px-4 py-1.5 rounded-full font-black text-[8px] uppercase italic transition-all active:scale-95"
                    >
                      RESPONDER
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <footer className="mt-16 text-center">
          <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.2em] opacity-50">
            © 2026 @eu.efrai - Elite Squad
          </p>
        </footer>

      </div>
      <Navbar />
    </div>
  )
}