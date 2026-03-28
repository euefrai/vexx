import { createClient } from "@supabase/supabase-js"

// Usar variáveis de ambiente - NUNCA expor chaves no código!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Variáveis de ambiente Supabase não configuradas!")
}

export const supabase = createClient(supabaseUrl, supabaseKey)