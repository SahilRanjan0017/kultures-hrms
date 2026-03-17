import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check if user is admin/hr for this tenant
    const { data: member } = await supabase
        .from("tenant_members")
        .select("role, tenant_id")
        .eq("user_id", user.id)
        .single();

    if (!member || !['admin', 'hr'].includes(member.role)) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const tenantId = member.tenant_id;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    try {
        // 2. Ensure bucket exists
        const { data: buckets } = await adminClient.storage.listBuckets();
        if (!buckets?.find(b => b.id === 'assets')) {
            await adminClient.storage.createBucket('assets', {
                public: true,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
                fileSizeLimit: 2048000 // 2MB
            });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${tenantId}/logo-${Date.now()}.${fileExt}`;
        const filePath = `tenant-logos/${fileName}`;

        // 3. Upload file
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await adminClient.storage
            .from('assets')
            .upload(filePath, Buffer.from(arrayBuffer), {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 4. Get public URL
        const { data: { publicUrl } } = adminClient.storage
            .from('assets')
            .getPublicUrl(filePath);

        // 5. Update tenant record
        const { error: updateError } = await adminClient
            .from('tenants')
            .update({ logo_url: publicUrl })
            .eq('id', tenantId);

        if (updateError) throw updateError;

        return NextResponse.json({ logoUrl: publicUrl });
    } catch (error: any) {
        console.error("Logo upload error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
