import { getSharedTrip } from '../../server/api/social';

export async function GET(req: Request, { id }: Record<string, any>) {
    try {
        const { plan, error } = await getSharedTrip(id);

        if (error) {
            return new Response(JSON.stringify({ error }), { status: 404 });
        }

        return new Response(JSON.stringify({ plan }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
