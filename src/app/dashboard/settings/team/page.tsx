'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, UserPlus, Shield, UserCog, MoreVertical, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface Employee {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: string;
    department: string;
    designation: string;
    emp_code: string;
}

const ROLES = ['admin', 'hr', 'manager', 'employee'];

export default function TeamSettingsPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchTeam = useCallback(async () => {
        try {
            const res = await fetch('/api/settings/team');
            const data = await res.json();
            setEmployees(data.employees ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTeam(); }, [fetchTeam]);

    async function handleUpdateRole(employeeId: string, newRole: string) {
        setUpdatingId(employeeId);
        try {
            const res = await fetch('/api/settings/team', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId, newRole })
            });
            if (res.ok) {
                await fetchTeam();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUpdatingId(null);
        }
    }

    if (loading) {
        return <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Team Registry</h3>
                    <p className="text-sm text-muted-foreground">Manage your team's roles and permissions.</p>
                </div>
                <Link href="/dashboard/employees">
                    <Button className="gap-2">
                        <UserPlus className="w-4 h-4" /> Manage Employees
                    </Button>
                </Link>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50">
                                <TableHead className="w-[280px]">Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((emp) => (
                                <TableRow key={emp.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600 border border-zinc-200 uppercase">
                                                {emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-zinc-900">{emp.full_name}</span>
                                                <span className="text-[11px] text-zinc-500">{emp.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize gap-1.5 py-0.5 px-2 font-medium ${emp.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            emp.role === 'hr' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                emp.role === 'manager' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                    'bg-zinc-50 text-zinc-700 border-zinc-200'
                                            }`}>
                                            {emp.role === 'admin' && <Shield className="w-3 h-3" />}
                                            {emp.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-zinc-500 text-sm">
                                        {emp.department || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-green-500' : 'bg-zinc-300'}`} />
                                            <span className="text-sm capitalize text-zinc-600">{emp.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                render={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={updatingId === emp.id}>
                                                        {updatingId === emp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                                                    </Button>
                                                }
                                            />
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuGroup>
                                                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {ROLES.map(role => (
                                                        <DropdownMenuItem
                                                            key={role}
                                                            onClick={() => handleUpdateRole(emp.id, role)}
                                                            className={`capitalize ${emp.role === role ? 'bg-zinc-50 font-semibold' : ''}`}
                                                            disabled={emp.role === role}
                                                        >
                                                            {role}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="bg-amber-50/50 border-amber-100">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-900">
                        <ShieldAlert className="w-4 h-4" /> Role Definitions
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-900">Admin</p>
                        <p className="text-[11px] text-amber-800/70">Full system access and billing management.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-900">HR</p>
                        <p className="text-[11px] text-amber-800/70">Manage employees, leaves, and payroll.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-900">Manager</p>
                        <p className="text-[11px] text-amber-800/70">Approve leaves for their department.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-900">Employee</p>
                        <p className="text-[11px] text-amber-800/70">Standard access to personal dashboard.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
