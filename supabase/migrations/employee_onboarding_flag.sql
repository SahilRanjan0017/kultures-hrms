-- Migration: Employee Onboarding Completion
-- Adds onboarding_completed flag to profiles to track progress for all roles.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- All existing admins with a tenant are considered onboarded
UPDATE public.profiles 
SET onboarding_completed = true 
WHERE tenant_id IS NOT NULL AND role = 'admin';

-- All existing active employees are considered onboarded
UPDATE public.profiles p
SET onboarding_completed = true
FROM public.employees e
WHERE p.id = e.user_id AND e.status = 'active';

-- Refresh the view to include the new column
CREATE OR REPLACE VIEW public.v_user_status AS
SELECT id, email, tenant_id, role, is_first_login, onboarding_completed
FROM public.profiles;
