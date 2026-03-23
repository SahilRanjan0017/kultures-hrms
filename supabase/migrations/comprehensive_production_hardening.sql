-- ============================================================
-- COMPREHENSIVE PRODUCTION HARDENING (MANDATORY)
-- Version: 2.0 (Post-Audit Enforcement)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CENTRALIZED RLS HELPER
-- ────────────────────────────────────────────────────────────
-- SECURE: Fetches the tenant_id directly from the profile of the current auth.uid().
-- Minimizes RLS subquery overhead and centralizes the "Source of Truth".
CREATE OR REPLACE FUNCTION public.auth_current_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 2. ENHANCED TENANT ISOLATION POLICIES (ALL TABLES)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
    table_name text;
    tenant_tables text[] := ARRAY[
        'employees', 'leave_requests', 'attendance_logs', 
        'payslips', 'notifications', 'tenant_members', 
        'payroll_runs', 'salary_structures', 'leave_balances',
        'company_policies', 'holidays', 'activity_logs'
    ];
BEGIN
    FOREACH table_name IN ARRAY tenant_tables
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

        -- Drop existing isolation policies to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation" ON public.%I', table_name);

        -- Create a strict isolation policy that includes Soft-Delete check
        -- Exception: activity_logs and notifications usually don't have deleted_at
        IF table_name IN ('activity_logs', 'notifications') THEN
            EXECUTE format(
                'CREATE POLICY "Tenant Isolation" ON public.%I FOR ALL USING (tenant_id = public.auth_current_tenant_id())',
                table_name
            );
        ELSE
            EXECUTE format(
                'CREATE POLICY "Tenant Isolation" ON public.%I FOR ALL USING (tenant_id = public.auth_current_tenant_id() AND deleted_at IS NULL)',
                table_name
            );
        END IF;

        RAISE NOTICE 'Enforced RLS + Soft Delete on table: %', table_name;
    END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. COMPLETE INDEXING STRATEGY
-- ────────────────────────────────────────────────────────────
-- B-Tree indexes for high-frequency query fields and foreign keys.
CREATE INDEX IF NOT EXISTS idx_employees_user_id       ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id    ON public.employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_created_at    ON public.employees(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leave_requests_emp      ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_created  ON public.leave_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_emp      ON public.attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date     ON public.attendance_logs(date DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_onboard_comp   ON public.profiles(onboarding_completed);

-- ────────────────────────────────────────────────────────────
-- 4. RATE LIMIT RESET & CLEANUP
-- ────────────────────────────────────────────────────────────
-- Function to clean up expired rate limit blocks.
CREATE OR REPLACE FUNCTION public.cleanup_otp_rate_limits()
RETURNS void AS $$
BEGIN
  -- Remove records where blocked_until has passed OR first_attempt was > 1 hour ago
  DELETE FROM public.otp_rate_limits
  WHERE (blocked_until IS NOT NULL AND blocked_until < NOW())
     OR (first_attempt < NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron (if available) or call manually from app
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cleanup-otp-rate-limits', '0 * * * *', 'SELECT public.cleanup_otp_rate_limits();');
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 5. MONITORING COMPLETION
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE TABLE IF NOT EXISTS public.slow_query_alerts (
    id           uuid                     NOT NULL DEFAULT gen_random_uuid(),
    query_sample text                     NOT NULL,
    avg_ms       numeric                  NOT NULL,
    captured_at  timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT slow_query_alerts_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.capture_slow_queries(threshold_ms numeric DEFAULT 500)
RETURNS void AS $$
BEGIN
  INSERT INTO public.slow_query_alerts (query_sample, avg_ms)
  SELECT query, ROUND(mean_exec_time::numeric, 2)
  FROM pg_stat_statements
  WHERE mean_exec_time > threshold_ms
    AND calls > 5
    AND query NOT LIKE '%pg_stat_statements%'
  ORDER BY mean_exec_time DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
