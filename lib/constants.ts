// Constantes centralizadas do projeto

export const API_ENDPOINTS = {
  ANALISAR_IMAGEM: '/api/analisar-imagem',
  GERAR_TREINO: '/api/gerar-treino',
  INTELIGENCIA_CAMPO: '/api/inteligencia-campo',
};

export const OPENAI_CONFIG = {
  MODEL: 'gpt-4',
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
};

export const SUPABASE_CONFIG = {
  URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export const UI_CONSTANTS = {
  MAX_HISTORICO_MENSAGENS: 15,
  MAX_HISTORICO_CARACTERES: 10000,
};