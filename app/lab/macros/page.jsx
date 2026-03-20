"use client"
import { useState, useRef, useEffect } from "react"
import Navbar from "@/components/Navbar"
import { alimentos } from "../../data/alimentos"

// --- FUNÇÕES AUXILIARES ---
function calcularMacros(texto) {
  const itens = texto.toLowerCase().split(/[,+]/);
  let total = { alimento: texto, proteina: 0, carbo: 0, gordura: 0, calorias: 0 };
  let encontrados = 0;

  itens.forEach(item => {
    item = item.trim();
    let quantidadeGramas = 100;
    let matchGramas = item.match(/(\d+)\s*g/);
    if (matchGramas) quantidadeGramas = parseInt(matchGramas[1]);

    const alimentoEncontrado = alimentos.find(a =>
      item.includes(a.nome) || a.nome.includes(item) || item.split(" ").some(p => a.nome.includes(p))
    );

    if (alimentoEncontrado) {
      let fator = quantidadeGramas / 100;
      total.proteina += alimentoEncontrado.proteina * fator;
      total.carbo += alimentoEncontrado.carbo * fator;
      total.gordura += alimentoEncontrado.gordura * fator;
      total.calorias += alimentoEncontrado.calorias * fator;
      encontrados++;
    }
  });

  return encontrados === 0 ? null : {
    ...total,
    proteina: Number(total.proteina.toFixed(1)),
    carbo: Number(total.carbo.toFixed(1)),
    gordura: Number(total.gordura.toFixed(1)),
    calorias: Math.round(total.calorias)
  };
}

function MacroBox({ label, value }) {
  return (
    <div>
      <p className="text-[8px] text-zinc-500 uppercase">{label}</p>
      <p className="font-black text-xs">{value}</p>
    </div>
  );
}

export default function MacrosPage() {
  const [inputTexto, setInputTexto] = useState("");
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  
  const fileInputRef = useRef(null);
  const [scanType, setScanType] = useState("comida");

  const META_CALORIAS = 2000;

  useEffect(() => {
    const saved = localStorage.getItem("elite_macros_history");
    if (saved) setHistorico(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("elite_macros_history", JSON.stringify(historico));
  }, [historico]);

  const totalDia = historico.reduce((acc, item) => acc + item.calorias, 0);

  const handleCameraClick = (type) => {
    setScanType(type);
    fileInputRef.current.click();
  };

  // --- LÓGICA DE IA ATUALIZADA ---
  const processarImagem = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErro(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;

      try {
        const res = await fetch("/api/analisar-imagem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, tipo: scanType })
        });
        
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        // Agora recebemos JSON pronto: { alimento, proteina, carbo, gordura, calorias }
        // Registramos direto no histórico, sem precisar de regex
        registrarNoHistorico({
          alimento: data.alimento,
          proteina: data.proteina || 0,
          carbo: data.carbo || 0,
          gordura: data.gordura || 0,
          calorias: data.calorias || 0,
          // Se for rótulo, podemos mostrar o veredito no erro ou num alert
          info: data.veredito || null 
        });

        if (data.veredito) {
           alert(`VEXX VERDITO: ${data.veredito}`);
        }

      } catch (err) {
        setErro("Falha no Scanner. Tente novamente.");
        console.error(err);
      } finally {
        setLoading(false);
        e.target.value = ""; // Limpa o input de arquivo
      }
    };
  };

  const registrarNoHistorico = (dados) => {
    setHistorico(prev => [{ 
      ...dados, 
      id: Date.now(), 
      hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
    }, ...prev]);
    setInputTexto("");
  };

  const analisarConteudo = () => {
    const res = calcularMacros(inputTexto);
    if (res) registrarNoHistorico(res);
    else setErro("Alimento não catalogado.");
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-48">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-black text-green-500 italic uppercase">BIO SCANNER 3.0</h1>
      </header>

      {/* METAS */}
      <div className="max-w-md mx-auto space-y-4 mb-8">
         <div className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <div className="flex justify-between mb-2 uppercase text-[10px] font-black italic">
                <span>Energia: {totalDia}kcal</span>
                <span className="text-zinc-500">Meta: {META_CALORIAS}</span>
            </div>
            <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500" 
                  style={{width: `${Math.min((totalDia/META_CALORIAS)*100, 100)}%`}}
                />
            </div>
         </div>
      </div>

      {/* HISTÓRICO */}
      <div className="max-w-md mx-auto space-y-3">
        {historico.map(item => (
          <div key={item.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
            <div>
              <p className="text-xs font-black uppercase text-green-500">{item.alimento}</p>
              <div className="flex gap-4 mt-1">
                <MacroBox label="P" value={item.proteina} />
                <MacroBox label="C" value={item.carbo} />
                <MacroBox label="G" value={item.gordura} />
                <MacroBox label="K" value={item.calorias} />
              </div>
            </div>
            <button onClick={() => setHistorico(prev => prev.filter(i => i.id !== item.id))} className="text-zinc-700 hover:text-red-500 transition-colors">✕</button>
          </div>
        ))}
      </div>

      {/* CONTROLES FLUTUANTES */}
      <div className="fixed bottom-24 left-0 right-0 px-4">
        <div className="max-w-md mx-auto space-y-3">
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleCameraClick("comida")}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-green-500 transition-all active:scale-95"
            >
              📷 Scan Comida
            </button>
            <button 
              onClick={() => handleCameraClick("rotulo")}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-blue-500 transition-all active:scale-95"
            >
              🔍 Scan Rótulo
            </button>
          </div>

          <div className="bg-zinc-900 p-2 rounded-2xl border border-green-500/50 flex gap-2 shadow-lg">
            <input 
              hidden type="file" accept="image/*" capture="environment"
              ref={fileInputRef} onChange={processarImagem} 
            />
            <input
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              placeholder={loading ? "ANALISANDO IMAGEM..." : "Digite ou use a câmera..."}
              className="flex-1 bg-transparent px-3 font-bold text-sm outline-none"
              disabled={loading}
            />
            <button 
              onClick={analisarConteudo}
              disabled={loading}
              className="bg-green-500 text-black px-4 py-2 rounded-xl font-black disabled:opacity-50"
            >
              {loading ? "..." : "OK"}
            </button>
          </div>
          {erro && <p className="text-red-500 text-center text-[10px] font-bold uppercase animate-bounce">{erro}</p>}
        </div>
      </div>
      <Navbar />
    </div>
  );
}