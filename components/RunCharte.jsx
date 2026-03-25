"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RunChart({ positions }) {
  const data = positions.map((p, i) => ({
    time: i,
    speed: p.speed || 0,
  }));

  return (
    <div className="w-full h-32 mt-4 bg-slate-900/60 rounded-xl p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "none",
            }}
          />
          <Line
            type="monotone"
            dataKey="speed"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}