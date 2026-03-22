// app/dashboard/employees/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRole } from '@/lib/role-context';
import RoleGuard from '@/components/dashboard/RoleGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Role } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone, Building, Calendar, MapPin, Briefcase, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Employee {
    id: string;
    full_name: string;
    email: string;
    emp_code: string;
    user_id?: string;
    role: string;
    department: string;
    designation: string;
    phone: string | null;
    date_of_joining: string | null;
    status: 'active' | 'inactive';
    avatar_url: string | null;
    address: {
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
    };
    documents: {
        aadhaar?: string;
        pan?: string;
    };
    emergency_contact: {
        name?: string;
        phone?: string;
        relation?: string;
    };
}

export default function EmployeeProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const role = useRole();
    const { user: currentUser } = useAuth(); // from global AuthProvider — no network call
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployee();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            const res = await fetch(`/api/employees/${id}`);
            const data = await res.json();
            setEmployee(data.employee);
        } catch (error) {
            console.error('Failed to fetch employee:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (!confirm('Are you sure you want to deactivate this employee?')) return;

        try {
            const res = await fetch(`/api/employees/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'inactive' }),
            });

            if (res.ok) {
                fetchEmployee();
            }
        } catch (error) {
            console.error('Failed to deactivate:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!employee) return <div className="p-8 text-center">Employee not found</div>;

    const initials = employee.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={employee.avatar_url || ''} />
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold">{employee.full_name}</h1>
                        <p className="text-muted-foreground">
                            {employee.designation || 'No designation'} • {employee.emp_code}
                        </p>
                        <div className="flex gap-2 mt-2">
                            <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                                {employee.status}
                            </Badge>
                            <Badge variant="outline">{employee.role}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {(currentUser?.id === employee.user_id || ['admin', 'hr'].includes(role)) ? (
                        <Link href={`/dashboard/employees/${id}/edit`}>
                            <Button variant="outline">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                    ) : (
                        <RoleGuard role={role} permission="employees:manage">
                            <Link href={`/dashboard/employees/${id}/edit`}>
                                <Button variant="outline">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            </Link>
                        </RoleGuard>
                    )}
                    <RoleGuard role={role} permission="employees:manage">
                        {employee.status === 'active' && (
                            <Button variant="destructive" onClick={handleDeactivate}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Deactivate
                            </Button>
                        )}
                    </RoleGuard>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="w-full">
                <TabsList>
                    <TabsTrigger value="info">Personal Info</TabsTrigger>
                    <TabsTrigger value="employment">Employment</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span>{employee.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{employee.phone || 'Not provided'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span>
                                        {employee.address?.city
                                            ? `${employee.address.city}, ${employee.address.state}`
                                            : 'Not provided'
                                        }
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Emergency Contact</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {employee.emergency_contact?.name ? (
                                <div className="space-y-2">
                                    <p><strong>Name:</strong> {employee.emergency_contact.name}</p>
                                    <p><strong>Phone:</strong> {employee.emergency_contact.phone}</p>
                                    <p><strong>Relation:</strong> {employee.emergency_contact.relation}</p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No emergency contact provided</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="employment" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Employment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4 text-muted-foreground" />
                                    <span>Department: {employee.department || 'Not assigned'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                                    <span>Designation: {employee.designation || 'Not assigned'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span>
                                        Joining Date: {employee.date_of_joining
                                            ? new Date(employee.date_of_joining).toLocaleDateString()
                                            : 'Not set'
                                        }
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {employee.documents?.aadhaar || employee.documents?.pan ? (
                                <div className="space-y-2">
                                    {employee.documents.aadhaar && (
                                        <p><strong>Aadhaar:</strong> {employee.documents.aadhaar}</p>
                                    )}
                                    {employee.documents.pan && (
                                        <p><strong>PAN:</strong> {employee.documents.pan}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No documents uploaded</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
