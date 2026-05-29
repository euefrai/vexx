"use client"

import { useState, useRef, useEffect } from "react"
import Navbar from "@/components/Navbar"
import PageHeader from "@/components/PageHeader"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, ChevronRight, X, ShieldAlert, Sparkles, Flame, Percent, Activity, Trash2, ArrowUpRight } from "lucide-react"
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
    calorias: Math.round(total.calorias),
    nota_pureza: 95, // Default manual input purity
    veredito: "Combustível inserido manualmente. Prossiga com o protocolo tático."
  };
}

function ProgressIndicator({ label, value, max, colorClass }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-[9px] uppercase font-black text-zinc-500 mb-1">
        <span>{label}</span>
        <span>{value.toFixed(0)}g / {max}g</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
        <div 
          className={`h-full ${colorClass} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function MacrosPage() {
  const [inputTexto, setInputTexto] = useState("");
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  
  // Custom states for vision result modal (replacing browser alerts)
  const [scanResult, setScanResult] = useState(null);
  
  const fileInputRef = useRef(null);
  const [scanType, setScanType] = useState("comida");

  const META_CALORIAS = 2000;
  const META_PROTEINA = 150;
  const META_CARBO = 200;
  const META_GORDURA = 60;

  useEffect(() => {
    const saved = localStorage.getItem("elite_macros_history");
    if (saved) setHistorico(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("elite_macros_history", JSON.stringify(historico));
  }, [historico]);

  // Cálculos diários
  const totalCal = historico.reduce((acc, item) => acc + item.calorias, 0);
  const totalProt = historico.reduce((acc, item) => acc + (item.proteina || 0), 0);
  const totalCarb = historico.reduce((acc, item) => acc + (item.carbo || 0), 0);
  const totalGord = historico.reduce((acc, item) => acc + (item.gordura || 0), 0);

  const handleCameraClick = (type) => {
    setScanType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // --- LÓGICA DE IA ATUALIZADA COM MODAL CUSTOMIZADO ---
  const processarImagem = async (e) => {
    const file = e.target.files?.[0];
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

        // Armazena no estado temporário para abrir o modal customizado de veredito
        setScanResult({
          alimento: data.alimento,
          proteina: Number(data.proteina || 0),
          carbo: Number(data.carbo || 0),
          gordura: Number(data.gordura || 0),
          calorias: Number(data.calorias || 0),
          nota_pureza: Number(data.nota_pureza || 90),
          veredito: data.veredito || "Alimento analisado. Excelentes proporções.",
          tipo: scanType
        });

      } catch (err) {
        setErro("Falha crítica no Bio Scanner. Tente novamente.");
        console.error(err);
      } finally {
        setLoading(false);
        if (e.target) e.target.value = ""; // Limpa o input de arquivo
      }
    };
  };

  const confirmarEGravar = () => {
    if (!scanResult) return;
    registrarNoHistorico({
      alimento: scanResult.alimento,
      proteina: scanResult.proteina,
      carbo: scanResult.carbo,
      gordura: scanResult.gordura,
      calorias: scanResult.calorias,
      nota_pureza: scanResult.nota_pureza,
      veredito: scanResult.veredito
    });
    setScanResult(null);
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
    if (res) {
      registrarNoHistorico(res);
      setErro(null);
    } else {
      setErro("Alimento não catalogado. Tente usar o scanner de imagem.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-950 via-black to-black text-white p-4 pb-48 font-sans relative">
      
      {/* 🔮 EMBEDDED KEYFRAME CSS FOR SCANNING EFFECT */}
      <style>{`
        @keyframes laserScan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(180px); }
        }
        .laser-sweep {
          animation: laserScan 2.5s ease-in-out infinite;
        }
      `}</style>

      <PageHeader icon="🥩" title="Bio Scanner 3.0" subtitle="Análise de Biometria Alimentar" color="red" />

      {/* METAS E RELATÓRIO DO DIA */}
      <div className="max-w-md mx-auto space-y-4 mt-6">
         <div className="bg-zinc-950/80 p-5 rounded-3xl border border-zinc-800/80 shadow-[0_4px_25px_rgba(239,68,68,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-center mb-2.5 uppercase text-[9px] font-black italic tracking-widest text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Flame size={12} className="text-red-500 animate-pulse" />
                  Combustível Diário
                </span>
                <span className="text-red-500">{totalCal} / {META_CALORIAS} Kcal</span>
            </div>
            
            {/* Barra de Calorias */}
            <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 mb-5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                  style={{width: `${Math.min((totalCal/META_CALORIAS)*100, 100)}%`}}
                />
            </div>

            {/* Sub-barras de Macros */}
            <div className="space-y-3 pt-1 border-t border-zinc-900">
              <ProgressIndicator label="Proteínas (P)" value={totalProt} max={META_PROTEINA} colorClass="bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]" />
              <ProgressIndicator label="Carboidratos (C)" value={totalCarb} max={META_CARBO} colorClass="bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.2)]" />
              <ProgressIndicator label="Gorduras (G)" value={totalGord} max={META_GORDURA} colorClass="bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.2)]" />
            </div>
         </div>
      </div>

      {/* HISTÓRICO DE REFEIÇÕES DO DIA */}
      <div className="max-w-md mx-auto space-y-3 mt-6">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-1">Registros das Últimas 24h ({historico.length})</p>
        
        {historico.length === 0 && (
          <div className="text-center py-12 bg-zinc-950/20 border border-dashed border-zinc-900 rounded-3xl">
            <Activity size={24} className="mx-auto text-zinc-800 mb-2 animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-650 italic">Sem registros no banco nutricional</p>
          </div>
        )}

        <AnimatePresence>
          {historico.map(item => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950/80 p-4 rounded-3xl border border-zinc-850 flex justify-between items-center hover:border-zinc-800 transition-all relative overflow-hidden group"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-600/30 group-hover:bg-red-600 transition-colors"></div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-[11px] font-black uppercase tracking-wide text-zinc-150 truncate leading-none">{item.alimento}</p>
                  {item.nota_pureza && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 text-[7px] font-black tracking-wide leading-none shrink-0">
                      PUREZA: {item.nota_pureza}%
                    </span>
                  )}
                </div>
                
                <div className="flex gap-4.5 mt-1.5">
                  <div>
                    <span className="text-[7px] text-zinc-600 uppercase font-black tracking-wider block">Prot</span>
                    <span className="font-black text-[10px] text-red-400">{item.proteina}g</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-zinc-600 uppercase font-black tracking-wider block">Carb</span>
                    <span className="font-black text-[10px] text-green-400">{item.carbo}g</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-zinc-600 uppercase font-black tracking-wider block">Gord</span>
                    <span className="font-black text-[10px] text-orange-400">{item.gordura}g</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-zinc-600 uppercase font-black tracking-wider block">Calorias</span>
                    <span className="font-black text-[10px] text-zinc-200">{item.calorias}kcal</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setHistorico(prev => prev.filter(i => i.id !== item.id))} 
                className="text-zinc-700 hover:text-red-500 p-2 rounded-lg transition-all shrink-0 cursor-pointer"
                title="Remover refeição"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 🔍 VISOR DE ESCANEAMENTO DE CÂMERA (LOADING ANIMATION) */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="bg-zinc-950 border border-red-500/20 rounded-3xl p-6 text-center max-w-sm w-full space-y-6 relative overflow-hidden shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2 text-zinc-500 text-[8px] font-black tracking-widest uppercase">
                <span>[ TELEMETRIA BIOLÓGICA ]</span>
                <span className="text-red-500 animate-pulse">SCANNINNG LIVE</span>
              </div>

              {/* Viewfinder e efeito laser */}
              <div className="relative w-full h-48 bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center">
                {/* Cantos do Viewfinder */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

                {/* Laser de Varredura Sweep */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-rose-400 to-red-500 shadow-[0_0_10px_#ef4444] laser-sweep"></div>
                
                <Camera size={42} className="text-red-500/20 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">ISOLANDO AMOSTRA BIOLÓGICA...</p>
                <p className="text-[9px] text-zinc-500 font-mono">ESTIMANDO COEFICIENTES MACRONUTRICIONAIS</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧬 MODAL CUSTOMIZADO DO VEREDITO DO BIO SCANNER (REMOVES BROWSER ALERTS) */}
      <AnimatePresence>
        {scanResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 max-w-sm w-full relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4 text-[8px] font-black tracking-widest text-zinc-500 uppercase">
                <span className="flex items-center gap-1 text-red-500">
                  <Sparkles size={10} />
                  RESULTADO DO BIO SCAN
                </span>
                <span>VEXX LAB 3.0</span>
              </div>

              {/* Alimento Identificado */}
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                <ArrowUpRight size={16} className="text-red-500 shrink-0" />
                {scanResult.alimento}
              </h3>

              {/* Macros do Resultado */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="bg-zinc-900/60 border border-zinc-850 p-2 rounded-xl text-center">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Proteína</p>
                  <p className="font-black text-xs text-red-400 mt-0.5">{scanResult.proteina}g</p>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-850 p-2 rounded-xl text-center">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Carbo</p>
                  <p className="font-black text-xs text-green-400 mt-0.5">{scanResult.carbo}g</p>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-850 p-2 rounded-xl text-center">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Gordura</p>
                  <p className="font-black text-xs text-orange-400 mt-0.5">{scanResult.gordura}g</p>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-850 p-2 rounded-xl text-center">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Calorias</p>
                  <p className="font-black text-xs text-zinc-200 mt-0.5">{scanResult.calorias}k</p>
                </div>
              </div>

              {/* Nota de Pureza / Qualidade */}
              <div className="mt-4 p-3 bg-zinc-900/40 border border-zinc-850 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent size={14} className="text-red-500" />
                  <span className="text-[9px] font-black uppercase text-zinc-400">Nota de Pureza de Macros</span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                  scanResult.nota_pureza >= 80 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                  scanResult.nota_pureza >= 50 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {scanResult.nota_pureza}/100
                </span>
              </div>

              {/* Veredito Tático do Comandante */}
              <div className="mt-3.5 bg-gradient-to-br from-red-950/20 to-zinc-900/40 border border-red-950/30 p-3.5 rounded-2xl relative">
                <p className="text-[8px] font-black uppercase tracking-widest text-red-500 mb-1.5 flex items-center gap-1">
                  <ShieldAlert size={10} className="animate-pulse" />
                  Veredito VEXX Comando
                </p>
                <p className="text-[10px] font-semibold leading-relaxed tracking-wide text-zinc-300 italic">
                  "{scanResult.veredito}"
                </p>
              </div>

              {/* Ações */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={confirmarEGravar}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-red-950/30 active:scale-[0.98] transition-all uppercase italic text-[10px] tracking-widest cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={12} />
                  REGISTRAR NO BANCO DE MACROS
                </button>
                <button
                  onClick={() => setScanResult(null)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white py-2.5 rounded-2xl font-black active:scale-[0.98] transition-all uppercase italic text-[9px] tracking-widest cursor-pointer"
                >
                  DESCARTAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTROLES FLUTUANTES INFERIORES */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-40">
        <div className="max-w-md mx-auto space-y-3">
          
          <div className="grid grid-cols-2 gap-2.5">
            <button 
              onClick={() => handleCameraClick("comida")}
              disabled={loading}
              className="bg-zinc-950 border border-zinc-850 hover:border-red-500/50 p-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md"
            >
              📸 Scan Comida
            </button>
            <button 
              onClick={() => handleCameraClick("rotulo")}
              disabled={loading}
              className="bg-zinc-950 border border-zinc-850 hover:border-blue-500/50 p-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md"
            >
              🔍 Scan Rótulo
            </button>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800 flex gap-2 shadow-2xl relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-600/50"></div>
            <input 
              hidden type="file" accept="image/*" capture="environment"
              ref={fileInputRef} onChange={processarImagem} 
            />
            <input
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              placeholder={loading ? "PROCESSANDO IMAGEM..." : "Digite alimento (ex: 100g frango)..."}
              className="flex-1 bg-transparent px-2.5 font-bold text-xs uppercase tracking-wider outline-none text-zinc-200 placeholder:text-zinc-700"
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && analisarConteudo()}
            />
            <button 
              onClick={analisarConteudo}
              disabled={loading || !inputTexto.trim()}
              className="bg-red-600 hover:bg-red-500 text-white w-9 h-9 rounded-xl font-black transition-all active:scale-[0.95] disabled:opacity-30 flex items-center justify-center cursor-pointer text-xs shrink-0"
            >
              OK
            </button>
          </div>
          {erro && <p className="text-red-500 text-center text-[9px] font-black uppercase animate-bounce tracking-widest pt-1">{erro}</p>}
        </div>
      </div>
      <Navbar />
    </div>
  );
}