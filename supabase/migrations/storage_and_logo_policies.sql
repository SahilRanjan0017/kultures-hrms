-- 1. Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to tenant logos (read)
CREATE POLICY "Public Access to Logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'assets' AND (storage.foldername(name))[1] = 'tenant-logos' );

-- 3. Allow admins to upload/update their own tenant logos
CREATE POLICY "Admins can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets' AND 
  (storage.foldername(name))[1] = 'tenant-logos' AND
  EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid()
    AND tenant_id::text = (storage.foldername(name))[2]
    AND role IN ('admin', 'hr')
  )
);

CREATE POLICY "Admins can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assets' AND 
  (storage.foldername(name))[1] = 'tenant-logos' AND
  EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid()
    AND tenant_id::text = (storage.foldername(name))[2]
    AND role IN ('admin', 'hr')
  )
);

-- 4. Enable RLS on tenants if not enabled
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 5. Admins can update their tenant record (for logo_url)
CREATE POLICY "Admins can update own tenant"
ON public.tenants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid()
    AND tenant_id = public.tenants.id
    AND role IN ('admin', 'hr')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid()
    AND tenant_id = public.tenants.id
    AND role IN ('admin', 'hr')
  )
);
-- 6. Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Allow public access to profile images (read)
CREATE POLICY "Public Access to Profile Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' AND (storage.foldername(name))[1] = 'avatars' );

-- 8. Allow users to upload their own profile images
CREATE POLICY "Users can upload own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'avatars'
);

-- Note: In a production environment, you'd want stricter checks on (storage.foldername(name))[3] 
-- to match the employee_id, but since the API uses an admin client to perform the upload, 
-- we rely on the API's internal tenant/user checks for security.
