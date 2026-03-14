'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    Briefcase,
    GraduationCap,
    Building2,
    Banknote,
    ShieldCheck,
    Settings,
    MoreVertical,
    ChevronDown,
    Camera,
    Loader2,
    Check
} from "lucide-react";
import HolidayList from "@/components/dashboard/HolidayList";
import {
    WorkInfoContent,
    CareerSnapshotContent,
    AcademicsContent,
    ProfileHubContent,
    BankingIdentityContent
} from "@/components/dashboard/profile/ProfileTabsContent";
import { FullEmployeeProfile } from "@/types/profile";

export default function ProfilePage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<FullEmployeeProfile | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile/full');
            const data = await res.json();

            if (data.profile) {
                setProfile(data.profile);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !profile) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    const profileData = {
        name: profile.full_name,
        id: profile.emp_code,
        joined: profile.date_of_joining ? new Date(profile.date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'Not set',
        location: profile.location || "Not assigned",
        email: profile.email,
        position: profile.designation || "Not assigned",
        manager: profile.work_info?.admin_manager || "Not assigned",
        photo: profile.profile_photo_url || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&h=200&auto=format&fit=crop"
    };

    return (
        <div className="min-h-screen bg-zinc-50/30">
            {/* Cover Photo */}
            <div className="relative h-64 w-full bg-[#3d2b1f] overflow-hidden rounded-b-3xl">
                <img
                    src="https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?q=80&w=2000&auto=format&fit=crop"
                    alt="Cover"
                    className="w-full h-full object-cover opacity-60"
                />
                <Button variant="secondary" size="sm" className="absolute top-6 right-8 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                    <Settings className="w-4 h-4 mr-2" /> Change Cover
                </Button>
            </div>

            <div className="max-w-[1600px] mx-auto px-8 -mt-24 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Sidebar Profile Card */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border-none shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                            <CardContent className="p-0">
                                <div className="flex flex-col items-center p-8 pt-12 pb-10">
                                    <div className="relative group">
                                        <div className="w-44 h-44 rounded-3xl overflow-hidden border-8 border-white shadow-2xl bg-zinc-50 flex items-center justify-center">
                                            <img src={profileData.photo} alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                        <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                            <Camera className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <h2 className="text-2xl font-bold text-zinc-900 mt-6 flex items-center gap-2">
                                        {profileData.name}
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                            <Check className="w-3 h-3 stroke-[4]" />
                                        </div>
                                    </h2>
                                    <p className="text-zinc-400 font-bold text-sm mt-1">{profileData.id}</p>

                                    <div className="flex gap-3 mt-6">
                                        <div className="p-2.5 rounded-xl bg-orange-50 text-orange-500 cursor-pointer hover:bg-orange-100 transition-colors">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500 cursor-pointer hover:bg-blue-100 transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-zinc-50 p-6 space-y-5">
                                    <SidebarInfoItem icon={Calendar} label="Date of Join" value={profileData.joined} />
                                    <SidebarInfoItem icon={MapPin} label="Location" value={profileData.location} />
                                    <SidebarInfoItem icon={Mail} label="Work Email" value={profileData.email} />
                                    <SidebarInfoItem icon={Briefcase} label="Position" value={profileData.position} />
                                    <SidebarInfoItem icon={User} label="Manager" value={profileData.manager} />
                                </div>
                            </CardContent>
                        </Card>

                        <HolidayList />
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-8">
                        {/* Custom Navigation Tabs */}
                        <Tabs defaultValue="work" className="w-full">
                            <Card className="border-none bg-white shadow-sm mb-8">
                                <TabsList className="h-auto p-0 bg-transparent flex justify-start px-8 overflow-x-auto scrollbar-none">
                                    <ProfileTabTrigger value="work" label="Work Info" icon={Building2} />
                                    <ProfileTabTrigger value="career" label="Career Snapshot" icon={Briefcase} />
                                    <ProfileTabTrigger value="contact" label="Contact info" icon={Phone} />
                                    <ProfileTabTrigger value="academics" label="Academics" icon={GraduationCap} />
                                    <ProfileTabTrigger value="hub" label="Profile Hub" icon={User} />
                                    <ProfileTabTrigger value="banking" label="Banking & Identity" icon={Banknote} />
                                    <div className="h-auto px-6 py-5 text-sm font-bold text-zinc-400 flex items-center gap-2 cursor-pointer hover:text-zinc-600">
                                        More <ChevronDown className="w-4 h-4" />
                                    </div>
                                </TabsList>
                            </Card>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                <div className="lg:col-span-2 space-y-8">
                                    <TabsContent value="work" className="mt-0 focus-visible:ring-0">
                                        <WorkInfoContent data={profile.work_info} empName={profile.full_name} dateOfJoining={profileData.joined} />
                                    </TabsContent>
                                    <TabsContent value="career" className="mt-0 focus-visible:ring-0">
                                        <CareerSnapshotContent data={profile.experience} refs={profile.references} />
                                    </TabsContent>
                                    <TabsContent value="academics" className="mt-0 focus-visible:ring-0">
                                        <AcademicsContent data={profile.academics} />
                                    </TabsContent>
                                    <TabsContent value="hub" className="mt-0 focus-visible:ring-0">
                                        <ProfileHubContent data={profile.personal_data} langs={profile.languages} email={profile.email} photo={profileData.photo} />
                                    </TabsContent>
                                    <TabsContent value="banking" className="mt-0 focus-visible:ring-0">
                                        <BankingIdentityContent data={profile.banking_identity} empName={profile.full_name} />
                                    </TabsContent>
                                </div>

                                {/* Right Widgets Column */}
                                <div className="lg:col-span-1 space-y-6">
                                    <Card className="border-zinc-200 shadow-sm overflow-hidden bg-white">
                                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
                                            <Building2 className="w-4 h-4 text-zinc-400" />
                                            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-tight">Employment Status</h3>
                                        </div>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between group cursor-pointer">
                                                <div className="space-y-1">
                                                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-900 font-bold px-3 py-1 text-[10px] uppercase rounded-md mb-2">
                                                        {profile.work_info?.employment_status || "Permanent"}
                                                    </Badge>
                                                    <p className="text-[10px] text-zinc-400 font-medium">Effective From : <span className="text-zinc-900 font-bold">{profile.work_info?.effective_date ? new Date(profile.work_info.effective_date).toLocaleDateString() : profileData.joined}</span></p>
                                                </div>
                                                <ChevronDown className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-zinc-200 shadow-sm overflow-hidden bg-white">
                                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
                                            <User className="w-4 h-4 text-zinc-400" />
                                            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-tight">Reporting Information</h3>
                                        </div>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between group cursor-pointer">
                                                    <div>
                                                        <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 font-bold px-3 py-1 text-[10px] uppercase rounded-md mb-2">Reporting Manager</Badge>
                                                        <p className="text-sm font-bold text-zinc-900">{profileData.manager}</p>
                                                        <div className="space-y-0.5 mt-1">
                                                            <p className="text-[10px] text-zinc-400 font-medium">From Date : <span className="text-zinc-900 font-bold">09-Apr-2025</span></p>
                                                            <p className="text-[10px] text-zinc-400 font-medium">To Date : -</p>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </Tabs>
                    </div>

                </div>
            </div>
        </div>
    );
}

function SidebarInfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-start gap-4 group">
            <div className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover:bg-primary/5 group-hover:text-primary transition-colors shrink-0">
                <Icon className="w-4 h-4 text-zinc-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-xs font-bold text-zinc-900 truncate">{value}</p>
            </div>
        </div>
    );
}

function ProfileTabTrigger({ value, label, icon: Icon }: { value: string, label: string, icon: any }) {
    return (
        <TabsTrigger
            value={value}
            className="h-auto px-6 py-5 text-sm font-bold text-zinc-400 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent hover:text-zinc-600 transition-all flex items-center gap-2 shadow-none"
        >
            <Icon className="w-4 h-4" />
            {label}
        </TabsTrigger>
    );
}
