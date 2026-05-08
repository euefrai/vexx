"use client";

import React, { useMemo } from "react";
import { Zap, Flame, Gauge, Clock, MapPin, Eye } from "lucide-react";

export default function RunStats({ 
  distance, 
  time, 
  pace, 
  positions = [],
  currentSpeed = 0,
  avgSpeed = 0,
}) {
  // Memoize cálculos
  const statsData = useMemo(() => {
    const maxSpeedVal = positions.length > 0 
      ? Math.max(...positions.map(p => p.speed || 0)).toFixed(1) 
      : 0;
    
    const calories = Math.round(distance * 63);

    return {
      currentSpeed: currentSpeed > 0 ? currentSpeed.toFixed(1) : "0",
      maxSpeed: maxSpeedVal,
      avgSpeedVal: avgSpeed > 0 ? avgSpeed.toFixed(1) : 0,
      calories,
    };
  }, [distance, positions, currentSpeed, avgSpeed]);

  const stats = [
    {
      label: "Distância",
      value: distance.toFixed(2),
      unit: "km",
      icon: MapPin,
      color: "from-emerald-500 to-green-500",
      bgColor: "from-emerald-900/20 to-emerald-900/10",
      borderColor: "emerald-500/30",
    },
    {
      label: "Queimadas",
      value: statsData.calories,
      unit: "kcal",
      icon: Flame,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-900/20 to-orange-900/10",
      borderColor: "orange-500/30",
    },
    {
      label: "Vel. Atual",
      value: statsData.currentSpeed,
      unit: "km/h",
      icon: Gauge,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-900/20 to-blue-900/10",
      borderColor: "blue-500/30",
    },
    {
      label: "Vel. Máxima",
      value: statsData.maxSpeed,
      unit: "km/h",
      icon: Zap,
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-900/20 to-purple-900/10",
      borderColor: "purple-500/30",
    },
    {
      label: "Vel. Média",
      value: statsData.avgSpeedVal,
      unit: "km/h",
      icon: Eye,
      color: "from-cyan-500 to-blue-500",
      bgColor: "from-cyan-900/20 to-cyan-900/10",
      borderColor: "cyan-500/30",
    },
    {
      label: "Tempo",
      value: `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, "0")}`,
      unit: "min",
      icon: Clock,
      color: "from-indigo-500 to-purple-500",
      bgColor: "from-indigo-900/20 to-indigo-900/10",
      borderColor: "indigo-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`bg-gradient-to-br ${stat.bgColor} border border-${stat.borderColor.split("-")[0]}-${stat.borderColor.split("-")[1]}/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 hover:border-opacity-60 transition-all duration-300 group cursor-default`}
          >
            <div className="flex items-start gap-2 mb-2">
              <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}>
                <Icon size={14} className={`text-${stat.color.split(" ")[1]}`} />
              </div>
              <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold tracking-tight line-clamp-1">
                {stat.label}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <h3 className="text-base sm:text-lg font-black text-white">
                {stat.value}
              </h3>
              <span className="text-[7px] sm:text-[8px] text-slate-400 font-medium">
                {stat.unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
