-- Add geolocation columns to attendance logs
ALTER TABLE public.attendance_logs 
  ADD COLUMN IF NOT EXISTS clock_in_lat numeric,
  ADD COLUMN IF NOT EXISTS clock_in_lng numeric,
  ADD COLUMN IF NOT EXISTS clock_out_lat numeric,
  ADD COLUMN IF NOT EXISTS clock_out_lng numeric;

-- Comment on columns for clarity
COMMENT ON COLUMN public.attendance_logs.clock_in_lat IS 'Latitude at time of clocking in';
COMMENT ON COLUMN public.attendance_logs.clock_in_lng IS 'Longitude at time of clocking in';
COMMENT ON COLUMN public.attendance_logs.clock_out_lat IS 'Latitude at time of clocking out';
COMMENT ON COLUMN public.attendance_logs.clock_out_lng IS 'Longitude at time of clocking out';
