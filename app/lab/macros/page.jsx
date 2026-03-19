"use client"
import { useState, useRef, useEffect } from "react"
import Navbar from "@/components/Navbar"
import { alimentos } from "../../data/alimentos";

// 🔍 AUTOCOMPLETE
function buscarAlimentos(query) {
  if (!query) return [];
  const q = query.toLowerCase();

  return alimentos
    .filter(a =>
      a.nome.includes(q) ||
      q.split(" ").some(p => a.nome.includes(p))
    )
    .slice(0, 5);
}

// 🧠 CALCULO
function calcularMacros(texto) {
  const itens = texto.toLowerCase().split(/[,+]/);

  let total = {
    alimento: texto,
    proteina: 0,
    carbo: 0,
    gordura: 0,
    calorias: 0
  };

  let encontrados = 0;

  itens.forEach(item => {
    item = item.trim();

    let quantidadeGramas = 100;
    let matchGramas = item.match(/(\d+)\s*g/);

    if (matchGramas) {
      quantidadeGramas = parseInt(matchGramas[1]);
    }

    let quantidadeUnidade = 1;
    let matchUnidade = item.match(/^(\d+)/);

    if (matchUnidade && !matchGramas) {
      quantidadeUnidade = parseInt(matchUnidade[1]);
    }

    const alimentoEncontrado = alimentos.find(a =>
      item.includes(a.nome) ||
      a.nome.includes(item) ||
      item.split(" ").some(p => a.nome.includes(p))
    );

    if (alimentoEncontrado) {
      let fator = quantidadeGramas / 100;

      if (alimentoEncontrado.unidade && matchUnidade) {
        fator = quantidadeUnidade;
      }

      total.proteina += alimentoEncontrado.proteina * fator;
      total.carbo += alimentoEncontrado.carbo * fator;
      total.gordura += alimentoEncontrado.gordura * fator;
      total.calorias += alimentoEncontrado.calorias * fator;

      encontrados++;
    }
  });

  if (encontrados === 0) return null;

  total.proteina = Number(total.proteina.toFixed(1));
  total.carbo = Number(total.carbo.toFixed(1));
  total.gordura = Number(total.gordura.toFixed(1));
  total.calorias = Math.round(total.calorias);

  return total;
}

// 🤖 IA OFFLINE (ANÁLISE)
function analisarDieta(calorias, proteina, metaCal, metaProt) {
  let feedback = [];

  if (calorias < metaCal * 0.7) {
    feedback.push("⚠️ Poucas calorias (pode faltar energia)");
  } else if (calorias > metaCal * 1.2) {
    feedback.push("🔥 Calorias altas (cuidado com excesso)");
  } else {
    feedback.push("✅ Calorias equilibradas");
  }

  if (proteina < metaProt * 0.7) {
    feedback.push("🥩 Proteína baixa (importante pra músculo)");
  } else if (proteina >= metaProt) {
    feedback.push("💪 Proteína ideal!");
  }

  if (calorias > 0 && proteina > 0) {
    const densidade = proteina / calorias;
    if (densidade < 0.05) {
      feedback.push("🍔 Dieta pouco eficiente (baixa proteína)");
    } else {
      feedback.push("🥗 Boa qualidade nutricional");
    }
  }

  return feedback;
}

export default function MacrosPage() {
  const [inputTexto, setInputTexto] = useState("");
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState(null);

  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const META_CALORIAS = 2000;
  const META_PROTEINA = 150; // 🔥 NOVO

  const chatEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("elite_macros_history");
    if (saved) setHistorico(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("elite_macros_history", JSON.stringify(historico));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historico]);

  const totalDia = historico.reduce((acc, item) => acc + item.calorias, 0);
  const proteinaDia = historico.reduce((acc, item) => acc + item.proteina, 0);

  const feedbackIA = analisarDieta(
    totalDia,
    proteinaDia,
    META_CALORIAS,
    META_PROTEINA
  );

  const removerItem = (id) => {
    setHistorico(prev => prev.filter(item => item.id !== id));
  };

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
        hora: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      }
    ]);

    setInputTexto("");
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-40">

      <header className="text-center mb-6">
        <h1 className="text-2xl font-black text-green-500">
          BIO SCANNER
        </h1>
      </header>

      {/* 🔥 CALORIAS */}
      <div className="max-w-md mx-auto mb-4">
        <p className="text-xs text-zinc-500">
          {totalDia} / {META_CALORIAS} kcal
        </p>

        <div className="w-full h-2 bg-zinc-800 rounded-full">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{
              width: `${Math.min((totalDia / META_CALORIAS) * 100, 100)}%`
            }}
          />
        </div>
      </div>

      {/* 💪 PROTEÍNA */}
      <div className="max-w-md mx-auto mb-6">
        <p className="text-xs text-blue-400">
          {proteinaDia} / {META_PROTEINA}g proteína
        </p>

        <div className="w-full h-2 bg-zinc-800 rounded-full">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{
              width: `${Math.min((proteinaDia / META_PROTEINA) * 100, 100)}%`
            }}
          />
        </div>
      </div>

      {/* 🤖 IA FEEDBACK */}
      <div className="max-w-md mx-auto mb-6 text-xs space-y-1">
        {feedbackIA.map((msg, i) => (
          <p key={i} className="text-zinc-400">{msg}</p>
        ))}
      </div>

      {/* HISTÓRICO */}
      <div className="space-y-4 max-w-md mx-auto">
        {historico.map(item => (
          <div key={item.id} className="bg-zinc-900 p-4 rounded-xl relative group">

            <button
              onClick={() => removerItem(item.id)}
              className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100"
            >
              ✖
            </button>

            <p className="text-green-500 text-sm">{item.alimento}</p>
            <p className="text-xs text-zinc-500">{item.hora}</p>

            <div className="grid grid-cols-4 text-center mt-2">
              <MacroBox label="P" value={item.proteina} />
              <MacroBox label="C" value={item.carbo} />
              <MacroBox label="G" value={item.gordura} />
              <MacroBox label="Kcal" value={item.calorias} />
            </div>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="max-w-md mx-auto bg-zinc-900 p-2 rounded-xl relative">

          <input
            value={inputTexto}
            onChange={(e) => {
              const valor = e.target.value;
              setInputTexto(valor);

              const ultima = valor.split(/[,+]/).pop().trim();
              const res = buscarAlimentos(ultima);

              setSugestoes(res);
              setMostrarSugestoes(true);
            }}
            onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
            onFocus={() => setMostrarSugestoes(true)}
            onKeyDown={(e) => e.key === "Enter" && analisarConteudo()}
            className="w-full bg-transparent outline-none text-white px-2"
            placeholder="Ex: 200g frango + arroz"
          />

          {mostrarSugestoes && sugestoes.length > 0 && (
            <div className="absolute bottom-12 left-0 right-0 bg-zinc-800 rounded-lg">
              {sugestoes.map((item, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const partes = inputTexto.split(/[,+]/);
                    partes[partes.length - 1] = item.nome;

                    setInputTexto(partes.join(" + "));
                    setMostrarSugestoes(false);
                  }}
                  className="p-2 hover:bg-green-500/20 cursor-pointer text-sm"
                >
                  {item.nome}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {erro && <p className="text-red-500 text-center">{erro}</p>}

      <Navbar />
    </div>
  );
}

function MacroBox({ label, value }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}