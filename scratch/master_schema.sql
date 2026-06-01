-- ==========================================================
-- SCRIPT MESTRE DE INICIALIZAÇÃO E PERMISSÕES - VEXX SQUAD
-- Copie e cole todo este script no painel SQL Editor do Supabase
-- e execute uma única vez para preparar o banco de dados completo.
-- ==========================================================

-- ==========================================
-- 1. CRIAÇÃO DAS TABELAS (SE NÃO EXISTIREM)
-- ==========================================

-- 1.1 TABELA DE USUÁRIOS/PERFIS
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

-- 1.2 TABELA DE ESQUADRÕES (SQUADS)
CREATE TABLE IF NOT EXISTS public.squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    capacity INT DEFAULT 12 NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 1.3 TABELA DE MEMBROS DO ESQUADRÃO
CREATE TABLE IF NOT EXISTS public.squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT unique_squad_member UNIQUE (squad_id, usuario_id)
);

-- 1.4 TABELA DE STORIES DE ATLETAS
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    media_url TEXT,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 1.5 TABELA DE DESAFIOS ATIVOS
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

-- 1.6 TABELA DE MENSAGENS DE GRUPO (SQUAD MESSAGES)
CREATE TABLE IF NOT EXISTS public.squad_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    texto TEXT NOT NULL
);

-- 1.7 TABELA DE MENSAGENS PRIVADAS (CHAT PRIVADO - MENSAGENS)
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    remetente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    destinatario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    texto TEXT NOT NULL
);

-- 1.8 TABELA DE CORRIDAS ESTRUTURADAS (RUNS)
CREATE TABLE IF NOT EXISTS public.runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    distancia FLOAT NOT NULL,
    calorias INT NOT NULL,
    tempo TEXT NOT NULL,
    pace TEXT NOT NULL
);

-- 1.9 TABELA DE TREINOS DE FORÇA (TREINOS)
CREATE TABLE IF NOT EXISTS public.treinos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    autor TEXT,
    grupo TEXT,
    descricao TEXT
);

-- 1.10 TABELA DE REGISTROS DE EXECUÇÃO DE EXERCÍCIOS
CREATE TABLE IF NOT EXISTS public.registros_treino (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    exercicio TEXT NOT NULL,
    peso FLOAT NOT NULL,
    series TEXT
);

-- 1.11 TABELA DE POSTAGENS E IMAGENS
CREATE TABLE IF NOT EXISTS public.postagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    imagem_url TEXT NOT NULL,
    legenda TEXT
);

-- 1.12 TABELA DE CURTIDAS DE TREINOS
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    treino_id UUID REFERENCES public.treinos(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT unique_like UNIQUE (user_id, treino_id)
);

-- 1.13 TABELA DE SEGUIDORES
CREATE TABLE IF NOT EXISTS public.seguidores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    seguidor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    seguido_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT unique_seguidor UNIQUE (seguidor_id, seguido_id)
);

-- 1.14 TABELA DE CONQUISTAS DESBLOQUEADAS
CREATE TABLE IF NOT EXISTS public.usuarios_conquistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    conquista_id TEXT NOT NULL,
    CONSTRAINT unique_usuario_conquista UNIQUE (usuario_id, conquista_id)
);

-- 1.15 TABELA DE PARTICIPANTES DE DESAFIOS
CREATE TABLE IF NOT EXISTS public.challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'joined' NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_challenge_participant UNIQUE (challenge_id, usuario_id)
);

-- ==========================================
-- 2. CRIAÇÃO DE ÍNDICES DE PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON public.squad_members(usuario_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON public.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_mensagens_squad ON public.squad_mensagens(squad_id);
CREATE INDEX IF NOT EXISTS idx_stories_expiry ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_runs_user ON public.runs(user_id);
CREATE INDEX IF NOT EXISTS idx_treinos_usuario ON public.treinos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_registros_treino_usuario ON public.registros_treino(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_conquistas_usuario ON public.usuarios_conquistas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_usuario ON public.challenge_participants(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversas ON public.mensagens(remetente_id, destinatario_id);

-- ==========================================
-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. CRIAÇÃO DE POLÍTICAS DE ACESSO TOTAL (PUBLIC)
-- ==========================================
CREATE POLICY "Acesso total usuarios" ON public.usuarios FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total squads" ON public.squads FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total squad_members" ON public.squad_members FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total stories" ON public.stories FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total challenges" ON public.challenges FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total squad_mensagens" ON public.squad_mensagens FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total mensagens" ON public.mensagens FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total runs" ON public.runs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total treinos" ON public.treinos FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total registros_treino" ON public.registros_treino FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total postagens" ON public.postagens FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total likes" ON public.likes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total seguidores" ON public.seguidores FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total usuarios_conquistas" ON public.usuarios_conquistas FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total challenge_participants" ON public.challenge_participants FOR ALL TO public USING (true) WITH CHECK (true);
