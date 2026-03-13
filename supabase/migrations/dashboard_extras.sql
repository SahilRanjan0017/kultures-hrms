-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'national', -- 'national', 'regional', 'optional'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create company_policies table
CREATE TABLE IF NOT EXISTS company_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    icon VARCHAR(50),
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add extra fields to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_policies ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone in tenant can view holidays"
    ON holidays FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.tenant_id = holidays.tenant_id
            AND employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Everyone in tenant can view policies"
    ON company_policies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.tenant_id = company_policies.tenant_id
            AND employees.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_holidays_tenant_date ON holidays(tenant_id, date);
CREATE INDEX idx_policies_tenant ON company_policies(tenant_id);
