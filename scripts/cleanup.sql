-- ============================================================
-- COMPLETE DATABASE RESET SCRIPT (Development Only)
-- Compatible with: Supabase / PostgreSQL
-- ============================================================
-- ⚠️  WARNING: This is fully destructive. Run in dev only.
-- ℹ️  DRY-RUN: Comment out the final COMMIT to preview SQL only.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- STEP 1: Bypass triggers and foreign key constraints
-- ────────────────────────────────────────────────────────────
-- Temporarily disables FK checks to avoid constraint violations
-- during bulk deletion. Re-enabled at the end.
SET session_replication_role = 'replica';

-- ────────────────────────────────────────────────────────────
-- STEP 2: Truncate Auth schema tables
-- ────────────────────────────────────────────────────────────
-- Supabase manages its own auth schema. We delete in the right
-- order to avoid FK violations (identities, sessions first).

-- Use dynamic SQL so that missing tables are skipped safely
DO $$
DECLARE
    tbl TEXT;
    auth_tables TEXT[] := ARRAY[
        'audit_log_errors',
        'flow_state',
        'mfa_amr_claims',
        'mfa_challenges',
        'mfa_factors',
        'one_time_tokens',
        'refresh_tokens',
        'saml_providers',
        'saml_relay_states',
        'sessions',
        'sso_domains',
        'sso_providers',
        'identities',
        'users'   -- users last (others depend on it)
    ];
BEGIN
    FOREACH tbl IN ARRAY auth_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'auth' AND table_name = tbl
        ) THEN
            EXECUTE format('TRUNCATE TABLE auth.%I RESTART IDENTITY CASCADE', tbl);
            RAISE NOTICE 'Cleared auth.%', tbl;
        ELSE
            RAISE NOTICE 'Skipped auth.% (not found)', tbl;
        END IF;
    END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 3: Truncate all public/application tables
-- ────────────────────────────────────────────────────────────
-- Ordered leaf → root to respect FKs (even with CASCADE this
-- is the cleanest approach for sequence reset).

-- Payroll & Finance
TRUNCATE TABLE public.payslips               RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.payroll_runs           RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.salary_structures      RESTART IDENTITY CASCADE;

-- Leave
TRUNCATE TABLE public.leave_requests         RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.leave_balances         RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.leave_types            RESTART IDENTITY CASCADE;

-- Attendance
TRUNCATE TABLE public.attendance_logs        RESTART IDENTITY CASCADE;

-- Employee extra profile tables
TRUNCATE TABLE public.employee_academics     RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.employee_banking_identity RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.employee_experience    RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.employee_languages     RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.employee_personal_data RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.employee_references    RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.employee_work_info     RESTART IDENTITY CASCADE;

-- Notifications, Logs & Policies
TRUNCATE TABLE public.activity_logs          RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.notifications          RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.company_policies       RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.holidays               RESTART IDENTITY CASCADE;

-- OTP / Auth helpers
TRUNCATE TABLE public.otp_codes              RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.otp_rate_limits        RESTART IDENTITY CASCADE;

-- API keys
TRUNCATE TABLE public.tenant_api_keys        RESTART IDENTITY CASCADE;

-- Monitoring
TRUNCATE TABLE public.slow_query_alerts      RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.system_health_alerts   RESTART IDENTITY CASCADE;

-- Core user tables (order matters: members & profiles before employees)
TRUNCATE TABLE public.tenant_members         RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.profiles               RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.employees              RESTART IDENTITY CASCADE;

-- Tenant root last
TRUNCATE TABLE public.tenants                RESTART IDENTITY CASCADE;

-- ────────────────────────────────────────────────────────────
-- STEP 4: Truncate Storage tables (if bucket exists)
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'
    ) THEN
        TRUNCATE TABLE storage.objects  RESTART IDENTITY CASCADE;
        TRUNCATE TABLE storage.buckets  RESTART IDENTITY CASCADE;
    END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 5: Re-enable triggers and FK enforcement
-- ────────────────────────────────────────────────────────────
SET session_replication_role = 'origin';

-- ────────────────────────────────────────────────────────────
-- STEP 6: Verification counts (read-only sanity check)
-- ────────────────────────────────────────────────────────────
SELECT
    'auth.users'          AS "table", COUNT(*) AS "rows" FROM auth.users
UNION ALL SELECT
    'public.employees',                COUNT(*) FROM public.employees
UNION ALL SELECT
    'public.tenants',                  COUNT(*) FROM public.tenants
UNION ALL SELECT
    'public.profiles',                 COUNT(*) FROM public.profiles;

-- ────────────────────────────────────────────────────────────
-- COMMIT or ROLLBACK
-- ────────────────────────────────────────────────────────────
-- ✅ To execute: leave COMMIT below as-is.
-- 🔍 To dry-run: replace COMMIT with ROLLBACK.
COMMIT;
