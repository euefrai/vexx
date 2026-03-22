import { supabase } from "./supabase"

export const registrarAtividade = async (userId, tipo, descricao, treinoId = null, valorXp = 0) => {
  const { error } = await supabase.from("logs_atividades").insert({
    usuario_id: userId,
    tipo_evento: tipo,
    descricao: descricao,
    treino_id: treinoId,
    valor_xp: valorXp
  })
  if (error) console.error("Erro ao registrar log:", error)
}