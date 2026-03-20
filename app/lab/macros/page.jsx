"use client"
import { useState, useRef, useEffect } from "react"
import Navbar from "@/components/Navbar"
import { alimentos } from "../../data/alimentos"

// --- FUNÇÕES AUXILIARES (FORA DO COMPONENTE) ---

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

    let quantidadeUnidade = 1;
    let matchUnidade = item.match(/^(\d+)/);
    if (matchUnidade && !matchGramas) quantidadeUnidade = parseInt(matchUnidade[1]);

    const alimentoEncontrado = alimentos.find(a =>
      item.includes(a.nome) || a.nome.includes(item) || item.split(" ").some(p => a.nome.includes(p))
    );

    if (alimentoEncontrado) {
      let fator = quantidadeGramas / 100;
      if (alimentoEncontrado.unidade && matchUnidade) fator = quantidadeUnidade;

      total.proteina += alimentoEncontrado.proteina * fator;
      total.carbo += alimentoEncontrado.carbo * fator;
      total.gordura += alimentoEncontrado.gordura * fator;
      total.calorias += alimentoEncontrado.calorias * fator;
      encontrados++;
    }
  });

  if (encontrados === 0) return null;
  return {
    ...total,
    proteina: Number(total.proteina.toFixed(1)),
    carbo: Number(total.carbo.toFixed(1)),
    gordura: Number(total.gordura.toFixed(1)),
    calorias: Math.round(total.calorias)
  };
}

function analisarDieta(calorias, proteina, metaCal, metaProt) {
  let feedback = [];
  if (calorias === 0) return ["🚀 Aguardando primeiro registro..."];
  
  if (calorias < metaCal * 0.7) feedback.push("⚠️ Poucas calorias (pode faltar energia)");
  else if (calorias > metaCal * 1.2) feedback.push("🔥 Calorias altas (cuidado com excesso)");
  else feedback.push("✅ Calorias equilibradas");

  if (proteina < metaProt * 0.7) feedback.push("🥩 Proteína baixa (importante pra músculo)");
  else if (proteina >= metaProt) feedback.push("💪 Proteína ideal!");

  const densidade = proteina / calorias;
  if (densidade < 0.05) feedback.push("🍔 Dieta pouco eficiente (baixa proteína)");
  else feedback.push("🥗 Boa qualidade nutricional");

  return feedback;
}

