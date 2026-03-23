-- ============================================================
-- FINAL PRODUCTION HARDENING: Security, Performance, & Monitoring
-- Run this in Supabase SQL Editor to ensure full compliance.
-- ============================================================

-- 1. ONBOARDING ENFORCEMENT
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 2. OTP RATE LIMITING (IP + IDENTIFIER)
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  identifier    text                     NOT NULL,             -- email, emp_code, or "ip:1.2.3.4"
  attempt_count integer                  NOT NULL DEFAULT 1,
  first_attempt timestamp with time zone NOT NULL DEFAULT now(),
  last_attempt  timestamp with time zone NOT NULL DEFAULT now(),
  blocked_until timestamp with time zone,
  CONSTRAINT otp_rate_limits_pkey PRIMARY KEY (id),
  CONSTRAINT otp_rate_limits_identifier_unique UNIQUE (identifier)
);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_identifier ON public.otp_rate_limits(identifier);

-- 3. SOFT DELETE COVERAGE (COMPREHENSIVE)
DO $$ 
BEGIN
    ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
    ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
    ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
    ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
    ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
    ALTER TABLE public.salary_structures ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
    ALTER TABLE public.company_policies ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
    ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
    ALTER TABLE public.leave_balances ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
END $$;

-- 4. PERFORMANCE INDEXES (60+ FK INDEXES)
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id     ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id       ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id      ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant   ON public.leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_tenant  ON public.attendance_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payslips_tenant         ON public.payslips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant    ON public.activity_logs(tenant_id);
-- (This is a subset — full list is in performance_security_hardening.sql)

-- 5. ROW LEVEL SECURITY (TENANT ISOLATION)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.profiles;
CREATE POLICY "Tenant Isolation" ON public.profiles
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 6. MONITORING (pg_stat_statements)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE TABLE IF NOT EXISTS public.slow_query_alerts (
    id           uuid                     NOT NULL DEFAULT gen_random_uuid(),
    query_sample text                     NOT NULL,
    avg_ms       numeric                  NOT NULL,
    captured_at  timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT slow_query_alerts_pkey PRIMARY KEY (id)
);
