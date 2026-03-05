// ALFRED — POST /api/like-trip
import { GLOBAL_POSTS } from './social-feed';

export interface LikeTripInput {
    post_id: string;
    user_id: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const body = await request.json() as LikeTripInput;

        if (!body.post_id || !body.user_id) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Mock DB query
        const post = GLOBAL_POSTS.find(p => p.post_id === body.post_id);

        if (!post) {
            return Response.json({ error: 'Post not found' }, { status: 404 });
        }

        // Toggle like (In reality: insert/delete in `trip_likes` table)
        post.liked_by_me = !post.liked_by_me;
        post.likes_count += post.liked_by_me ? 1 : -1;

        return Response.json({
            success: true,
            likes_count: post.likes_count,
            liked_by_me: post.liked_by_me
        }, { status: 200 });
    } catch (e) {
        return Response.json({ error: 'Failed to toggle like' }, { status: 500 });
    }
}
