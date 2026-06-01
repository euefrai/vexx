-- =========================================================================
-- CORREÇÃO DE CHAVES ESTRANGEIRAS PARA INTEGRIDADE OPERACIONAL - VEXX SQUAD
-- Copie e cole este script completo no painel SQL Editor do seu Supabase
-- e clique em "Run" para atualizar os relacionamentos estruturais do banco.
-- =========================================================================

-- NOTA: O aplicativo VEXX agora implementa uma estratégia híbrida resiliente de
-- "Client-side Joins" que funciona de forma independente no código, mas a execução
-- deste script é ALTAMENTE recomendada para reestabelecer a integridade referencial
-- nativa do banco de dados PostgreSQL e habilitar a otimização de performance pelo PostgREST.

BEGIN;

-- 1. CORREÇÃO NA TABELA DE STORIES
-- Remover a constraint anterior que aponta para auth.users se existir
ALTER TABLE IF EXISTS public.stories 
  DROP CONSTRAINT IF EXISTS stories_usuario_id_fkey;

-- Adicionar a nova constraint apontando diretamente para public.usuarios
ALTER TABLE public.stories 
  ADD CONSTRAINT stories_usuario_id_fkey 
  FOREIGN KEY (usuario_id) 
  REFERENCES public.usuarios(id) 
  ON DELETE CASCADE;

-- 2. CORREÇÃO NA TABELA DE CHALLENGES
-- Remover a constraint anterior que aponta para auth.users se existir
ALTER TABLE IF EXISTS public.challenges 
  DROP CONSTRAINT IF EXISTS challenges_owner_id_fkey;

-- Adicionar a nova constraint apontando diretamente para public.usuarios
ALTER TABLE public.challenges 
  ADD CONSTRAINT challenges_owner_id_fkey 
  FOREIGN KEY (owner_id) 
  REFERENCES public.usuarios(id) 
  ON DELETE SET NULL;

-- 3. CORREÇÃO NA TABELA DE SQUADS
-- Remover a constraint anterior que aponta para auth.users se existir
ALTER TABLE IF EXISTS public.squads 
  DROP CONSTRAINT IF EXISTS squads_owner_id_fkey;

-- Adicionar a nova constraint apontando diretamente para public.usuarios
ALTER TABLE public.squads 
  ADD CONSTRAINT squads_owner_id_fkey 
  FOREIGN KEY (owner_id) 
  REFERENCES public.usuarios(id) 
  ON DELETE CASCADE;

COMMIT;

-- =========================================================================
-- SCRIPT FINALIZADO COM SUCESSO. SEU BANCO SUPABASE ESTÁ TOTALMENTE ALINHADO!
-- =========================================================================
