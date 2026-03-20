import { NextResponse } from 'next/server';
import { getUserTenant } from '@/lib/tenant';
import { getAppUrl } from "@/lib/utils";

export async function GET(request: Request) {
    const tenantData = await getUserTenant();

    if (tenantData && tenantData.tenants && tenantData.tenants.slug) {
        const slug = tenantData.tenants.slug;
        const isLocalhost = getAppUrl().includes('localhost');
        const redirectUrl = isLocalhost
            ? `http://${slug}.localhost:3000`
            : `https://${slug}.kultures.io`;

        return NextResponse.redirect(redirectUrl);
    }

    const url = new URL(request.url);
    return NextResponse.redirect(`${url.origin}/onboarding`);
}
