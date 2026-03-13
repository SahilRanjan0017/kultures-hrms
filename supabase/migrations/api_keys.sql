-- Create tenant_api_keys table
CREATE TABLE IF NOT EXISTS tenant_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    hashed_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage their tenant's API keys"
    ON tenant_api_keys
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.tenant_id = tenant_api_keys.tenant_id
            AND employees.user_id = auth.uid()
            AND employees.role = 'admin'
        )
    );

-- Create index for fast lookup
CREATE INDEX idx_tenant_api_keys_tenant_id ON tenant_api_keys(tenant_id);
