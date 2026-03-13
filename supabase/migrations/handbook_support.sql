-- Add file_url to company_policies for PDF support
ALTER TABLE company_policies ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Create storage bucket for handbook if not exists (handled via Supabase UI usually, but documented here)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('handbook', 'handbook', true) ON CONFLICT (id) DO NOTHING;
