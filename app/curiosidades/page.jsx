"use client";

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import { TrendingUp, Users, Zap, Target, Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function Curiosidades() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarCuriosidades = async () => {
      try {
        const agora = new Date();
        const umaSemanaatrás = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Total de km da semana
        const { data: runs } = await supabase
          .from("runs")
          .select("distancia, calorias")
          .gte("created_at", umaSemanaatrás.toISOString());

        // Total de usuários ativos
        const { data: usuariosAtivos } = await supabase
          .from("registros_treino")
          .select("usuario_id", { distinct: true })
          .gte("created_at", umaSemanaatrás.toISOString());

        // Total de treinos
        const { data: treinos } = await supabase
          .from("treinos")
          .select("id")
          .gte("created_at", umaSemanaatrás.toISOString());

        // Top corrida
        const topRun = runs && runs.length > 0 ? runs.reduce((max, r) => (r.distancia > max.distancia ? r : max)) : null;

        // Calcular
        const totalKm = runs ? runs.reduce((sum, r) => sum + (r.distancia || 0), 0) : 0;
        const totalCalorias = runs ? runs.reduce((sum, r) => sum + (r.calorias || 0), 0) : 0;
        const numAtivos = new Set(usuariosAtivos?.map(u => u.usuario_id) || []).size;
        const numTreinos = treinos ? treinos.length : 0;

        setStats({
          totalKm: Math.round(totalKm),
          totalCalorias: Math.round(totalCalorias),
          usuariosAtivos: numAtivos,
          numTreinos,
          topRun: topRun ? Math.round(topRun.distancia) : 0,
          mediaKmPorPessoa: numAtivos > 0 ? Math.round(totalKm / numAtivos * 10) / 10 : 0,
          totalCorridas: runs ? runs.length : 0,
        });
      } catch (error) {
        console.error("Erro ao carregar curiosidades:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarCuriosidades();
  }, []);

  if (loading) {
    return (
      <div className="pb-24 bg-black min-h-screen">
        <PageHeader icon="📈" title="Curiosidades" subtitle="Dados incríveis da semana" color="orange" />
        <div className="p-4 text-center text-gray-400">Carregando...</div>
      </div>
    );
  }

  const cards = [
    {
      icon: "🏃",
      titulo: "Total de KM",
      valor: stats?.totalKm,
      unidade: "km",
      cor: "from-emerald-500/20 to-green-500/20 border-emerald-500/50",
      icone: TrendingUp,
    },
    {
      icon: "🔥",
      titulo: "Calorias Queimadas",
      valor: stats?.totalCalorias,
      unidade: "kcal",
      cor: "from-orange-500/20 to-red-500/20 border-orange-500/50",
      icone: Zap,
    },
    {
      icon: "👥",
      titulo: "Usuários Ativos",
      valor: stats?.usuariosAtivos,
      unidade: "pessoas",
      cor: "from-blue-500/20 to-cyan-500/20 border-blue-500/50",
      icone: Users,
    },
    {
      icon: "💪",
      titulo: "Treinos Realizados",
      valor: stats?.numTreinos,
      unidade: "treinos",
      cor: "from-purple-500/20 to-pink-500/20 border-purple-500/50",
      icone: Sparkles,
    },
    {
      icon: "🎯",
      titulo: "Maior Corrida",
      valor: stats?.topRun,
      unidade: "km",
      cor: "from-yellow-500/20 to-orange-500/20 border-yellow-500/50",
      icone: Target,
    },
    {
      icon: "📊",
      titulo: "Média por Pessoa",
      valor: stats?.mediaKmPorPessoa,
      unidade: "km",
      cor: "from-violet-500/20 to-indigo-500/20 border-violet-500/50",
      icone: Trophy,
    },
  ];

  return (
    <div className="pb-24 bg-black min-h-screen">
      <PageHeader icon="📈" title="Curiosidades" subtitle="Dados incríveis da semana" color="orange" />

      <div className="p-4 space-y-3">
        {/* MENSAGEM MOTIVADORA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500/30 to-cyan-500/30 border border-green-500/50 rounded-lg p-4 text-center"
        >
          <p className="text-sm font-bold text-green-300 mb-1">🔥 Semana Espetacular!</p>
          <p className="text-xs text-gray-300">A squad está em forma. Continue assim e suba de nível!</p>
        </motion.div>

        {/* CARDS DE STATS */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-gradient-to-br ${card.cor} border rounded-lg p-4`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-2xl">{card.icon}</p>
                <card.icone className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 mb-1">{card.titulo}</p>
              <p className="text-2xl font-bold text-white">{card.valor}</p>
              <p className="text-xs text-gray-500 mt-1">{card.unidade}</p>
            </motion.div>
          ))}
        </div>

        {/* INSIGHTS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3 mt-4"
        >
          <h3 className="font-bold text-white flex items-center gap-2">
            💡 Insights da Semana
          </h3>
          
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">
              ✨ <span className="text-yellow-400 font-semibold">{stats?.usuariosAtivos}</span> pessoas se movimentaram esta semana!
            </p>
            <p className="text-gray-300">
              🚀 Média de <span className="text-green-400 font-semibold">{stats?.mediaKmPorPessoa} km</span> por atleta
            </p>
            {stats?.topRun && (
              <p className="text-gray-300">
                🏆 Melhor corrida individual: <span className="text-cyan-400 font-semibold">{stats?.topRun} km</span>
              </p>
            )}
            <p className="text-gray-300">
              💪 Total de <span className="text-purple-400 font-semibold">{stats?.numTreinos}</span> treinos feitos
            </p>
          </div>
        </motion.div>

        {/* DESAFIO */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/30 rounded-lg p-4 text-center"
        >
          <p className="text-sm font-bold text-pink-300 mb-2">🎯 Desafio Próxima Semana</p>
          <p className="text-xs text-gray-300 mb-3">
            Consegue bater o recorde semanal? O top 3 ganha badges extras!
          </p>
          <button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg text-xs transition">
            ACEITAR DESAFIO
          </button>
        </motion.div>
      </div>
    </div>
  );
}
