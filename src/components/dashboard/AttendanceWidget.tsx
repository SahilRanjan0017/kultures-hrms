'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AttendanceWidget() {
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchStatus();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/attendance?limit=1');
            const data = await res.json();
            const lastLog = data.logs?.[0];
            if (lastLog && !lastLog.clock_out) {
                setActiveSession(lastLog);
            } else {
                setActiveSession(null);
            }
        } catch (err) {
            console.error("Failed to fetch attendance status");
        } finally {
            setLoading(false);
        }
    };

    const handleClockToggle = async () => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/attendance/clock', { method: 'POST' });
            const data = await res.json();
            if (data.ok) {
                if (data.type === 'clock_in') {
                    setActiveSession(data.log);
                } else {
                    setActiveSession(null);
                }
            }
        } catch (err) {
            alert("Action failed. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const getDuration = () => {
        if (!activeSession) return "00:00:00";
        const start = new Date(activeSession.clock_in);
        const diff = currentTime.getTime() - start.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <Card className="bg-white/50 backdrop-blur-sm border-zinc-200/50">
            <CardContent className="h-40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </CardContent>
        </Card>
    );

    return (
        <Card className="overflow-hidden bg-gradient-to-br from-white to-zinc-50/50 border-zinc-200/50 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Attendance
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center py-4 space-y-4">
                    <div className="text-center">
                        <div className="text-4xl font-bold tracking-tighter text-zinc-900 tabular-nums">
                            {format(currentTime, 'hh:mm:ss a')}
                        </div>
                        <div className="text-xs text-zinc-500 font-medium">
                            {format(currentTime, 'EEEE, do MMMM yyyy')}
                        </div>
                    </div>

                    {activeSession && (
                        <div className="px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-mono flex items-center gap-2 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-green-400" />
                            Session: {getDuration()}
                        </div>
                    )}

                    <Button
                        size="lg"
                        onClick={handleClockToggle}
                        disabled={actionLoading}
                        variant={activeSession ? "destructive" : "default"}
                        className="w-full h-14 text-lg font-semibold shadow-lg shadow-zinc-200 transition-all hover:-translate-y-0.5"
                    >
                        {actionLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : activeSession ? (
                            <>
                                <LogOut className="w-5 h-5 mr-2" />
                                Clock Out
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5 mr-2" />
                                Clock In
                            </>
                        )}
                    </Button>

                    <div className="text-[10px] text-zinc-400 text-center">
                        * Your current location and IP will be logged for security.
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
