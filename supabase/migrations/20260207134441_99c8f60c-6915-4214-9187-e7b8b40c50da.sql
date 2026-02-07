-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'status_change',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Criar índice para performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

-- Função para criar notificação quando status da proposta muda
CREATE OR REPLACE FUNCTION public.notify_proposal_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  status_text TEXT;
  message_text TEXT;
BEGIN
  -- Só notifica se o status realmente mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Mapear status para texto amigável
    CASE NEW.status
      WHEN 'pendente' THEN status_text := 'Pendente';
      WHEN 'em_analise' THEN status_text := 'Em Análise';
      WHEN 'aprovado' THEN status_text := 'Aprovada';
      WHEN 'assinatura_pendente' THEN status_text := 'Aguardando Assinatura';
      WHEN 'efetivado' THEN status_text := 'Efetivada';
      WHEN 'cancelado' THEN status_text := 'Cancelada';
      WHEN 'rejeitado' THEN status_text := 'Rejeitada';
      ELSE status_text := NEW.status;
    END CASE;

    message_text := 'Sua proposta de R$ ' || TRIM(TO_CHAR(NEW.valor_operacao, '999G999D00')) || ' no ' || NEW.banco_nome || ' agora está: ' || status_text;

    INSERT INTO public.notifications (user_id, proposal_id, title, message, type)
    VALUES (NEW.user_id, NEW.id, 'Status da Proposta Atualizado', message_text, 'status_change');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela proposals
CREATE TRIGGER on_proposal_status_change
  AFTER UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_proposal_status_change();