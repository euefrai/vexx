"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, Trophy, Target, TrendingUp, Zap, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const BADGES = {
  "primeira-corrida": {
    icon: "🏃",
    nome: "Debutante",
    descricao: "Completar primeira corrida",
    reward: 50,
  },
  "streak-7": {
    icon: "🔥",
    nome: "Semana de Fogo",
    descricao: "7 dias seguidos com atividade",
    reward: 100,
  },
  "streak-30": {
    icon: "🌟",
    nome: "Mês de Ouro",
    descricao: "30 dias de streak",
    reward: 500,
  },
  "km-100": {
    icon: "🚀",
    nome: "Centistas",
    descricao: "Completar 100 km totais",
    reward: 200,
  },
  "km-1000": {
    icon: "💎",
    nome: "Lenda",
    descricao: "Completar 1000 km",
    reward: 1000,
  },
  "treino-10": {
    icon: "💪",
    nome: "Musculação",
    descricao: "Completar 10 treinos",
    reward: 150,
  },
  "compartilhamento": {
    icon: "📱",
    nome: "Influenciador",
    descricao: "Compartilhar 5 vezes",
    reward: 75,
  },
};

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({
    corridasMes: 0,
    kmMes: 0,
    calorias: 0,
    treinos: 0,
    totalKm: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Buscam dados do usuário
        const { data: userProfile } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .single();

        if (userProfile) {
          setUserData(userProfile);
        }

        // Buscar runs do mês
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

        const { data: runs } = await supabase
          .from("runs")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", inicioMes.toISOString())
          .order("created_at", { ascending: false });

        // Calcular stats
        let totKm = 0;
        let totCalorias = 0;
        if (runs && runs.length > 0) {
          totKm = runs.reduce((sum, r) => sum + (r.distancia || 0), 0);
          totCalorias = runs.reduce((sum, r) => sum + (r.calorias || 0), 0);

          // Preparar data para gráfico (últimos 7 dias)
          const ultimos7 = [];
          for (let i = 6; i >= 0; i--) {
            const data = new Date(agora);
            data.setDate(data.getDate() - i);
            const dataStr = data.toISOString().split("T")[0];
            const corridas = runs.filter(
              (r) => r.created_at.split("T")[0] === dataStr
            );
            ultimos7.push({
              data: data.getDate() + "/" + (data.getMonth() + 1),
              km: corridas.reduce((sum, r) => sum + (r.distancia || 0), 0),
              calorias: corridas.reduce((sum, r) => sum + (r.calorias || 0), 0),
            });
          }
          setChartData(ultimos7);
        }

        // Buscar treinos do mês
        const { data: treinos } = await supabase
          .from("treinos")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", inicioMes.toISOString());

        // Calcular streak
        const { data: allRuns } = await supabase
          .from("runs")
          .select("created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        let streakCount = 0;
        if (allRuns && allRuns.length > 0) {
          const datas = allRuns.map((r) => new Date(r.created_at).toDateString());
          const datasUnicas = [...new Set(datas)];
          let dataAtual = new Date();
          dataAtual.setHours(0, 0, 0, 0);

          for (const dataStr of datasUnicas) {
            const data = new Date(dataStr);
            if (
              (dataAtual - data) / (1000 * 60 * 60 * 24) === streakCount
            ) {
              streakCount++;
            } else {
              break;
            }
          }
        }

        setStats({
          corridasMes: runs ? runs.length : 0,
          kmMes: Math.round(totKm * 10) / 10,
          calorias: Math.round(totCalorias),
          treinos: treinos ? treinos.length : 0,
          totalKm: Math.round(totKm * 10) / 10,
        });

        setStreak(streakCount);

        // Calcular badges desbloqueados
        const badgesDesbloqueados = [];
        if (runs && runs.length > 0) {
          badgesDesbloqueados.push("primeira-corrida");
        }
        if (streakCount >= 7) badgesDesbloqueados.push("streak-7");
        if (streakCount >= 30) badgesDesbloqueados.push("streak-30");
        if (totKm >= 100) badgesDesbloqueados.push("km-100");
        if (totKm >= 1000) badgesDesbloqueados.push("km-1000");
        if (treinos && treinos.length >= 10) badgesDesbloqueados.push("treino-10");

        setBadges(badgesDesbloqueados);
      } catch (error) {
        console.error("Erro ao buscar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="pb-24 bg-black min-h-screen">
        <PageHeader icon="📊" title="Dashboard" subtitle="Acompanhe seu progresso" color="blue" />
        <div className="p-4 text-center text-gray-400">Carregando...</div>
      </div>
    );
  }

  const proximoMilestone = [
    { meta: "Primeira corrida", valor: stats.corridasMes, alvo: 1, badge: "primeira-corrida" },
    { meta: "Semana de Fogo", valor: streak, alvo: 7, badge: "streak-7" },
    { meta: "100 km", valor: Math.round(stats.totalKm), alvo: 100, badge: "km-100" },
    { meta: "10 Treinos", valor: stats.treinos, alvo: 10, badge: "treino-10" },
  ].find((m) => m.valor < m.alvo && !badges.includes(m.badge));

  const progressoMilestone = proximoMilestone
    ? Math.round((proximoMilestone.valor / proximoMilestone.alvo) * 100)
    : 100;

  return (
    <div className="pb-24 bg-black min-h-screen">
      <PageHeader icon="📊" title="Dashboard" subtitle="Acompanhe seu progresso" color="blue" />

      <div className="p-4 space-y-4">
        {/* STREAK */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 flex items-center gap-2">
                <Flame className="w-4 h-4" /> Streak Atual
              </p>
              <p className="text-4xl font-bold text-orange-400 mt-2">{streak} dias</p>
            </div>
            <div className="text-6xl">🔥</div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {streak > 0
              ? "Continue assim! Mantenha a consistência"
              : "Complete uma corrida hoje para começar seu streak"}
          </p>
        </motion.div>

        {/* PRÓXIMO MILESTONE */}
        {proximoMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-purple-300 font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" /> Próximo Objetivo
              </p>
              <span className="text-sm bg-purple-500/30 px-2 py-1 rounded">
                {progressoMilestone}%
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                style={{ width: `${progressoMilestone}%` }}
              />
            </div>
            <p className="text-xs text-gray-300 mt-2">
              {proximoMilestone.meta}: {proximoMilestone.valor}/{proximoMilestone.alvo}
            </p>
          </motion.div>
        )}

        {/* STATS DO MÊS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
            <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-xs text-gray-400">KM este mês</p>
            <p className="text-2xl font-bold text-green-400">{stats.kmMes}</p>
          </div>
          <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-4">
            <Zap className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-xs text-gray-400">Calorias</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.calorias}</p>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
            <Calendar className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-xs text-gray-400">Corridas</p>
            <p className="text-2xl font-bold text-blue-400">{stats.corridasMes}</p>
          </div>
          <div className="bg-pink-500/20 border border-pink-500/50 rounded-lg p-4">
            <Trophy className="w-5 h-5 text-pink-400 mb-2" />
            <p className="text-xs text-gray-400">Treinos</p>
            <p className="text-2xl font-bold text-pink-400">{stats.treinos}</p>
          </div>
        </motion.div>

        {/* GRÁFICO DE ATIVIDADE */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
          >
            <h3 className="text-sm font-semibold text-white mb-3">Atividade - Últimos 7 dias</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="data" stroke="#999" style={{ fontSize: "12px" }} />
                <YAxis stroke="#999" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "4px",
                  }}
                />
                <Bar dataKey="km" fill="#22c55e" name="KM" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* BADGES */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Conquistas ({badges.length})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((badgeId) => {
              const badge = BADGES[badgeId];
              return (
                <div key={badgeId} className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                  <p className="text-2xl text-center mb-1">{badge.icon}</p>
                  <p className="text-xs font-semibold text-yellow-300 text-center">{badge.nome}</p>
                  <p className="text-xs text-gray-400 text-center mt-1">+{badge.reward} XP</p>
                </div>
              );
            })}
          </div>

          {/* BADGES PRÓXIMAS */}
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Desbloqueie também:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BADGES)
                .filter(([id]) => !badges.includes(id))
                .slice(0, 4)
                .map(([id, badge]) => (
                  <div key={id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 opacity-50">
                    <p className="text-lg text-center mb-1">{badge.icon}</p>
                    <p className="text-xs text-gray-400 text-center">{badge.nome}</p>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
