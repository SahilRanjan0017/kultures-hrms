-- ============================================================
-- Migration: Unified System Health Alerting
-- Includes Query Performance + Auth Stability Monitoring
-- ============================================================

-- 1. Create a Unified Alert Sink
CREATE TABLE IF NOT EXISTS public.system_health_alerts (
    id           uuid                     NOT NULL DEFAULT gen_random_uuid(),
    alert_type   text                     NOT NULL, -- 'SLOW_QUERY', 'AUTH_CONTENTION', 'RATE_LIMIT'
    severity     text                     NOT NULL DEFAULT 'WARNING', -- 'INFO', 'WARNING', 'CRITICAL'
    summary      text                     NOT NULL,
    details      jsonb                    DEFAULT '{}'::jsonb,
    captured_at  timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT system_health_alerts_pkey PRIMARY KEY (id)
);

-- Index for timeline analysis
CREATE INDEX IF NOT EXISTS idx_system_alerts_captured_at ON public.system_health_alerts(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON public.system_health_alerts(alert_type);

-- 2. Auth Health Monitoring Function
-- Detects if auth errors (429s, Locks) exceed a threshold in the last hour.
CREATE OR REPLACE FUNCTION public.check_auth_health_alerts(threshold_count int DEFAULT 20)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contention_count int;
    latest_error text;
BEGIN
    -- Check for high-frequency auth errors in the last hour
    SELECT COUNT(*), MAX(metadata->>'error')
    INTO contention_count, latest_error
    FROM public.activity_logs
    WHERE action LIKE 'auth:%'
      AND created_at > NOW() - INTERVAL '1 hour';

    IF contention_count > threshold_count THEN
        -- Only alert if we haven't alerted for this in the last 2 hours
        IF NOT EXISTS (
            SELECT 1 FROM public.system_health_alerts 
            WHERE alert_type = 'AUTH_CONTENTION' 
              AND captured_at > NOW() - INTERVAL '2 hours'
        ) THEN
            INSERT INTO public.system_health_alerts (alert_type, severity, summary, details)
            VALUES (
                'AUTH_CONTENTION', 
                'CRITICAL',
                'High Auth Contention Detected',
                jsonb_build_object(
                    'error_count_last_hour', contention_count,
                    'last_known_error', latest_error,
                    'threshold', threshold_count
                )
            );
        END IF;
    END IF;
END;
$$;

-- 3. Schedule via pg_cron (Every 15 minutes)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('check-auth-health') WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'check-auth-health'
    );
    PERFORM cron.schedule(
      'check-auth-health',
      '*/15 * * * *', -- every 15 minutes
      'SELECT public.check_auth_health_alerts(20);'
    );
    RAISE NOTICE 'pg_cron job scheduled: check-auth-health every 15m';
  END IF;
END $$;

-- 4. View for active alerts
CREATE OR REPLACE VIEW public.v_system_alerts AS
SELECT 
    captured_at,
    alert_type,
    severity,
    summary,
    details
FROM public.system_health_alerts
ORDER BY captured_at DESC;
