// ALFRED — POST /api/post-trip
import { GLOBAL_POSTS } from './social-feed';
import type { TripPost, Plan } from '../../lib/types';

export interface PostTripInput {
    trip_json: Partial<Plan>;
    caption: string;
    user_id: string;
    remixed_from_post_id?: string;
    remixed_from_username?: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const body = await request.json() as PostTripInput;

        if (!body.trip_json || !body.user_id) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newPost: TripPost = {
            post_id: `post_${Date.now()}`,
            user_id: body.user_id,
            username: 'Current_User', // Mocked user context
            caption: body.caption || '',
            trip_json: body.trip_json,
            likes_count: 0,
            remix_count: 0,
            remixed_from_post_id: body.remixed_from_post_id || null,
            remixed_from_username: body.remixed_from_username,
            created_at: new Date().toISOString(),
            liked_by_me: false,
        };

        // In a real app: INSERT INTO trip_posts ...
        GLOBAL_POSTS.unshift(newPost); // Add to head of mock array

        // If remixed, increment the parent's remix count
        if (body.remixed_from_post_id) {
            const parent = GLOBAL_POSTS.find(p => p.post_id === body.remixed_from_post_id);
            if (parent) {
                parent.remix_count += 1;
                // SQL: UPDATE trip_posts SET remix_count = remix_count + 1 WHERE post_id = $1
            }
        }

        return Response.json({ success: true, post: newPost }, { status: 201 });
    } catch (e) {
        return Response.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
