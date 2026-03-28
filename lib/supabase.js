import { createClient } from "@supabase/supabase-js"

// Usar variáveis de ambiente - NUNCA expor chaves no código!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validar apenas se estiver em cliente (não durante build)
let supabase = null

if (typeof window !== "undefined") {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Variáveis de ambiente Supabase não configuradas! Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }
  supabase = createClient(supabaseUrl, supabaseKey)
} else {
  // Durante build/server, criar com valores placeholder
  supabase = supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey)
    : null
}

export { supabase }