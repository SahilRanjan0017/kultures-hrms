import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: baseProfile } = await supabase
        .from('employees')
        .select('id, tenant_id')
        .eq('user_id', user.id)
        .single();

    if (!baseProfile) {
        return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const employeeId = baseProfile.id;
    const tenantId = baseProfile.tenant_id;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    try {
        // Ensure bucket exists
        const { data: buckets } = await adminClient.storage.listBuckets();
        if (!buckets?.find(b => b.id === 'images')) {
            await adminClient.storage.createBucket('images', {
                public: true,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
                fileSizeLimit: 2048000 // 2MB
            });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${tenantId}/${employeeId}/profile-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload file
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await adminClient.storage
            .from('images')
            .upload(filePath, Buffer.from(arrayBuffer), {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = adminClient.storage
            .from('images')
            .getPublicUrl(filePath);

        // Update employee record
        const { error: updateError } = await adminClient
            .from('employees')
            .update({ profile_photo_url: publicUrl })
            .eq('id', employeeId);

        if (updateError) throw updateError;

        return NextResponse.json({ photoUrl: publicUrl });
    } catch (error: any) {
        console.error("Profile photo upload error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
