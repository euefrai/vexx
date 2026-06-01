-- ==========================================
-- SCRIPT DE INICIALIZAÇÃO DE BANCO - VEXX SQUAD
-- Copie e cole este script no SQL Editor do painel Supabase
-- ==========================================

-- 1. TABELA DE USUÁRIOS/PERFIS (USUARIOS)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    username TEXT UNIQUE NOT NULL,
    foto TEXT,
    xp INT DEFAULT 0 NOT NULL,
    nivel INT DEFAULT 1 NOT NULL,
    bio TEXT,
    peso FLOAT,
    altura FLOAT,
    sexo TEXT,
    status TEXT DEFAULT 'ativo' NOT NULL,
    titulo_manual TEXT
);

-- 2. TABELA DE ESQUADRÕES (SQUADS)
CREATE TABLE IF NOT EXISTS public.squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    capacity INT DEFAULT 12 NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. TABELA DE MEMBROS DO ESQUADRÃO (SQUAD MEMBERS)
CREATE TABLE IF NOT EXISTS public.squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT unique_squad_member UNIQUE (squad_id, usuario_id)
);

-- 4. TABELA DE STORIES DE ATLETAS (STORIES)
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    media_url TEXT,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 5. TABELA DE DESAFIOS ATIVOS (CHALLENGES)
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

-- 6. TABELA DE MENSAGENS DO ESQUADRÃO (SQUAD MESSAGES)
CREATE TABLE IF NOT EXISTS public.squad_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    texto TEXT NOT NULL
);

-- 7. TABELA DE CORRIDAS ESTRUTURADAS (RUNS)
CREATE TABLE IF NOT EXISTS public.runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    distancia FLOAT NOT NULL,
    calorias INT NOT NULL,
    tempo TEXT NOT NULL,
    pace TEXT NOT NULL
);

-- 8. TABELA DE TREINOS DE FORÇA (TREINOS)
CREATE TABLE IF NOT EXISTS public.treinos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    autor TEXT,
    grupo TEXT,
    descricao TEXT
);

-- 9. TABELA DE REGISTROS DE EXECUÇÃO DE EXERCÍCIOS (REGISTROS_TREINO)
CREATE TABLE IF NOT EXISTS public.registros_treino (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    exercicio TEXT NOT NULL,
    peso FLOAT NOT NULL,
    series TEXT
);

-- 10. TABELA DE POSTAGENS E REGISTROS DE IMAGENS (POSTAGENS)
CREATE TABLE IF NOT EXISTS public.postagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    imagem_url TEXT NOT NULL,
    legenda TEXT
);

-- 11. TABELA DE CURTIDAS/SALVOS DE TREINOS (LIKES)
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    treino_id UUID REFERENCES public.treinos(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT unique_like UNIQUE (user_id, treino_id)
);

-- 12. TABELA DE SEGUIDORES (SEGUIDORES)
CREATE TABLE IF NOT EXISTS public.seguidores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    seguidor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    seguido_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT unique_seguidor UNIQUE (seguidor_id, seguido_id)
);

-- 13. TABELA DE CONQUISTAS DESBLOQUEADAS (USUARIOS_CONQUISTAS)
CREATE TABLE IF NOT EXISTS public.usuarios_conquistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    conquista_id TEXT NOT NULL,
    CONSTRAINT unique_usuario_conquista UNIQUE (usuario_id, conquista_id)
);

-- 14. TABELA DE PARTICIPANTES DE DESAFIOS (CHALLENGE_PARTICIPANTS)
CREATE TABLE IF NOT EXISTS public.challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'joined' NOT NULL, -- joined, completed
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_challenge_participant UNIQUE (challenge_id, usuario_id)
);

-- Criar índices de busca rápida para otimização de performance
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON public.squad_members(usuario_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON public.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_mensagens_squad ON public.squad_mensagens(squad_id);
CREATE INDEX IF NOT EXISTS idx_stories_expiry ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_runs_user ON public.runs(user_id);
CREATE INDEX IF NOT EXISTS idx_treinos_usuario ON public.treinos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_registros_treino_usuario ON public.registros_treino(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_conquistas_usuario ON public.usuarios_conquistas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_usuario ON public.challenge_participants(usuario_id);

-- Habilitar replicação em tempo real para mensagens de esquadrão
ALTER publication supabase_realtime ADD TABLE public.squad_mensagens;
