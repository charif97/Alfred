// ALFRED — Remix Trip Endpoint  (Phase 12: Steal My Trip Remix)
// Accepts the original trip destination + new_origin, new_dates, mood.
// Runs the solver to produce adapted plans for the new traveller context.

import { generatePlans } from '../agents/solver';
import type { Mood, Plan, TravelProfile } from '../../lib/types';

// ─── Input / Output ──────────────────────────────────────────────
export interface RemixTripInput {
    original_destination: string;
    new_origin: string;
    new_dates: { departure: string; return: string };
    mood: Mood;
    budget_max?: number;
    user_id?: string;
}

export interface RemixTripOutput {
    remixed_plans: Plan[];
    original_destination: string;
    new_origin: string;
}

// ─── Mock Profile (until user is authenticated) ──────────────────
const DEFAULT_PROFILE: TravelProfile = {
    user_id: 'remix_anon',
    archetype: 'city_sprinter',
    budget_sensitivity: 60,
    fatigue_tolerance: 50,
    nature_vs_city: 70,
    transport_tolerance: 60,
    comfort_level: 60,
    spontaneity: 70,
    weather_preference: 60,
    time_sensitivity: 60,
    culture_priority: 70,
    food_priority: 60,
    nightlife_priority: 40,
    passions: [],
    updated_at: new Date().toISOString(),
};

export function remixTrip(input: RemixTripInput): RemixTripOutput {
    const solverOutput = generatePlans({
        user_id: input.user_id || 'remix_anon',
        profile: DEFAULT_PROFILE,
        mood: input.mood,
        constraints: {
            origin: input.new_origin,
            destinations: [input.original_destination],
            departure_earliest: input.new_dates.departure,
            return_latest: input.new_dates.return,
            budget_max: input.budget_max || 5000,
            budget_currency: 'EUR',
        },
    });

    return {
        remixed_plans: solverOutput.plans,
        original_destination: input.original_destination,
        new_origin: input.new_origin,
    };
}

// ─── Expo API Route Handler ──────────────────────────────────────
export async function POST(request: Request): Promise<Response> {
    try {
        const body = await request.json() as RemixTripInput;
        if (!body.original_destination || !body.new_origin || !body.new_dates) {
            return Response.json(
                { error: 'Missing required fields: original_destination, new_origin, new_dates' },
                { status: 400 }
            );
        }
        const result = remixTrip(body);
        return Response.json(result, { status: 200 });
    } catch (e) {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
