// ALFRED — GET /api/generate-brag-card
// Endpoint wrapper for the SVG brag card generator

import { generateTripCardSvg } from '../utils/trip-card-generator';
import { GLOBAL_POSTS } from './social-feed'; // Use the localized memory store for mock fetching

export async function GET(request: Request): Promise<Response> {
    try {
        const url = new URL(request.url);
        const postId = url.searchParams.get('post_id');

        let plan;
        let username = 'Alfred User';

        if (postId) {
            const post = GLOBAL_POSTS.find(p => p.post_id === postId);
            if (post) {
                plan = post.trip_json;
                username = post.username;
            }
        }

        // If no post is found or directly targeting a specific trip schema, we'd pull from `trips` table.
        // For MVP, we will mock fallback generic values if it's missing.
        if (!plan) {
            plan = {
                destination: 'Mystery City',
                duration_days: 3,
                total_price_est: 2500,
                why_bullets: ['Direct flight', 'Great weekend weather'],
                tradeoff: 'Fast paced execution.'
            };
        }

        const dataUri = generateTripCardSvg(plan, username);

        return Response.json({ success: true, image_url: dataUri }, { status: 200 });

    } catch (e) {
        return Response.json({ error: 'Failed to generate brag card' }, { status: 500 });
    }
}
