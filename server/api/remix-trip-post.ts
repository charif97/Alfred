// ALFRED — POST /api/remix-trip-post
// Reuses solver to adapt a trip from the social feed

import { generatePlans } from '../agents/solver';
import { GLOBAL_POSTS } from './social-feed';
import type { Mood } from '../../lib/types';

export interface RemixTripPostInput {
    post_id: string;
    user_id: string;
    new_origin: string;
    new_dates: string;
    mood?: Mood;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const body = await request.json() as RemixTripPostInput;

        if (!body.post_id || !body.user_id || !body.new_origin || !body.new_dates) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch parent trip json
        const parentPost = GLOBAL_POSTS.find(p => p.post_id === body.post_id);
        if (!parentPost) {
            return Response.json({ error: 'Trip post not found' }, { status: 404 });
        }

        const destination = parentPost.trip_json.destination || 'Madrid'; // Fallback

        // 2. Call solver to adapt to new origin/dates
        const [startParam, endParam] = body.new_dates.split('_');
        const start = startParam === 'next_weekend' ? new Date().toISOString() : startParam;
        const end = endParam === 'next_weekend' ? new Date(Date.now() + 3 * 86400000).toISOString() : endParam || new Date(Date.now() + 3 * 86400000).toISOString();

        // 3. Fake travel profile for mock
        const mockProfile = {
            user_id: body.user_id,
            archetype: 'chill_explorer' as const,
            budget_sensitivity: 50,
            fatigue_tolerance: 50,
            nature_vs_city: 50,
            transport_tolerance: 50,
            comfort_level: 50,
            spontaneity: 50,
            weather_preference: 50,
            time_sensitivity: 50,
            culture_priority: 50,
            food_priority: 50,
            nightlife_priority: 50,
            passions: [],
            updated_at: new Date().toISOString()
        };

        const result = generatePlans({
            user_id: body.user_id,
            profile: mockProfile,
            mood: body.mood || 'explorer',
            constraints: {
                origin: body.new_origin,
                destinations: [destination],
                departure_earliest: start,
                return_latest: end,
                budget_max: 8000,
                budget_currency: 'MAD'
            }
        });

        // 4. Inject attribution tags into returned plan
        let newPlan = result.plans[0] || parentPost.trip_json;
        newPlan = {
            ...newPlan,
            // Inherit destination explicitly since solver stub might miss it
            destination,
        };

        return Response.json({
            success: true,
            remixed_plan: newPlan,
            remixed_from_post_id: parentPost.post_id,
            remixed_from_username: parentPost.username
        }, { status: 200 });

    } catch (e) {
        return Response.json({ error: 'Failed to remix trip post' }, { status: 500 });
    }
}
