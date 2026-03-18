"use client"
import { useState } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

export default function MetabolismoPage() {
  const [dados, setDados] = useState({ peso: "", altura: "", idade: "", genero: "M", atividade: "1.2" });
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const { peso, altura, idade, genero, atividade } = dados;
    let tmb = 0;

    // Fórmula de Harris-Benedict
    if (genero === "M") {
      tmb = 66.5 + (13.75 * peso) + (5.003 * altura) - (6.75 * idade);
    } else {
      tmb = 655.1 + (9.563 * peso) + (1.85 * altura) - (4.676 * idade);
    }

    const gastoTotal = Math.round(tmb * parseFloat(atividade));
    setResultado({ basal: Math.round(tmb), total: gastoTotal });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32 font-sans">
      <Link href="/lab" className="text-zinc-600 uppercase font-black text-[10px]">← Voltar</Link>
      <h1 className="text-2xl font-black uppercase italic text-yellow-500 mt-6 mb-8 tracking-tighter">TAXA METABÓLICA</h1>

      <div className="space-y-4 max-w-xs mx-auto">
        <div className="flex gap-4 mb-4">
          <button onClick={() => setDados({...dados, genero: 'M'})} className={`flex-1 p-3 rounded-2xl font-black italic text-xs border ${dados.genero === 'M' ? 'bg-yellow-500 text-black border-yellow-500' : 'border-zinc-800 text-zinc-500'}`}>MASCULINO</button>
          <button onClick={() => setDados({...dados, genero: 'F'})} className={`flex-1 p-3 rounded-2xl font-black italic text-xs border ${dados.genero === 'F' ? 'bg-yellow-500 text-black border-yellow-500' : 'border-zinc-800 text-zinc-500'}`}>FEMININO</button>
        </div>

        <InputLab label="Peso (kg)" type="number" value={dados.peso} onChange={(v) => setDados({...dados, peso: v})} />
        <InputLab label="Altura (cm)" type="number" value={dados.altura} onChange={(v) => setDados({...dados, altura: v})} />
        <InputLab label="Idade" type="number" value={dados.idade} onChange={(v) => setDados({...dados, idade: v})} />

        <div>
          <label className="text-[8px] font-black uppercase text-zinc-500 ml-2">Nível de Atividade</label>
          <select 
            onChange={(e) => setDados({...dados, atividade: e.target.value})}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 font-black italic text-xs outline-none focus:border-yellow-500 mt-1"
          >
            <option value="1.2">Sedentário</option>
            <option value="1.375">Leve (1-2 dias/sem)</option>
            <option value="1.55">Moderado (3-5 dias/sem)</option>
            <option value="1.725">Pesado (6-7 dias/sem)</option>
            <option value="1.9">Atleta Elite (2x por dia)</option>
          </select>
        </div>

        <button onClick={calcular} className="w-full bg-yellow-500 text-black font-black uppercase italic p-5 rounded-[2rem] mt-4 shadow-lg shadow-yellow-500/10">Calcular Gasto Energético</button>

        {resultado && (
          <div className="mt-8 space-y-3 animate-in fade-in zoom-in duration-500">
            <ResultCard label="Metabolismo Basal" value={`${resultado.basal} kcal`} />
            <ResultCard label="Gasto Diário Total" value={`${resultado.total} kcal`} highlight />
          </div>
        )}
      </div>
      <Navbar />
    </div>
  )
}

function InputLab({ label, value, onChange, type }) {
  return (
    <div>
      <label className="text-[8px] font-black uppercase text-zinc-500 ml-2">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 font-black italic outline-none focus:border-yellow-500 mt-1" 
      />
    </div>
  )
}

function ResultCard({ label, value, highlight }) {
  return (
    <div className={`p-5 rounded-[2rem] border ${highlight ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-zinc-900 border-zinc-800'}`}>
      <p className={`text-[8px] font-black uppercase mb-1 ${highlight ? 'text-black/60' : 'text-zinc-500'}`}>{label}</p>
      <p className="text-3xl font-black italic tracking-tighter">{value}</p>
    </div>
  )
}