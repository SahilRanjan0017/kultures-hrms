'use client';

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Loader2, Info } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface LeaveType {
    id: string;
    leave_type: {
        id: string;
        name: string;
        color: string;
        half_day_allowed: boolean;
    };
    available_days: number;
}

interface ApplyLeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
}

export default function ApplyLeaveModal({ isOpen, onClose, initialDate }: ApplyLeaveModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [leaveBalances, setLeaveBalances] = useState<LeaveType[]>([]);

    // Form state
    const [selectedTypeId, setSelectedTypeId] = useState<string>("");
    const [fromDate, setFromDate] = useState<string>(initialDate ? format(initialDate, 'yyyy-MM-dd') : "");
    const [toDate, setToDate] = useState<string>(initialDate ? format(initialDate, 'yyyy-MM-dd') : "");
    const [fromSession, setFromSession] = useState<string>("full_day");
    const [toSession, setToSession] = useState<string>("full_day");
    const [comments, setComments] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            fetchBalances();
            if (initialDate) {
                const dateStr = format(initialDate, 'yyyy-MM-dd');
                setFromDate(dateStr);
                setToDate(dateStr);
            }
        }
    }, [isOpen, initialDate]);

    const fetchBalances = async () => {
        setFetching(true);
        try {
            const res = await fetch('/api/leaves/balance');
            const data = await res.json();
            setLeaveBalances(data.balances || []);
            if (data.balances?.length > 0 && !selectedTypeId) {
                setSelectedTypeId(data.balances[0].leave_type.id);
            }
        } catch (error) {
            console.error('Fetch balances error:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleApply = async () => {
        if (!selectedTypeId || !fromDate || !toDate || !comments) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/leaves/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leave_type_id: selectedTypeId,
                    start_date: fromDate,
                    end_date: toDate,
                    session: fromSession === 'full_day' && toSession === 'full_day' ? 'full_day' : 'custom',
                    // Note: If original API only supports one 'session' type, we might need to adapt.
                    // Let's stick to the basic 'session' for now or handle it mapping-wise.
                    reason: comments,
                }),
            });

            if (res.ok) {
                toast.success("Leave application submitted successfully");
                onClose();
                // Optionally refresh dashboard data here via a custom event or router refresh
                window.dispatchEvent(new CustomEvent('leave-applied'));
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to submit application");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="bg-zinc-900 px-8 py-6">
                    <DialogTitle className="text-white text-xl font-bold tracking-tight">Apply Leave</DialogTitle>
                </DialogHeader>

                <div className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Leave Type */}
                        <div className="space-y-3 md:col-span-2">
                            <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                Leave Name <span className="text-red-500">*</span>
                            </Label>
                            {leaveBalances.length === 0 && !fetching ? (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-amber-700">
                                    <Info className="w-4 h-4" />
                                    <p className="text-xs font-medium">No leave balances found. Please contact HR.</p>
                                </div>
                            ) : (
                                <Select value={selectedTypeId} onValueChange={(val) => val && setSelectedTypeId(val)}>
                                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 bg-zinc-50/30 focus:ring-primary/20">
                                        <SelectValue placeholder="Select leave type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {fetching ? (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            </div>
                                        ) : leaveBalances.map((b) => (
                                            <SelectItem key={b.id} value={b.leave_type.id} className="cursor-pointer hover:bg-zinc-50">
                                                <div className="flex items-center justify-between w-full gap-4">
                                                    <span className="font-semibold">{b.leave_type.name}</span>
                                                    <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full text-primary font-bold">{b.available_days} Left</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Start Date */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                Start Date <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="h-12 pl-10 rounded-xl border-zinc-200 bg-zinc-50/30 focus:ring-primary/20"
                                    />
                                </div>
                                <Select value={fromSession} onValueChange={(val) => val && setFromSession(val)}>
                                    <SelectTrigger className="w-24 h-12 rounded-xl border-zinc-200 bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="full_day">Full Day</SelectItem>
                                        <SelectItem value="first_half">1st Half</SelectItem>
                                        <SelectItem value="second_half">2nd Half</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-medium px-1 italic">Format: DD-MMM-YYYY (e.g. 10-Mar-2026)</p>
                        </div>

                        {/* End Date */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                End Date <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="h-12 pl-10 rounded-xl border-zinc-200 bg-zinc-50/30 focus:ring-primary/20"
                                    />
                                </div>
                                <Select value={toSession} onValueChange={(val) => val && setToSession(val)}>
                                    <SelectTrigger className="w-24 h-12 rounded-xl border-zinc-200 bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="full_day">Full Day</SelectItem>
                                        <SelectItem value="first_half">1st Half</SelectItem>
                                        <SelectItem value="second_half">2nd Half</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-medium px-1 italic">Format: DD-MMM-YYYY (e.g. 10-Mar-2026)</p>
                        </div>

                        {/* Comments */}
                        <div className="space-y-3 md:col-span-2">
                            <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                Enter Comments <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                placeholder="Write your reason here..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="min-h-[100px] max-h-[100px] rounded-xl border-zinc-200 bg-zinc-50/30 focus:ring-primary/20 p-4 resize-none"
                            />
                            <p className="text-[10px] text-zinc-400 font-medium px-1 italic">Please enter comments</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-zinc-50/80 px-8 py-6 flex sm:justify-end gap-3 border-t border-zinc-100">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-11 px-8 rounded-xl border-zinc-200 font-bold text-zinc-500 hover:bg-white hover:text-zinc-700 shadow-sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={loading}
                        className="h-11 px-10 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-bold shadow-lg shadow-[#14b8a6]/20 transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
