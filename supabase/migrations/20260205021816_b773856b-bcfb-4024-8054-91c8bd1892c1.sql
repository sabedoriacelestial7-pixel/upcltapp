
-- Add UPDATE policy to contract_requests table to prevent unauthorized modifications
CREATE POLICY "Users can update their own requests"
ON public.contract_requests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy to contract_requests table
CREATE POLICY "Users can delete their own requests"
ON public.contract_requests
FOR DELETE
USING (auth.uid() = user_id);
