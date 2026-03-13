-- Add manager_id and profile fields
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Index for hierarchy lookups
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
