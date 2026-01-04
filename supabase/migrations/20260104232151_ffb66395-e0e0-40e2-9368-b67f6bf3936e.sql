-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Tabela de consultas de margem
CREATE TABLE public.margin_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf TEXT NOT NULL,
  nome_trabalhador TEXT,
  valor_margem_disponivel DECIMAL(10,2),
  valor_base_margem DECIMAL(10,2),
  valor_total_vencimentos DECIMAL(10,2),
  nome_empregador TEXT,
  data_admissao DATE,
  elegivel BOOLEAN DEFAULT false,
  motivo_inelegibilidade TEXT,
  api_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.margin_queries ENABLE ROW LEVEL SECURITY;

-- Policies for margin_queries
CREATE POLICY "Users can view their own queries"
ON public.margin_queries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queries"
ON public.margin_queries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Tabela de solicitações de contratação
CREATE TABLE public.contract_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  margin_query_id UUID REFERENCES public.margin_queries(id),
  banco_id TEXT NOT NULL,
  banco_nome TEXT NOT NULL,
  valor_solicitado DECIMAL(10,2) NOT NULL,
  parcelas INTEGER NOT NULL,
  valor_parcela DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  taxa_mensal DECIMAL(5,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_requests ENABLE ROW LEVEL SECURITY;

-- Policies for contract_requests
CREATE POLICY "Users can view their own requests"
ON public.contract_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests"
ON public.contract_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, telefone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'telefone'
  );
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();