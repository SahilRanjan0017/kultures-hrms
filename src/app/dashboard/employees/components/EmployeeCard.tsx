// app/dashboard/employees/components/EmployeeCard.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type Employee } from '@/lib/employees';

interface EmployeeCardProps {
    employee: Employee;
    onClick: () => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
    const initials = employee.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
        >
            <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={employee.avatar_url || ''} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-medium">{employee.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {employee.designation || 'No designation'} • {employee.department || 'No department'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {employee.email} • {employee.emp_code}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                    {employee.status}
                </Badge>
                <Badge variant="outline">{employee.role}</Badge>
            </div>
        </div>
    );
}
