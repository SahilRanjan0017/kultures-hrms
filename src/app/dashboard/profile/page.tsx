'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Upload, Check, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        location: '',
        bio: '',
        phone: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("employees")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (data) {
            setProfile(data);
            setFormData({
                full_name: data.full_name || '',
                location: data.location || '',
                bio: data.bio || '',
                phone: data.phone || '',
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from("employees")
            .update({
                full_name: formData.full_name,
                location: formData.location,
                bio: formData.bio,
                phone: formData.phone,
                profile_completion: 100 // Example: set to 100 after first update
            })
            .eq("id", profile.id);

        if (error) {
            toast.error("Failed to update profile");
        } else {
            toast.success("Profile updated successfully");
            fetchProfile();
        }
        setSaving(false);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/${profile.id}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('public') // Assuming a public bucket exists
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from("employees")
                .update({ profile_photo_url: publicUrl })
                .eq("id", profile.id);

            if (updateError) throw updateError;

            toast.success("Photo updated!");
            fetchProfile();
        } catch (error: any) {
            toast.error("Photo upload failed: " + error.message);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Profile Settings</h1>
                    <p className="text-zinc-500 mt-1">Manage your public information and identity</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="shadow-lg shadow-primary/20">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Identity Section */}
                <Card className="lg:col-span-1 border-zinc-200 shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">Identity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-3xl overflow-hidden bg-zinc-50 border-4 border-zinc-100 shadow-inner flex items-center justify-center">
                                {profile?.profile_photo_url ? (
                                    <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-zinc-200" />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-colors border-2 border-white">
                                <Camera className="w-5 h-5" />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                        </div>
                        <div className="mt-8 text-center">
                            <h3 className="text-lg font-bold text-zinc-900">{profile.full_name}</h3>
                            <p className="text-sm font-medium text-zinc-500">{profile.designation}</p>
                            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                                {profile.status}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Information Section */}
                <Card className="lg:col-span-2 border-zinc-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-zinc-500">Full Name</Label>
                                <Input
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="border-zinc-100 bg-zinc-50/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-zinc-500">Work Location</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="border-zinc-100 bg-zinc-50/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-500">Contact Number</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="border-zinc-100 bg-zinc-50/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-500">Professional Bio</Label>
                            <Textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="border-zinc-100 bg-zinc-50/50 min-h-[120px]"
                                placeholder="Write a short summary about yourself..."
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
