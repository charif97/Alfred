// ALFRED — Social Trip Layer API (Phase 14)
// GET /api/social-feed
// Returns the global explore feed mixed heavily with recent uploads and remixes.
// Uses an in-memory DB stub representation for MVP since DB connection is outside the constraints.

import type { TripPost, Plan } from '../../lib/types';

// ─── Mock Database (until Supabase hookup) ────────────────────────
export const GLOBAL_POSTS: TripPost[] = [
    {
        post_id: 'post_1',
        user_id: 'user_a',
        username: 'Sarah_Explorer',
        caption: 'Literally the perfect weekend in Rome. Found a way to skip all the lines for the Colosseum. 🍝',
        likes_count: 34,
        remix_count: 5,
        remixed_from_post_id: null,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        trip_json: {
            destination: 'Rome',
            duration_days: 3,
            total_price_est: 3500,
            why_bullets: ['Skipped major queues', 'Local food priority', 'Perfect 3-day timing'],
            tradeoff: 'Slightly higher hotel price for central location.',
        },
        liked_by_me: false,
    },
    {
        post_id: 'post_2',
        user_id: 'user_b',
        username: 'TechNomad_99',
        caption: 'Needed to chill after a crazy week. Budapest canals + zero schedule.',
        likes_count: 12,
        remix_count: 0,
        remixed_from_post_id: 'post_8', // Example of a remix
        remixed_from_username: 'Alfred',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        trip_json: {
            destination: 'Budapest',
            duration_days: 4,
            total_price_est: 2800,
            why_bullets: ['Direct transport', 'Budget friendly', 'Very relaxed pace'],
            tradeoff: 'Flight arrives quite late on Thursday.',
        },
        liked_by_me: true,
    }
];

export async function GET(request: Request): Promise<Response> {
    try {
        // Here we'd normally order by recent + user following algorithms.
        // For MVP, we sort by date descending.
        const sortedFeed = [...GLOBAL_POSTS].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return Response.json({
            feed: sortedFeed,
            next_cursor: null // Infinite pagination disabled for MVP stub
        }, { status: 200 });
    } catch (e) {
        return Response.json({ error: 'Failed to load social feed' }, { status: 500 });
    }
}
