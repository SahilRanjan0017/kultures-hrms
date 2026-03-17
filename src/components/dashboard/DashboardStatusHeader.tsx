'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, Loader2, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardStatusHeader() {
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
            // Get geolocation
            let lat = null;
            let lng = null;

            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    });
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
            } catch (geoError) {
                console.warn("Geolocation failed or denied:", geoError);
                // Optionally alert the user if location is mandatory
                // if (mandatoryLocation) return;
            }

            const res = await fetch('/api/attendance/clock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng })
            });

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

    return (
        <Card className="border-zinc-200 shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden border-none shadow-none bg-transparent mb-8">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                        {/* Clock Segment */}
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                                <Clock className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
                                    {format(currentTime, 'hh:mm:ss a')}
                                </div>
                                <div className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                                    {format(currentTime, 'EEEE, do MMMM yyyy')}
                                </div>
                            </div>
                        </div>

                        {/* Status Stats */}
                        <div className="hidden lg:flex items-center gap-6 pl-8 border-l border-zinc-100">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Location</span>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-600">
                                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                    <span>Headquarters</span>
                                </div>
                            </div>
                            {activeSession && (
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Current Session</span>
                                    <div className="flex items-center gap-2 text-sm font-mono font-bold text-[#2EC4B6]">
                                        <span className="w-2 h-2 rounded-full bg-[#2EC4B6] animate-pulse" />
                                        {getDuration()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant={activeSession ? "destructive" : "default"}
                            size="lg"
                            className={`h-14 px-8 text-base font-bold rounded-2xl transition-all shadow-lg active:scale-95 ${!activeSession ? "bg-zinc-900 hover:bg-zinc-800 shadow-zinc-200" : "shadow-red-100"}`}
                            onClick={handleClockToggle}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : activeSession ? (
                                <>
                                    <LogOut className="w-5 h-5 mr-3" />
                                    Clock Out
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 mr-3" />
                                    Clock In
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
