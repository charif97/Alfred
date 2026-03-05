// ALFRED — Trip Evolution (Travel Copilot)
// POST /api/refine-trip
// Refines a trip in one tap using weight modifiers on the existing solver.

import { generatePlans } from '../agents/solver';
import type { TravelProfile, Mood, Plan } from '../../lib/types';

// ─── Refine Modes ────────────────────────────────────────────────
export type RefineMode = 'food' | 'culture' | 'nightlife' | 'nature' | 'chill' | 'efficient' | 'budget';

export interface RefineTripInput {
    trip_id: string | null;
    trip_json: Partial<Plan> | null;
    refine_mode: RefineMode;
    user_id: string;
}

export interface RoutineSuggestion {
    label: string;
    pattern: RefineMode[];
}

export interface RefineTripOutput {
    trip: Partial<Plan>;
    refined_from: RefineMode;
    refine_applied: boolean;
    routine_suggestion: RoutineSuggestion | null;
}

// ─── Weight Modifier Maps ────────────────────────────────────────
// Each refine mode adjusts profile weights before re-running the solver
const WEIGHT_MODIFIERS: Record<RefineMode, Partial<TravelProfile>> = {
    food: {
        food_priority: 95,
        culture_priority: 75,
    },
    culture: {
        culture_priority: 95,
        nightlife_priority: 20,
    },
    nightlife: {
        nightlife_priority: 95,
        spontaneity: 85,
    },
    nature: {
        nature_vs_city: 15, // 0 = nature
    },
    chill: {
        comfort_level: 90,
        transport_tolerance: 25,
    },
    efficient: {
        time_sensitivity: 95,
        fatigue_tolerance: 30,
    },
    budget: {
        budget_sensitivity: 95,
    },
};

// ─── In-Memory Event Store (MVP) ─────────────────────────────────
interface RefineEvent {
    user_id: string;
    refine_mode: RefineMode;
    trip_id: string | null;
    timestamp: string;
}

const REFINE_EVENTS: RefineEvent[] = [];

// ─── In-Memory Refine Stats ──────────────────────────────────────
const REFINE_STATS: Record<string, Record<RefineMode, number>> = {};

function trackRefineEvent(event: RefineEvent) {
    REFINE_EVENTS.push(event);

    // Increment stats
    if (!REFINE_STATS[event.user_id]) {
        REFINE_STATS[event.user_id] = {
            food: 0, culture: 0, nightlife: 0, nature: 0,
            chill: 0, efficient: 0, budget: 0,
        };
    }
    REFINE_STATS[event.user_id][event.refine_mode]++;
}

// ─── In-Memory Routines Store ────────────────────────────────────
interface DetectedRoutine {
    user_id: string;
    routine_type: string;
    pattern: RefineMode[];
    confidence: number;
}

const DETECTED_ROUTINES: DetectedRoutine[] = [];

// ─── Routine Detection Logic ("Comme d'habitude") ────────────────
// If a user uses the SAME combination ≥3 times in recent events → create routine
function detectRoutines(userId: string): void {
    const userEvents = REFINE_EVENTS.filter(e => e.user_id === userId);
    if (userEvents.length < 3) return;

    // Look at the last 20 events and count mode pairs
    const recent = userEvents.slice(-20);
    const modeCounts: Record<string, number> = {};

    for (const e of recent) {
        modeCounts[e.refine_mode] = (modeCounts[e.refine_mode] || 0) + 1;
    }

    // Find modes used ≥3 times
    const frequentModes = Object.entries(modeCounts)
        .filter(([_, count]) => count >= 3)
        .map(([mode]) => mode as RefineMode)
        .sort();

    if (frequentModes.length >= 1) {
        // Check if this exact pattern is already stored
        const existing = DETECTED_ROUTINES.find(
            r => r.user_id === userId &&
                JSON.stringify(r.pattern) === JSON.stringify(frequentModes)
        );

        if (!existing) {
            const confidence = Math.min(0.95, 0.5 + (frequentModes.length * 0.15));
            DETECTED_ROUTINES.push({
                user_id: userId,
                routine_type: 'trip_refine_pattern',
                pattern: frequentModes,
                confidence,
            });
        } else {
            // Boost confidence
            existing.confidence = Math.min(0.98, existing.confidence + 0.05);
        }
    }
}

// ─── Routine Suggestion Lookup ───────────────────────────────────
function getRoutineSuggestion(userId: string): RoutineSuggestion | null {
    const routine = DETECTED_ROUTINES.find(
        r => r.user_id === userId && r.confidence >= 0.7
    );
    if (!routine) return null;

    const patternLabel = routine.pattern
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' + ');

    return {
        label: `Comme d'habitude ? (${patternLabel})`,
        pattern: routine.pattern,
    };
}

// ─── Default Profile ─────────────────────────────────────────────
const BASE_PROFILE: TravelProfile = {
    user_id: 'refine_default',
    archetype: 'city_sprinter',
    budget_sensitivity: 60,
    fatigue_tolerance: 50,
    nature_vs_city: 65,
    transport_tolerance: 55,
    comfort_level: 60,
    spontaneity: 50,
    weather_preference: 65,
    time_sensitivity: 50,
    culture_priority: 60,
    food_priority: 55,
    nightlife_priority: 40,
    passions: [],
    updated_at: new Date().toISOString(),
};

