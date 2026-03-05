// ALFRED — Next Trip Engine
// Generates 3 proactive trip recommendations without user interaction
// Uses the existing solver module + mock travel data layer

import { generatePlans } from '../agents/solver';
import type { TravelProfile, Mood, Plan } from '../../lib/types';

// ─── Input & Response Types ─────────────────────────────────────────

export interface NextTripsOptions {
    limit?: number;        // default 10
    cursor?: string | null; // e.g. "page:0", "page:1"
    mode?: 'default' | 'surprise';
    seed_override?: string; // used for deterministic shuffle
}

export interface NextTripRecommendation {
    id: string; // Add a unique ID for React keys
    destination: string;
    duration_days: number;
    total_price_est: number;
    transport_time_hours: number;
    best_dates: string;
    savings_if_flexible: number;
    itinerary_teaser: string[];
    reason: string;
    why_bullets: string[];
    tradeoff: string;
    savings_tip: string | null;
    alfred_narration: string;
}

export interface NextTripsResponse {
    trips: NextTripRecommendation[];
    next_cursor: string | null;
}

// ─── Mock Destination Catalog ───────────────────────────────────
// Curated list of destinations with mock metadata for the data layer
interface DestinationEntry {
    city: string;
    country: string;
    flight_hours_from_casa: number;
    avg_flight_cost_mad: number;
    avg_hotel_per_night_mad: number;
    flexible_savings_mad: number;
    best_weekend_dates: string;
    vibe: string[];
    itinerary_teaser: string[];
    reason_template: string;
}

const BASE_CATALOG: DestinationEntry[] = [
    {
        city: 'Lisbon',
        country: 'Portugal',
        flight_hours_from_casa: 1.5,
        avg_flight_cost_mad: 1200,
        avg_hotel_per_night_mad: 500,
        flexible_savings_mad: 120,
        best_weekend_dates: 'Sat → Mon',
        vibe: ['culture', 'food', 'city'],
        itinerary_teaser: ['Old town walk', 'Sunset viewpoints', 'Day trip Sintra'],
        reason_template: 'Cheap flights and great weather for a 3-day trip',
    },
    {
        city: 'Madrid',
        country: 'Spain',
        flight_hours_from_casa: 2.0,
        avg_flight_cost_mad: 1400,
        avg_hotel_per_night_mad: 600,
        flexible_savings_mad: 180,
        best_weekend_dates: 'Fri → Sun',
        vibe: ['nightlife', 'food', 'culture'],
        itinerary_teaser: ['Prado Museum', 'Tapas crawl La Latina', 'Retiro Park sunset'],
        reason_template: 'Direct flights from Casa, perfect for a weekend cultural escape',
    },
    {
        city: 'Istanbul',
        country: 'Turkey',
        flight_hours_from_casa: 5.0,
        avg_flight_cost_mad: 2200,
        avg_hotel_per_night_mad: 450,
        flexible_savings_mad: 350,
        best_weekend_dates: 'Thu → Sun',
        vibe: ['culture', 'food', 'adventure'],
        itinerary_teaser: ['Hagia Sophia', 'Bosphorus boat tour', 'Grand Bazaar shopping'],
        reason_template: 'Visa-free for Moroccans and incredible food scene',
    },
    {
        city: 'Barcelona',
        country: 'Spain',
        flight_hours_from_casa: 2.5,
        avg_flight_cost_mad: 1600,
        avg_hotel_per_night_mad: 700,
        flexible_savings_mad: 200,
        best_weekend_dates: 'Sat → Mon',
        vibe: ['city', 'nightlife', 'culture'],
        itinerary_teaser: ['Sagrada Familia', 'Barceloneta beach', 'Gothic Quarter walk'],
        reason_template: 'Beach + city combo with short flight time',
    },
    {
        city: 'Marrakech',
        country: 'Morocco',
        flight_hours_from_casa: 0.8,
        avg_flight_cost_mad: 500,
        avg_hotel_per_night_mad: 350,
        flexible_savings_mad: 80,
        best_weekend_dates: 'Fri → Sun',
        vibe: ['culture', 'food', 'chill'],
        itinerary_teaser: ['Jemaa el-Fna at night', 'Riad rooftop breakfast', 'Majorelle Gardens'],
        reason_template: 'Super close and cheap — perfect low-effort escape',
    },
    {
        city: 'Rome',
        country: 'Italy',
        flight_hours_from_casa: 3.0,
        avg_flight_cost_mad: 1800,
        avg_hotel_per_night_mad: 650,
        flexible_savings_mad: 250,
        best_weekend_dates: 'Sat → Tue',
        vibe: ['culture', 'food', 'city'],
        itinerary_teaser: ['Colosseum morning', 'Trastevere food tour', 'Vatican Museums'],
        reason_template: 'History, pasta, and espresso — the ultimate European classic',
    },
    {
        city: 'Tunis',
        country: 'Tunisia',
        flight_hours_from_casa: 2.5,
        avg_flight_cost_mad: 1100,
        avg_hotel_per_night_mad: 300,
        flexible_savings_mad: 150,
        best_weekend_dates: 'Fri → Sun',
        vibe: ['culture', 'chill', 'food'],
        itinerary_teaser: ['Medina of Tunis', 'Sidi Bou Said blue village', 'Carthage ruins'],
        reason_template: 'Visa-free, affordable, and culturally rich — great quick getaway',
    },
    {
        city: 'Paris',
        country: 'France',
        flight_hours_from_casa: 3.0,
        avg_flight_cost_mad: 1500,
        avg_hotel_per_night_mad: 800,
        flexible_savings_mad: 200,
        best_weekend_dates: 'Thu → Sun',
        vibe: ['culture', 'food', 'city'],
        itinerary_teaser: ['Louvre Museum', 'Montmartre walk', 'Seine river cruise'],
        reason_template: 'Classic romantic getaway with direct flights',
    },
    {
        city: 'London',
        country: 'UK',
        flight_hours_from_casa: 3.5,
        avg_flight_cost_mad: 1700,
        avg_hotel_per_night_mad: 900,
        flexible_savings_mad: 300,
        best_weekend_dates: 'Fri → Mon',
        vibe: ['culture', 'city', 'nightlife'],
        itinerary_teaser: ['British Museum', 'West End show', 'Borough Market'],
        reason_template: 'Global city vibes and endless entertainment',
    },
    {
        city: 'Amsterdam',
        country: 'Netherlands',
        flight_hours_from_casa: 3.5,
        avg_flight_cost_mad: 2000,
        avg_hotel_per_night_mad: 850,
        flexible_savings_mad: 220,
        best_weekend_dates: 'Thu → Sun',
        vibe: ['culture', 'chill', 'nightlife'],
        itinerary_teaser: ['Canal cruise', 'Van Gogh Museum', 'Vondelpark cycling'],
        reason_template: 'Unique charm, bikes, and laid-back atmosphere',
    }
];

