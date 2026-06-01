-- =======================================================
-- CORREÇÃO DE POLÍTICAS DE RLS (ROW LEVEL SECURITY) - VEXX SQUAD
-- Copie e cole este script no painel SQL Editor do Supabase
-- =======================================================

-- 1. Habilitar RLS em todas as tabelas (boa prática de segurança)
ALTER TABLE IF EXISTS public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.squad_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registros_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.postagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seguidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.usuarios_conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas permissivas de acesso total para usuários autenticados (ou anônimos dependendo da necessidade do app)

-- USUARIOS
DROP POLICY IF EXISTS "Acesso total usuarios" ON public.usuarios;
CREATE POLICY "Acesso total usuarios" ON public.usuarios 
FOR ALL TO public USING (true) WITH CHECK (true);

-- SQUADS
DROP POLICY IF EXISTS "Acesso total squads" ON public.squads;
CREATE POLICY "Acesso total squads" ON public.squads 
FOR ALL TO public USING (true) WITH CHECK (true);

-- SQUAD_MEMBERS
DROP POLICY IF EXISTS "Acesso total squad_members" ON public.squad_members;
CREATE POLICY "Acesso total squad_members" ON public.squad_members 
FOR ALL TO public USING (true) WITH CHECK (true);

-- STORIES
DROP POLICY IF EXISTS "Acesso total stories" ON public.stories;
CREATE POLICY "Acesso total stories" ON public.stories 
FOR ALL TO public USING (true) WITH CHECK (true);

-- CHALLENGES
DROP POLICY IF EXISTS "Acesso total challenges" ON public.challenges;
CREATE POLICY "Acesso total challenges" ON public.challenges 
FOR ALL TO public USING (true) WITH CHECK (true);

-- SQUAD_MENSAGENS
DROP POLICY IF EXISTS "Acesso total squad_mensagens" ON public.squad_mensagens;
CREATE POLICY "Acesso total squad_mensagens" ON public.squad_mensagens 
FOR ALL TO public USING (true) WITH CHECK (true);

-- RUNS
DROP POLICY IF EXISTS "Acesso total runs" ON public.runs;
CREATE POLICY "Acesso total runs" ON public.runs 
FOR ALL TO public USING (true) WITH CHECK (true);

-- TREINOS
DROP POLICY IF EXISTS "Acesso total treinos" ON public.treinos;
CREATE POLICY "Acesso total treinos" ON public.treinos 
FOR ALL TO public USING (true) WITH CHECK (true);

-- REGISTROS_TREINO
DROP POLICY IF EXISTS "Acesso total registros_treino" ON public.registros_treino;
CREATE POLICY "Acesso total registros_treino" ON public.registros_treino 
FOR ALL TO public USING (true) WITH CHECK (true);

-- POSTAGENS
DROP POLICY IF EXISTS "Acesso total postagens" ON public.postagens;
CREATE POLICY "Acesso total postagens" ON public.postagens 
FOR ALL TO public USING (true) WITH CHECK (true);

-- LIKES
DROP POLICY IF EXISTS "Acesso total likes" ON public.likes;
CREATE POLICY "Acesso total likes" ON public.likes 
FOR ALL TO public USING (true) WITH CHECK (true);

-- SEGUIDORES
DROP POLICY IF EXISTS "Acesso total seguidores" ON public.seguidores;
CREATE POLICY "Acesso total seguidores" ON public.seguidores 
FOR ALL TO public USING (true) WITH CHECK (true);

-- USUARIOS_CONQUISTAS
DROP POLICY IF EXISTS "Acesso total usuarios_conquistas" ON public.usuarios_conquistas;
CREATE POLICY "Acesso total usuarios_conquistas" ON public.usuarios_conquistas 
FOR ALL TO public USING (true) WITH CHECK (true);

-- CHALLENGE_PARTICIPANTS
DROP POLICY IF EXISTS "Acesso total challenge_participants" ON public.challenge_participants;
CREATE POLICY "Acesso total challenge_participants" ON public.challenge_participants 
FOR ALL TO public USING (true) WITH CHECK (true);
