// app/dashboard/employees/components/EmployeeFilters.tsx
'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface EmployeeFiltersProps {
    filters: {
        role: string;
        department: string;
        status: string;
    };
    onChange: (filters: any) => void;
}

export function EmployeeFilters({ filters, onChange }: EmployeeFiltersProps) {
    return (
        <div className="flex gap-2">
            <Select
                value={filters.status}
                onValueChange={(val) => onChange({ ...filters, status: val })}
            >
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={filters.role}
                onValueChange={(val) => onChange({ ...filters, role: val === "all" ? "" : val })}
            >
                <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={filters.department}
                onValueChange={(val) => onChange({ ...filters, department: val === "all" ? "" : val })}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
