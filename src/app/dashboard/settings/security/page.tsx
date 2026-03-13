'use client';

import { useState } from 'react';
import { Loader2, ShieldCheck, LogOut, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SecuritySettingsPage() {
    const [saving, setSaving] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [passwords, setPasswords] = useState({
        new: '',
        confirm: '',
    });

    async function handlePassUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setError("Passwords don't match");
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/settings/security/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: passwords.new })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess('Password updated successfully');
            setPasswords({ new: '', confirm: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleLogoutAll() {
        setLoggingOut(true);
        try {
            const res = await fetch('/api/settings/security/logout-all', { method: 'POST' });
            if (res.ok) {
                window.location.href = '/auth/login';
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <form onSubmit={handlePassUpdate}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-primary" /> Password
                        </CardTitle>
                        <CardDescription>
                            Change your account password. We recommend using a strong, unique password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">{error}</div>}
                        {success && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">{success}</div>}

                        <div className="grid gap-4 max-w-sm">
                            <div className="space-y-2">
                                <Label htmlFor="new-pass">New Password</Label>
                                <Input
                                    id="new-pass"
                                    type="password"
                                    value={passwords.new}
                                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-pass">Confirm New Password</Label>
                                <Input
                                    id="confirm-pass"
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 flex justify-end">
                        <Button type="submit" disabled={saving || !passwords.new}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Update Password
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="border-zinc-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-zinc-500" /> Active Sessions
                    </CardTitle>
                    <CardDescription>
                        Management of your active browser sessions across all devices.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                        <div>
                            <p className="text-sm font-medium text-zinc-900">Logout of all sessions</p>
                            <p className="text-xs text-zinc-500 mt-1">
                                This will sign you out of all browsers on all your devices.
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleLogoutAll} disabled={loggingOut} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-zinc-200">
                            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
                            Log Out All
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
