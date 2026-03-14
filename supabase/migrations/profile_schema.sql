-- =========================================================================
-- Employee Profile Schema Updates (Multi-Tenant Aware)
-- Since the tables already exist, we need to ADD the tenant_id column 
-- and then apply the RLS policies.
-- =========================================================================

-- 1. Add tenant_id column to existing tables
ALTER TABLE public.employee_work_info ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.employee_experience ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.employee_references ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.employee_academics ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.employee_personal_data ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.employee_languages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.employee_banking_identity ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. Backfill tenant_id from employees table (if there is any existing data)
UPDATE public.employee_work_info w SET tenant_id = e.tenant_id FROM public.employees e WHERE w.employee_id = e.id AND w.tenant_id IS NULL;
UPDATE public.employee_experience w SET tenant_id = e.tenant_id FROM public.employees e WHERE w.employee_id = e.id AND w.tenant_id IS NULL;
UPDATE public.employee_references w SET tenant_id = e.tenant_id FROM public.employees e WHERE w.employee_id = e.id AND w.tenant_id IS NULL;
UPDATE public.employee_academics w SET tenant_id = e.tenant_id FROM public.employees e WHERE w.employee_id = e.id AND w.tenant_id IS NULL;
UPDATE public.employee_personal_data w SET tenant_id = e.tenant_id FROM public.employees e WHERE w.employee_id = e.id AND w.tenant_id IS NULL;
UPDATE public.employee_languages w SET tenant_id = e.tenant_id FROM public.employees e WHERE w.employee_id = e.id AND w.tenant_id IS NULL;
UPDATE public.employee_banking_identity w SET tenant_id = e.tenant_id FROM public.employees e WHERE w.employee_id = e.id AND w.tenant_id IS NULL;

-- 3. In case any stray records exist without an employee, delete them to enforce NOT NULL
DELETE FROM public.employee_work_info WHERE tenant_id IS NULL;
DELETE FROM public.employee_experience WHERE tenant_id IS NULL;
DELETE FROM public.employee_references WHERE tenant_id IS NULL;
DELETE FROM public.employee_academics WHERE tenant_id IS NULL;
DELETE FROM public.employee_personal_data WHERE tenant_id IS NULL;
DELETE FROM public.employee_languages WHERE tenant_id IS NULL;
DELETE FROM public.employee_banking_identity WHERE tenant_id IS NULL;

-- 4. Enforce NOT NULL constraint on tenant_id
ALTER TABLE public.employee_work_info ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.employee_experience ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.employee_references ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.employee_academics ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.employee_personal_data ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.employee_languages ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.employee_banking_identity ALTER COLUMN tenant_id SET NOT NULL;

-- =========================================================================
-- Enable Row Level Security (RLS) policies
-- Strict Tenant Isolation
-- =========================================================================
ALTER TABLE public.employee_work_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_academics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_personal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_banking_identity ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id (if not already existing)
CREATE OR REPLACE FUNCTION public.get_tenant_id() RETURNS UUID AS $$
    SELECT tenant_id FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Unified read policy: Drop existings (if any) and recreate
DO $$
BEGIN
    DROP POLICY IF EXISTS "Tenant users can view work info" ON public.employee_work_info;
    DROP POLICY IF EXISTS "Tenant users can view experience" ON public.employee_experience;
    DROP POLICY IF EXISTS "Tenant users can view references" ON public.employee_references;
    DROP POLICY IF EXISTS "Tenant users can view academics" ON public.employee_academics;
    DROP POLICY IF EXISTS "Tenant users can view personal data" ON public.employee_personal_data;
    DROP POLICY IF EXISTS "Tenant users can view languages" ON public.employee_languages;
    DROP POLICY IF EXISTS "Tenant users can view banking" ON public.employee_banking_identity;
END $$;

CREATE POLICY "Tenant users can view work info" ON public.employee_work_info FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "Tenant users can view experience" ON public.employee_experience FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "Tenant users can view references" ON public.employee_references FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "Tenant users can view academics" ON public.employee_academics FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "Tenant users can view personal data" ON public.employee_personal_data FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "Tenant users can view languages" ON public.employee_languages FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "Tenant users can view banking" ON public.employee_banking_identity FOR SELECT USING (tenant_id = public.get_tenant_id());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_employee_work_info_tenant ON public.employee_work_info(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_experience_tenant ON public.employee_experience(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_references_tenant ON public.employee_references(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_academics_tenant ON public.employee_academics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_personal_data_tenant ON public.employee_personal_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_languages_tenant ON public.employee_languages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_banking_tenant ON public.employee_banking_identity(tenant_id);
