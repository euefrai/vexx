"use client";

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

export default function RunChart({ positions = [] }) {
  const data = positions.map((p, i) => ({
    time: i,
    speed: parseFloat((p.speed || 0).toFixed(1)),
  }));

  const maxSpeed = data.length > 0 ? Math.max(...data.map(d => d.speed)) : 0;
  const minSpeed = data.length > 0 ? Math.min(...data.map(d => d.speed)) : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-zinc-950/95 border border-emerald-500/35 rounded-2xl p-2.5 backdrop-blur-md shadow-2xl shadow-emerald-500/10">
          <p className="text-[9px] text-zinc-500 font-extrabold tracking-widest uppercase mb-0.5">TELEMETRIA VELOCIDADE</p>
          <p className="text-emerald-400 font-black text-sm">{payload[0].value.toFixed(1)} <span className="text-[10px] text-zinc-400">km/h</span></p>
          <p className="text-zinc-400 text-[9px] font-bold">Registro #{payload[0].payload.time}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-44 sm:h-48 bg-zinc-900/40 backdrop-blur-md rounded-2xl p-3 border border-white/5 shadow-2xl relative group overflow-hidden transition-all duration-300 hover:border-emerald-500/20">
      {/* Glow Superior */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent group-hover:via-emerald-500/40 transition-all duration-300" />
      
      {/* Estado Vazio / Aguardando Dados */}
      {data.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-6 h-6 rounded-full border border-zinc-700 border-t-emerald-400 animate-spin mx-auto mb-2" />
            <p className="text-[9px] text-zinc-500 font-extrabold tracking-widest uppercase">Aguardando telemetria GPS...</p>
          </div>
        </div>
      )}

      {data.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 5, left: -22, bottom: -5 }}>
              <defs>
                <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff9f" stopOpacity={0.4} />
                  <stop offset="60%" stopColor="#00e0ff" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#00e0ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="2 4" 
                stroke="#3f3f46" 
                opacity={0.1}
                vertical={false}
              />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, Math.max(maxSpeed + 3, 15)]} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0, 255, 159, 0.25)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="speed"
                stroke="#00ff9f"
                strokeWidth={1.8}
                fill="url(#speedGradient)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Estatísticas Flutuantes HUD */}
          <div className="absolute bottom-2.5 left-3 right-3 flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-950/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Min: <span className="text-cyan-400 font-black">{minSpeed.toFixed(1)} km/h</span></span>
            <span>Máx: <span className="text-emerald-400 font-black">{maxSpeed.toFixed(1)} km/h</span></span>
            <span>Amostras: <span className="text-purple-400 font-black">{data.length}</span></span>
          </div>
        </>
      )}
    </div>
  );
}