"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import PageHeader from "@/components/PageHeader"
import { Sparkles, Brain, Cpu, ShieldAlert, Award, Compass, Zap, CheckCircle2, ChevronRight, RefreshCw, BarChart2 } from "lucide-react"

export default function CriarTreinoIA() {
  const [loading, setLoading] = useState(false)
  const [treino, setTreino] = useState("")
  const [loadingStep, setLoadingStep] = useState(0)
  
  // Custom presets
  const [nivel, setNivel] = useState("Intermediário")
  const [objetivo, setObjetivo] = useState("Hipertrofia")
  const [divisao, setDivisao] = useState("Full Body")
  const [observacoes, setObservacoes] = useState("")
  const router = useRouter()

  const niveis = [
    { id: "Iniciante", label: "Recruta (Iniciante)", desc: "Fundamentos e adaptação muscular" },
    { id: "Intermediário", label: "Soldado (Intermediário)", desc: "Intensidade progressiva e volume" },
    { id: "Avançado", label: "Elite (Avançado)", desc: "Exaustão muscular e técnicas avançadas" }
  ]

  const objetivos = [
    { id: "Hipertrofia", label: "Hipertrofia", icon: "💪" },
    { id: "Resistência", label: "Resistência / Aero", icon: "🏃" },
    { id: "Emagrecimento", label: "Definição / Queima", icon: "🔥" },
    { id: "Calistenia", label: "Calistenia (Corporal)", icon: "🧗" }
  ]

  const divisoes = [
    "Full Body", "Push / Pull / Legs", "Membros Superiores", "Membros Inferiores", "Cardio Extremo"
  ]

  const loadingPhrases = [
    "🛰️ CONECTANDO À REDE DE COMANDO VEXX...",
    "🧬 ANALISANDO BIOMETRIA E VARIABILIDADE FÍSICA...",
    "⚙️ PROJETANDO EQUILÍBRIO DE REPETIÇÕES E SÉRIES...",
    "🔋 ESTRUTURANDO PROTOCOLOS DE RECUPERAÇÃO BIOLÓGICA...",
    "🎯 OTIMIZANDO CURVAS DE TENSÃO E INTENSIDADE...",
    "⚡ COMPILANDO INSTRUÇÕES DO BRIEFING TÁTICO FINAL..."
  ]

  // Telemetry loop for loading state
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingPhrases.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  async function gerarTreino() {
    setLoading(true)
    setTreino("")
    setLoadingStep(0)

    // Constrói um prompt extremamente rico baseado nos presets do usuário
    const promptConstruido = `Solicitação do Atleta VEXX:
- Nível de Experiência: ${nivel}
- Objetivo Tático: ${objetivo}
- Divisão Selecionada: ${divisao}
${observacoes ? `- Foco e Notas Extras: ${observacoes}` : ""}

Por favor, elabore um plano de exercícios otimizado de alto rendimento.`

    try {
      const res = await fetch("/api/gerar-treino", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: promptConstruido })
      })

      const data = await res.json()
      
      if (data.treino) {
        setTreino(data.treino)
      } else {
        alert("O servidor de comando VEXX falhou ao retornar a ficha tática.")
      }
    } catch (err) {
      console.error(err)
      alert("Falha na rede neural tática. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function enviarParaMissao() {
    if (!treino) return
    const encoded = encodeURIComponent(treino)
    router.push(`/novo-treino?ia=${encoded}`)
  }

  // Parse do treino retornado para exibir em formato visual premium
  const parseTreino = () => {
    if (!treino) return { titulo: "Missão Tática IA", exercicios: [] }
    const linhas = treino.split("\n").map(l => l.trim()).filter(Boolean)
    const titulo = linhas[0] || "Missão IA VEXX"
    
    const exercicios = linhas.slice(1).map(linha => {
      if (linha.includes(":")) {
        const [nome, series] = linha.split(":")
        return { nome: nome.trim(), series: series.trim() }
      }
      return { nome: linha, series: "3 séries" }
    })

    return { titulo, exercicios }
  }

  const { titulo: treinoTitulo, exercicios: treinoExercicios } = parseTreino()

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-950 via-black to-black text-white p-4 pb-36 font-sans">
      <PageHeader icon="🤖" title="Gerador de Treinos" subtitle="Inteligência Artificial de Combate Muscular" color="green" />

      <div className="max-w-md mx-auto mt-6 space-y-6">
        
        {/* Painel de Configurações - Visível apenas se não estiver gerando nem tiver resultado pronto */}
        {!loading && !treino && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-350">
            
            {/* 🎯 PRESET 1: NÍVEL OPERACIONAL */}
            <div className="bg-zinc-950/80 p-4 rounded-3xl border border-zinc-800/80 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Compass className="text-green-500" size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">1. Nível Operacional</p>
              </div>
              <div className="space-y-2">
                {niveis.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setNivel(n.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      nivel === n.id 
                        ? "bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                        : "bg-zinc-900/40 border-zinc-850 hover:bg-zinc-900"
                    }`}
                  >
                    <p className={`font-black text-xs uppercase tracking-wide ${nivel === n.id ? "text-green-500" : "text-zinc-300"}`}>{n.label}</p>
                    <p className="text-[9px] text-zinc-500 font-medium mt-0.5">{n.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 🔥 PRESET 2: OBJETIVO TÁTICO */}
            <div className="bg-zinc-950/80 p-4 rounded-3xl border border-zinc-800/80">
              <div className="flex items-center gap-2 mb-3">
                <Award className="text-green-500" size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">2. Objetivo Tático</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {objetivos.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => setObjetivo(obj.id)}
                    className={`p-3.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      objetivo === obj.id 
                        ? "bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                        : "bg-zinc-900/40 border-zinc-850 hover:bg-zinc-900"
                    }`}
                  >
                    <span className="text-xl">{obj.icon}</span>
                    <p className={`font-black text-[10px] uppercase tracking-wide ${objetivo === obj.id ? "text-green-500" : "text-zinc-300"}`}>{obj.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ⚙️ PRESET 3: DIVISÃO DE TREINAMENTO */}
            <div className="bg-zinc-950/80 p-4 rounded-3xl border border-zinc-800/80">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="text-green-500" size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">3. Divisão Operacional</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {divisoes.map((div) => (
                  <button
                    key={div}
                    onClick={() => setDivisao(div)}
                    className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      divisao === div 
                        ? "bg-green-500/10 border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]" 
                        : "bg-zinc-900/40 border-zinc-850 hover:bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    {div}
                  </button>
                ))}
              </div>
            </div>

            {/* 📝 ANOTAÇÕES EXTRAS */}
            <div className="bg-zinc-950/80 p-4 rounded-3xl border border-zinc-800/80">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="text-green-500" size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">4. Exigências Especiais (Opcional)</p>
              </div>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Foco nos deltoides, tenho dores no joelho esquerdo, treinar em casa apenas..."
                className="w-full h-20 p-3 bg-zinc-900/50 rounded-2xl outline-none border border-zinc-850 focus:border-green-500 text-xs font-semibold text-zinc-300 placeholder:text-zinc-650 resize-none"
              />
            </div>

            {/* BOTÃO GERAR */}
            <button
              onClick={gerarTreino}
              className="w-full bg-green-500 text-black py-4.5 rounded-2xl font-black shadow-[0_0_25px_rgba(34,197,94,0.35)] hover:brightness-105 transition-all duration-200 active:scale-[0.98] uppercase italic text-xs tracking-widest flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} className="animate-pulse" />
              GERAR MISSÃO TÁTICA IA
            </button>

          </div>
        )}

        {/* 🛰️ SCANNER DE CARREGAMENTO (HUD MILITAR) */}
        {loading && (
          <div className="bg-zinc-950/80 border border-green-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300 min-h-[300px] flex flex-col justify-center">
            
            {/* Holographic Radar Simulation */}
            <div className="relative w-24 h-24 mx-auto mb-2">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-green-500/20 animate-spin" style={{ animationDuration: '10s' }}></div>
              <div className="absolute inset-2 rounded-full border border-green-500/35 animate-ping" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-4 rounded-full border border-green-500/50 flex items-center justify-center bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                <Brain className="text-green-500 animate-pulse" size={24} />
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-green-500 text-[10px] font-black tracking-widest animate-pulse uppercase">
                {loadingPhrases[loadingStep]}
              </p>
              <div className="w-48 h-1 bg-zinc-900 rounded-full mx-auto overflow-hidden relative">
                <div 
                  className="h-full bg-green-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                  style={{ width: `${((loadingStep + 1) / loadingPhrases.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-[8px] text-zinc-600 font-mono space-y-1 uppercase tracking-widest">
              <p>Conexão orbital estável</p>
              <p>Segurança tática: Ativa</p>
            </div>
          </div>
        )}

        {/* 📝 RESULTADO GERADO (PAINEL ESTRUTURADO DE FICHA TÁTICA) */}
        {treino && !loading && (
          <div className="space-y-5 animate-in fade-in zoom-in duration-350">
            
            <div className="bg-zinc-950/80 p-5 rounded-3xl border border-green-500/30 shadow-2xl relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg">
                    <Sparkles size={14} />
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Briefing do Treino Gerado</p>
                </div>
                <span className="text-[8px] bg-green-500 text-black px-2 py-0.5 rounded-md font-black uppercase tracking-wider animate-pulse">PRONTO</span>
              </div>

              {/* Título do Treino */}
              <h2 className="text-base font-black text-green-500 uppercase tracking-wide mb-4 italic flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                {treinoTitulo}
              </h2>

              {/* Grade de Exercícios Estruturados */}
              <div className="space-y-2.5">
                {treinoExercicios.length > 0 ? (
                  treinoExercicios.map((ex, idx) => (
                    <div 
                      key={idx} 
                      className="bg-zinc-900/60 border border-zinc-850 p-3 rounded-2xl flex items-center justify-between group hover:border-green-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-black flex items-center justify-center text-zinc-500 group-hover:text-green-500 group-hover:border-green-500/20 transition-colors">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="text-[11px] font-black text-zinc-200 uppercase tracking-wide leading-tight group-hover:text-white transition-colors">{ex.nome}</p>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 bg-zinc-950 border border-zinc-850 text-green-500 text-[9px] font-black uppercase rounded-lg group-hover:border-green-500/10 transition-colors">
                        {ex.series}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-400 text-xs italic">Não foi possível estruturar os exercícios da forma padrão. Verifique o briefing bruto abaixo.</p>
                )}
              </div>

              {/* Exibição Completa/Livre se necessário */}
              <div className="mt-4 pt-4 border-t border-zinc-900">
                <details className="cursor-pointer group">
                  <summary className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1 select-none">
                    <span>VISUALIZAR BRIEFING DETALHADO COMPLETO</span>
                    <ChevronRight size={10} className="group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-2.5 text-[10px] leading-relaxed font-semibold text-zinc-400 whitespace-pre-line bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-850 font-mono">
                    {treino}
                  </p>
                </details>
              </div>

              {/* Botões de Ações */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={enviarParaMissao}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black shadow-lg active:scale-[0.98] transition-all uppercase italic text-xs tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  ENVIAR E REGISTRAR MISSÃO TÁTICA 🚀
                </button>
                
                <button
                  onClick={() => setTreino("")}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white py-3 rounded-2xl font-black active:scale-[0.98] transition-all uppercase italic text-[10px] tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={11} />
                  RECONFIGURAR TREINAMENTO
                </button>
              </div>

            </div>

          </div>
        )}

      </div>

      <Navbar />
    </div>
  )
}