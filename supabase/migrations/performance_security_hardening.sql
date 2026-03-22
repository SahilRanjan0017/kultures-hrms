-- ============================================================
-- Migration: Performance Indexes + OTP Rate Limiting + Soft Delete
-- Run this in Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SECTION 1: PERFORMANCE INDEXES
-- Every FK on tenant_id / employee_id / user_id gets an index.
-- Without these, every tenant-scoped query does a full table scan.
-- ────────────────────────────────────────────────────────────

-- employees
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id     ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id       ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id    ON public.employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_status        ON public.employees(status);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id      ON public.profiles(tenant_id);

-- tenant_members
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id   ON public.tenant_members(user_id);

-- leave_requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id    ON public.leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id  ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status       ON public.leave_requests(status);

-- leave_balances
CREATE INDEX IF NOT EXISTS idx_leave_balances_tenant_id    ON public.leave_balances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_id  ON public.leave_balances(employee_id);

-- attendance_logs
CREATE INDEX IF NOT EXISTS idx_attendance_logs_tenant_id   ON public.attendance_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_employee_id ON public.attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date        ON public.attendance_logs(date);

-- payslips
CREATE INDEX IF NOT EXISTS idx_payslips_tenant_id     ON public.payslips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id   ON public.payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_month         ON public.payslips(month);

-- payroll_runs
CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant_id ON public.payroll_runs(tenant_id);

-- salary_structures
CREATE INDEX IF NOT EXISTS idx_salary_structures_tenant_id ON public.salary_structures(tenant_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read   ON public.notifications(is_read);

-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON public.activity_logs(tenant_id);

-- company_policies
CREATE INDEX IF NOT EXISTS idx_company_policies_tenant_id ON public.company_policies(tenant_id);

-- holidays
CREATE INDEX IF NOT EXISTS idx_holidays_tenant_id ON public.holidays(tenant_id);

-- employee sub-tables
CREATE INDEX IF NOT EXISTS idx_employee_academics_employee_id        ON public.employee_academics(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_experience_employee_id       ON public.employee_experience(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_banking_identity_employee_id ON public.employee_banking_identity(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_languages_employee_id        ON public.employee_languages(employee_id);

-- tenant_api_keys
CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_tenant_id ON public.tenant_api_keys(tenant_id);


-- ────────────────────────────────────────────────────────────
-- SECTION 2: OTP RATE LIMITING TABLE
-- Tracks OTP request attempts per identifier (email / emp_code).
-- Used by the reset-password and setup-email API routes to:
--   1. Enforce max 5 attempts per 15-minute window
--   2. Block repeated abuse without valid credentials
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  identifier    text                     NOT NULL,             -- email or emp_code
  tenant_id     uuid                     REFERENCES public.tenants(id),
  attempt_count integer                  NOT NULL DEFAULT 1,
  first_attempt timestamp with time zone NOT NULL DEFAULT now(),
  last_attempt  timestamp with time zone NOT NULL DEFAULT now(),
  blocked_until timestamp with time zone,
  CONSTRAINT otp_rate_limits_pkey PRIMARY KEY (id),
  CONSTRAINT otp_rate_limits_identifier_unique UNIQUE (identifier)
);

CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_identifier    ON public.otp_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_blocked_until ON public.otp_rate_limits(blocked_until);

-- Automatically clean up records older than 1 hour (no permanent bloat)
-- Run this as a scheduled job in Supabase (pg_cron) or just let the app clean on read
COMMENT ON TABLE public.otp_rate_limits IS
  'Tracks OTP request attempts. Max 5 attempts per 15-min window per identifier. Blocked until timestamp enforces cooldown.';

-- Row Level Security for otp_rate_limits (service role only — never exposed to client)
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.otp_rate_limits
  FOR ALL USING (auth.role() = 'service_role');


-- ────────────────────────────────────────────────────────────
-- SECTION 3: SOFT DELETE (deleted_at)
-- Critical tables get a deleted_at timestamp instead of hard DELETE.
-- This allows audit trails, accidental recovery, and safe FK references.
-- Application queries must add `WHERE deleted_at IS NULL` filtering.
-- ────────────────────────────────────────────────────────────

-- employees (most critical — cascades would destroy payroll history)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_employees_deleted_at ON public.employees(deleted_at)
  WHERE deleted_at IS NULL;  -- partial index: only un-deleted rows indexed (efficient)

-- leave_requests (audit trail required)
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- payslips (financial records — must never hard delete)
ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- company_policies
ALTER TABLE public.company_policies
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- tenant_api_keys (revocation trail)
-- Note: already has revoked_at column, deleted_at adds visibility into full lifecycle
ALTER TABLE public.tenant_api_keys
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;


-- ────────────────────────────────────────────────────────────
-- SECTION 4: Update RLS policies for soft-deleted rows
-- Existing policies need a deleted_at IS NULL filter added
-- so soft-deleted records are invisible to normal queries.
-- ────────────────────────────────────────────────────────────

-- Recreate the employees SELECT policy to exclude soft-deleted rows
-- (adjust the policy name below to match your actual policy name)
DO $$
BEGIN
  -- Only add the filter if the employees table has RLS enabled
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'employees' AND c.relrowsecurity = true
  ) THEN
    RAISE NOTICE 'RLS is enabled on employees. Ensure your SELECT policies include: deleted_at IS NULL';
  END IF;
END $$;
