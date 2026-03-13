'use client';

import { useState, useEffect, useCallback } from "react";
import { Loader2, History, User, Activity, Filter, Calendar, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Log {
    id: string;
    action: string;
    target_type: string;
    metadata: any;
    created_at: string;
    actor: {
        full_name: string;
        email: string;
    } | null;
}

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/activity-logs?limit=${limit}&offset=${offset}`);
            const data = await res.json();
            if (data.logs) {
                setLogs(data.logs);
                setTotal(data.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [offset]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    function formatAction(action: string) {
        return action.replace(/_/g, ' ').toLowerCase();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
                    <p className="text-muted-foreground">Monitor administrative actions and system events across the tenant.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search logs..." className="pl-9" />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-9" />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50">
                                <TableHead className="w-[180px]">Date & Time</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead className="text-right">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-zinc-400 italic">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading logs...
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-zinc-400 italic">
                                        No activity recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <TableCell className="text-sm font-medium">
                                            {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-bold">
                                                    {log.actor?.full_name ? log.actor.full_name[0] : <User className="w-3 h-3" />}
                                                </div>
                                                <span className="text-sm">{log.actor?.full_name || 'System'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize text-[11px] font-medium bg-white">
                                                {formatAction(log.action)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-zinc-500">
                                            {log.target_type || '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                                                View JSON
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {logs.length} of {total} events
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={offset === 0}
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={offset + limit >= total}
                        onClick={() => setOffset(offset + limit)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
