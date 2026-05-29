"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import Navbar from "@/components/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, Trophy, Target, TrendingUp, Zap, Calendar, Activity, Sparkles, Award } from "lucide-react";
import { motion } from "framer-motion";

const BADGES = {
  "primeira-corrida": {
    icon: Trophy,
    nome: "Debutante",
    descricao: "Completar primeira corrida",
    reward: 50,
  },
  "streak-7": {
    icon: Flame,
    nome: "Semana de Fogo",
    descricao: "7 dias seguidos com atividade",
    reward: 100,
  },
  "streak-30": {
    icon: Award,
    nome: "Mês de Ouro",
    descricao: "30 dias de streak",
    reward: 500,
  },
  "km-100": {
    icon: Target,
    nome: "Centista",
    descricao: "Completar 100 km totais",
    reward: 200,
  },
  "km-1000": {
    icon: Zap,
    nome: "Lenda",
    descricao: "Completar 1000 km",
    reward: 1000,
  },
  "treino-10": {
    icon: Activity,
    nome: "Musculação",
    descricao: "Completar 10 treinos",
    reward: 150,
  },
  "compartilhamento": {
    icon: Sparkles,
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

        const { data: userProfile } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .single();

        if (userProfile) {
          setUserData(userProfile);
        }

        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

        const { data: runs } = await supabase
          .from("runs")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", inicioMes.toISOString())
          .order("created_at", { ascending: false });

        let totKm = 0;
        let totCalorias = 0;
        if (runs && runs.length > 0) {
          totKm = runs.reduce((sum, r) => sum + (r.distancia || 0), 0);
          totCalorias = runs.reduce((sum, r) => sum + (r.calorias || 0), 0);

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

        const { data: treinos } = await supabase
          .from("treinos")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", inicioMes.toISOString());

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
      <div className="pb-24 bg-zinc-950 min-h-screen text-zinc-100 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Carregando painel de progresso...</p>
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
    <div className="pb-32 bg-zinc-950 min-h-screen text-zinc-100 relative">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

      <PageHeader 
        icon={<Activity className="w-7 h-7 text-blue-400" />} 
        title="Dashboard" 
        subtitle="Acompanhe seu progresso individual" 
        color="blue" 
      />

      <div className="p-4 space-y-4 z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" /> Consistência
              </p>
              <p className="text-3xl font-extrabold text-orange-400 mt-2">{streak} dias seguidos</p>
            </div>
            <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-3">
            {streak > 0
              ? "Excelente progresso! Mantenha a consistência diária."
              : "Complete um treino hoje para iniciar sua sequência de fogo."}
          </p>
        </motion.div>

        {proximoMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20 rounded-xl p-4.5"
          >
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-purple-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-purple-400" /> Próxima Meta
              </p>
              <span className="text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg text-purple-400">
                {progressoMilestone}%
              </span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-500"
                style={{ width: `${progressoMilestone}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-2.5">
              {proximoMilestone.meta}: {proximoMilestone.valor} / {proximoMilestone.alvo}
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3.5"
        >
          <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-900 rounded-xl p-4">
            <TrendingUp className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Distância Mês</p>
            <p className="text-xl font-extrabold text-emerald-400 mt-1">{stats.kmMes} KM</p>
          </div>
          <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-900 rounded-xl p-4">
            <Zap className="w-4 h-4 text-cyan-400 mb-2" />
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Energia Gasta</p>
            <p className="text-xl font-extrabold text-cyan-400 mt-1">{stats.calorias} kcal</p>
          </div>
          <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-900 rounded-xl p-4">
            <Calendar className="w-4 h-4 text-blue-400 mb-2" />
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Corridas Registradas</p>
            <p className="text-xl font-extrabold text-blue-400 mt-1">{stats.corridasMes}</p>
          </div>
          <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-900 rounded-xl p-4">
            <Trophy className="w-4 h-4 text-rose-400 mb-2" />
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Treinos Completados</p>
            <p className="text-xl font-extrabold text-rose-400 mt-1">{stats.treinos}</p>
          </div>
        </motion.div>

        {chartData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-900 rounded-xl p-4"
          >
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">Progresso Recente (Últimos 7 dias)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis dataKey="data" stroke="#4b5563" style={{ fontSize: "9px", fontWeight: "bold" }} tickLine={false} />
                <YAxis stroke="#4b5563" style={{ fontSize: "9px", fontWeight: "bold" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: "#f3f4f6"
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.01)' }}
                />
                <Bar dataKey="km" fill="#10b981" name="KM" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/10 border border-zinc-900/80 rounded-xl p-6 text-center"
          >
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Nenhuma corrida registrada nos últimos 7 dias.</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 mt-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Conquistas Desbloqueadas ({badges.length})
          </h3>
          
          {badges.length === 0 ? (
            <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-6 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Nenhuma conquista desbloqueada ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badgeId) => {
                const badge = BADGES[badgeId];
                if (!badge) return null;
                const BadgeIcon = badge.icon;
                return (
                  <div key={badgeId} className="bg-zinc-900/20 border border-amber-500/10 rounded-xl p-4 flex flex-col items-center justify-center">
                    <BadgeIcon className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-xs font-bold text-amber-400 text-center uppercase tracking-wide leading-none">{badge.nome}</p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider text-center mt-2">+{badge.reward} XP</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Próximos Objetivos:</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(BADGES)
                .filter(([id]) => !badges.includes(id))
                .slice(0, 4)
                .map(([id, badge]) => {
                  const BadgeIcon = badge.icon;
                  return (
                    <div key={id} className="bg-zinc-900/10 border border-zinc-900/60 rounded-xl p-3.5 opacity-40 flex items-center gap-3">
                      <BadgeIcon className="w-6 h-6 text-zinc-500" />
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide leading-none">{badge.nome}</p>
                        <p className="text-[8px] text-zinc-600 font-semibold uppercase tracking-wider mt-1">+{badge.reward} XP</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </motion.div>
      </div>

      <Navbar />
    </div>
  );
}
