-- Create nutrient_batches table
CREATE TABLE public.nutrient_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL UNIQUE,
  batch_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  certification_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('verified', 'pending', 'failed')),
  certifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batch_activity_history table
CREATE TABLE public.transaction_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_id TEXT NOT NULL UNIQUE,
  tx_type TEXT NOT NULL,
  batch_id TEXT NOT NULL REFERENCES public.nutrient_batches(batch_id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.nutrient_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Anyone can view nutrient batches"
ON public.nutrient_batches
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view transaction history"
ON public.transaction_history
FOR SELECT
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_nutrient_batches_updated_at
BEFORE UPDATE ON public.nutrient_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.nutrient_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_history;

-- Insert initial batch data
INSERT INTO public.nutrient_batches (batch_id, batch_name, quantity, certification_date, expiry_date, status, certifier) VALUES
('NB-2024-001', 'Nitrogen Compound A', '2,500 kg', '2024-01-15', '2025-01-15', 'verified', 'AgriCert Global'),
('NB-2024-002', 'Phosphate Mix B', '1,800 kg', '2024-01-18', '2025-01-18', 'verified', 'EcoNutrient Labs'),
('NB-2024-003', 'Potassium Blend C', '3,200 kg', '2024-01-20', '2025-01-20', 'pending', 'GreenCert Authority'),
('NB-2024-004', 'Organic Compost D', '5,000 kg', '2024-01-22', '2025-01-22', 'verified', 'AgriCert Global'),
('NB-2024-005', 'Micronutrient Mix E', '800 kg', '2024-01-25', '2025-01-25', 'failed', 'EcoNutrient Labs');

-- Insert initial activity data
INSERT INTO public.transaction_history (tx_id, tx_type, batch_id, timestamp, status) VALUES
('TX-001', 'Certification', 'NB-2024-004', '2024-01-22 14:32:15', 'confirmed'),
('TX-002', 'Verification', 'NB-2024-003', '2024-01-20 09:15:42', 'pending'),
('TX-003', 'Transfer', 'NB-2024-002', '2024-01-19 16:48:33', 'confirmed'),
('TX-004', 'Certification', 'NB-2024-002', '2024-01-18 11:22:08', 'confirmed'),
('TX-005', 'Rejection', 'NB-2024-005', '2024-01-25 08:05:19', 'confirmed');
