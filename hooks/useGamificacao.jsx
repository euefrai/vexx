// hooks/useGamificacao.jsx
import { supabase } from "@/lib/supabase"
import { offlineManager } from "@/lib/offlineManager"

export const BADGES_CATALOG = {
  "primeiro-treino": {
    nome: "Debutante do Aço",
    descricao: "Complete seu primeiro treino de força.",
    icon: "💪",
    reward: 100,
    categoria: "treino"
  },
  "treino-10": {
    nome: "Guerreiro de Ferro",
    descricao: "Complete 10 treinos de força.",
    icon: "🏋️",
    reward: 250,
    categoria: "treino"
  },
  "treino-50": {
    nome: "Cavalaria Pesada",
    descricao: "Complete 50 treinos de força.",
    icon: "🛡️",
    reward: 750,
    categoria: "treino"
  },
  "treino-ia": {
    nome: "Mestre dos Algoritmos",
    descricao: "Gere e complete um treino criado por Inteligência Artificial.",
    icon: "🤖",
    reward: 150,
    categoria: "treino"
  },
  "primeira-corrida": {
    nome: "Primeira Passada",
    descricao: "Registre sua primeira corrida de rua.",
    icon: "🏃",
    reward: 100,
    categoria: "cardio"
  },
  "corrida-5": {
    nome: "Coração de Aço",
    descricao: "Complete uma corrida de 5km ou mais.",
    icon: "⚡",
    reward: 150,
    categoria: "cardio"
  },
  "corrida-10": {
    nome: "Velocidade Terminal",
    descricao: "Complete uma corrida de 10km ou mais.",
    icon: "🌪️",
    reward: 300,
    categoria: "cardio"
  },
  "corrida-21": {
    nome: "Maratonista de Elite",
    descricao: "Complete uma corrida de 21km ou mais.",
    icon: "🏆",
    reward: 1000,
    categoria: "cardio"
  },
  "km-100": {
    nome: "Centista do Asfalto",
    descricao: "Alcance a marca de 100 km totais de corrida.",
    icon: "🚀",
    reward: 500,
    categoria: "cardio"
  },
  "km-1000": {
    nome: "Lenda da Estrada",
    descricao: "Alcance a marca lendária de 1000 km de corrida.",
    icon: "👑",
    reward: 2000,
    categoria: "cardio"
  },
  "streak-3": {
    nome: "Foco Inicial",
    descricao: "Mantenha uma sequência de 3 dias de atividade.",
    icon: "🕯️",
    reward: 50,
    categoria: "consistencia"
  },
  "streak-7": {
    nome: "Semana de Fogo",
    descricao: "Mantenha uma sequência de 7 dias de atividade.",
    icon: "🔥",
    reward: 200,
    categoria: "consistencia"
  },
  "streak-15": {
    nome: "Indomável",
    descricao: "Mantenha uma sequência de 15 dias de atividade.",
    icon: "💥",
    reward: 500,
    categoria: "consistencia"
  },
  "streak-30": {
    nome: "Mês de Ouro",
    descricao: "Mantenha uma sequência de 30 dias de atividade.",
    icon: "💎",
    reward: 1200,
    categoria: "consistencia"
  },
  "criador-squad": {
    nome: "Líder de Esquadrão",
    descricao: "Crie o seu próprio esquadrão fitness.",
    icon: "🗣️",
    reward: 150,
    categoria: "comunidade"
  },
  "socio-squad": {
    nome: "Guerreiro Unido",
    descricao: "Entre em uma squad de combatentes.",
    icon: "👥",
    reward: 100,
    categoria: "comunidade"
  },
  "squad-cheia": {
    nome: "General Nato",
    descricao: "Tenha um esquadrão completo de 12 membros.",
    icon: "🏰",
    reward: 300,
    categoria: "comunidade"
  },
  "desafio-aceito": {
    nome: "Combatente",
    descricao: "Aceite o seu primeiro desafio da squad.",
    icon: "🎯",
    reward: 50,
    categoria: "desafio"
  },
  "desafio-concluido": {
    nome: "Destruidor de Metas",
    descricao: "Conclua seu primeiro desafio com sucesso.",
    icon: "🎖️",
    reward: 200,
    categoria: "desafio"
  },
  "desafio-mestre": {
    nome: "Invicto",
    descricao: "Conclua 5 desafios da squad.",
    icon: "🏅",
    reward: 600,
    categoria: "desafio"
  },
  "curioso": {
    nome: "Mente Operacional",
    descricao: "Acesse a central de curiosidades da squad.",
    icon: "🧠",
    reward: 50,
    categoria: "habito"
  },
  "hidro-guerreiro": {
    nome: "Fonte de Energia",
    descricao: "Registre sua ingestão de água por comando no chat.",
    icon: "💧",
    reward: 50,
    categoria: "habito"
  },
  "suplementado": {
    nome: "Fórmula do Sucesso",
    descricao: "Registre seu consumo diário de creatina por comando.",
    icon: "🧪",
    reward: 50,
    categoria: "habito"
  },
  "peso-atualizado": {
    nome: "Monitorado",
    descricao: "Atualize o seu peso corporal por comando no chat.",
    icon: "⚖️",
    reward: 50,
    categoria: "habito"
  },
  "influenciador": {
    nome: "Promotor",
    descricao: "Publique um story de progresso para motivar a squad.",
    icon: "📢",
    reward: 75,
    categoria: "comunidade"
  }
}

