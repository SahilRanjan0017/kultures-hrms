export type Role = "admin" | "hr" | "manager" | "employee";

export type Permission =
    | "team:view"
    | "team:invite"
    | "employees:view"
    | "employees:manage"
    | "attendance:view"
    | "attendance:manage"
    | "attendance:own"
    | "payroll:view"
    | "payroll:manage"
    | "payroll:own"
    | "roles:manage"
    | "settings:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    admin: [
        "team:view",
        "team:invite",
        "employees:view",
        "employees:manage",
        "attendance:view",
        "attendance:manage",
        "attendance:own",
        "payroll:view",
        "payroll:manage",
        "payroll:own",
        "roles:manage",
        "settings:manage",
    ],
    hr: [
        "team:view",
        "team:invite",
        "employees:view",
        "employees:manage",
        "attendance:view",
        "attendance:manage",
        "attendance:own",
        "payroll:view",
        "payroll:own",
        "roles:manage",
    ],
    manager: [
        "team:view",
        "employees:view",
        "attendance:view",
        "attendance:own",
        "payroll:own",
    ],
    employee: [
        "attendance:own",
        "payroll:own",
    ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccess(role: Role, permissions: Permission[]): boolean {
    return permissions.some((p) => hasPermission(role, p));
}
