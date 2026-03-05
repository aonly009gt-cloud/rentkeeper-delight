
-- Storage policies for payment-slips bucket
CREATE POLICY "Authenticated users can upload payment slips"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-slips');

CREATE POLICY "Authenticated users can view payment slips"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'payment-slips');

CREATE POLICY "Authenticated users can update payment slips"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-slips');

CREATE POLICY "Authenticated users can delete payment slips"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'payment-slips');
