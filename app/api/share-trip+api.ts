import { shareTrip } from '../../server/api/social';
import { Plan } from '../../lib/types';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const plan = body.plan as Plan;

        if (!plan) {
            return new Response(JSON.stringify({ error: "Missing plan object" }), { status: 400 });
        }

        const { shareUrl, error } = await shareTrip(plan);

        if (error) {
            return new Response(JSON.stringify({ error }), { status: 500 });
        }

        // Normally the host is dynamic. Hardcoding domain standard format for MVP.
        const fullLink = `https://alfred.travel${shareUrl}`;

        return new Response(JSON.stringify({ shareUrl: fullLink }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
