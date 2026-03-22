// hooks/useRanks.js
import { supabase } from "@/lib/supabase"

export function useRanks() {
  async function getRanks() {
    const { data } = await supabase
      .from("ranks_custom")
      .select("*")
      .order("xp_minimo", { ascending: true })
    return data || []
  }

  function calcularRank(xp, listaDeRanks) {
    // Encontra o rank mais alto que o usuário atingiu o XP mínimo
    const rankAtingido = [...listaDeRanks]
      .reverse()
      .find(r => xp >= r.xp_minimo)
    
    return rankAtingido || listaDeRanks[0]
  }

  return { getRanks, calcularRank }
}