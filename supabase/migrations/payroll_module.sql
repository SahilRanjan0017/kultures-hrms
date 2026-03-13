-- ============================================================
-- Kultures HRMS — Payroll Module Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Salary Structures (one per employee)
CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    hra NUMERIC(12,2) NOT NULL DEFAULT 0,
    transport_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
    other_allowances NUMERIC(12,2) NOT NULL DEFAULT 0,
    pf_deduction NUMERIC(12,2) NOT NULL DEFAULT 0,
    tds_deduction NUMERIC(12,2) NOT NULL DEFAULT 0,
    other_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (employee_id) -- one structure per employee
);

-- Enable RLS
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
-- Allow service_role (used by admin client) full access
CREATE POLICY "service_role_all" ON salary_structures
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 2. Payroll Runs (one per tenant per month)
CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL,           -- e.g. "2025-03"
    status VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft | processed | paid
    generated_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, month)            -- one run per tenant per month
);

ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON payroll_runs
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 3. Payslips (one per employee per payroll run)
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL,
    basic_salary NUMERIC(12,2) DEFAULT 0,
    hra NUMERIC(12,2) DEFAULT 0,
    transport_allowance NUMERIC(12,2) DEFAULT 0,
    other_allowances NUMERIC(12,2) DEFAULT 0,
    gross_salary NUMERIC(12,2) DEFAULT 0,
    pf_deduction NUMERIC(12,2) DEFAULT 0,
    tds_deduction NUMERIC(12,2) DEFAULT 0,
    other_deductions NUMERIC(12,2) DEFAULT 0,
    total_deductions NUMERIC(12,2) DEFAULT 0,
    net_salary NUMERIC(12,2) DEFAULT 0,
    working_days INT DEFAULT 0,
    present_days INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (payroll_run_id, employee_id)  -- one payslip per employee per run
);

ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON payslips
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- Handy index for fast per-employee payslip lookups
CREATE INDEX IF NOT EXISTS payslips_employee_idx ON payslips(employee_id, month);
CREATE INDEX IF NOT EXISTS payslips_tenant_month_idx ON payslips(tenant_id, month);
