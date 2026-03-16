-- 1. Create a unique constraint on employees(user_id) to allow it to be a target of a foreign key
-- Note: In a multi-tenant app, user_id is usually unique per tenant. 
-- However, for the activity log join to work simply, we need a unique index.
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id_unique ON public.employees(user_id);

-- 2. Update the activity_logs table to explicitly link actor_id to employees(user_id)
-- First, drop existing if it happens to exist (though grep didn't find it)
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_actor_id_fkey;

-- 3. Add the new foreign key constraint
ALTER TABLE public.activity_logs 
ADD CONSTRAINT activity_logs_actor_id_fkey 
FOREIGN KEY (actor_id) 
REFERENCES public.employees(user_id) 
ON DELETE SET NULL;

-- 4. Verify RLS for activity_logs (Ensure admins can see it)
-- This was already in notifications_activity.sql but good to ensure it's robust
DROP POLICY IF EXISTS "Admins and HR can view activity logs" ON activity_logs;
CREATE POLICY "Admins and HR can view activity logs"
    ON activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.tenant_id = activity_logs.tenant_id
            AND employees.user_id = auth.uid()
            AND employees.role IN ('admin', 'hr')
        )
    );
