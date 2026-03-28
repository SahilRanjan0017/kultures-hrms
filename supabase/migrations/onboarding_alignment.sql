-- ============================================================
-- ONBOARDING ALIGNMENT
-- ============================================================

-- Add sector/industry and size to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS size text;

-- Ensure phone exists in employees for admin contact
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone text;
