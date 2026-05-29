"use client";

import React, { useMemo } from "react";
import { MapPin, Flame, Gauge, Zap, Clock, Heart, Activity, ArrowUp, Compass } from "lucide-react";

export default function RunStats({ 
  distance, 
  time, 
  pace, 
  positions = [],
  currentSpeed = 0,
  avgSpeed = 0,
}) {
  // Simular métricas avançadas baseadas na velocidade real e distância para manter HUD vivo
  const advancedStats = useMemo(() => {
    const isRunning = currentSpeed > 0.5;
    
    // Frequência Cardíaca (BPM)
    const heartRate = isRunning 
      ? Math.min(185, Math.round(120 + (currentSpeed * 4.5) + (Math.sin(time / 20) * 3)))
      : 0;
      
    // Determinar Zona de Batimento Cardíaco
    let hrZone = "Repouso";
    let hrColor = "text-zinc-500";
    if (heartRate > 165) {
      hrZone = "Pico Anaeróbico";
      hrColor = "text-rose-500";
    } else if (heartRate > 145) {
      hrZone = "Cardio Aeróbico";
      hrColor = "text-orange-500";
    } else if (heartRate > 120) {
      hrZone = "Queima de Gordura";
      hrColor = "text-amber-400";
    } else if (heartRate > 0) {
      hrZone = "Aquecimento";
      hrColor = "text-emerald-400";
    }

    // Cadência (Passos por minuto - SPM)
    const cadence = isRunning
      ? Math.min(195, Math.round(135 + (currentSpeed * 3.8) + (Math.cos(time / 15) * 2)))
      : 0;

    // Passos acumulados estimados
    const steps = Math.round(distance * 1315);

    // Ganho de altitude simulado acumulado
    const elevation = Math.round(distance * 8.5);

    // Calorias (fórmula realista: ~68 kcal por km)
    const calories = Math.round(distance * 68);

    return {
      heartRate,
      hrZone,
      hrColor,
      cadence,
      steps,
      elevation,
      calories,
    };
  }, [distance, currentSpeed, time]);

  // Formatar tempo em HH:MM:SS
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

  const stats = [
    {
      label: "Distância",
      value: distance.toFixed(2),
      unit: "KM",
      icon: MapPin,
      color: "from-emerald-400 to-teal-500",
      iconColor: "text-emerald-400",
      glowColor: "shadow-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Tempo Ativo",
      value: formattedTime,
      unit: "TEMPO",
      icon: Clock,
      color: "from-blue-400 to-indigo-500",
      iconColor: "text-blue-400",
      glowColor: "shadow-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Ritmo Atual",
      value: pace,
      unit: "/KM",
      icon: Compass,
      color: "from-cyan-400 to-sky-500",
      iconColor: "text-cyan-400",
      glowColor: "shadow-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      label: "Frequência Card.",
      value: advancedStats.heartRate > 0 ? advancedStats.heartRate : "--",
      unit: "BPM",
      subText: advancedStats.heartRate > 0 ? advancedStats.hrZone : "Inativo",
      subTextColor: advancedStats.hrColor,
      icon: Heart,
      color: "from-red-400 to-rose-500",
      iconColor: "text-rose-400",
      iconAnim: advancedStats.heartRate > 0 ? "animate-pulse" : "",
      glowColor: "shadow-rose-500/10",
      borderColor: "border-rose-500/20",
    },
    {
      label: "Cadência",
      value: advancedStats.cadence > 0 ? advancedStats.cadence : "--",
      unit: "SPM",
      icon: Activity,
      color: "from-purple-400 to-fuchsia-500",
      iconColor: "text-purple-400",
      glowColor: "shadow-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      label: "Energia",
      value: advancedStats.calories,
      unit: "KCAL",
      icon: Flame,
      color: "from-orange-400 to-red-500",
      iconColor: "text-orange-400",
      glowColor: "shadow-orange-500/10",
      borderColor: "border-orange-500/20",
    },
    {
      label: "Ganho Elev.",
      value: advancedStats.elevation,
      unit: "M",
      icon: ArrowUp,
      color: "from-amber-400 to-yellow-500",
      iconColor: "text-amber-400",
      glowColor: "shadow-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Vel. Média",
      value: avgSpeed > 0 ? avgSpeed.toFixed(1) : "0.0",
      unit: "KM/H",
      icon: Gauge,
      color: "from-indigo-400 to-blue-500",
      iconColor: "text-indigo-400",
      glowColor: "shadow-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`relative bg-zinc-900/60 backdrop-blur-md border ${stat.borderColor} rounded-2xl p-3 hover:bg-zinc-900/80 transition-all duration-300 shadow-lg ${stat.glowColor} group`}
          >
            {/* Efeito de hover ciano/neon muito leve */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-t-2xl group-hover:via-white/20 transition-all duration-300" />
            
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-zinc-400 font-extrabold tracking-widest uppercase truncate max-w-[80%]">
                {stat.label}
              </span>
              <Icon size={14} className={`${stat.iconColor} ${stat.iconAnim || ""} opacity-75 group-hover:opacity-100 transition-opacity`} />
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                {stat.value}
              </span>
              <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wide">
                {stat.unit}
              </span>
            </div>

            {stat.subText && (
              <div className={`text-[8px] font-black uppercase tracking-wider mt-1 truncate ${stat.subTextColor}`}>
                {stat.subText}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
