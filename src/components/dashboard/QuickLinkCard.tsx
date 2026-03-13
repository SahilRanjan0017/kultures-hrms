'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Users2, BookOpen } from "lucide-react";
import Link from "next/link";

export default function QuickLinkCard({ type }: { type: 'organogram' | 'handbook' }) {
    const isOrg = type === 'organogram';
    const href = isOrg ? '/dashboard/organogram' : '/dashboard/handbook';

    return (
        <Link href={href} className="block">
            <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
                <CardContent className="p-0 flex h-32">
                    <div className="flex-1 p-6">
                        <h3 className="text-lg font-bold text-zinc-900 group-hover:text-primary transition-colors">
                            {isOrg ? 'Organogram' : 'Employee Handbook'}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-[180px]">
                            {isOrg
                                ? 'Modern representation of an team\'s structure'
                                : 'InfoGuide related to company\'s history, mission, values...'}
                        </p>
                    </div>
                    <div className="w-24 bg-zinc-50 flex items-center justify-center p-4">
                        {isOrg ? (
                            <Users2 className="w-12 h-12 text-zinc-200 group-hover:text-primary/20 transition-colors" />
                        ) : (
                            <BookOpen className="w-12 h-12 text-zinc-200 group-hover:text-amber-500/20 transition-colors" />
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
