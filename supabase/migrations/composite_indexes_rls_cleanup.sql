-- ============================================================
-- Migration: Composite Indexes + OTP Cleanup Job + RLS Policies
-- Run this in Supabase SQL Editor AFTER performance_security_hardening.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SECTION 1: COMPOSITE INDEXES FOR HEAVY QUERIES
-- Single-column indexes already added in previous migration.
-- These cover the most common multi-column query patterns.
-- ────────────────────────────────────────────────────────────

-- employees: listing active employees per tenant (most common dashboard query)
CREATE INDEX IF NOT EXISTS idx_employees_tenant_status
  ON public.employees(tenant_id, status)
  WHERE deleted_at IS NULL;

-- attendance_logs: daily attendance per tenant (clock-in/out widget, reports)
CREATE INDEX IF NOT EXISTS idx_attendance_logs_tenant_employee_date
  ON public.attendance_logs(tenant_id, employee_id, date DESC);

-- attendance_logs: tenant-level daily summary (Present Today widget)
CREATE INDEX IF NOT EXISTS idx_attendance_logs_tenant_date
  ON public.attendance_logs(tenant_id, date DESC);

-- leave_requests: pending approvals per tenant (HR inbox)
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_status
  ON public.leave_requests(tenant_id, status)
  WHERE deleted_at IS NULL;

-- leave_requests: employee's own leave history
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status
  ON public.leave_requests(employee_id, status)
  WHERE deleted_at IS NULL;

-- leave_balances: employee balance lookup per year
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year
  ON public.leave_balances(employee_id, year);

-- notifications: unread count per user (bell icon query — runs every 60s)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read)
  WHERE is_read = false;

-- payslips: tenant payroll history by month
CREATE INDEX IF NOT EXISTS idx_payslips_tenant_month
  ON public.payslips(tenant_id, month)
  WHERE deleted_at IS NULL;

-- payslips: employee's own payslip list
CREATE INDEX IF NOT EXISTS idx_payslips_employee_month
  ON public.payslips(employee_id, month)
  WHERE deleted_at IS NULL;

-- activity_logs: recent activity per tenant (dashboard feed)
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_created
  ON public.activity_logs(tenant_id, created_at DESC);

-- tenant_members: active members per tenant
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_status
  ON public.tenant_members(tenant_id, status);

-- profiles: lookup by tenant (onboarding checks)
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_employee
  ON public.profiles(tenant_id, employee_id)
  WHERE employee_id IS NOT NULL;

-- holidays: tenant + date range queries (calendar widget)
CREATE INDEX IF NOT EXISTS idx_holidays_tenant_date
  ON public.holidays(tenant_id, date);

