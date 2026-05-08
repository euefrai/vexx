"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export function StreakWidget({ userId, sizeClass = "lg" }) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const result = await supabase
          .from("runs")
          .select("created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        const allRuns = result.data;

        if (!allRuns || allRuns.length === 0) {
          setStreak(0);
          return;
        }

        const dates = allRuns.map(r => new Date(r.created_at).toDateString());
        const uniqueDates = [...new Set(dates)];

        let streakCount = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const dateStr of uniqueDates) {
          const date = new Date(dateStr);
          if ((currentDate - date) / (1000 * 60 * 60 * 24) === streakCount) {
            streakCount++;
          } else {
            break;
          }
        }

        setStreak(streakCount);
      } catch (error) {
        console.error("Error calculating streak:", error);
      }
    };

    if (userId) {
      loadStreak();
    }
  }, [userId]);

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-lg flex items-center gap-2 font-bold text-orange-400 ${sizes[sizeClass]}`}
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-lg"
      >
        🔥
      </motion.span>
      <span>{streak} dias</span>
    </motion.div>
  );
}
