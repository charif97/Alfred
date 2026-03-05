// ALFRED Learning Engine — Module 7
// Listens to tracking events and updates profile/routines/rules

import type { EventType, TravelProfile, Routine } from '../../lib/types';

// ─── Event Processing Rules ─────────────────────────────────────
interface LearningRule {
    event_type: EventType;
    handler: (payload: any, context: LearningContext) => LearningAction[];
}

interface LearningContext {
    user_id: string;
    profile: TravelProfile;
    routines: Routine[];
    recentEvents: { type: EventType; payload: any; created_at: string }[];
}

type LearningAction =
    | { type: 'update_score'; key: string; delta: number }
    | { type: 'create_routine'; name: string; description: string; pattern: any }
    | { type: 'update_routine_confidence'; routine_id: string; delta: number }
    | { type: 'create_fact'; key: string; value: string; source: 'implicit' | 'explicit' }
    | { type: 'log'; message: string };

// ─── Rules ───────────────────────────────────────────────────────
const REPEAT_THRESHOLD = 3; // pattern must repeat 3× to create routine

export const LEARNING_RULES: LearningRule[] = [
    // Plan selected → learn preferences
    {
        event_type: 'plan_selected',
        handler: (payload, ctx) => {
            const actions: LearningAction[] = [];
            const plan = payload.plan;

            // If user consistently selects cheapest plan
            if (plan.label === 'B' && plan.total_cost < 2000) {
                actions.push({ type: 'update_score', key: 'budget_sensitivity', delta: 3 });
            }

            // If user selects YOLO plan
            if (plan.label === 'C' && plan.risk_level > 40) {
                actions.push({ type: 'update_score', key: 'spontaneity', delta: 5 });
                actions.push({ type: 'update_score', key: 'budget_sensitivity', delta: -3 });
            }

            return actions;
        },
    },

    // Plan modified → learn what they don't like
    {
        event_type: 'plan_modified',
        handler: (payload, ctx) => {
            const actions: LearningAction[] = [];
            const modification = payload.modification;

            // Check if this modification is a pattern
            const similarMods = ctx.recentEvents.filter(
                e => e.type === 'plan_modified' && e.payload.modification?.type === modification?.type
            );

            if (similarMods.length >= REPEAT_THRESHOLD - 1) {
                // Refusal repeated 3× → create stable rule
                if (modification.type === 'remove_night_bus') {
                    actions.push({ type: 'create_fact', key: 'hates_night_bus', value: 'true', source: 'implicit' });
                }
                if (modification.type === 'change_hotel_location') {
                    actions.push({ type: 'create_fact', key: 'hotel_preference', value: 'centre-ville', source: 'implicit' });
                }
            }

            return actions;
        },
    },

    // Feedback → direct preference signal
    {
        event_type: 'feedback_given',
        handler: (payload, ctx) => {
            const actions: LearningAction[] = [];

            if (payload.rating === 'down' && payload.plan) {
                // Negative feedback on expensive plan → budget sensitivity up
                if (payload.plan.total_cost > 4000) {
                    actions.push({ type: 'update_score', key: 'budget_sensitivity', delta: 5 });
                }
                // Negative on high-fatigue plan → fatigue tolerance down
                if (payload.plan.fatigue_estimate > 60) {
                    actions.push({ type: 'update_score', key: 'fatigue_tolerance', delta: -5 });
                }
            }

            return actions;
        },
    },

    // Routine detection → check patterns
    {
        event_type: 'plan_saved',
        handler: (payload, ctx) => {
            const actions: LearningAction[] = [];

            // Check for recurring patterns in saved plans
            const savedPlans = ctx.recentEvents.filter(e => e.type === 'plan_saved');

            if (savedPlans.length >= REPEAT_THRESHOLD) {
                // Detect "Weekend Express" pattern
                const weekendPlans = savedPlans.filter(e => {
                    const p = e.payload.plan;
                    return p && p.legs?.some((l: any) => l.type === 'flight') &&
                        (new Date(p.legs[0]?.departure).getDay() === 5); // Friday
                });

                if (weekendPlans.length >= REPEAT_THRESHOLD) {
                    const existingRoutine = ctx.routines.find(r => r.name === 'Weekend Express');
                    if (existingRoutine) {
                        actions.push({ type: 'update_routine_confidence', routine_id: existingRoutine.id, delta: 0.1 });
                    } else {
                        actions.push({
                            type: 'create_routine',
                            name: 'Weekend Express',
                            description: 'Vol vendredi soir, retour dimanche soir, ville européenne',
                            pattern: { departure_day: 'friday', transport: 'flight', duration: 'weekend' },
                        });
                    }
                }
            }

            return actions;
        },
    },

    // Mood override → track mood preferences
    {
        event_type: 'mood_override_used',
        handler: (payload, ctx) => {
            return [{ type: 'log', message: `User overrode mood to: ${payload.new_mood}` }];
        },
    },

    // Chat abandoned → something went wrong
    {
        event_type: 'chat_abandoned',
        handler: (payload, ctx) => {
            return [{ type: 'log', message: `Chat abandoned at step: ${payload.last_step || 'unknown'}` }];
        },
    },
];

// ─── Process Event ──────────────────────────────────────────────
export function processEvent(
    eventType: EventType,
    payload: any,
    context: LearningContext
): LearningAction[] {
    const matchingRules = LEARNING_RULES.filter(r => r.event_type === eventType);
    const allActions: LearningAction[] = [];

    for (const rule of matchingRules) {
        const actions = rule.handler(payload, context);
        allActions.push(...actions);
    }

    return allActions;
}

// ─── Apply Actions (would call DB in production) ─────────────────
export function applyActions(actions: LearningAction[], userId: string): void {
    for (const action of actions) {
        switch (action.type) {
            case 'update_score':
                console.log(`[Learning] Update ${userId} ${action.key} by ${action.delta}`);
                break;
            case 'create_routine':
                console.log(`[Learning] Create routine for ${userId}: ${action.name}`);
                break;
            case 'create_fact':
                console.log(`[Learning] Store fact for ${userId}: ${action.key}=${action.value}`);
                break;
            case 'update_routine_confidence':
                console.log(`[Learning] Update routine confidence: ${action.routine_id} += ${action.delta}`);
                break;
            case 'log':
                console.log(`[Learning] ${action.message}`);
                break;
        }
    }
}