-- Missing indexes from schema that weren't in previous migration
-- (new tables: employee_personal_data, employee_references, employee_work_info)
CREATE INDEX IF NOT EXISTS idx_employee_personal_data_employee_id
  ON public.employee_personal_data(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_personal_data_tenant_id
  ON public.employee_personal_data(tenant_id);

CREATE INDEX IF NOT EXISTS idx_employee_references_employee_id
  ON public.employee_references(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_references_tenant_id
  ON public.employee_references(tenant_id);

CREATE INDEX IF NOT EXISTS idx_employee_work_info_employee_id
  ON public.employee_work_info(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_work_info_tenant_id
  ON public.employee_work_info(tenant_id);


-- ────────────────────────────────────────────────────────────
-- SECTION 2: OTP RATE LIMIT CLEANUP FUNCTION + SCHEDULED JOB
-- Removes records older than WINDOW_MINUTES that are not blocked.
-- Safe to run frequently; operates only on stale, unblocked rows.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cleanup_otp_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.otp_rate_limits
  WHERE
    -- Record's window has expired (last attempt > 15 minutes ago)
    last_attempt < NOW() - INTERVAL '15 minutes'
    -- AND it's not currently in a blocked state
    AND (blocked_until IS NULL OR blocked_until < NOW());

  -- Also expire old blocks (blocked_until passed)
  UPDATE public.otp_rate_limits
  SET attempt_count = 0,
      blocked_until = NULL,
      first_attempt = NOW()
  WHERE blocked_until IS NOT NULL AND blocked_until < NOW();
END;
$$;

-- Schedule using pg_cron (enable pg_cron extension in Supabase Dashboard → Extensions first)
-- Runs every 15 minutes, keeps the table lean
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'cleanup-otp-rate-limits',   -- job name (unique)
      '*/15 * * * *',              -- every 15 minutes
      'SELECT public.cleanup_otp_rate_limits();'
    );
    RAISE NOTICE 'pg_cron job scheduled: cleanup-otp-rate-limits every 15 minutes';
  ELSE
    RAISE NOTICE 'pg_cron not installed. Run cleanup_otp_rate_limits() manually or enable the extension.';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- SECTION 3: ROW LEVEL SECURITY — FULL COVERAGE
-- All tenant-scoped tables enforce tenant_id = the caller's tenant.
-- The pattern: auth.uid() → tenant_members → tenant_id lookup.
-- ────────────────────────────────────────────────────────────

-- Helper function: returns the tenant_id for the currently authenticated user
-- Used in all RLS policies below to avoid N+1 subqueries
CREATE OR REPLACE FUNCTION public.auth_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id
  FROM public.tenant_members
  WHERE user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

-- Helper: returns role of the current user in their tenant
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.tenant_members
  WHERE user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

-- ── employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_employees" ON public.employees;
CREATE POLICY "tenant_isolation_employees" ON public.employees
  FOR ALL USING (
    tenant_id = public.auth_user_tenant_id()
    AND deleted_at IS NULL
  );

-- ── attendance_logs
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_attendance" ON public.attendance_logs;
CREATE POLICY "tenant_isolation_attendance" ON public.attendance_logs
  FOR ALL USING (tenant_id = public.auth_user_tenant_id());

-- ── leave_requests
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_leave_requests" ON public.leave_requests;
CREATE POLICY "tenant_isolation_leave_requests" ON public.leave_requests
  FOR ALL USING (
    tenant_id = public.auth_user_tenant_id()
    AND deleted_at IS NULL
  );

-- ── leave_balances
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_leave_balances" ON public.leave_balances;
CREATE POLICY "tenant_isolation_leave_balances" ON public.leave_balances
  FOR ALL USING (tenant_id = public.auth_user_tenant_id());

-- ── leave_types
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_leave_types" ON public.leave_types;
CREATE POLICY "tenant_isolation_leave_types" ON public.leave_types
  FOR ALL USING (tenant_id = public.auth_user_tenant_id());

-- ── notifications: each user sees only their own
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_notifications" ON public.notifications;
CREATE POLICY "own_notifications" ON public.notifications
  FOR ALL USING (
    tenant_id = public.auth_user_tenant_id()
    AND user_id = auth.uid()
  );

-- ── payroll_runs
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_payroll_runs" ON public.payroll_runs;
CREATE POLICY "tenant_isolation_payroll_runs" ON public.payroll_runs
  FOR ALL USING (tenant_id = public.auth_user_tenant_id());

-- ── payslips
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_payslips" ON public.payslips;
CREATE POLICY "tenant_isolation_payslips" ON public.payslips
  FOR ALL USING (
    tenant_id = public.auth_user_tenant_id()
    AND deleted_at IS NULL
  );

-- ── salary_structures
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_salary_structures" ON public.salary_structures;
CREATE POLICY "tenant_isolation_salary_structures" ON public.salary_structures
  FOR ALL USING (tenant_id = public.auth_user_tenant_id());

-- ── company_policies
ALTER TABLE public.company_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_company_policies" ON public.company_policies;
CREATE POLICY "tenant_isolation_company_policies" ON public.company_policies
  FOR ALL USING (
    tenant_id = public.auth_user_tenant_id()
    AND deleted_at IS NULL
  );

-- ── holidays
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_holidays" ON public.holidays;
CREATE POLICY "tenant_isolation_holidays" ON public.holidays
  FOR ALL USING (tenant_id = public.auth_user_tenant_id());

-- ── activity_logs (read-only for non-service roles, writes via service role)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_activity_logs" ON public.activity_logs;
CREATE POLICY "tenant_isolation_activity_logs" ON public.activity_logs
  FOR SELECT USING (tenant_id = public.auth_user_tenant_id());

-- ── tenant_api_keys (admin/hr only)
ALTER TABLE public.tenant_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_api_keys" ON public.tenant_api_keys;
CREATE POLICY "tenant_isolation_api_keys" ON public.tenant_api_keys
  FOR ALL USING (
    tenant_id = public.auth_user_tenant_id()
    AND public.auth_user_role() IN ('admin', 'hr')
    AND deleted_at IS NULL
  );

-- ── employee sub-tables (all share same pattern)
ALTER TABLE public.employee_academics        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_banking_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_experience       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_languages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_personal_data    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_references       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_work_info        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_emp_academics"   ON public.employee_academics;
DROP POLICY IF EXISTS "tenant_isolation_emp_banking"     ON public.employee_banking_identity;
DROP POLICY IF EXISTS "tenant_isolation_emp_experience"  ON public.employee_experience;
DROP POLICY IF EXISTS "tenant_isolation_emp_languages"   ON public.employee_languages;
DROP POLICY IF EXISTS "tenant_isolation_emp_personal"    ON public.employee_personal_data;
DROP POLICY IF EXISTS "tenant_isolation_emp_references"  ON public.employee_references;
DROP POLICY IF EXISTS "tenant_isolation_emp_workinfo"    ON public.employee_work_info;

CREATE POLICY "tenant_isolation_emp_academics"   ON public.employee_academics   FOR ALL USING (tenant_id = public.auth_user_tenant_id());
CREATE POLICY "tenant_isolation_emp_banking"     ON public.employee_banking_identity FOR ALL USING (tenant_id = public.auth_user_tenant_id());
CREATE POLICY "tenant_isolation_emp_experience"  ON public.employee_experience  FOR ALL USING (tenant_id = public.auth_user_tenant_id());
CREATE POLICY "tenant_isolation_emp_languages"   ON public.employee_languages   FOR ALL USING (tenant_id = public.auth_user_tenant_id());
CREATE POLICY "tenant_isolation_emp_personal"    ON public.employee_personal_data FOR ALL USING (tenant_id = public.auth_user_tenant_id());
CREATE POLICY "tenant_isolation_emp_references"  ON public.employee_references  FOR ALL USING (tenant_id = public.auth_user_tenant_id());
CREATE POLICY "tenant_isolation_emp_workinfo"    ON public.employee_work_info   FOR ALL USING (tenant_id = public.auth_user_tenant_id());

-- ── profiles: users can only see their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_profile" ON public.profiles;
CREATE POLICY "own_profile" ON public.profiles
  FOR ALL USING (id = auth.uid());

-- ── otp_codes: service role only (never accessible to browser clients)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only_otp" ON public.otp_codes;
CREATE POLICY "service_role_only_otp" ON public.otp_codes
  FOR ALL USING (auth.role() = 'service_role');

-- ── otp_rate_limits: service role only
-- Already set in previous migration, included here for completeness
DROP POLICY IF EXISTS "service_role_only_rate_limits" ON public.otp_rate_limits;
CREATE POLICY "service_role_only_rate_limits" ON public.otp_rate_limits
  FOR ALL USING (auth.role() = 'service_role');
