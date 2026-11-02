CREATE TABLE public.resource_recovery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sludge_generated_kg NUMERIC NOT NULL DEFAULT 0,
  sludge_dry_solids_pct NUMERIC NOT NULL DEFAULT 0,
  biogas_yield_m3 NUMERIC NOT NULL DEFAULT 0,
  methane_content_pct NUMERIC NOT NULL DEFAULT 0,
  reclaimed_water_m3 NUMERIC NOT NULL DEFAULT 0,
  reuse_application TEXT NOT NULL DEFAULT 'irrigation',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resource_recovery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resource recovery"
  ON public.resource_recovery FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert resource recovery"
  ON public.resource_recovery FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update resource recovery"
  ON public.resource_recovery FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_resource_recovery_date ON public.resource_recovery(date DESC);

INSERT INTO public.resource_recovery (date, sludge_generated_kg, sludge_dry_solids_pct, biogas_yield_m3, methane_content_pct, reclaimed_water_m3, reuse_application, notes)
SELECT
  (CURRENT_DATE - (n || ' days')::interval)::date,
  1800 + (random() * 600)::numeric(10,2),
  3 + (random() * 2)::numeric(10,2),
  900 + (random() * 350)::numeric(10,2),
  60 + (random() * 8)::numeric(10,2),
  450 + (random() * 250)::numeric(10,2),
  CASE (n % 3) WHEN 0 THEN 'irrigation' WHEN 1 THEN 'industrial' ELSE 'cooling' END,
  'Auto-seeded sample record'
FROM generate_series(0, 29) AS n;