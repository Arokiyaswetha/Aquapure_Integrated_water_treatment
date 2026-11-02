
CREATE TABLE public.treatment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  treatment_type text NOT NULL,
  source text NOT NULL,
  volume_treated numeric NOT NULL,
  ph_before numeric NOT NULL,
  ph_after numeric NOT NULL,
  turbidity_before numeric NOT NULL,
  turbidity_after numeric NOT NULL,
  tds_before numeric NOT NULL,
  tds_after numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  operator text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view treatment history" ON public.treatment_history
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert treatment history" ON public.treatment_history
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update treatment history" ON public.treatment_history
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed sample data
INSERT INTO public.treatment_history (treatment_id, date, treatment_type, source, volume_treated, ph_before, ph_after, turbidity_before, turbidity_after, tds_before, tds_after, status, operator) VALUES
  ('TR-001', '2026-01-31', 'Reverse Osmosis', 'Zone A - Well 1', 25000, 6.2, 7.1, 4.5, 0.3, 850, 120, 'completed', 'John Smith'),
  ('TR-002', '2026-01-30', 'UV Disinfection', 'Zone B - Reservoir', 18000, 7.0, 7.0, 0.8, 0.5, 220, 220, 'completed', 'Sarah Johnson'),
  ('TR-003', '2026-01-29', 'Chlorination', 'Zone C - Tank 3', 32000, 7.2, 7.4, 1.2, 0.8, 180, 185, 'completed', 'Mike Chen'),
  ('TR-004', '2026-01-28', 'Filtration', 'Zone A - Well 2', 15000, 6.8, 7.0, 8.2, 1.1, 420, 380, 'pending', 'Lisa Wang'),
  ('TR-005', '2026-01-27', 'Chemical Treatment', 'Zone D - Main Line', 45000, 5.8, 7.2, 3.5, 0.6, 650, 280, 'completed', 'John Smith'),
  ('TR-006', '2026-01-26', 'Reverse Osmosis', 'Zone B - Well 3', 22000, 6.5, 7.0, 5.1, 0.4, 920, 95, 'failed', 'Sarah Johnson');
