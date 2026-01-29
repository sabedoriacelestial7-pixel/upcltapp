-- Add CPF field to profiles table (unique per user, immutable once set)
ALTER TABLE public.profiles 
ADD COLUMN cpf character varying(11) UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_profiles_cpf ON public.profiles(cpf);

-- Add comment explaining the field
COMMENT ON COLUMN public.profiles.cpf IS 'CPF vinculado ao usuário. Uma vez definido, não pode ser alterado.';