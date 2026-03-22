-- Auth Health & Contention Monitoring
-- Creates a view to monitor 429s and lock errors logged from the client

CREATE OR REPLACE VIEW public.v_auth_health AS
SELECT 
  date_trunc('hour', created_at) as hour,
  action,
  metadata->>'error' as error_message,
  metadata->>'path' as page_path,
  COUNT(*) as occurrence_count
FROM public.activity_logs
WHERE action LIKE 'auth:%'
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC;

-- Helper to cleanup stale logs
CREATE OR REPLACE FUNCTION public.cleanup_auth_health_logs(days_to_keep integer DEFAULT 7)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.activity_logs
  WHERE action LIKE 'auth:%'
    AND created_at < NOW() - (days_to_keep || ' days')::interval;
END;
$$;
