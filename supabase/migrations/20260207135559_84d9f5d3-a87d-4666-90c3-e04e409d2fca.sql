-- Adicionar política DELETE para suggestions
CREATE POLICY "Users can delete their own suggestions"
ON public.suggestions
FOR DELETE
USING (auth.uid() = user_id);