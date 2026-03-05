
-- Add line_user_id to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS line_user_id text;
CREATE INDEX IF NOT EXISTS idx_tenants_line_user_id ON public.tenants(line_user_id);

-- Create bills table for monthly billing history
CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  billing_month text NOT NULL,
  room_name text NOT NULL DEFAULT '',
  tenant_name text NOT NULL DEFAULT '',
  rent numeric NOT NULL DEFAULT 0,
  previous_meter numeric NOT NULL DEFAULT 0,
  current_meter numeric NOT NULL DEFAULT 0,
  electricity_rate numeric NOT NULL DEFAULT 8,
  electricity_cost numeric NOT NULL DEFAULT 0,
  water_cost numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  payment_slip_url text,
  paid_at timestamp with time zone,
  note text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(room_id, billing_month)
);

-- Enable RLS on bills
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Admin (owner) policies - full CRUD based on user_id
CREATE POLICY "Owners can view own bills" ON public.bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can insert own bills" ON public.bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update own bills" ON public.bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete own bills" ON public.bills FOR DELETE USING (auth.uid() = user_id);

-- Tenant policy: anon users can view bills if their line_user_id matches a tenant linked to the room
CREATE POLICY "Tenants can view own bills via LINE"
  ON public.bills
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.room_id = bills.room_id
        AND t.line_user_id = current_setting('request.headers')::json->>'x-line-user-id'
    )
  );

-- Update trigger for bills
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-slips', 'payment-slips', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment slips
CREATE POLICY "Owners can upload payment slips"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-slips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can view payment slips"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-slips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete payment slips"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'payment-slips' AND auth.uid()::text = (storage.foldername(name))[1]);
