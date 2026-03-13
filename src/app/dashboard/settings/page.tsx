'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GeneralSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [form, setForm] = useState({
        name: '',
        industry: '',
        size: '',
    });

    const [deleteInput, setDeleteInput] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/settings/tenant');
            const data = await res.json();
            if (data.tenant) {
                setForm({
                    name: data.tenant.name || '',
                    industry: data.tenant.industry || '',
                    size: data.tenant.size || '',
                });
            } else if (data.error) {
                setError(data.error);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccessMsg('');

        try {
            const res = await fetch('/api/settings/tenant', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccessMsg('Profile updated successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteWorkspace() {
        if (deleteInput !== form.name) {
            setDeleteError("Company name doesn't match.");
            return;
        }

        setDeleting(true);
        setDeleteError('');
        try {
            const res = await fetch('/api/settings/tenant/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmName: deleteInput })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Redirect to landing
            window.location.href = '/';
        } catch (err: any) {
            setDeleteError(err.message);
            setDeleting(false);
        }
    }

    if (loading) {
        return <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;
    }

    return (
        <div className="space-y-10">
            {/* General Settings */}
            <Card>
                <form onSubmit={handleSaveProfile}>
                    <CardHeader>
                        <CardTitle>Organization Profile</CardTitle>
                        <CardDescription>
                            Update your company's core details. These will be visible on your team's dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">{error}</div>}
                        {successMsg && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">{successMsg}</div>}

                        <div className="space-y-2">
                            <Label htmlFor="orgName">Organization Name</Label>
                            <Input
                                id="orgName"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                className="max-w-md"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg">
                            <div className="space-y-2">
                                <Label>Industry</Label>
                                <Select value={form.industry || ""} onValueChange={v => setForm({ ...form, industry: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Technology', 'Education', 'Healthcare', 'Finance', 'Retail', 'Other'].map(i => (
                                            <SelectItem key={i} value={i.toLowerCase()}>{i}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Company Size</Label>
                                <Select value={form.size || ""} onValueChange={v => setForm({ ...form, size: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['1-10', '11-50', '51-200', '201-500', '500+'].map(s => (
                                            <SelectItem key={s} value={s}>{s} employees</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 flex justify-between items-center">
                        <p className="text-sm text-zinc-500">Please use 32 characters at maximum for the name.</p>
                        <Button type="submit" disabled={saving} className="gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Actions
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Current Plan Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                        Manage your billing and subscription details here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-zinc-900 text-lg">Pro Tier</p>
                            <p className="text-sm text-zinc-500 mt-1">You are currently on the unlimited early-access tier.</p>
                        </div>
                        <Button variant="outline" disabled>Manage Billing</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" /> Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Permanently delete your organization and all of its contents. This action is not reversible, so please continue with caution.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                    <div className="bg-red-50/50 border border-red-100 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-red-900 mb-1">Delete this workspace</h4>
                        <p className="text-sm text-red-700/80 mb-4">
                            Once you delete your organization, there is no going back. Please be certain.
                        </p>

                        <div className="space-y-2 max-w-sm">
                            <Label className="text-red-900 font-medium">Type <strong className="font-bold">"{form.name}"</strong> to confirm</Label>
                            <Input
                                value={deleteInput}
                                onChange={e => setDeleteInput(e.target.value)}
                                className="border-red-200 focus-visible:ring-red-500"
                                placeholder={form.name}
                            />
                        </div>
                        {deleteError && <p className="text-sm text-red-600 font-medium mt-2">{deleteError}</p>}
                    </div>
                </CardContent>
                <CardFooter className="bg-red-50/30 border-t border-red-100 px-6 py-4 justify-end">
                    <Button
                        variant="destructive"
                        disabled={deleteInput !== form.name || deleting}
                        onClick={handleDeleteWorkspace}
                        className="gap-2"
                    >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete Workspace Forever
                    </Button>
                </CardFooter>
            </Card>

        </div>
    );
}
