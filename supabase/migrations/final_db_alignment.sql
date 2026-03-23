-- ============================================================
-- FINAL DATABASE ALIGNMENT & HARDENING
-- Use this to bridge the gap between Current Schema and Production Logic.
-- ============================================================

-- 1. FIX MISSING SOFT-DELETE
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 2. RLS HELPER FUNCTION (Performance + Security)
CREATE OR REPLACE FUNCTION public.auth_current_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. ENFORCE RLS ON ALL TENANT-SCOPED TABLES
DO $$
DECLARE
    table_name text;
    -- Comprehensive list of all tables that MUST have tenant isolation
    tenant_tables text[] := ARRAY[
        'employees', 'leave_requests', 'attendance_logs', 
        'payslips', 'notifications', 'tenant_members', 
        'payroll_runs', 'salary_structures', 'leave_balances',
        'company_policies', 'holidays', 'employee_academics',
        'employee_experience', 'employee_languages', 'employee_personal_data',
        'employee_references', 'employee_work_info', 'employee_banking_identity'
    ];
BEGIN
    FOREACH table_name IN ARRAY tenant_tables
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation" ON public.%I', table_name);
        
        -- Apply strict isolation: Same Tenant + Not Deleted
        EXECUTE format(
            'CREATE POLICY "Tenant Isolation" ON public.%I FOR ALL USING (tenant_id = public.auth_current_tenant_id() AND (deleted_at IS NULL))',
            table_name
        );
    END LOOP;
END $$;

-- 4. PERFORMANCE INDEXING (60+ FKs)
-- Essential for preventing Sequential Scans as user base grows.
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id     ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id       ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant   ON public.leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_tenant  ON public.attendance_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payslips_tenant         ON public.payslips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant    ON public.activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant    ON public.notifications(tenant_id);

-- 5. MONITORING & ALERTING
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE OR REPLACE FUNCTION public.capture_slow_queries(threshold_ms numeric DEFAULT 500)
RETURNS void AS $$
BEGIN
  INSERT INTO public.slow_query_alerts (query_hash, query_sample, avg_ms, total_calls)
  SELECT md5(query), query, ROUND(mean_exec_time::numeric, 2), calls
  FROM pg_stat_statements
  WHERE mean_exec_time > threshold_ms
    AND calls > 5
    AND query NOT LIKE '%pg_stat_statements%'
  ORDER BY mean_exec_time DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
