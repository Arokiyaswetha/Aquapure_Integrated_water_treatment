DROP POLICY IF EXISTS "Anyone can view nutrient batches" ON public.nutrient_batches;
CREATE POLICY "Authenticated users can view nutrient batches"
ON public.nutrient_batches FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.nutrient_batches FROM anon;

DROP POLICY IF EXISTS "Anyone can view transaction history" ON public.transaction_history;
CREATE POLICY "Authenticated users can view transaction history"
ON public.transaction_history FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.transaction_history FROM anon;