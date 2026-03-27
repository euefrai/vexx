"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function RunChart({ positions }) {
  const data = positions.map((p, i) => ({
    time: i,
    speed: p.speed || 0,
  }));

  return (
    <div className="w-full h-40 mt-2 bg-gradient-to-b from-slate-800/60 to-slate-900/40 rounded-2xl p-3 border border-slate-700/30 shadow-xl shadow-emerald-500/5 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff9f" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#00e0ff" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis dataKey="time" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(100, 255, 159, 0.3)",
              borderRadius: "8px",
              boxShadow: "0 0 20px rgba(0, 255, 159, 0.2)"
            }}
            labelStyle={{ color: "#00ff9f" }}
          />
          <Line
            type="monotone"
            dataKey="speed"
            strokeWidth={3}
            stroke="url(#speedGradient)"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
    </div>
  );
}