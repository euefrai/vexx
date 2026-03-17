// hooks/useGamificacao.js
import { supabase } from "@/lib/supabase"

export function useGamificacao() {
  const adicionarXP = async (userId, quantidade) => {
    try {
      // 1. Puxa os dados atuais
      const { data: perfil, error: fetchError } = await supabase
        .from("usuarios")
        .select("xp, nivel")
        .eq("id", userId)
        .single()

      if (fetchError || !perfil) throw new Error("Usuário não encontrado")

      const novoXP = (perfil.xp || 0) + quantidade
      const xpParaProximoNivel = 500
      
      // Cálculo de nível: se cada 500 XP sobe um nível
      const novoNivel = Math.floor(novoXP / xpParaProximoNivel) + 1

      // 2. Salva no banco
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({ xp: novoXP, nivel: novoNivel })
        .eq("id", userId)

      if (updateError) throw updateError

      return { novoXP, novoNivel, subiuDeNivel: novoNivel > perfil.nivel }
    } catch (err) {
      console.error("Erro ao processar XP:", err.message)
    }
  }

  return { adicionarXP }
}