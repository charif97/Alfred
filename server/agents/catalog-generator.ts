import { createClient } from '@supabase/supabase-js';
import { Database } from '../db/client';

// Simple types for the script since it uses DB inserts
interface TripCatalogRow {
    origin: string;
    destination: string;
    duration_days: number;
    transport_mode: string;
    travel_time_est: number;
    total_price_min: number;
    total_price_max: number;
    score: number;
    why_bullets: any; // jsonb
    tradeoff: string;
    savings_tip: string;
    timeframe_tags: any; // jsonb
}

/**
 * Validates distance with Haversine formula
 */
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

// --- Placeholder coordinates to resolve Haversine
const MOCK_CITY_COORDS: Record<string, { lat: number, lon: number }> = {
    'Paris': { lat: 48.8566, lon: 2.3522 },
    'London': { lat: 52.3676, lon: 4.9041 },
    'Madrid': { lat: 40.4168, lon: -3.7038 },
    'Rome': { lat: 41.9028, lon: 12.4964 },
    'Berlin': { lat: 52.5200, lon: 13.4050 },
    'Lisbon': { lat: 38.7223, lon: -9.1393 },
    'Amsterdam': { lat: 52.3676, lon: 4.9041 },
    'Casablanca': { lat: 33.5731, lon: -7.5898 },
    'Marrakech': { lat: 31.6295, lon: -7.9811 },
    // Fallback coordinates for others will be randomized around Europe for the assignment mock generator.
};

function getCityCoords(name: string) {
    if (MOCK_CITY_COORDS[name]) return MOCK_CITY_COORDS[name];
    // return somewhat random european bounds
    return {
        lat: 35 + Math.random() * 20,
        lon: -10 + Math.random() * 30
    }
}

// ─── Price Baseline Maps
const CITY_COST_INDEX: Record<string, number> = {
    'Paris': 120, 'London': 140, 'Madrid': 80, 'Rome': 100,
    'Berlin': 90, 'Lisbon': 75, 'Amsterdam': 130, 'Casablanca': 50,
};

export async function generateTripCatalog(
    originCities: string[],
    destinations: string[],
    durations: number[],
    tags: string[]
) {
    const validTrips: TripCatalogRow[] = [];
    const MAX_TRIPS = 10000;

    for (const origin of originCities) {
        for (const dest of destinations) {
            if (origin === dest) continue;

            const coordOrigin = getCityCoords(origin);
            const coordDest = getCityCoords(dest);
            const distance = getDistanceFromLatLonInKm(coordOrigin.lat, coordOrigin.lon, coordDest.lat, coordDest.lon);

            for (const duration of durations) {
                // Determine Mode
                let mode = 'flight';
                if (distance < 900) mode = 'train';
                if (distance < 500) mode = 'bus';

                // Estimate Travel Time
                let travelTime = 0;
                if (mode === 'flight') travelTime = 2 + (distance / 800) + 1.5; // buffers
                if (mode === 'train') travelTime = distance / 200;
                if (mode === 'bus') travelTime = distance / 80;

                // Feasibility Flags
                const timeOnGround = (duration * 24) - (travelTime * 2);

                if (timeOnGround < 12) continue; // Minimum ground time rejection
                if (duration <= 3 && mode === 'bus' && travelTime > 10) continue; // Bus trip too long for a weekend

                // Pricing
                const costIndex = CITY_COST_INDEX[dest] || 90;
                const stayEst = costIndex * (duration - 1);
                const foodEst = (costIndex * 0.4) * duration;

                let transportMin = 60, transportMax = 200;
                if (mode === 'train') { transportMin = 30; transportMax = 150; }
                if (mode === 'bus') { transportMin = 15; transportMax = 60; }

                const flightMaxPenaltyFactor = Math.min(1.5, Math.random() + 0.5);

                const priceMin = transportMin + stayEst + foodEst;
                const priceMax = (transportMax * flightMaxPenaltyFactor) + stayEst + foodEst + (costIndex * 0.5);

                // Tag assignments
                const tripTags = [tags[Math.floor(Math.random() * tags.length)]];

                const score = Math.floor(Math.random() * 30 + 50); // 50-80 bounds

                const savings = Math.floor(Math.random() * 150) + 20;

                validTrips.push({
                    origin: origin,
                    destination: dest,
                    duration_days: duration,
                    transport_mode: mode,
                    travel_time_est: travelTime,
                    total_price_min: priceMin,
                    total_price_max: priceMax,
                    score: score,
                    why_bullets: [
                        `Perfect distance for a ${mode} trip.`,
                        `Maximize ground time with only ${travelTime.toFixed(1)}h travel.`,
                        `Great fit for ${duration} days.`
                    ],
                    tradeoff: `A bit rushed but you get to see ${dest}.`,
                    savings_tip: `Save €${savings} by flying a day earlier`,
                    timeframe_tags: tripTags
                });

                if (validTrips.length >= MAX_TRIPS) break;
            }
            if (validTrips.length >= MAX_TRIPS) break;
        }
        if (validTrips.length >= MAX_TRIPS) break;
    }

    console.log(`Generated ${validTrips.length} catalog items.`);
    return validTrips;
}
