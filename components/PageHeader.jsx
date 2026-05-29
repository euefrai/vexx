"use client";

import { motion } from "framer-motion";

export default function PageHeader({ icon, title, subtitle, color = "green" }) {
  const colorMap = {
    green: "border-emerald-500/20 bg-emerald-500/5",
    red: "border-rose-500/20 bg-rose-500/5",
    blue: "border-blue-500/20 bg-blue-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
    orange: "border-orange-500/20 bg-orange-500/5",
  };

  const colorText = {
    green: "text-emerald-400",
    red: "text-rose-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-5 mb-6 ml-4 mr-4 backdrop-blur-sm ${colorMap[color]}`}
    >
      <div className="flex items-center gap-4">
        {icon && <div className="text-3xl flex items-center justify-center">{icon}</div>}
        <div className="flex-1">
          <h1 className={`text-xl sm:text-2xl font-extrabold uppercase tracking-wider ${colorText[color]}`}>
            {title}
          </h1>
          {subtitle && <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
}

