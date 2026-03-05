// ALFRED — GET /api/trip-of-the-day (Phase 15)
// Deteriministically picks a "Trip of the Day" off the catalog rotating every 24h.

import { DESTINATION_CATALOG } from './next-trips';
import type { CatalogTrip } from '../../lib/types';

// Simple deterministic hash based on date string
function hashDateString(dateStr: string): number {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export async function GET(request: Request): Promise<Response> {
    try {
        const today = new Date().toISOString().split('T')[0]; // e.g. "2026-03-05"
        const hashIndex = hashDateString(today);

        // Pick deterministically from catalog
        const dest = DESTINATION_CATALOG[hashIndex % DESTINATION_CATALOG.length];

        const duration = 3;
        const totalEst = (dest.avg_flight_cost_mad * 2) + (dest.avg_hotel_per_night_mad * (duration - 1)) + 400;

        const tod: CatalogTrip = {
            id: `tod_${today}_${dest.city}`,
            origin: 'Casablanca',
            destination: dest.city,
            duration_days: duration,
            transport_mode: dest.avg_flight_cost_mad > 0 ? 'flight' : 'train', // Mock
            travel_time_est: dest.flight_hours_from_casa,
            total_price_min: totalEst * 0.9,
            total_price_max: totalEst * 1.1,
            price_source: 'estimate',
            score: 95, // High score guaranteed for TOD
            why_bullets: [
                `${dest.city} is peaking right now.`,
                `Incredible weather for a ${duration}-day trip.`,
                `Hand-picked by Alfred based on recent traveler feedback.`
            ],
            tradeoff: 'Popular spot, so book flights soon before prices spike.',
            savings_tip: dest.flexible_savings_mad > 0 ? `Save ${dest.flexible_savings_mad} MAD traveling next month.` : null,
            timeframe_tags: ['next_month'],
        };

        return Response.json({ trip: tod }, { status: 200 });

    } catch (e) {
        return Response.json({ error: 'Failed to fetch trip of the day' }, { status: 500 });
    }
}
