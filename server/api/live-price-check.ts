// ALFRED — Live Price Check Endpoint (Phase 11: Hybrid Pricing)
// Returns a deterministic mock "live" price for a given route + dates.
// Caches results with a 2-hour TTL using a simple in-memory map (MVP).
// In production, this would hit the real Supabase price_cache table.

import type { LivePriceCheckInput, LivePriceCheckOutput } from '../../lib/types';

// Simple TTL map as an in-memory cache (replaces DB for MVP)
const PRICE_CACHE = new Map<string, { price: number; created_at: number }>();
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Deterministic hash of the query fields so the same query always hits the same cache key.
 */
function buildCacheKey(input: LivePriceCheckInput): string {
    return `${input.origin}|${input.destination}|${input.dates}|${input.passengers}`;
}

/**
 * Mock price engine — deterministic given the same inputs.
 * In production this would call a flight pricing API.
 */
function estimateLivePrice(input: LivePriceCheckInput): number {
    // Base price in EUR
    const baseFlightCost = 60 + (input.origin.charCodeAt(0) % 80) + (input.destination.charCodeAt(0) % 60);
    const dateSensitivity = input.dates.includes('weekend') ? 1.2 : 1.0;
    const passengerMultiplier = input.passengers;
    return Math.round(baseFlightCost * dateSensitivity * passengerMultiplier);
}

export function checkLivePrice(input: LivePriceCheckInput): LivePriceCheckOutput {
    const key = buildCacheKey(input);
    const now = Date.now();
    const cached = PRICE_CACHE.get(key);

    if (cached && now - cached.created_at < TTL_MS) {
        return {
            live_price: cached.price,
            currency: 'EUR',
            checked_at: new Date(cached.created_at).toISOString(),
            price_source: 'live',
            cached: true,
        };
    }

    const livePrice = estimateLivePrice(input);
    PRICE_CACHE.set(key, { price: livePrice, created_at: now });

    return {
        live_price: livePrice,
        currency: 'EUR',
        checked_at: new Date(now).toISOString(),
        price_source: 'live',
        cached: false,
    };
}

// ─── Expo API Route Handler ──────────────────────────────────────
export async function POST(request: Request): Promise<Response> {
    try {
        const body = await request.json() as LivePriceCheckInput;
        if (!body.origin || !body.destination || !body.dates) {
            return Response.json({ error: 'Missing required fields: origin, destination, dates' }, { status: 400 });
        }
        const result = checkLivePrice({ ...body, passengers: body.passengers || 1 });
        return Response.json(result, { status: 200 });
    } catch (e) {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
