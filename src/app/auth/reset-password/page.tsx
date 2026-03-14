'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        empCode: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/handbook/auth/reset-password/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empCode: formData.empCode }),
            });
            const data = await res.json();
            if (res.ok) {
                setStep('verify');
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/handbook/auth/reset-password/verify-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empCode: formData.empCode,
                    otp: formData.otp,
                    newPassword: formData.newPassword
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/auth/login'), 3000);
            } else {
                setError(data.error || 'Failed to reset password');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Extracted Logo / Intro left side for consistency
    const LeftBranding = () => (
        <div className="hidden lg:flex w-1/2 bg-[#FFCA28] flex-col items-center justify-center p-12 relative overflow-hidden">
            <div className="z-10 text-center space-y-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative w-24 h-24 mb-2">
                        <div className="absolute inset-0 bg-white rounded-full shadow-lg"></div>
                        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#00B4D8] rounded-tr-full"></div>
                        <div className="absolute top-1/2 right-0 w-1/2 h-1/2 bg-[#F4A261] rounded-br-full"></div>
                        <div className="absolute bottom-4 left-4 w-6 h-6 bg-[#8CB369] rounded-full"></div>
                        <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-[#111] rounded-full"></div>
                        <div className="absolute -left-12 top-4 w-12 h-4 bg-[#9D4EDD] rounded-l-full rotate-[-15deg]"></div>
                        <div className="absolute -left-10 top-8 w-10 h-4 bg-[#E01E37] rounded-l-full rotate-[10deg]"></div>
                    </div>
                    <h1 className="text-6xl font-black text-zinc-900 tracking-tight flex items-baseline">
                        Kulture
                    </h1>
                </div>
                <p className="text-2xl font-medium text-zinc-900">
                    Smart HR Tech for all businesses
                </p>
            </div>
        </div>
    );

    if (success) {
        return (
            <div className="flex min-h-screen bg-white">
                <LeftBranding />
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative">
                    <Card className="w-full max-w-sm text-center py-8 shadow-none border-none">
                        <CardContent className="space-y-4">
                            <CheckCircle2 className="w-16 h-16 text-[#14b8a6] mx-auto" />
                            <CardTitle className="text-2xl font-bold text-zinc-900">Password Reset Successful</CardTitle>
                            <CardDescription>
                                Your password has been updated. Redirecting to login...
                            </CardDescription>
                            <Link href="/auth/login" className="w-full block">
                                <Button className="w-full mt-4 bg-[#14b8a6] hover:bg-[#0f766e] text-white py-6">
                                    Go to Login
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-white">
            <LeftBranding />

            {/* Right Side: Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative">
                <div className="mx-auto w-full max-w-sm">

                    {/* Tenant Logo Placeholder */}
                    <div className="mb-10 text-center flex flex-col items-center justify-center">
                        <h2 className="text-3xl font-bold text-zinc-900">Brick & Bolt</h2>
                        <p className="text-xs uppercase tracking-widest text-[#F4A261] font-bold mt-1">Home Construction</p>
                    </div>

                    <Link href="/auth/login" className="flex items-center text-sm text-zinc-500 hover:text-zinc-900 transition-colors w-fit mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-zinc-900">Change Password</h3>
                            <p className="text-sm text-zinc-500 mt-2">
                                {step === 'request'
                                    ? 'Enter your Employee Code to receive a 4-digit OTP via email.'
                                    : 'Enter the 4-digit code sent to your email along with your new password.'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        {step === 'request' ? (
                            <form onSubmit={handleRequestOTP} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="empCode" className="text-sm font-medium text-zinc-700">Employee Code</Label>
                                    <Input
                                        id="empCode"
                                        placeholder="EMP-001"
                                        required
                                        value={formData.empCode}
                                        onChange={(e) => setFormData({ ...formData, empCode: e.target.value })}
                                        className="uppercase"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-[#14b8a6] hover:bg-[#0f766e] text-white py-6 text-sm font-medium mt-6" disabled={loading}>
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Send OTP
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyReset} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="otp" className="text-sm font-medium text-zinc-700">OTP Code</Label>
                                    <Input
                                        id="otp"
                                        placeholder="4 digit number"
                                        required
                                        maxLength={4}
                                        value={formData.otp}
                                        onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                        className="text-center tracking-widest text-lg font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="newPassword" className="text-sm font-medium text-zinc-700">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="Min 6 characters"
                                        required
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Repeat new password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <div className="pt-2">
                                    <Button type="submit" className="w-full bg-[#14b8a6] hover:bg-[#0f766e] text-white py-6 text-sm font-medium" disabled={loading}>
                                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Update Password
                                    </Button>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full text-xs text-zinc-500 hover:text-zinc-900"
                                    onClick={() => setStep('request')}
                                    disabled={loading}
                                >
                                    Didn't receive an OTP? Resend
                                </Button>
                            </form>
                        )}

                        <div className="mt-16 text-center">
                            <p className="text-xs text-zinc-400 mb-2">Powered By</p>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <h1 className="text-xl font-black text-zinc-900 tracking-tight flex items-baseline">
                                    Kulture
                                </h1>
                            </div>
                            <p className="text-[10px] text-zinc-400 mb-6">© 2026 Kulture Private Limited</p>

                            <div className="flex justify-center gap-6 text-xs text-[#14b8a6] font-medium">
                                <Link href="/privacy">Privacy</Link>
                                <Link href="/legal">Legal</Link>
                                <Link href="/contact">Contact</Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
