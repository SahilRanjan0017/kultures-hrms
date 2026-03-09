import { type Role, type Permission, hasPermission } from "@/lib/permissions";

interface RoleGuardProps {
    role: Role;
    permission: Permission;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export default function RoleGuard({
    role,
    permission,
    children,
    fallback,
}: RoleGuardProps) {
    const allowed = hasPermission(role, permission);

    if (!allowed) {
        if (fallback !== undefined) return <>{fallback}</>;
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <span className="text-2xl">🔒</span>
                </div>
                <h2 className="text-lg font-semibold text-zinc-900">Access Denied</h2>
                <p className="text-sm text-zinc-500 text-center max-w-sm">
                    You don&apos;t have permission to view this page.
                    Contact your admin if you think this is a mistake.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