function MacroBox({ label, value }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function MacrosPage() {
  const [inputTexto, setInputTexto] = useState("");
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const META_CALORIAS = 2000;
  const META_PROTEINA = 150;
  const chatEndRef = useRef(null);

  // 1. CARREGAR E VALIDAR DATA (Executa uma vez ao abrir)
  useEffect(() => {
    const saved = localStorage.getItem("elite_macros_history");
    const lastDate = localStorage.getItem("elite_macros_date");
    const hoje = new Date().toLocaleDateString();

    if (lastDate !== hoje) {
      localStorage.removeItem("elite_macros_history");
      localStorage.setItem("elite_macros_date", hoje);
      setHistorico([]);
    } else if (saved) {
      setHistorico(JSON.parse(saved));
    }
  }, []);

  // 2. SALVAR E SCROLL (Executa sempre que o histórico muda)
  useEffect(() => {
    localStorage.setItem("elite_macros_history", JSON.stringify(historico));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historico]);

  // Cálculos de Totais
  const totalDia = historico.reduce((acc, item) => acc + item.calorias, 0);
  const proteinaDia = historico.reduce((acc, item) => acc + item.proteina, 0);
  const feedbackIA = analisarDieta(totalDia, proteinaDia, META_CALORIAS, META_PROTEINA);

  const analisarConteudo = () => {
    if (!inputTexto.trim()) return;
    setErro(null);
    const resultado = calcularMacros(inputTexto);

    if (!resultado) {
      setErro("Alimento não encontrado.");
      return;
    }

    setHistorico(prev => [
      ...prev,
      {
        ...resultado,
        id: Date.now(),
        hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setInputTexto("");
    setMostrarSugestoes(false);
  };

  const removerItem = (id) => {
    setHistorico(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-40">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-black text-green-500 italic uppercase">BIO SCANNER</h1>
      </header>

      {/* PROGRESSO CALORIAS */}
      <div className="max-w-md mx-auto mb-4">
        <div className="flex justify-between items-end mb-1">
          <p className="text-[10px] font-black uppercase text-zinc-500">Energia Diária</p>
          <p className="text-xs font-bold text-green-500">{totalDia} / {META_CALORIAS} kcal</p>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-green-500 transition-all duration-500" 
            style={{ width: `${Math.min((totalDia / META_CALORIAS) * 100, 100)}%` }} 
          />
        </div>
      </div>

      {/* PROGRESSO PROTEÍNA */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex justify-between items-end mb-1">
          <p className="text-[10px] font-black uppercase text-zinc-500">Construção Muscular</p>
          <p className="text-xs font-bold text-blue-400">{proteinaDia} / {META_PROTEINA}g</p>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-blue-500 transition-all duration-500" 
            style={{ width: `${Math.min((proteinaDia / META_PROTEINA) * 100, 100)}%` }} 
          />
        </div>
      </div>

      {/* IA FEEDBACK BOX */}
      <div className="max-w-md mx-auto mb-8 bg-zinc-900/30 p-3 rounded-2xl border border-zinc-800/50">
        <p className="text-[8px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Análise de Campo</p>
        <div className="space-y-1">
          {feedbackIA.map((msg, i) => (
            <p key={i} className="text-[10px] font-bold text-zinc-400 uppercase italic">› {msg}</p>
          ))}
        </div>
      </div>

      {/* LISTA DE HISTÓRICO */}
      <div className="space-y-4 max-w-md mx-auto">
        {historico.length > 0 ? (
          historico.map(item => (
            <div key={item.id} className="bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 relative group animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={() => removerItem(item.id)} 
                className="absolute top-3 right-3 text-zinc-700 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
              <p className="text-green-500 font-black uppercase italic text-xs">{item.alimento}</p>
              <p className="text-[8px] text-zinc-600 font-bold mb-3">{item.hora}</p>
              <div className="grid grid-cols-4 text-center border-t border-white/5 pt-3">
                <MacroBox label="PROT" value={`${item.proteina}g`} />
                <MacroBox label="CARB" value={`${item.carbo}g`} />
                <MacroBox label="GORD" value={`${item.gordura}g`} />
                <MacroBox label="KCAL" value={item.calorias} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-20">
            <p className="text-[10px] font-black uppercase italic tracking-widest">Nenhum dado escaneado hoje</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT FLUTUANTE COM AUTOCOMPLETE */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-50">
        <div className="max-w-md mx-auto relative">
          {mostrarSugestoes && sugestoes.length > 0 && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              {sugestoes.map((item, i) => (
                <div 
                  key={i} 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const partes = inputTexto.split(/[,+]/);
                    partes[partes.length - 1] = item.nome;
                    setInputTexto(partes.join(" + ") + " ");
                    setMostrarSugestoes(false);
                  }}
                  className="p-3 hover:bg-green-500/10 cursor-pointer text-xs font-bold uppercase border-b border-white/5 last:border-0"
                >
                  <span className="text-green-500">＋</span> {item.nome}
                </div>
              ))}
            </div>
          )}

          <div className="bg-zinc-900 p-2 rounded-2xl border border-green-500/30 shadow-2xl flex items-center gap-2">
            <input
              value={inputTexto}
              onChange={(e) => {
                const valor = e.target.value;
                setInputTexto(valor);
                const ultima = valor.split(/[,+]/).pop().trim();
                setSugestoes(buscarAlimentos(ultima));
                setMostrarSugestoes(true);
              }}
              onFocus={() => setMostrarSugestoes(true)}
              onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
              onKeyDown={(e) => e.key === "Enter" && analisarConteudo()}
              className="flex-1 bg-transparent outline-none text-white px-3 font-bold text-sm"
              placeholder="Ex: 200g frango + arroz"
            />
            <button 
              onClick={analisarConteudo}
              className="bg-green-500 text-black w-10 h-10 rounded-xl flex items-center justify-center font-black active:scale-90 transition-transform"
            >
              ✓
            </button>
          </div>
          {erro && <p className="text-red-500 text-[10px] font-black uppercase mt-2 text-center animate-bounce">{erro}</p>}
        </div>
      </div>

      <Navbar />
    </div>
  );
}