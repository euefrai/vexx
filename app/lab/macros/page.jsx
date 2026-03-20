"use client"
import { useState, useRef, useEffect } from "react"
import Navbar from "@/components/Navbar"
import { alimentos } from "../../data/alimentos"

// 

// --- FUNÇÕES AUXILIARES ---
function buscarAlimentos(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  return alimentos
    .filter(a => a.nome.includes(q) || q.split(" ").some(p => a.nome.includes(p)))
    .slice(0, 5);
}

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
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  
  const fileInputRef = useRef(null);
  const [scanType, setScanType] = useState("comida"); // "comida" ou "rotulo"

  const META_CALORIAS = 2000;
  const META_PROTEINA = 150;

  useEffect(() => {
    const saved = localStorage.getItem("elite_macros_history");
    if (saved) setHistorico(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("elite_macros_history", JSON.stringify(historico));
  }, [historico]);

  const totalDia = historico.reduce((acc, item) => acc + item.calorias, 0);
  const proteinaDia = historico.reduce((acc, item) => acc + item.proteina, 0);

  // --- LÓGICA DE CÂMERA E IA ---
  const handleCameraClick = (type) => {
    setScanType(type);
    fileInputRef.current.click();
  };

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
          body: JSON.stringify({ image: base64, tipo: scanType })
        });
        const data = await res.json();

        if (scanType === "comida") {
          setInputTexto(data.resultado); // A IA retorna algo como "200g Frango + Arroz"
          // O usuário clica no botão OK para confirmar o que a IA viu
        } else {
          // No caso de rótulo, a IA já dá os macros, então injetamos direto
          const mockResultado = {
            alimento: "Scanner Rótulo",
            proteina: parseFloat(data.resultado.match(/Proteína: ([\d.]+)g/)?.[1] || 0),
            carbo: parseFloat(data.resultado.match(/Carboidratos: ([\d.]+)g/)?.[1] || 0),
            gordura: parseFloat(data.resultado.match(/Gorduras: ([\d.]+)g/)?.[1] || 0),
            calorias: parseInt(data.resultado.match(/Calorias: (\d+)kcal/)?.[1] || 0),
          };
          registrarNoHistorico(mockResultado);
        }
      } catch (err) {
        setErro("Erro ao processar imagem.");
      } finally {
        setLoading(false);
      }
    };
  };

  const registrarNoHistorico = (dados) => {
    setHistorico(prev => [...prev, { ...dados, id: Date.now(), hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
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
         <div className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800">
            <div className="flex justify-between mb-2 uppercase text-[10px] font-black italic">
                <span>Energia: {totalDia}kcal</span>
                <span className="text-zinc-500">Meta: {META_CALORIAS}</span>
            </div>
            <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{width: `${(totalDia/META_CALORIAS)*100}%`}}/>
            </div>
         </div>
      </div>

      {/* HISTÓRICO */}
      <div className="max-w-md mx-auto space-y-3">
        {historico.map(item => (
          <div key={item.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
            <div>
              <p className="text-xs font-black uppercase text-green-500">{item.alimento}</p>
              <div className="flex gap-4 mt-1">
                <MacroBox label="P" value={item.proteina} />
                <MacroBox label="C" value={item.carbo} />
                <MacroBox label="G" value={item.gordura} />
                <MacroBox label="K" value={item.calorias} />
              </div>
            </div>
            <button onClick={() => setHistorico(prev => prev.filter(i => i.id !== item.id))} className="text-zinc-700">✕</button>
          </div>
        ))}
      </div>

      {/* CONTROLES FLUTUANTES */}
      <div className="fixed bottom-24 left-0 right-0 px-4">
        <div className="max-w-md mx-auto space-y-3">
          
          {/* BOTÕES DE CÂMERA */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleCameraClick("comida")}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-green-500"
            >
              📷 Scan Comida
            </button>
            <button 
              onClick={() => handleCameraClick("rotulo")}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-blue-500"
            >
              🔍 Scan Rótulo
            </button>
          </div>

          {/* INPUT MANUAL / RESULTADO IA */}
          <div className="bg-zinc-900 p-2 rounded-2xl border border-green-500/50 flex gap-2">
            <input 
              hidden type="file" accept="image/*" capture="environment"
              ref={fileInputRef} onChange={processarImagem} 
            />
            <input
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              placeholder={loading ? "IA ANALISANDO..." : "Digite ou use a câmera..."}
              className="flex-1 bg-transparent px-3 font-bold text-sm outline-none"
            />
            <button 
              onClick={analisarConteudo}
              className="bg-green-500 text-black px-4 py-2 rounded-xl font-black"
            >
              {loading ? "..." : "OK"}
            </button>
          </div>
          {erro && <p className="text-red-500 text-center text-[10px] font-bold">{erro}</p>}
        </div>
      </div>
      <Navbar />
    </div>
  );
}