// Replicate cities with slight variations to create a 50+ item catalog for infinite scrolling
export const DESTINATION_CATALOG: DestinationEntry[] = [];
for (let i = 0; i < 6; i++) {
    BASE_CATALOG.forEach((dest, index) => {
        DESTINATION_CATALOG.push({
            ...dest,
            city: i === 0 ? dest.city : `${dest.city} (Option ${i + 1})`,
            avg_flight_cost_mad: dest.avg_flight_cost_mad + (i * 150),
            avg_hotel_per_night_mad: dest.avg_hotel_per_night_mad + (i * 50),
        });
    });
}


// ─── Profile-Based Scoring ──────────────────────────────────────
// Score destinations against user profile to find best matches
function scoreDestinationForProfile(
    dest: DestinationEntry,
    profile: TravelProfile,
): number {
    let score = 50; // base

    // Budget sensitivity: cheaper destinations score higher
    const totalCost = dest.avg_flight_cost_mad + dest.avg_hotel_per_night_mad * 3;
    if (totalCost < 3000) score += profile.budget_sensitivity * 0.3;
    if (totalCost > 5000) score -= profile.budget_sensitivity * 0.2;

    // City vs nature preference
    if (dest.vibe.includes('city')) score += (profile.nature_vs_city / 100) * 15;
    if (dest.vibe.includes('chill')) score += ((100 - profile.nature_vs_city) / 100) * 10;

    // Culture match
    if (dest.vibe.includes('culture')) score += (profile.culture_priority / 100) * 20;

    // Food match
    if (dest.vibe.includes('food')) score += (profile.food_priority / 100) * 15;

    // Nightlife match
    if (dest.vibe.includes('nightlife')) score += (profile.nightlife_priority / 100) * 15;

    // Short flight bonus for fatigue-sensitive users
    if (dest.flight_hours_from_casa <= 2) score += (profile.fatigue_tolerance < 50 ? 15 : 5);

    // Comfort-oriented users prefer better hotels
    if (dest.avg_hotel_per_night_mad > 500 && profile.comfort_level > 60) score += 10;

    // Adventure/Spontaneity for certain destinations
    if (dest.vibe.includes('adventure')) score += (profile.spontaneity / 100) * 10;

    // Passion matching
    for (const passion of profile.passions) {
        const lp = passion.toLowerCase();
        if (dest.vibe.includes(lp)) score += 8;
        if (lp.includes('food') && dest.vibe.includes('food')) score += 5;
        if (lp.includes('photo') && dest.vibe.includes('culture')) score += 5;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Default Profile (fallback) ─────────────────────────────────
const DEFAULT_PROFILE: TravelProfile = {
    user_id: 'default',
    archetype: 'chill_explorer',
    budget_sensitivity: 60,
    fatigue_tolerance: 50,
    nature_vs_city: 65,
    transport_tolerance: 50,
    comfort_level: 60,
    spontaneity: 50,
    weather_preference: 70,
    time_sensitivity: 40,
    culture_priority: 70,
    food_priority: 65,
    nightlife_priority: 40,
    passions: ['food', 'culture'],
    updated_at: new Date().toISOString(),
};

// ─── Simple Deterministic Pseudo-Random Generator ─────────────────
// Allows for stable shuffling so pagination doesn't break on reload
function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// ─── Main: Generate Next Trips ──────────────────────────────────
export function generateNextTrips(
    userProfile?: TravelProfile,
    originCity: string = 'Casablanca',
    options?: NextTripsOptions
): NextTripsResponse {
    const profile = userProfile || DEFAULT_PROFILE;

    // Default options
    const limit = options?.limit || 10;
    const mode = options?.mode || 'default';
    let cursorIndex = 0;

    if (options?.cursor && options.cursor.startsWith('page:')) {
        cursorIndex = parseInt(options.cursor.split(':')[1], 10) * limit;
    }

    // Step 1: Score all destinations against profile
    let scored = DESTINATION_CATALOG.map((dest, idx) => {
        let score = scoreDestinationForProfile(dest, profile);

        // Surprise mode: increase novelty weight.
        if (mode === 'surprise') {
            // Favor unusual destinations (low flight counts or random novelty)
            const seed = options?.seed_override ? parseInt(options.seed_override, 36) : 123456;
            const rand = mulberry32(seed + idx)();
            const noveltyBonus = rand * 50; // High random factor for diversification
            const untraveledBonus = dest.avg_flight_cost_mad > 1500 ? 15 : 0; // Pretend it's "further"

            score = (score * 0.3) + noveltyBonus + untraveledBonus;
        }

        return {
            id: `dest_${idx}_${dest.city.replace(/\s/g, '_')}`,
            dest,
            score,
        };
    });

    // Step 2: Sort by score descending (stable across pages if seed/mode is unchanged)
    scored.sort((a, b) => b.score - a.score);

    // Step 3: Slice for current page
    const pageItems = scored.slice(cursorIndex, cursorIndex + limit);
    const hasMore = (cursorIndex + limit) < scored.length;
    const nextCursor = hasMore ? `page:${(cursorIndex / limit) + 1}` : null;

    // Step 4: Map to the expected response format
    const trips: NextTripRecommendation[] = pageItems.map((entry) => {
        const dest = entry.dest;
        const duration = 3; // MVP default

        // Calculate total estimated price
        const flightCostRoundTrip = dest.avg_flight_cost_mad * 2;
        const hotelCost = dest.avg_hotel_per_night_mad * (duration - 1);
        const activitiesBudget = 400; // flat mock
        const totalEst = flightCostRoundTrip + hotelCost + activitiesBudget;

        // Contextual strings for detailed explanations
        const why_bullets: string[] = [
            `Best time-on-ground for a ${duration}-day trip`,
            `Low fatigue: direct transport + short transfers`,
            `Great weather fit for your profile`
        ];

        const tradeoff = dest.avg_flight_cost_mad > 1500
            ? "Slightly higher flight cost, but more time in the city."
            : "Cheaper flights, but might involve early morning departure.";

        const savings_tip = dest.flexible_savings_mad > 0
            ? `Save ${dest.flexible_savings_mad} MAD by being flexible on dates.`
            : null;

        const alfred_narration = `Honestly, this option is hard to beat. Flights to ${dest.city} are relatively cheap, and it's perfect for a ${duration}-day city break.`;

        return {
            id: entry.id, // For map keys
            destination: dest.city,
            duration_days: duration,
            total_price_est: totalEst,
            transport_time_hours: dest.flight_hours_from_casa,
            best_dates: dest.best_weekend_dates,
            savings_if_flexible: dest.flexible_savings_mad,
            itinerary_teaser: dest.itinerary_teaser,
            reason: dest.reason_template,
            why_bullets,
            tradeoff,
            savings_tip,
            alfred_narration
        };
    });

    return { trips, next_cursor: nextCursor };
}

