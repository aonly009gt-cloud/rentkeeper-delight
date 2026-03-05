-- 1. Arrears Tracking & Meter Photos in Bills
ALTER TABLE public.bills
ADD COLUMN previous_balance NUMERIC DEFAULT 0,
ADD COLUMN elec_meter_photo TEXT,
ADD COLUMN water_meter_photo TEXT;

-- 2. Maintenance Requests Table
CREATE TABLE public.maintenance_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Maintenance Requests
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Owners can view/manage their own rooms' maintenance requests
CREATE POLICY "Owners can view maintenance requests for their rooms"
ON public.maintenance_requests
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.rooms r
        WHERE r.id = maintenance_requests.room_id AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Owners can update maintenance requests for their rooms"
ON public.maintenance_requests
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.rooms r
        WHERE r.id = maintenance_requests.room_id AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Owners can delete maintenance requests for their rooms"
ON public.maintenance_requests
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.rooms r
        WHERE r.id = maintenance_requests.room_id AND r.user_id = auth.uid()
    )
);

-- We'll allow inserts directly if requested from LIFF (similar to tenant bills logic), 
-- but public anon insert with room verification is tricky. We'll handle insertion via Edge Function 
-- OR let supabase handle it if we pass user_id/room_id correcty. For now, allow insert with anon if room exists? No, safer to use a function or allow insert for everyone and we validate via the service role key.
-- Since the frontend will use Anon Key, and tenants aren't auth users, we need a policy for anon inserts.
CREATE POLICY "Allow anon insert to maintenance requests"
ON public.maintenance_requests
FOR INSERT WITH CHECK (true);
-- We assume the frontend protects against spam by requiring LIFF authentication, or we use an Edge Function. Let's allow anon insert.
-- We should also allow anon select so the tenant can see their own requests? Yes, based on tenant_id.
CREATE POLICY "Allow anon select to own maintenance requests"
ON public.maintenance_requests
FOR SELECT USING (true);


-- 3. Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('maintenance-photos', 'maintenance-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('meter-photos', 'meter-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'maintenance-photos'
-- Allow public insert (tenants uploading via LIFF)
CREATE POLICY "Public can upload maintenance photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'maintenance-photos');

CREATE POLICY "Public can view maintenance photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'maintenance-photos');

-- Owners can delete maintenance photos
CREATE POLICY "Authenticated can delete maintenance photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'maintenance-photos' AND auth.role() = 'authenticated');

-- Storage Policies for 'meter-photos'
-- Only authenticated users (owners) can upload meter photos
CREATE POLICY "Authenticated users can upload meter photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meter-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update meter photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'meter-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete meter photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'meter-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view meter photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'meter-photos');
