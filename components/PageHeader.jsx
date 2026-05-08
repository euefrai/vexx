"use client";

import { motion } from "framer-motion";

export default function PageHeader({ icon, title, subtitle, color = "green" }) {
  const colorMap = {
    green: "from-green-600/20 via-green-900/10 to-transparent border-green-500/30",
    red: "from-red-600/20 via-red-900/10 to-transparent border-red-500/30",
    blue: "from-blue-600/20 via-blue-900/10 to-transparent border-blue-500/30",
    purple: "from-purple-600/20 via-purple-900/10 to-transparent border-purple-500/30",
    orange: "from-orange-600/20 via-orange-900/10 to-transparent border-orange-500/30",
  };

  const colorText = {
    green: "text-green-400",
    red: "text-red-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${colorMap[color]} backdrop-blur-sm border rounded-2xl p-6 mb-6 ml-4 mr-4`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl sm:text-5xl">{icon}</div>
        <div className="flex-1">
          <h1 className={`text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-2 ${colorText[color]}`}>
            {title}
          </h1>
          {subtitle && <p className="text-sm sm:text-base text-slate-300 font-medium">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
}
