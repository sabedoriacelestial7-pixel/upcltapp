
-- Add UPDATE policy to margin_queries table to prevent unauthorized modifications
-- This ensures users can only update their own queries, preventing race conditions and policy bypasses
CREATE POLICY "Users can update their own queries"
ON public.margin_queries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy to margin_queries table for complete security
-- This prevents users from deleting other users' sensitive financial data
CREATE POLICY "Users can delete their own queries"
ON public.margin_queries
FOR DELETE
USING (auth.uid() = user_id);
