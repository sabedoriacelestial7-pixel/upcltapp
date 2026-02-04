import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SugestaoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    mensagem: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.email.trim() || !formData.mensagem.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar logado');
        return;
      }

      const { error } = await supabase
        .from('suggestions')
        .insert({
          user_id: user.id,
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          mensagem: formData.mensagem.trim()
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
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
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
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Seu nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              disabled={loading}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Sua sugestão</Label>
            <Textarea
              id="mensagem"
              placeholder="Escreva sua sugestão, crítica ou elogio..."
              value={formData.mensagem}
              onChange={(e) => setFormData(prev => ({ ...prev, mensagem: e.target.value }))}
              disabled={loading}
              className="bg-white min-h-[150px] resize-none"
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
    </div>
  );
}
