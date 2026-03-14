'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wallet, FileText, TrendingUp, ChevronRight, FileDown } from "lucide-react";
import { useState } from "react";

export default function DashboardServiceCards() {
    return (
        <div className="space-y-6">
            {/* Payslip Card */}
            <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden">
                <CardContent className="p-8 flex items-center gap-8">
                    <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        <Wallet className="w-10 h-10 text-zinc-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Payslip</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-md">
                            View & Download pay slips, tax slips, salary breakup and other pay-related information
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Letters Card */}
            <Card className="border-zinc-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <Tabs defaultValue="letters" className="w-full">
                        <div className="px-8 pt-6 flex items-center justify-between border-b border-zinc-100 pb-4">
                            <span className="text-sm font-medium text-zinc-400">1 Letters</span>
                            <TabsList className="bg-zinc-100/50 p-1 h-10">
                                <TabsTrigger
                                    value="letters"
                                    className="data-[state=active]:bg-[#2EC4B6] data-[state=active]:text-white px-6 text-xs font-semibold"
                                >
                                    Letters
                                </TabsTrigger>
                                <TabsTrigger
                                    value="signed"
                                    className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 px-6 text-xs font-semibold"
                                >
                                    Signed Document
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="letters" className="p-8 mt-0">
                            <div className="flex items-center justify-between bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-zinc-100 font-bold text-zinc-400 text-lg shadow-sm">
                                        A
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-900 mb-1 group-hover:text-primary transition-colors">
                                            Appointment Letter CTC
                                        </h4>
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-zinc-400 font-medium">
                                                Accepted By : <span className="text-zinc-600 font-bold">Sahil Ranjan (1897)</span>
                                            </p>
                                            <p className="text-xs text-zinc-400 font-medium">
                                                Accepted Date : <span className="text-zinc-600 font-bold">09-Apr-2025 01:07</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-1 group/btn">
                                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover/btn:bg-red-100 transition-colors">
                                        <FileDown className="w-5 h-5 text-red-500" />
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">PDF</span>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="signed" className="p-8 mt-0">
                            <div className="text-center py-8 text-zinc-400 text-sm">
                                No signed documents found.
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Performance Card */}
            <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden">
                <CardContent className="p-8 flex items-center gap-8">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Performance</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            Performance management is a corporate management tool that helps managers monitor and evaluate employees' work.
                        </p>
                    </div>
                    <div className="w-32 h-32 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        <TrendingUp className="w-16 h-16 text-zinc-300 group-hover:text-primary transition-colors" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
