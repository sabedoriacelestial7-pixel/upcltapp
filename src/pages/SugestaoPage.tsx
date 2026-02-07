import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/PageTransition';

export default function SugestaoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mensagem.trim()) {
      toast.error('Escreva sua sugestão');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar logado');
        return;
      }

      // Buscar dados do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, email')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('suggestions')
        .insert({
          user_id: user.id,
          nome: profile?.nome || 'Usuário',
          email: profile?.email || user.email || '',
          mensagem: mensagem.trim()
        });

      if (error) throw error;

      toast.success('Sugestão enviada com sucesso!', {
        description: 'Agradecemos seu feedback.'
      });
      
      navigate('/perfil');
    } catch (error) {
      console.error('Erro ao enviar sugestão:', error);
      toast.error('Erro ao enviar sugestão', {
        description: 'Tente novamente mais tarde.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6">
        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Voltar</span>
        </button>
        <h1 className="text-xl font-bold">Deixar sugestão</h1>
        <p className="text-sm text-primary-foreground/80 mt-1">
          Sua opinião é muito importante para nós
        </p>
      </header>

      <main className="max-w-md mx-auto px-5 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="mensagem">Sua sugestão</Label>
            <Textarea
              id="mensagem"
              placeholder="Escreva sua sugestão, crítica ou elogio..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              disabled={loading}
              className="bg-card min-h-[180px] resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full h-12 text-base font-semibold',
              'bg-primary hover:bg-primary/90'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Enviando...
              </>
            ) : (
              <>
                <Send size={20} className="mr-2" />
                Enviar sugestão
              </>
            )}
          </Button>
        </form>
      </main>

      <BottomNav />
    </PageTransition>
  );
}
