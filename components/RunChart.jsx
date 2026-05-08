"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

export default function RunChart({ positions }) {
  const data = positions.map((p, i) => ({
    time: i,
    speed: parseFloat((p.speed || 0).toFixed(1)),
  }));

  // Calcula estatísticas para a tooltip
  const maxSpeed = data.length > 0 ? Math.max(...data.map(d => d.speed)) : 0;
  const minSpeed = data.length > 0 ? Math.min(...data.map(d => d.speed)) : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-slate-900/95 border border-emerald-500/50 rounded-lg p-2 backdrop-blur-sm shadow-lg shadow-emerald-500/20">
          <p className="text-emerald-400 font-bold text-sm">{payload[0].value.toFixed(1)} km/h</p>
          <p className="text-slate-400 text-xs">Ponto #{payload[0].payload.time}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-48 sm:h-56 mt-2 bg-gradient-to-b from-slate-800/40 to-slate-900/20 rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-slate-700/30 shadow-xl shadow-emerald-500/5 overflow-hidden relative group hover:border-emerald-500/40 transition-all duration-300">
      {/* Efeito de brilho superior */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent group-hover:via-emerald-500/50 transition-all duration-300" />
      
      {/* Loading estados */}
      {data.length === 0 && (
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-emerald-500 mx-auto mb-2 animate-spin" />
            <p>Aguardando dados de velocidade...</p>
          </div>
        </div>
      )}

      {data.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff9f" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#00e0ff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00e0ff" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#334155" 
                opacity={0.15}
                vertical={false}
              />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, Math.max(maxSpeed + 5, 20)]} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0, 255, 159, 0.3)" }} />
              <Area
                type="monotone"
                dataKey="speed"
                stroke="#00ff9f"
                strokeWidth={2}
                fill="url(#speedGradient)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Estadísticas inline */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] sm:text-xs text-slate-400 bg-gradient-to-r from-slate-900/60 to-transparent px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Min: <span className="text-cyan-400 font-bold">{minSpeed.toFixed(1)} km/h</span></span>
            <span>Max: <span className="text-emerald-400 font-bold">{maxSpeed.toFixed(1)} km/h</span></span>
            <span>Pontos: <span className="text-blue-400 font-bold">{data.length}</span></span>
          </div>
        </>
      )}

      {/* Efeito de brilho inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent group-hover:via-cyan-500/40 transition-all duration-300" />
    </div>
  );
}