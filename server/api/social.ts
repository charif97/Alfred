import { supabase } from '../../lib/supabase';
import { Plan } from '../../lib/types';

// Utility to generate a short, random 5-character string (e.g. 82HJ3)
function generateShareId(length: number = 5): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Creates a shareable link for a given trip plan by saving it to DB.
 */
export async function shareTrip(plan: Plan): Promise<{ shareUrl: string | null; error: string | null }> {
    try {
        const shareId = generateShareId();

        const { error } = await supabase
            .from('shared_trips')
            .insert({
                share_id: shareId,
                trip_data_json: plan
            });

        if (error) {
            console.error('Error inserting shared trip:', error);
            return { shareUrl: null, error: error.message };
        }

        // Returns relative path for the app router to catch later
        return { shareUrl: `/t/${shareId}`, error: null };
    } catch (e: any) {
        return { shareUrl: null, error: e.message };
    }
}

/**
 * Retrieves a stored trip using the short URL code
 */
export async function getSharedTrip(shareId: string): Promise<{ plan: Plan | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('shared_trips')
            .select('trip_data_json')
            .eq('share_id', shareId)
            .single();

        if (error) {
            console.error('Error fetching shared trip:', error);
            return { plan: null, error: 'Share link expired or invalid.' };
        }

        return { plan: data.trip_data_json as Plan, error: null };
    } catch (e: any) {
        return { plan: null, error: e.message };
    }
}
