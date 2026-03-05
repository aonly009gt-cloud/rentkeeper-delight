
-- Add tenant detail columns to rooms table
ALTER TABLE public.rooms
ADD COLUMN tenant_phone text DEFAULT '',
ADD COLUMN tenant_id_card_number text DEFAULT '',
ADD COLUMN occupant_count integer DEFAULT 1,
ADD COLUMN tenant_address text DEFAULT '',
ADD COLUMN tenant_emergency_contact text DEFAULT '',
ADD COLUMN tenant_emergency_phone text DEFAULT '';

-- Create storage bucket for tenant documents
INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-documents', 'tenant-documents', false);

-- Storage policies
CREATE POLICY "Users can upload tenant documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tenant-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own tenant documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own tenant documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'tenant-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own tenant documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tenant-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
