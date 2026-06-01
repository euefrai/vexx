"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import Navbar from "@/components/Navbar";
import { TrendingUp, Users, Zap, Target, Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useGamificacao } from "@/hooks/useGamificacao";

export default function Curiosidades() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { avaliarEConquistar } = useGamificacao();

  useEffect(() => {
    const carregarCuriosidades = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await avaliarEConquistar(user.id, "curiosidades_visit");
        }

        const agora = new Date();
        const umaSemanaatrás = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Total de km da semana com fallback local
        let runsData = [];
        try {
          const { data, error } = await supabase
            .from("runs")
            .select("distancia, calorias, created_at")
            .gte("created_at", umaSemanaatrás.toISOString());
          
          if (error) throw error;
          runsData = data || [];
        } catch (err) {
          console.log("Tabela 'runs' offline. Carregando dados locais para curiosidades...");
          const localRuns = JSON.parse(localStorage.getItem("vexx_runs") || "[]");
          runsData = localRuns.filter(r => new Date(r.created_at) >= umaSemanaatrás);
        }

        // Total de usuários ativos
        let usuariosAtivos = [];
        try {
          const { data } = await supabase
            .from("registros_treino")
            .select("usuario_id")
            .gte("created_at", umaSemanaatrás.toISOString());
          usuariosAtivos = data || [];
        } catch (err) {
          console.log("Supabase offline ou sem registros_treino. Usando fallbacks...");
        }

        // Total de treinos
        let treinos = [];
        try {
          const { data } = await supabase
            .from("treinos")
            .select("id")
            .gte("created_at", umaSemanaatrás.toISOString());
          treinos = data || [];
        } catch (err) {
          console.log("Supabase offline ou sem treinos. Usando fallbacks...");
        }

        // Top corrida
        const topRun = runsData && runsData.length > 0 ? runsData.reduce((max, r) => (r.distancia > max.distancia ? r : max)) : null;

        // Calcular
        const totalKm = runsData ? runsData.reduce((sum, r) => sum + (r.distancia || 0), 0) : 0;
        const totalCalorias = runsData ? runsData.reduce((sum, r) => sum + (r.calorias || 0), 0) : 0;
        const numAtivos = new Set(usuariosAtivos?.map(u => u.usuario_id) || []).size;
        const numTreinos = treinos ? treinos.length : 0;

        setStats({
          totalKm: Math.round(totalKm),
          totalCalorias: Math.round(totalCalorias),
          usuariosAtivos: numAtivos > 0 ? numAtivos : 1, // Fallback se sem conexao
          numTreinos: numTreinos > 0 ? numTreinos : runsData.length,
          topRun: topRun ? Math.round(topRun.distancia) : 0,
          mediaKmPorPessoa: (numAtivos > 0 ? numAtivos : 1) > 0 ? Math.round(totalKm / (numAtivos > 0 ? numAtivos : 1) * 10) / 10 : 0,
          totalCorridas: runsData ? runsData.length : 0,
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
      <div className="pb-24 bg-zinc-950 min-h-screen text-zinc-100 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Carregando métricas da squad...</p>
      </div>
    );
  }

  const cards = [
    {
      titulo: "Total de KM",
      valor: stats?.totalKm,
      unidade: "km",
      cor: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
      icone: TrendingUp,
    },
    {
      titulo: "Calorias Queimadas",
      valor: stats?.totalCalorias,
      unidade: "kcal",
      cor: "border-orange-500/20 bg-orange-500/5 text-orange-400",
      icone: Zap,
    },
    {
      titulo: "Usuários Ativos",
      valor: stats?.usuariosAtivos,
      unidade: "pessoas",
      cor: "border-blue-500/20 bg-blue-500/5 text-blue-400",
      icone: Users,
    },
    {
      titulo: "Treinos Realizados",
      valor: stats?.numTreinos,
      unidade: "treinos",
      cor: "border-purple-500/20 bg-purple-500/5 text-purple-400",
      icone: Sparkles,
    },
    {
      titulo: "Maior Corrida",
      valor: stats?.topRun,
      unidade: "km",
      cor: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
      icone: Target,
    },
    {
      titulo: "Média por Pessoa",
      valor: stats?.mediaKmPorPessoa,
      unidade: "km",
      cor: "border-violet-500/20 bg-violet-500/5 text-violet-400",
      icone: Trophy,
    },
  ];

  return (
    <div className="pb-24 bg-zinc-950 min-h-screen text-zinc-100 relative">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />

      <PageHeader 
        icon={<TrendingUp className="w-7 h-7 text-orange-400" />} 
        title="Curiosidades" 
        subtitle="Dados de performance da semana" 
        color="orange" 
      />

      <div className="p-4 space-y-4 z-10 relative">
        {/* INFORMAÇÃO GERAL */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-center"
        >
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Desempenho da Squad</p>
          <p className="text-[11px] text-zinc-400 font-medium">A squad está ativa e em constante evolução. Continue superando seus limites.</p>
        </motion.div>

        {/* CARDS DE STATS */}
        <div className="grid grid-cols-2 gap-3.5">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-900/80 rounded-xl p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <card.icone className={`w-5 h-5 ${card.cor.split(' ')[2]}`} />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{card.unidade}</span>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">{card.titulo}</p>
                <p className="text-2xl font-extrabold text-white">{card.valor}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* INSIGHTS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-900 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" /> Insights de Desempenho
          </h3>
          
          <div className="space-y-3 text-[11px] font-semibold uppercase tracking-wider">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
              <span className="text-zinc-500">Atletas Ativos</span>
              <span className="text-emerald-400">{stats?.usuariosAtivos} membros</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
              <span className="text-zinc-500">Média de Distância</span>
              <span className="text-blue-400">{stats?.mediaKmPorPessoa} km por atleta</span>
            </div>
            {stats?.topRun > 0 && (
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
                <span className="text-zinc-500">Melhor Corrida Individual</span>
                <span className="text-amber-400">{stats?.topRun} km</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-1">
              <span className="text-zinc-500">Total de Sessões</span>
              <span className="text-purple-400">{stats?.numTreinos} treinos</span>
            </div>
          </div>
        </motion.div>

        {/* DESAFIO */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-rose-500/10 to-orange-500/5 border border-rose-500/20 rounded-xl p-5 text-center"
        >
          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1.5">Meta da Próxima Semana</p>
          <p className="text-[11px] text-zinc-400 mb-4">
            Superar o recorde de distância acumulada da squad. O Top 3 ganha badges exclusivos.
          </p>
          <button 
            onClick={() => router.push("/social")}
            className="w-full bg-rose-500 hover:bg-rose-600 text-black font-extrabold py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider transition duration-300 cursor-pointer"
          >
            Aceitar Desafio
          </button>
        </motion.div>
      </div>

      <Navbar />
    </div>
  );
}