export function useGamificacao() {
  const adicionarXP = async (userId, quantidade) => {
    if (!userId) return null
    try {
      // 1. Puxa os dados atuais
      let perfil = null
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("xp, nivel")
          .eq("id", userId)
          .single()
        
        if (error) throw error
        perfil = data
      } catch (err) {
        console.log("Supabase offline ou sem tabela usuarios. Buscando perfil local...")
        const localPerfil = JSON.parse(localStorage.getItem(`vexx_perfil_${userId}`) || '{"xp":0,"nivel":1}')
        perfil = localPerfil
      }

      if (!perfil) {
        perfil = { xp: 0, nivel: 1 }
      }

      const novoXP = (perfil.xp || 0) + quantidade
      const xpParaProximoNivel = 500
      
      // Cálculo de nível: se cada 500 XP sobe um nível
      const novoNivel = Math.floor(novoXP / xpParaProximoNivel) + 1
      const subiuDeNivel = novoNivel > (perfil.nivel || 1)

      // 2. Salva
      try {
        const { error } = await supabase
          .from("usuarios")
          .update({ xp: novoXP, nivel: novoNivel })
          .eq("id", userId)

        if (error) throw error
      } catch (dbErr) {
        console.log("Enfileirando atualização de XP offline...")
        // Atualiza cache local
        localStorage.setItem(`vexx_perfil_${userId}`, JSON.stringify({ xp: novoXP, nivel: novoNivel }))
        
        offlineManager.addMutation("usuarios", "update", { xp: novoXP, nivel: novoNivel }, [
          { type: "eq", column: "id", value: userId }
        ])
      }

      return { novoXP, novoNivel, subiuDeNivel }
    } catch (err) {
      console.error("Erro ao processar XP:", err.message)
      return null
    }
  }

  const desbloquearConquista = async (userId, conquistaId) => {
    if (!userId || !conquistaId) return
    const badge = BADGES_CATALOG[conquistaId]
    if (!badge) return

    try {
      // Verificar se já possui essa conquista para evitar duplicados
      let possui = false
      try {
        const { data, error } = await supabase
          .from("usuarios_conquistas")
          .select("id")
          .eq("usuario_id", userId)
          .eq("conquista_id", conquistaId)
          .maybeSingle()
        
        if (error) throw error
        if (data) possui = true
      } catch (err) {
        const localConquistas = JSON.parse(localStorage.getItem(`vexx_conquistas_${userId}`) || "[]")
        possui = localConquistas.includes(conquistaId)
      }

      if (possui) return // Já tem!

      console.log(`[Gamificação] Desbloqueando nova conquista: ${badge.nome} para ${userId}`)

      // Salvar Conquista
      try {
        const { error } = await supabase
          .from("usuarios_conquistas")
          .insert({ usuario_id: userId, conquista_id: conquistaId })
        
        if (error) throw error
      } catch (dbErr) {
        console.log("Enfileirando conquista offline...")
        const localConquistas = JSON.parse(localStorage.getItem(`vexx_conquistas_${userId}`) || "[]")
        const novaLista = [...localConquistas, conquistaId]
        localStorage.setItem(`vexx_conquistas_${userId}`, JSON.stringify(novaLista))

        offlineManager.addMutation("usuarios_conquistas", "insert", {
          usuario_id: userId,
          conquista_id: conquistaId
        })
      }

      // Adicionar o prêmio de XP correspondente
      await adicionarXP(userId, badge.reward)

      // Disparar o evento visual
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("vexx_badge_unlocked", {
            detail: { badgeId: conquistaId, badge }
          })
        )
      }
    } catch (err) {
      console.error("Erro ao desbloquear conquista:", err)
    }
  }

  const avaliarEConquistar = async (userId, acao, contexto = {}) => {
    if (!userId) return

    // 1. AÇÕES DE TREINOS DE FORÇA
    if (acao === "treino") {
      let totalTreinos = 0
      try {
        const { count, error } = await supabase
          .from("treinos")
          .select("id", { count: "exact", head: true })
          .eq("usuario_id", userId)
        
        if (error) throw error
        totalTreinos = count || 0
      } catch (err) {
        const localTreinos = JSON.parse(localStorage.getItem("vexx_treinos") || "[]")
        totalTreinos = localTreinos.filter(t => t.usuario_id === userId).length
      }

      if (totalTreinos >= 1) {
        await desbloquearConquista(userId, "primeiro-treino")
      }
      if (totalTreinos >= 10) {
        await desbloquearConquista(userId, "treino-10")
      }
      if (totalTreinos >= 50) {
        await desbloquearConquista(userId, "treino-50")
      }
      if (contexto.ia === true) {
        await desbloquearConquista(userId, "treino-ia")
      }
    }

    // 2. AÇÕES DE RUN / CARDIO
    if (acao === "run") {
      let runs = []
      try {
        const { data, error } = await supabase
          .from("runs")
          .select("distancia")
          .eq("user_id", userId)
        
        if (error) throw error
        runs = data || []
      } catch (err) {
        const localRuns = JSON.parse(localStorage.getItem("vexx_runs") || "[]")
        runs = localRuns.filter(r => r.user_id === userId)
      }

      const totalRuns = runs.length
      const totalKm = runs.reduce((sum, r) => sum + (r.distancia || 0), 0)

      if (totalRuns >= 1) {
        await desbloquearConquista(userId, "primeira-corrida")
      }
      
      const distanciaMax = contexto.distancia || 0
      if (distanciaMax >= 5) {
        await desbloquearConquista(userId, "corrida-5")
      }
      if (distanciaMax >= 10) {
        await desbloquearConquista(userId, "corrida-10")
      }
      if (distanciaMax >= 21) {
        await desbloquearConquista(userId, "corrida-21")
      }

      if (totalKm >= 100) {
        await desbloquearConquista(userId, "km-100")
      }
      if (totalKm >= 1000) {
        await desbloquearConquista(userId, "km-1000")
      }
    }

    // 3. AÇÕES DE STREAK E CONSISTÊNCIA
    if (acao === "streak") {
      const streak = contexto.streak || 0
      if (streak >= 3) {
        await desbloquearConquista(userId, "streak-3")
      }
      if (streak >= 7) {
        await desbloquearConquista(userId, "streak-7")
      }
      if (streak >= 15) {
        await desbloquearConquista(userId, "streak-15")
      }
      if (streak >= 30) {
        await desbloquearConquista(userId, "streak-30")
      }
    }

    // 4. AÇÕES SOCIAIS / SQUADS
    if (acao === "squad_create") {
      await desbloquearConquista(userId, "criador-squad")
    }

    if (acao === "squad_join") {
      await desbloquearConquista(userId, "socio-squad")
      if (contexto.membrosCount >= 12) {
        await desbloquearConquista(userId, "squad-cheia")
      }
    }

    // 5. AÇÕES DE DESAFIOS
    if (acao === "challenge_accept") {
      await desbloquearConquista(userId, "desafio-aceito")
    }

    if (acao === "challenge_complete") {
      await desbloquearConquista(userId, "desafio-concluido")

      let totalCompletos = 0
      try {
        const { count, error } = await supabase
          .from("challenge_participants")
          .select("id", { count: "exact", head: true })
          .eq("usuario_id", userId)
          .eq("status", "completed")
        
        if (error) throw error
        totalCompletos = count || 0
      } catch (err) {
        const localCompletions = JSON.parse(localStorage.getItem(`vexx_challenge_completes_${userId}`) || "[]")
        totalCompletos = localCompletions.length
      }

      if (totalCompletos >= 5) {
        await desbloquearConquista(userId, "desafio-mestre")
      }
    }

    // 6. AÇÕES DE HÁBITOS & PROTOCOLOS
    if (acao === "curiosidades_visit") {
      await desbloquearConquista(userId, "curioso")
    }
    if (acao === "hidro") {
      await desbloquearConquista(userId, "hidro-guerreiro")
    }
    if (acao === "creatina") {
      await desbloquearConquista(userId, "suplementado")
    }
    if (acao === "peso") {
      await desbloquearConquista(userId, "peso-atualizado")
    }
    if (acao === "story") {
      await desbloquearConquista(userId, "influenciador")
    }
  }

  return { adicionarXP, desbloquearConquista, avaliarEConquistar }
}