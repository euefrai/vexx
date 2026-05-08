#!/bin/bash
# Script para testar se as variáveis de ambiente estão sendo acessadas corretamente

echo "====== TESTE DE CARREGAMENTO DE ENV VARS ======"
echo ""

# Criar arquivo de teste Node.js
cat > /tmp/test-env.js << 'EOF'
// Simulando ambiente de build (sem window)
console.log("🔍 Teste 1: Acessando variáveis em contexto de build (sem window)");
console.log("---");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const orsKey = process.env.NEXT_PUBLIC_ORS_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Presente" : "❌ Faltando");
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey ? "✅ Presente" : "❌ Faltando");
console.log("OPENAI_API_KEY:", openaiKey ? "✅ Presente" : "❌ Faltando");
console.log("NEXT_PUBLIC_ORS_KEY:", orsKey ? "✅ Presente" : "❌ Faltando");
console.log("NEXT_PUBLIC_APP_URL:", appUrl ? "✅ Presente" : "❌ Faltando");

console.log("");
console.log("🔍 Teste 2: Validando valores não-placeholder");
console.log("---");

const isValid = {
    supabase: supabaseUrl && supabaseUrl !== "https://placeholder.supabase.co",
    supabaseKey: supabaseKey && supabaseKey !== "placeholder_key_for_build",
    openai: openaiKey && openaiKey !== "placeholder",
    ors: orsKey && orsKey !== "placeholder",
};

console.log("Supabase com valor real:", isValid.supabase ? "🟢" : "🟡 Placeholder (OK para build)");
console.log("Supabase Key com valor real:", isValid.supabaseKey ? "🟢" : "🟡 Placeholder (OK para build)");
console.log("OpenAI com valor real:", isValid.openai ? "🟢" : "🟡 Placeholder (OK para build)");
console.log("ORS com valor real:", isValid.ors ? "🟢" : "🟡 Placeholder (OK para build)");

console.log("");
console.log("🔍 Teste 3: Tipo das variáveis");
console.log("---");

console.log("typeof NEXT_PUBLIC_SUPABASE_URL:", typeof supabaseUrl);
console.log("typeof OPENAI_API_KEY:", typeof openaiKey);
console.log("typeof NEXT_PUBLIC_ORS_KEY:", typeof orsKey);

console.log("");
console.log("✅ Teste concluído!");
EOF

# Executar o teste
node /tmp/test-env.js

# Limpar
rm /tmp/test-env.js

echo ""
echo "====== INTERPRETAÇÃO ======"
echo ""
echo "🟢 Se todas estão 'Presente' e 'Placeholder': BUILD está OK"
echo "🔴 Se alguma está 'Faltando': Erro crítico - adicione ao .env"
echo "🟡 Em PRODUÇÃO: Substitua placeholders pelas chaves reais no Render"
