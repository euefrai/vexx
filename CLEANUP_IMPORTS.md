# 🧹 Limpeza de Imports Não Usados

## Como Executar

```bash
# Verificar todos os erros/warnings
npm run lint

# Ver especificamente imports não usados
npm run lint -- --rule no-unused-vars
```

## Imports Identificados (Revisar)

Os arquivos abaixo podem ter imports não usados:

- `app/perfil/page.jsx` - Suspense pode não estar sendo usada
- `app/novo-treino/page.jsx` - Suspense pode não estar sendo usada  
- `components/Navbar.jsx` - Verificar se todos imports estão sendo usados
- `components/MotivacaoDoDia.jsx` - Verificar state management
- `app/forum/[id]/page.jsx` - useRef pode não estar sendo usada
- `app/unidade-comando/page.jsx` - useRef pode não estar sendo usada
- `app/lab/macros/page.jsx` - Todos estão sendo usados provavelmente
- `app/ko/page.jsx` - useMemo pode não estar sendo usado
- `app/social/page.jsx` - useMemo pode não estar sendo usado
- `hooks/useAddressSearch.js` - useCallback pode não estar sendo usado

## Como Corrigir Automaticamente

Se a project usar editor que suporte Quick Fix:

1. Hover sobre o import não usado (ESLint vai mostrar warning)
2. Click em "Quick Fix" > "Remove unused import"

Ou usar ESLint com --fix:

```bash
npm run lint -- --fix
```

## ESLint Config

Atualmente, ESLint está configurado com:
- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`

Estas configs já incluem `no-unused-vars`.

## Status Atual

✅ ESLint já está configurado para detectar imports não usados
⚠️ Alguns componentes podem precisar limpeza manual
