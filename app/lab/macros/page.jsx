"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import OpenAI from "openai"

// Sua chave OpenAI configurada, Paul.
const openai = new OpenAI({
  apiKey: "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",
  dangerouslyAllowBrowser: true 
});

export default function MacrosPage() {
  const [inputTexto, setInputTexto] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("elite_macros_history");
    if (saved) setHistorico(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("elite_macros_history", JSON.stringify(historico));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historico]);

  const analisarConteudo = async (arquivo = null) => {
    if (!arquivo && !inputTexto.trim()) return;

    setAnalisando(true);
    setErro(null);
    const textoAtual = inputTexto;
    setInputTexto("");

    try {
      let messages = [
        {
          role: "system",
          content: "Atue como um nutricionista esportivo. Analise o alimento e estime calorias, proteínas, carboidratos e gorduras. Responda APENAS um JSON: {\"alimento\": \"nome\", \"calorias\": 0, \"proteina\": 0, \"carbo\": 0, \"gordura\": 0}"
        }
      ];

      if (arquivo) {
        // Conversão para Base64 para a OpenAI processar a imagem
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(arquivo);
        });

        messages.push({
          role: "user",
          content: [
            { type: "text", text: "Analise esta imagem de comida e extraia os macros." },
            { type: "image_url", image_url: { url: base64 } }
          ]
        });
      } else {
        messages.push({
          role: "user",
          content: `Estime os macros para: ${textoAtual}`
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        response_format: { type: "json_object" }
      });

      const dadosIA = JSON.parse(response.choices[0].message.content);

      setHistorico(prev => [...prev, {
        ...dadosIA,
        id: Date.now(),
        tipo: arquivo ? 'FOTO' : 'TEXTO',
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (err) {
      console.error("ERRO OPENAI:", err);
      setErro("FALHA NO PROCESSAMENTO. VERIFIQUE SALDO/CHAVE.");
    } finally {
      setAnalisando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-40 font-sans selection:bg-green-500/30">
      <Link href="/lab" className="text-zinc-600 uppercase font-black text-[10px] tracking-widest hover:text-green-500 transition-all">← Voltar ao Lab</Link>
      
      <header className="mt-4 mb-6 text-center">
        <h1 className="text-2xl font-black uppercase italic text-green-500 tracking-tighter">BIO <span className="text-white font-normal">SCANNER</span></h1>
        <p className="text-zinc-800 text-[8px] font-black uppercase tracking-[0.4em]">Intelligence by OpenAI</p>
      </header>

      {/* Histórico Dinâmico */}
      <div className="space-y-4 mb-6 max-w-md mx-auto">
        {historico.length === 0 && !analisando && (
          <div className="text-center py-24 opacity-10 italic font-black uppercase text-[10px] tracking-[0.5em]">Standby...</div>
        )}

        {historico.map((item) => (
          <div key={item.id} className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-[2rem] animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase italic text-green-500">{item.alimento}</span>
              <span className="text-[7px] text-zinc-600 font-bold uppercase">{item.hora} • {item.tipo}</span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <MacroBox label="P" value={item.proteina} color="text-blue-400" />
              <MacroBox label="C" value={item.carbo} color="text-yellow-400" />
              <MacroBox label="G" value={item.gordura} color="text-red-400" />
              <div className="bg-green-500/10 rounded-xl py-2 border border-green-500/20 text-center">
                <p className="text-[7px] text-green-700 font-black uppercase">Kcal</p>
                <p className="text-xs font-black italic text-green-500">{item.calorias}</p>
              </div>
            </div>
          </div>
        ))}

        {analisando && (
          <div className="flex flex-col items-center gap-2 py-4">
             <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">Decodificando Nutrientes...</span>
          </div>
        )}
        
        {erro && <p className="text-red-500 text-[8px] font-black uppercase text-center animate-bounce">{erro}</p>}
        <div ref={chatEndRef} />
      </div>

      {/* Input de Comando */}
      <div className="fixed bottom-24 left-0 right-0 px-4">
        <div className="max-w-md mx-auto bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2 rounded-[2.5rem] flex items-center gap-2 shadow-2xl">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-all border border-zinc-700 active:scale-90"
          >
            📸
          </button>
          
          <input
            value={inputTexto}
            onChange={(e) => setInputTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analisarConteudo()}
            placeholder="Descreva sua refeição..."
            className="flex-1 bg-transparent border-none outline-none px-2 text-sm font-bold text-white placeholder:text-zinc-800"
          />

          <button 
            onClick={() => analisarConteudo()}
            disabled={analisando || !inputTexto.trim()}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              inputTexto.trim() ? 'bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-zinc-800 text-zinc-700'
            }`}
          >
            🚀
          </button>
        </div>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => e.target.files[0] && analisarConteudo(e.target.files[0])} 
      />
      
      <Navbar />

      {historico.length > 0 && (
        <button 
          onClick={() => {if(confirm('Limpar banco de dados?')) setHistorico([])}}
          className="fixed top-6 right-6 text-[7px] font-black uppercase text-zinc-800 hover:text-red-500 transition-colors"
        >
          Reset Log
        </button>
      )}
    </div>
  )
}

function MacroBox({ label, value, color }) {
  return (
    <div className="bg-zinc-950 rounded-xl py-2 border border-zinc-800 text-center">
      <p className="text-[7px] text-zinc-600 font-black uppercase">{label}</p>
      <p className={`text-xs font-black italic ${color}`}>{value}g</p>
    </div>
  )
}