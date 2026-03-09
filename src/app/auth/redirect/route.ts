import { NextResponse } from 'next/server';
import { getUserTenant } from '@/lib/tenant';

export async function GET(request: Request) {
    const tenantData = await getUserTenant();

    if (tenantData && tenantData.tenants && tenantData.tenants.subdomain) {
        const subdomain = tenantData.tenants.subdomain;
        const isLocalhost = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');
        const redirectUrl = isLocalhost
            ? `http://${subdomain}.localhost:3000`
            : `https://${subdomain}.kultures.io`;

        return NextResponse.redirect(redirectUrl);
    }

    const url = new URL(request.url);
    return NextResponse.redirect(`${url.origin}/onboarding`);
}
