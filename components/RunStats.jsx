"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Flame, Gauge, Clock, Heart, Activity, ArrowUp, Compass } from "lucide-react";

// ---------------------------------------------------------------------------
// AnimatedNumber – smoothly interpolates between numeric values over ~300ms
// using requestAnimationFrame with an ease-out cubic curve.
// For string values (e.g. "--") it falls through instantly.
// ---------------------------------------------------------------------------
function AnimatedNumber({ value, decimals = 0 }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(typeof value === "number" ? value : parseFloat(value) || 0);
  const rafRef = useRef(null);

  useEffect(() => {
    const to = typeof value === "number" ? value : parseFloat(value);

    // Non-numeric → show as-is (e.g. "--")
    if (isNaN(to)) {
      setDisplay(value);
      prevRef.current = 0;
      return;
    }

    const from = prevRef.current;
    if (from === to) {
      setDisplay(decimals > 0 ? to.toFixed(decimals) : Math.round(to));
      return;
    }

    const duration = 300;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = from + (to - from) * eased;
      setDisplay(decimals > 0 ? current.toFixed(decimals) : Math.round(current));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    };

    // Cancel any in-flight animation before starting a new one
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    prevRef.current = to;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, decimals]);

  return <>{display}</>;
}

// ---------------------------------------------------------------------------
// Breathing animation variants for active metric cards
// ---------------------------------------------------------------------------
const breathingTransition = {
  duration: 3,
  repeat: Infinity,
  ease: "easeInOut",
};

// ---------------------------------------------------------------------------
// Accent gradient color map (CSS-friendly) – derived from each card's palette
// ---------------------------------------------------------------------------
const ACCENT_CSS_COLORS = {
  emerald: "rgba(52,211,153,0.6)",
  blue: "rgba(96,165,250,0.6)",
  cyan: "rgba(34,211,238,0.6)",
  rose: "rgba(251,113,133,0.6)",
  purple: "rgba(192,132,252,0.6)",
  orange: "rgba(251,146,60,0.6)",
  amber: "rgba(251,191,36,0.6)",
  indigo: "rgba(129,140,248,0.6)",
};

export default function RunStats({ 
  distance, 
  time, 
  pace, 
  positions = [],
  currentSpeed = 0,
  avgSpeed = 0,
}) {
  // -------------------------------------------------------------------
  // Organic jitter for BPM and Cadence – updates every 800ms
  // -------------------------------------------------------------------
  const [jitter, setJitter] = useState({ hr: 0, cad: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setJitter({
        hr: Math.round((Math.random() - 0.5) * 4),   // +/- 2
        cad: Math.round((Math.random() - 0.5) * 2),   // +/- 1
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Simular métricas avançadas baseadas na velocidade real e distância para manter HUD vivo
  const advancedStats = useMemo(() => {
    const isRunning = currentSpeed > 0.5;
    
    // Frequência Cardíaca (BPM) – with organic jitter
    const heartRate = isRunning 
      ? Math.min(185, Math.round(120 + (currentSpeed * 4.5) + (Math.sin(time / 20) * 3) + jitter.hr))
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

    // Cadência (Passos por minuto - SPM) – with organic jitter
    const cadence = isRunning
      ? Math.min(195, Math.round(135 + (currentSpeed * 3.8) + (Math.cos(time / 15) * 2) + jitter.cad))
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
  }, [distance, currentSpeed, time, jitter]);

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

  // Derive running state for breathing animation
  const isRunning = currentSpeed > 0.5;

  // -------------------------------------------------------------------
  // Dynamic HR card styling based on intensity zone
  // -------------------------------------------------------------------
  const hrIntensity = useMemo(() => {
    if (advancedStats.heartRate > 165) {
      return {
        borderColor: "border-rose-500/40",
        cardPulse: "animate-pulse",
        glowShadow: "0 0 20px rgba(244,63,94,0.25), 0 0 40px rgba(244,63,94,0.1)",
      };
    }
    if (advancedStats.heartRate > 145) {
      return {
        borderColor: "border-orange-500/35",
        cardPulse: "",
        glowShadow: "0 0 16px rgba(251,146,60,0.2), 0 0 32px rgba(251,146,60,0.08)",
      };
    }
    return {
      borderColor: "border-rose-500/20",
      cardPulse: "",
      glowShadow: "none",
    };
  }, [advancedStats.heartRate]);

  // -------------------------------------------------------------------
  // Stat card definitions – which values get AnimatedNumber
  // -------------------------------------------------------------------
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
      accent: "emerald",
      animated: true,
      decimals: 2,
      rawValue: distance,
      primary: true,
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
      accent: "blue",
      animated: false,
      primary: true,
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
      accent: "cyan",
      animated: false,
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
      borderColor: hrIntensity.borderColor,
      cardPulse: hrIntensity.cardPulse,
      cardGlow: hrIntensity.glowShadow,
      accent: "rose",
      animated: true,
      decimals: 0,
      rawValue: advancedStats.heartRate > 0 ? advancedStats.heartRate : "--",
      isHR: true,
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
      accent: "purple",
      animated: true,
      decimals: 0,
      rawValue: advancedStats.cadence > 0 ? advancedStats.cadence : "--",
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
      accent: "orange",
      animated: true,
      decimals: 0,
      rawValue: advancedStats.calories,
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
      accent: "amber",
      animated: true,
      decimals: 0,
      rawValue: advancedStats.elevation,
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
      accent: "indigo",
      animated: true,
      decimals: 1,
      rawValue: avgSpeed,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const accentCssColor = ACCENT_CSS_COLORS[stat.accent] || "rgba(255,255,255,0.15)";

        return (
          <motion.div
            key={idx}
            animate={isRunning ? { scale: [1, 1.008, 1] } : { scale: 1 }}
            transition={isRunning ? breathingTransition : { duration: 0.3 }}
            className={`relative bg-zinc-900/60 backdrop-blur-md border ${stat.borderColor} rounded-2xl p-3 hover:bg-zinc-900/80 transition-all duration-300 shadow-lg ${stat.glowColor} ${stat.cardPulse || ""} group`}
            style={stat.cardGlow && stat.cardGlow !== "none" ? { boxShadow: stat.cardGlow } : undefined}
          >
            {/* Accent-colored top gradient line – glows when active */}
            <div
              className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl transition-all duration-500"
              style={{
                background: isRunning
                  ? `linear-gradient(90deg, transparent, ${accentCssColor}, transparent)`
                  : "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
              }}
            />
            
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-zinc-400 font-extrabold tracking-widest uppercase truncate max-w-[80%]">
                {stat.label}
              </span>
              <Icon size={14} className={`${stat.iconColor} ${stat.iconAnim || ""} opacity-75 group-hover:opacity-100 transition-opacity`} />
            </div>

            <div className="flex items-baseline gap-1">
              <span className={`${stat.primary ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"} font-black text-white tracking-tight leading-none`}>
                {stat.animated ? (
                  <AnimatedNumber value={stat.rawValue} decimals={stat.decimals} />
                ) : (
                  stat.value
                )}
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
          </motion.div>
        );
      })}
    </div>
  );
}
