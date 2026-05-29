-- ==========================================
-- SCRIPT DE INICIALIZAÇÃO DE BANCO - VEXX SQUAD
-- Copie e cole este script no SQL Editor do painel Supabase
-- ==========================================

-- 1. TABELA DE ESQUADRÕES (SQUADS)
CREATE TABLE IF NOT EXISTS public.squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    capacity INT DEFAULT 12 NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. TABELA DE MEMBROS DO ESQUADRÃO (SQUAD MEMBERS)
CREATE TABLE IF NOT EXISTS public.squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT unique_squad_member UNIQUE (squad_id, usuario_id)
);

-- 3. TABELA DE STORIES DE ATLETAS (STORIES)
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    media_url TEXT,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 4. TABELA DE DESAFIOS ATIVOS (CHALLENGES)
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    goal TEXT NOT NULL,
    reward TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open' NOT NULL
);

-- 5. TABELA DE MENSAGENS DO ESQUADRÃO (SQUAD MESSAGES)
CREATE TABLE IF NOT EXISTS public.squad_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    texto TEXT NOT NULL
);

-- 6. TABELA DE CORRIDAS ESTRUTURADAS (RUNS)
CREATE TABLE IF NOT EXISTS public.runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    distancia FLOAT NOT NULL,
    calorias INT NOT NULL,
    tempo TEXT NOT NULL,
    pace TEXT NOT NULL
);

-- Criar índices de busca rápida para otimização de performance
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON public.squad_members(usuario_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON public.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_mensagens_squad ON public.squad_mensagens(squad_id);
CREATE INDEX IF NOT EXISTS idx_stories_expiry ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_runs_user ON public.runs(user_id);

-- Habilitar replicação em tempo real para mensagens de esquadrão
ALTER publication supabase_realtime ADD TABLE public.squad_mensagens;
