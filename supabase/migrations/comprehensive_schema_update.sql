-- Comprehensive Schema Update (V3) - FINAL ALIGNMENT
-- Adding all missing tables and fixing references to match the provided schema EXACTLY

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update employees table with ALL missing columns
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS date_of_joining date;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS address jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS emergency_contact jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS location character varying;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS profile_completion integer DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS manager_id uuid;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS designation text;

-- 2.1 Update attendance_logs with geolocation columns
ALTER TABLE public.attendance_logs 
  ADD COLUMN IF NOT EXISTS clock_in_lat numeric,
  ADD COLUMN IF NOT EXISTS clock_in_lng numeric,
  ADD COLUMN IF NOT EXISTS clock_out_lat numeric,
  ADD COLUMN IF NOT EXISTS clock_out_lng numeric;

-- Add manager relationship
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_manager_id_fkey') THEN
        ALTER TABLE public.employees ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id);
    END IF;
END $$;

-- 3. Fix activity_logs reference
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_actor_id_fkey') THEN
        ALTER TABLE public.activity_logs DROP CONSTRAINT activity_logs_actor_id_fkey;
    END IF;
END $$;
ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.employees(user_id);

-- 4. Create missing tables (exactly as specified)

-- Company Policies
CREATE TABLE IF NOT EXISTS public.company_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  title character varying NOT NULL,
  content text,
  icon character varying,
  category character varying DEFAULT 'general'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  file_url text,
  CONSTRAINT company_policies_pkey PRIMARY KEY (id)
);

-- Holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  name character varying NOT NULL,
  date date NOT NULL,
  type character varying DEFAULT 'national'::character varying,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT holidays_pkey PRIMARY KEY (id)
);

-- Leave Types, Balances, Requests
CREATE TABLE IF NOT EXISTS public.leave_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  name text NOT NULL,
  color text DEFAULT '#3b82f6'::text,
  max_days integer NOT NULL,
  carry_forward boolean DEFAULT false,
  requires_approval boolean DEFAULT true,
  half_day_allowed boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT leave_types_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id),
  year integer NOT NULL,
  total_days integer DEFAULT 0,
  used_days numeric DEFAULT 0,
  pending_days numeric DEFAULT 0,
  CONSTRAINT leave_balances_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric NOT NULL,
  reason text,
  status text DEFAULT 'pending'::text,
  approved_by uuid REFERENCES public.employees(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leave_requests_pkey PRIMARY KEY (id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title character varying NOT NULL,
  message text NOT NULL,
  type character varying DEFAULT 'info'::character varying,
  link character varying,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- Payroll & Payslips
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  month character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'draft'::character varying,
  generated_by uuid REFERENCES public.employees(id),
  generated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payroll_runs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payroll_run_id uuid NOT NULL REFERENCES public.payroll_runs(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  month character varying NOT NULL,
  basic_salary numeric DEFAULT 0,
  hra numeric DEFAULT 0,
  transport_allowance numeric DEFAULT 0,
  other_allowances numeric DEFAULT 0,
  gross_salary numeric DEFAULT 0,
  pf_deduction numeric DEFAULT 0,
  tds_deduction numeric DEFAULT 0,
  other_deductions numeric DEFAULT 0,
  total_deductions numeric DEFAULT 0,
  net_salary numeric DEFAULT 0,
  working_days integer DEFAULT 0,
  present_days integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payslips_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.salary_structures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id),
  basic_salary numeric NOT NULL DEFAULT 0,
  hra numeric NOT NULL DEFAULT 0,
  transport_allowance numeric NOT NULL DEFAULT 0,
  other_allowances numeric NOT NULL DEFAULT 0,
  pf_deduction numeric NOT NULL DEFAULT 0,
  tds_deduction numeric NOT NULL DEFAULT 0,
  other_deductions numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT salary_structures_pkey PRIMARY KEY (id)
);

-- API Keys
CREATE TABLE IF NOT EXISTS public.tenant_api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  name character varying NOT NULL,
  key_prefix character varying NOT NULL,
  hashed_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  CONSTRAINT tenant_api_keys_pkey PRIMARY KEY (id)
);

-- Employee Profile Sub-tables
CREATE TABLE IF NOT EXISTS public.employee_academics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  qualification_level text NOT NULL,
  specialization text,
  institute text NOT NULL,
  passing_year text,
  score text,
  out_of_score text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  CONSTRAINT employee_academics_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.employee_banking_identity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id),
  aadhar_number text,
  pan_number text,
  bank_name text,
  account_number text,
  account_name text,
  account_type text,
  ifsc_code text,
  payment_mode text,
  payment_transaction text,
  effective_date date,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  CONSTRAINT employee_banking_identity_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.employee_experience (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  experience_type text,
  company_name text NOT NULL,
  from_date date,
  to_date date,
  last_designation text,
  last_salary text,
  reason_for_leaving text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  CONSTRAINT employee_experience_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.employee_languages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  language text NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  can_speak boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  CONSTRAINT employee_languages_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.employee_personal_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id),
  dob date,
  father_name text,
  mother_name text,
  place_of_birth text,
  mother_tongue text,
  nationality text,
  highest_qualification text,
  marital_status text,
  blood_group text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  CONSTRAINT employee_personal_data_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.employee_references (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  reference_name text NOT NULL,
  company_or_college text,
  reporting_name text,
  reporting_contact text,
  address text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  CONSTRAINT employee_references_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.employee_work_info (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id),
  legal_entity text,
  business_unit text,
  nature_of_employment text,
  grade text,
  function text,
  sub_function text,
  band text,
  zone text,
  region text,
  cost_center text,
  admin_manager text,
  employment_status text,
  effective_date date,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  CONSTRAINT employee_work_info_pkey PRIMARY KEY (id)
);

-- OTP Codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otp_codes_pkey PRIMARY KEY (id)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_employee_academics_emp ON public.employee_academics(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_experience_emp ON public.employee_experience(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

-- 6. Constraints and Unique Keys
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_members_user_tenant_unique') THEN
        ALTER TABLE public.tenant_members ADD CONSTRAINT tenant_members_user_tenant_unique UNIQUE (user_id, tenant_id);
    END IF;
END $$;

-- 7. RLS Policies
-- Enable RLS on all key tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_personal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_api_keys ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tenant Members Policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.tenant_members;
CREATE POLICY "Users can view their own memberships" ON public.tenant_members FOR SELECT USING (auth.uid() = user_id);

-- Employees Policies
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
CREATE POLICY "Users can view their own employee record" ON public.employees FOR SELECT USING (auth.uid() = user_id);

-- Attendance Policies (Basic)
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance_logs;
CREATE POLICY "Users can view their own attendance" ON public.attendance_logs FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

-- Generic Policies for Tenant-level data (Basic Select)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view tenants" ON public.tenants;
CREATE POLICY "Anyone can view tenants" ON public.tenants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenant users can view company policies" ON public.company_policies;

CREATE POLICY "Tenant users can view company policies" ON public.company_policies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenant users can view holidays" ON public.holidays;
CREATE POLICY "Tenant users can view holidays" ON public.holidays FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
