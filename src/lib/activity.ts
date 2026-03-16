import { createAdminClient } from "@/lib/supabase/admin";

export type ActivityAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'EMPLOYEE_CREATE' | 'EMPLOYEE_UPDATE' | 'EMPLOYEE_DELETE'
    | 'LEAVE_APPLY' | 'LEAVE_APPROVE' | 'LEAVE_REJECT'
    | 'PAYROLL_RUN' | 'PAYROLL_UPDATE'
    | 'TENANT_UPDATE' | 'TENANT_DELETE'
    | 'ROLE_UPDATE'
    | 'API_KEY_CREATE' | 'API_KEY_REVOKE';

export async function logActivity({
    tenantId,
    actorId,
    action,
    targetType,
    targetId,
    metadata = {},
    ipAddress
}: {
    tenantId: string;
    actorId: string;
    action: ActivityAction;
    targetType?: string;
    targetId?: string;
    metadata?: any;
    ipAddress?: string;
}) {
    const adminSupabase = createAdminClient();

    try {
        const { error } = await adminSupabase
            .from('activity_logs')
            .insert({
                tenant_id: tenantId,
                actor_id: actorId,
                action,
                target_type: targetType,
                target_id: targetId,
                metadata,
                ip_address: ipAddress
            });

        if (error) {
            console.error(`→ Activity log error [${action}]:`, error.message);
            console.error("→ Log Details:", { tenantId, actorId, targetType, targetId });
        }
    } catch (err) {
        console.error("→ Failed to log activity unexpectedly:", err);
    }
}

export async function createNotification({
    tenantId,
    userId,
    title,
    message,
    type = 'info',
    link
}: {
    tenantId: string;
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    link?: string;
}) {
    const adminSupabase = createAdminClient();

    try {
        const { error } = await adminSupabase
            .from('notifications')
            .insert({
                tenant_id: tenantId,
                user_id: userId,
                title,
                message,
                type,
                link
            });

        if (error) console.error("→ Notification error:", error.message);
    } catch (err) {
        console.error("→ Failed to create notification:", err);
    }
}
