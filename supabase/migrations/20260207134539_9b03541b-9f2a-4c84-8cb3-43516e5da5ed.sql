-- Remover política permissiva de INSERT
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Criar política mais restritiva - usuários não podem inserir diretamente
-- As notificações são inseridas apenas pelo trigger com SECURITY DEFINER
-- Não precisamos de política INSERT para usuários normais