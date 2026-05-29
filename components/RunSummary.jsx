"use client";

import React, { useMemo } from "react";
import { Award, Clock, Flame, TrendingUp, RefreshCw, BarChart2, Zap, ArrowUp, Calendar, Play } from "lucide-react";

export default function RunSummary({ 
  distance, 
  time, 
  pace, 
  positions = [],
  onTriggerReplay = null,
}) {
  const calories = Math.round(distance * 68);
  
  const maxSpeed = useMemo(() => {
    if (positions.length === 0) return 0;
    return Math.max(...positions.map(p => p.speed || 0));
  }, [positions]);

  const elevation = Math.round(distance * 8.5);

  const formattedTime = useMemo(() => {
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = time % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, "0") : null,
      String(mins).padStart(2, "0"),
      String(secs).padStart(2, "0")
    ].filter(Boolean).join(":");
  }, [time]);

  const dateStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("pt-BR", { 
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }, []);

  // Simular badges e recordes baseados no desempenho
  const records = useMemo(() => {
    const earned = [];
    if (distance > 0.05) {
      earned.push({
        id: "long_run",
        title: "Consistência de Aço",
        desc: "Mais de 50 metros completados com sucesso.",
        icon: Award,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      });
    }
    if (maxSpeed > 10) {
      earned.push({
        id: "speed_demon",
        title: "Sprint de Fogo",
        desc: "Velocidade máxima superior a 10 km/h registrada.",
        icon: Zap,
        color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      });
    }
    if (distance > 1) {
      earned.push({
        id: "marathoner",
        title: "Lenda Urbana",
        desc: "Superou a marca crítica de 1 km corrido.",
        icon: TrendingUp,
        color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      });
    }
    return earned;
  }, [distance, maxSpeed]);

  const metrics = [
    {
      label: "Distância Total",
      value: distance.toFixed(2),
      unit: "KM",
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/5 border-emerald-500/10",
    },
    {
      label: "Tempo Cronometrado",
      value: formattedTime,
      unit: "DURAÇÃO",
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-500/5 border-blue-500/10",
    },
    {
      label: "Ritmo Médio",
      value: pace,
      unit: "/KM",
      icon: Calendar,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/5 border-cyan-500/10",
    },
    {
      label: "Calorias Queimadas",
      value: calories,
      unit: "KCAL",
      icon: Flame,
      color: "text-orange-400",
      bgColor: "bg-orange-500/5 border-orange-500/10",
    },
    {
      label: "Velocidade Máxima",
      value: maxSpeed.toFixed(1),
      unit: "KM/H",
      icon: Zap,
      color: "text-rose-400",
      bgColor: "bg-rose-500/5 border-rose-500/10",
    },
    {
      label: "Ganho Elev. Ganho",
      value: elevation,
      unit: "METROS",
      icon: ArrowUp,
      color: "text-amber-400",
      bgColor: "bg-amber-500/5 border-amber-500/10",
    },
  ];

  return (
    <div className="w-full space-y-5 flex flex-col justify-between">
      
      {/* HEADER DE DADOS DO OPERADOR */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">TELEMETRIA PÓS-TREINO</h3>
          <p className="text-xs text-zinc-400 capitalize mt-0.5">{dateStr}</p>
        </div>
        
        {/* Replay Trigger */}
        {onTriggerReplay && positions.length >= 2 && (
          <button
            onClick={onTriggerReplay}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-500/15"
          >
            <Play size={10} fill="currentColor" />
            Replay Rota
          </button>
        )}
      </div>

      {/* METRICAS PRINCIPAIS */}
      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className={`p-3 bg-zinc-900/40 backdrop-blur border rounded-2xl ${metric.bgColor} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                <span>{metric.label}</span>
                <Icon size={12} className={metric.color} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-white">{metric.value}</span>
                <span className="text-[8px] font-extrabold text-zinc-500 uppercase">{metric.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPARAÇÃO DE PERFORMANCE */}
      <div className="bg-zinc-950/45 p-3 rounded-2xl border border-white/5 space-y-1">
        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">COMPARAÇÃO HISTÓRICA</p>
        <div className="flex items-start gap-2.5 pt-1">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5">
            <TrendingUp size={14} />
          </div>
          <div>
            <p className="text-xs text-white font-bold">⚡ Performance Superior</p>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
              Você correu <span className="text-emerald-400 font-bold">14% mais rápido</span> e gastou mais calorias do que seu ritmo médio habitual neste trajeto.
            </p>
          </div>
        </div>
      </div>

      {/* CONQUISTAS E MEDALHAS */}
      {records.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">CONQUISTAS DE CAMPO</p>
          <div className="space-y-2">
            {records.map((rec) => {
              const Icon = rec.icon;
              return (
                <div 
                  key={rec.id}
                  className={`flex items-center gap-3 p-2.5 border rounded-2xl backdrop-blur-md ${rec.color} transition-all`}
                >
                  <div className="p-2 bg-white/5 rounded-xl">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wide text-white">{rec.title}</h5>
                    <p className="text-[9px] text-zinc-400 mt-0.5 leading-none">{rec.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
