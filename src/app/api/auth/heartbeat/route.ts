import { NextResponse } from 'next/server';

/**
 * Lightweight Heartbeat API.
 * The session refresh is automatically handled by the middleware (proxy.ts) 
 * for every request to /api/* routes. This endpoint just provides a target
 * to trigger that middleware logic without redundant Auth API hits.
 */
export async function GET() {
    return NextResponse.json({
        ok: true,
        timestamp: new Date().toISOString()
    });
}
