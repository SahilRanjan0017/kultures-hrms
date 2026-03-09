// app/dashboard/employees/new/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface EmployeeFormData {
    full_name: string;
    email: string;
    emp_code: string;
    department: string;
    designation: string;
    phone: string;
    date_of_joining: string;
    role: string;
    address: {
        street: string;
        city: string;
        state: string;
        pincode: string;
    };
    emergency_contact: {
        name: string;
        phone: string;
        relation: string;
    };
}

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
const ROLES = ['admin', 'manager', 'employee'];

export default function NewEmployeePage() {
    const { id } = useParams();
    const router = useRouter();

    const isNew = id === 'new';
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<EmployeeFormData>({
        full_name: '',
        email: '',
        emp_code: '',
        department: '',
        designation: '',
        phone: '',
        date_of_joining: '',
        role: 'employee',
        address: { street: '', city: '', state: '', pincode: '' },
        emergency_contact: { name: '', phone: '', relation: '' },
    });

    useEffect(() => {
        if (!isNew) {
            fetchEmployee();
        }
    }, [id, isNew]);

    const fetchEmployee = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/employees/${id}`);
            const data = await res.json();
            if (data.employee) {
                setFormData({
                    ...data.employee,
                    date_of_joining: data.employee.date_of_joining
                        ? new Date(data.employee.date_of_joining).toISOString().split('T')[0]
                        : '',
                    address: data.employee.address || { street: '', city: '', state: '', pincode: '' },
                    emergency_contact: data.employee.emergency_contact || { name: '', phone: '', relation: '' }
                });
            }
        } catch (error) {
            console.error('Failed to fetch employee:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = isNew ? '/api/employees' : `/api/employees/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push(isNew ? '/dashboard/employees' : `/dashboard/employees/${id}`);
                router.refresh();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save employee');
            }
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateNested = (parent: 'address' | 'emergency_contact', field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }));
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold">{isNew ? 'Add New Employee' : 'Edit Employee'}</h1>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name *</Label>
                                <Input required value={formData.full_name} onChange={e => updateField('full_name', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input type="email" required value={formData.email} onChange={e => updateField('email', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Employee Code *</Label>
                                <Input required value={formData.emp_code} onChange={e => updateField('emp_code', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Joining</Label>
                                <Input type="date" value={formData.date_of_joining} onChange={e => updateField('date_of_joining', e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select value={formData.department} onValueChange={(v) => updateField('department', v || '')}>
                                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                    <SelectContent>
                                        {DEPARTMENTS.map(d => <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Designation</Label>
                                <Input value={formData.designation} onChange={e => updateField('designation', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Role *</Label>
                                <Select value={formData.role} onValueChange={(v) => updateField('role', v || '')}>
                                    <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Address</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Street Address</Label>
                            <Input value={formData.address.street} onChange={e => updateNested('address', 'street', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input value={formData.address.city} onChange={e => updateNested('address', 'city', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>State</Label>
                            <Input value={formData.address.state} onChange={e => updateNested('address', 'state', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Pincode</Label>
                            <Input value={formData.address.pincode} onChange={e => updateNested('address', 'pincode', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Contact Name</Label>
                            <Input value={formData.emergency_contact.name} onChange={e => updateNested('emergency_contact', 'name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input value={formData.emergency_contact.phone} onChange={e => updateNested('emergency_contact', 'phone', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Relationship</Label>
                            <Input value={formData.emergency_contact.relation} onChange={e => updateNested('emergency_contact', 'relation', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isNew ? 'Create Employee' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
