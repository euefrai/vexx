#!/bin/bash

# Script para validar configuração de variáveis de ambiente

echo "====== VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE ======"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Array com as variáveis necessárias
declare -A REQUIRED_VARS=(
    ["NEXT_PUBLIC_SUPABASE_URL"]="URL do Supabase"
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="Chave Pública Supabase"
    ["OPENAI_API_KEY"]="Chave OpenAI"
    ["NEXT_PUBLIC_ORS_KEY"]="Chave OpenRouteService"
    ["NEXT_PUBLIC_APP_URL"]="URL da Aplicação"
)

MISSING=0
CONFIGURED=0

for var in "${!REQUIRED_VARS[@]}"; do
    value=$(eval "echo \$${var}")
    
    if [ -z "$value" ] || [ "$value" = "placeholder" ]; then
        echo -e "${RED}❌ $var${NC} - ${REQUIRED_VARS[$var]}"
        echo "   Valor: ${value:-'(vazio)'}"
        MISSING=$((MISSING + 1))
    else
        echo -e "${GREEN}✅ $var${NC} - ${REQUIRED_VARS[$var]}"
        echo "   Valor: ${value:0:20}..."
        CONFIGURED=$((CONFIGURED + 1))
    fi
done

echo ""
echo "====== RESUMO ======"
echo -e "${GREEN}Configuradas: $CONFIGURED${NC}"
echo -e "${RED}Faltando/Placeholder: $MISSING${NC}"
echo ""

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ Todas as variáveis estão configuradas!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Você está em modo DESENVOLVIMENTO/BUILD${NC}"
    echo "Para PRODUÇÃO, configure as variáveis no Render Dashboard"
    exit 1
fi