// ─── Narration templates per mode ────────────────────────────────
const NARRATIONS: Record<RefineMode, string[]> = {
    food: [
        "Alright, if you're in a food mood this works really well.\nGreat spots and everything is walkable.",
        "Honestly this version is better for foodies.\nMore time in local restaurants, less rushing.",
    ],
    culture: [
        "This one's for the culture lovers.\nMuseums, history walks, and a slower pace.",
        "Nice refined plan. More time for the stuff that actually matters to you.",
    ],
    nightlife: [
        "Party mode activated.\nLater starts, better evenings, and the right neighborhoods.",
        "This version is way more fun at night.\nTrust me on this one.",
    ],
    nature: [
        "Fresh air edition. Parks, trails, and less concrete.\nYou'll feel recharged.",
        "Swapped the city grind for some greenery.\nWay more chill.",
    ],
    chill: [
        "Maximum chill activated.\nNo rushing, no stress, just vibes.",
        "Honestly this version works better.\nLess transport, more time actually enjoying the city.",
    ],
    efficient: [
        "Efficiency mode engaged.\nEvery hour optimized, zero wasted time.",
        "Tight but doable. You'll see everything important without burning out.",
    ],
    budget: [
        "Budget-friendly version unlocked.\nSame destination, way less damage to the wallet.",
        "Saved you some serious cash here.\nStill a great trip though, no compromises on the essentials.",
    ],
};

// ─── Itinerary Teasers per mode ──────────────────────────────────
const ITINERARY_TEASERS: Record<RefineMode, string[]> = {
    food: ['Local food tour', 'Market visit + cooking class', 'Best-rated restaurants walkthrough'],
    culture: ['Museum deep-dive morning', 'Historic quarter walking tour', 'Local art gallery visit'],
    nightlife: ['Rooftop bar sunset', 'Live music venue', 'Late-night neighborhood crawl'],
    nature: ['Park morning jog', 'Botanical garden visit', 'Scenic trail hike'],
    chill: ['Sleep in + brunch', 'Spa afternoon', 'Sunset waterfront walk'],
    efficient: ['Early start city highlights', 'Packed sightseeing day', 'Quick authentic lunch stops'],
    budget: ['Free walking tour', 'Street food lunch', 'Public transport exploration'],
};

// ─── Main Refine Logic ───────────────────────────────────────────
export function refineTrip(input: RefineTripInput): RefineTripOutput {
    const { trip_id, trip_json, refine_mode, user_id } = input;

    // 1. Track the event
    trackRefineEvent({
        user_id,
        refine_mode,
        trip_id,
        timestamp: new Date().toISOString(),
    });

    // 2. Detect routines after tracking
    detectRoutines(user_id);

    // 3. Apply weight modifiers to profile
    const modifiedProfile: TravelProfile = {
        ...BASE_PROFILE,
        user_id,
        ...WEIGHT_MODIFIERS[refine_mode],
    };

    // 4. Pick destination from existing trip or default
    const destination = trip_json?.destination || 'Madrid';
    const duration = trip_json?.duration_days || 3;

    // 5. Run solver with modified profile
    const solverResult = generatePlans({
        user_id,
        profile: modifiedProfile,
        mood: refine_mode === 'budget' ? 'budget_hacker'
            : refine_mode === 'efficient' ? 'efficient'
                : refine_mode === 'chill' ? 'chill'
                    : 'explorer',
        constraints: {
            origin: 'Casablanca',
            destinations: [destination],
            departure_earliest: trip_json?.best_dates || new Date().toISOString(),
            return_latest: new Date(Date.now() + duration * 86400000).toISOString(),
            budget_max: refine_mode === 'budget' ? 3000 : 8000,
            budget_currency: 'MAD',
        },
    });

    // 6. Build refined trip response (keep destination, update details)
    const basePlan = solverResult.plans[0] || trip_json || {};
    const narrations = NARRATIONS[refine_mode];
    const narration = narrations[Math.floor(Math.random() * narrations.length)];
    const teasers = ITINERARY_TEASERS[refine_mode];

    const refinedTrip: Partial<Plan> = {
        ...basePlan,
        destination,
        duration_days: duration,
        itinerary_teaser: teasers,
        why_bullets: [
            `Optimized for ${refine_mode} preferences`,
            `${destination} has great ${refine_mode} options`,
            `Plan adjusted to maximize ${refine_mode} time`,
        ],
        tradeoff: refine_mode === 'budget'
            ? 'Slightly less comfort, but 30% cheaper overall.'
            : refine_mode === 'efficient'
                ? 'Packed schedule but you see everything important.'
                : refine_mode === 'chill'
                    ? 'Fewer activities but way more relaxing.'
                    : `More ${refine_mode} focus means slightly less variety in other areas.`,
        alfred_narration: narration,
        explanation: `Refined for ${refine_mode} mode — plan adjusted to match your vibe.`,
    };

    // 7. Get routine suggestion if available
    const routineSuggestion = getRoutineSuggestion(user_id);

    return {
        trip: refinedTrip,
        refined_from: refine_mode,
        refine_applied: true,
        routine_suggestion: routineSuggestion,
    };
}

// ─── Expo API Route Handler ──────────────────────────────────────
export async function POST(request: Request): Promise<Response> {
    try {
        const body = await request.json() as RefineTripInput;

        if (!body.refine_mode || !body.user_id) {
            return Response.json(
                { error: 'Missing required fields: refine_mode, user_id' },
                { status: 400 }
            );
        }

        const result = refineTrip(body);
        return Response.json(result, { status: 200 });
    } catch (e) {
        console.error('Refine trip error:', e);
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
