-- ============================================================
-- Migration: Query Monitoring & Alerting Setup
-- Run in Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SECTION 1: pg_stat_statements — Query Performance Monitoring
-- Captures execution statistics for every query type.
-- Use this to find slow queries, high-frequency calls, and N+1s.
-- ────────────────────────────────────────────────────────────

-- Enable the extension (requires Supabase Dashboard → Extensions → pg_stat_statements)
-- If it's already enabled in your Supabase project (it usually is), this is a no-op:
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View top 10 slowest queries by mean execution time:
-- SELECT
--   LEFT(query, 80)        AS query_preview,
--   calls,
--   ROUND(mean_exec_time::numeric, 2)  AS avg_ms,
--   ROUND(total_exec_time::numeric, 2) AS total_ms,
--   rows
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- View top 10 most-called queries:
-- SELECT
--   LEFT(query, 80) AS query_preview,
--   calls,
--   ROUND(mean_exec_time::numeric, 2) AS avg_ms
-- FROM pg_stat_statements
-- ORDER BY calls DESC
-- LIMIT 10;

-- Reset stats after optimization work:
-- SELECT pg_stat_statements_reset();


-- ────────────────────────────────────────────────────────────
-- SECTION 2: Slow Query Log Table
-- A lightweight in-database alert sink for queries that exceed
-- a configurable threshold. Populated by the function below.
-- In production, pair with pg_cron to check hourly.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.slow_query_alerts (
    id           uuid                     NOT NULL DEFAULT gen_random_uuid(),
    query_hash   text                     NOT NULL,
    query_sample text                     NOT NULL,
    avg_ms       numeric                  NOT NULL,
    total_calls  bigint                   NOT NULL,
    captured_at  timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT slow_query_alerts_pkey PRIMARY KEY (id)
);

-- Only service role should read/write
ALTER TABLE public.slow_query_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_slow_queries" ON public.slow_query_alerts
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_slow_query_alerts_captured_at
  ON public.slow_query_alerts(captured_at DESC);


-- ────────────────────────────────────────────────────────────
-- SECTION 3: Slow Query Capture Function
-- Scans pg_stat_statements and logs any query with mean
-- execution time > THRESHOLD_MS that isn't already logged
-- in the current hour.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.capture_slow_queries(threshold_ms numeric DEFAULT 500)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.slow_query_alerts (query_hash, query_sample, avg_ms, total_calls)
  SELECT
    md5(query)                     AS query_hash,
    LEFT(query, 300)               AS query_sample,
    ROUND(mean_exec_time::numeric, 2) AS avg_ms,
    calls                          AS total_calls
  FROM pg_stat_statements
  WHERE mean_exec_time > threshold_ms
    AND calls > 5                  -- ignore one-off slow queries
    AND query NOT LIKE '%pg_stat_statements%'
    -- Don't re-alert on the same query within the same hour
    AND md5(query) NOT IN (
      SELECT query_hash
      FROM public.slow_query_alerts
      WHERE captured_at > NOW() - INTERVAL '1 hour'
    )
  ORDER BY mean_exec_time DESC
  LIMIT 20;
END;
$$;

-- Schedule hourly slow-query capture via pg_cron
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove if already exists to allow re-running safely
    PERFORM cron.unschedule('capture-slow-queries') WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'capture-slow-queries'
    );
    PERFORM cron.schedule(
      'capture-slow-queries',
      '0 * * * *',                 -- every hour at :00
      'SELECT public.capture_slow_queries(500);'  -- threshold: 500ms
    );
    RAISE NOTICE 'pg_cron job scheduled: capture-slow-queries every hour';
  ELSE
    RAISE NOTICE 'pg_cron not installed. Call capture_slow_queries() manually.';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- SECTION 4: Useful Monitoring Views
-- ────────────────────────────────────────────────────────────

-- View: top slowest queries right now
CREATE OR REPLACE VIEW public.v_slow_queries AS
SELECT
  LEFT(query, 120)                      AS query_preview,
  calls,
  ROUND(mean_exec_time::numeric, 2)     AS avg_ms,
  ROUND(total_exec_time::numeric, 0)    AS total_ms,
  rows,
  ROUND((shared_blks_hit::numeric /
    NULLIF(shared_blks_hit + shared_blks_read, 0)) * 100, 1) AS cache_hit_pct
FROM pg_stat_statements
WHERE calls > 0
ORDER BY mean_exec_time DESC
LIMIT 25;

-- View: table size + index usage
CREATE OR REPLACE VIEW public.v_table_stats AS
SELECT
  schemaname,
  relname                               AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_live_tup                            AS live_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;

-- View: index utilization (find unused indexes)
CREATE OR REPLACE VIEW public.v_unused_indexes AS
SELECT
  schemaname,
  relname                               AS table_name,
  indexrelname                          AS index_name,
  idx_scan                              AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- ────────────────────────────────────────────────────────────
-- HOW TO USE:
--
-- 1. Check slow queries:
--    SELECT * FROM public.v_slow_queries;
--
-- 2. Check table sizes + scan patterns:
--    SELECT * FROM public.v_table_stats;
--
-- 3. Find unused indexes (safe to drop):
--    SELECT * FROM public.v_unused_indexes;
--
-- 4. See all captured slow query alerts:
--    SELECT * FROM public.slow_query_alerts ORDER BY captured_at DESC;
--
-- 5. Manually run slow query capture:
--    SELECT public.capture_slow_queries(200); -- threshold: 200ms
--
-- 6. Reset pg_stat_statements after optimizations:
--    SELECT pg_stat_statements_reset();
-- ────────────────────────────────────────────────────────────
