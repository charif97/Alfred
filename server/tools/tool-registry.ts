// Tool Registry — Following agent-tool-builder skill
// Each tool has: name, description (crystal clear), strict JSON Schema, input examples, error handling
// "The LLM never sees your code. It only sees the schema and description."

export interface ToolSchema {
    name: string;
    description: string;
    parameters: Record<string, any>;
    returns: Record<string, any>;
    examples: { input: Record<string, any>; description: string }[];
}

export const TOOL_REGISTRY: ToolSchema[] = [
    // ─── Session Management ─────────────────────────────────────────
    {
        name: 'startSession',
        description: 'Start a new Alfred session. Must be called at start of every conversation. consent_memory=false blocks ALL memory retrieval and routine suggestions for this session.',
        parameters: {
            type: 'object',
            required: ['user_id', 'consent_memory'],
            properties: {
                user_id: { type: 'string', format: 'uuid', description: 'The user ID' },
                consent_memory: { type: 'boolean', description: 'Whether user consents to memory usage. If false, memory_access_denied event is logged on any memory attempt.' },
                mood: { type: 'string', enum: ['chill', 'budget_hacker', 'yolo', 'explorer', 'efficient'], description: 'Optional mood override for this session' },
            },
        },
        returns: {
            type: 'object',
            properties: {
                session_id: { type: 'string' },
                mood: { type: 'string' },
                consent_memory: { type: 'boolean' },
                routines: { type: 'array', description: 'Active routines if consent_memory=true, empty array otherwise' },
            },
        },
        examples: [
            { input: { user_id: '123e4567-e89b-12d3-a456-426614174000', consent_memory: true }, description: 'Start session with memory consent' },
            { input: { user_id: '123e4567-e89b-12d3-a456-426614174000', consent_memory: false, mood: 'budget_hacker' }, description: 'Start session without memory, budget mode' },
        ],
    },

    // ─── Profile Management ─────────────────────────────────────────
    {
        name: 'getUserProfile',
        description: 'Get the full travel profile for a user including all 11 scores, archetype, and passions.',
        parameters: {
            type: 'object',
            required: ['user_id'],
            properties: {
                user_id: { type: 'string', format: 'uuid' },
            },
        },
        returns: {
            type: 'object',
            properties: {
                archetype: { type: 'string', nullable: true },
                scores: { type: 'object', description: '11 score fields 0-100' },
                passions: { type: 'array', items: { type: 'string' } },
            },
        },
        examples: [
            { input: { user_id: '123e4567-e89b-12d3-a456-426614174000' }, description: 'Get profile for user' },
        ],
    },

    {
        name: 'updateUserProfileScores',
        description: 'Update user profile scores with delta values. Positive deltas increase, negative decrease. Clamps to 0-100.',
        parameters: {
            type: 'object',
            required: ['user_id', 'deltas'],
            properties: {
                user_id: { type: 'string', format: 'uuid' },
                deltas: {
                    type: 'object',
                    description: 'Key-value pairs of score names and delta values (e.g., {"budget_sensitivity": +5, "comfort_level": -3})',
                },
            },
        },
        returns: { type: 'object', properties: { updated_profile: { type: 'object' } } },
        examples: [
            { input: { user_id: '123', deltas: { budget_sensitivity: 5, comfort_level: -3 } }, description: 'User chose cheaper option twice → increase budget_sensitivity' },
        ],
    },

    // ─── Memory System ──────────────────────────────────────────────
    {
        name: 'storeMemoryFact',
        description: 'Store a stable fact about the user. Only store facts that have been confirmed 2+ times or explicitly stated. Returns error if session consent_memory=false.',
        parameters: {
            type: 'object',
            required: ['user_id', 'key', 'value'],
            properties: {
                user_id: { type: 'string', format: 'uuid' },
                key: { type: 'string', description: 'Fact key (e.g., "hates_night_bus", "preferred_airline")' },
                value: { type: 'string', description: 'Fact value (e.g., "true", "Royal Air Maroc")' },
                source: { type: 'string', enum: ['explicit', 'implicit'], default: 'implicit' },
            },
        },
        returns: { type: 'object', properties: { stored: { type: 'boolean' }, error: { type: 'string', nullable: true } } },
        examples: [
            { input: { user_id: '123', key: 'hates_night_bus', value: 'true', source: 'implicit' }, description: 'User refused night bus 3 times → store fact' },
        ],
    },

    {
        name: 'retrieveMemories',
        description: 'Retrieve relevant memories for a user query. Uses hybrid search (facts + embeddings). Returns error + logs memory_access_denied if session consent=false.',
        parameters: {
            type: 'object',
            required: ['user_id', 'query'],
            properties: {
                user_id: { type: 'string', format: 'uuid' },
                query: { type: 'string', description: 'Natural language query to search memories' },
                session_id: { type: 'string', description: 'Session ID to check consent_memory' },
            },
        },
        returns: {
            type: 'object',
            properties: {
                facts: { type: 'array' },
                similar_memories: { type: 'array' },
                error: { type: 'string', nullable: true },
            },
        },
        examples: [
            { input: { user_id: '123', query: 'transport preferences', session_id: 's1' }, description: 'Get relevant transport memories' },
        ],
    },

    // ─── Routines ───────────────────────────────────────────────────
    {
        name: 'getRoutines',
        description: 'Get detected routines for a user. Returns routines with confidence >= 0.5. Used for "Comme d\'habitude?" feature.',
        parameters: {
            type: 'object',
            required: ['user_id'],
            properties: {
                user_id: { type: 'string', format: 'uuid' },
            },
        },
        returns: {
            type: 'object',
            properties: {
                routines: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            confidence: { type: 'number', minimum: 0, maximum: 1 },
                            pattern: { type: 'object' },
                        },
                    },
                },
            },
        },
        examples: [
            { input: { user_id: '123' }, description: 'Get routines for mood picker' },
        ],
    },

    // ─── Travel Data Layer (Mock) ───────────────────────────────────
    {
        name: 'searchFlights',
        description: 'Search for flights between two cities. Returns mock estimations tagged with source:"mock_estimation". Never present these as real bookable prices.',
        parameters: {
            type: 'object',
            required: ['origin', 'destination', 'departure_date'],
            properties: {
                origin: { type: 'string', description: 'Origin city or airport code (e.g., "CMN", "Casablanca")' },
                destination: { type: 'string', description: 'Destination city or airport code' },
                departure_date: { type: 'string', format: 'date' },
                return_date: { type: 'string', format: 'date' },
                max_price: { type: 'number', description: 'Maximum price in currency' },
                currency: { type: 'string', default: 'MAD' },
            },
        },
        returns: { type: 'object', properties: { flights: { type: 'array' }, source: { type: 'string', const: 'mock_estimation' } } },
        examples: [
            { input: { origin: 'CMN', destination: 'MAD', departure_date: '2026-03-10' }, description: 'Search Casablanca → Madrid flights' },
        ],
    },

    {
        name: 'searchHotels',
        description: 'Search for hotels in a city. Returns mock estimations.',
        parameters: {
            type: 'object',
            required: ['city', 'check_in', 'check_out'],
            properties: {
                city: { type: 'string' },
                check_in: { type: 'string', format: 'date' },
                check_out: { type: 'string', format: 'date' },
                max_price_per_night: { type: 'number' },
                currency: { type: 'string', default: 'MAD' },
            },
        },
        returns: { type: 'object', properties: { hotels: { type: 'array' }, source: { type: 'string', const: 'mock_estimation' } } },
        examples: [
            { input: { city: 'Madrid', check_in: '2026-03-10', check_out: '2026-03-12' }, description: 'Search Madrid hotels' },
        ],
    },

    {
        name: 'searchGroundTransport',
        description: 'Search for trains, buses, or ferries between two cities. Returns mock estimations.',
        parameters: {
            type: 'object',
            required: ['origin', 'destination', 'date'],
            properties: {
                origin: { type: 'string' },
                destination: { type: 'string' },
                date: { type: 'string', format: 'date' },
                types: { type: 'array', items: { type: 'string', enum: ['train', 'bus', 'ferry'] }, default: ['train', 'bus', 'ferry'] },
            },
        },
        returns: { type: 'object', properties: { options: { type: 'array' }, source: { type: 'string', const: 'mock_estimation' } } },
        examples: [
            { input: { origin: 'Casablanca', destination: 'Tanger', date: '2026-03-10', types: ['train'] }, description: 'Search train Casa → Tanger' },
        ],
    },

    {
        name: 'estimateLocalCommute',
        description: 'Estimate commute time from a location to a transport hub (airport/station). Includes buffers for check-in, security, and transfers.',
        parameters: {
            type: 'object',
            required: ['origin', 'hub'],
            properties: {
                origin: { type: 'string', description: 'Starting location (e.g., "Maarif, Casablanca")' },
                hub: { type: 'string', description: 'Transport hub (e.g., "CMN Airport", "Casa Voyageurs Station")' },
                departure_time: { type: 'string', description: 'Planned departure time for traffic estimation' },
            },
        },
        returns: {
            type: 'object',
            properties: {
                duration_minutes: { type: 'number' },
                buffer_minutes: { type: 'number', description: 'Includes check-in, security, transfer time' },
                recommended_departure: { type: 'string' },
                transport_options: { type: 'array' },
                source: { type: 'string', const: 'mock_estimation' },
            },
        },
        examples: [
            { input: { origin: 'Bureau Maarif', hub: 'CMN Airport', departure_time: '17:00' }, description: 'Commute from office to airport on Friday evening' },
        ],
    },

    {
        name: 'checkVisaRequirements',
        description: 'Check visa requirements for a nationality + destination. If nationality unknown, return check_required and suggest asking user or proposing no-visa alternative.',
        parameters: {
            type: 'object',
            required: ['destination'],
            properties: {
                nationality: { type: 'string', description: 'Nationality/passport country. If unknown, leave empty.' },
                destination: { type: 'string', description: 'Destination country' },
            },
        },
        returns: {
            type: 'object',
            properties: {
                visa_risk: { type: 'string', enum: ['none', 'check_required', 'visa_needed'] },
                details: { type: 'string' },
                alternative_destinations: { type: 'array', description: 'No-visa alternatives if visa_needed' },
                source: { type: 'string', const: 'mock_estimation' },
            },
        },
        examples: [
            { input: { nationality: 'MA', destination: 'Spain' }, description: 'Check Morocco → Spain visa' },
            { input: { destination: 'Netherlands' }, description: 'Unknown nationality → suggest clarification' },
        ],
    },

    // ─── Solver ─────────────────────────────────────────────────────
    {
        name: 'generatePlans',
        description: 'Generate 3 optimized travel plans (A/B/C) with different compromises. Always runs feasibility check first (ok/tight/impossible). If impossible, generates best-effort + recommendation.',
        parameters: {
            type: 'object',
            required: ['user_id', 'constraints'],
            properties: {
                user_id: { type: 'string', format: 'uuid' },
                constraints: {
                    type: 'object',
                    properties: {
                        origin: { type: 'string' },
                        destinations: { type: 'array', items: { type: 'string' } },
                        departure_earliest: { type: 'string' },
                        return_latest: { type: 'string' },
                        budget_max: { type: 'number' },
                        budget_currency: { type: 'string' },
                        work_end_time: { type: 'string', description: 'e.g., "16:30" — triggers commute buffer calculation' },
                        work_start_time: { type: 'string', description: 'e.g., "08:00" — for return constraint' },
                        nationality: { type: 'string' },
                    },
                },
                mood: { type: 'string', enum: ['chill', 'budget_hacker', 'yolo', 'explorer', 'efficient'] },
                session_id: { type: 'string' },
            },
        },
        returns: {
            type: 'object',
            properties: {
                feasibility: { type: 'string', enum: ['ok', 'tight', 'impossible'] },
                plans: { type: 'array', items: { type: 'object' }, maxItems: 3 },
                recommendation: { type: 'string', nullable: true, description: 'If tight/impossible: suggest taking leave, changing destination, etc.' },
            },
        },
        examples: [
            {
                input: {
                    user_id: '123',
                    constraints: { origin: 'Casablanca', destinations: ['Madrid', 'Amsterdam'], departure_earliest: '2026-03-10T16:30', return_latest: '2026-03-13T08:00', budget_max: 5000, budget_currency: 'MAD', work_end_time: '16:30', work_start_time: '08:00' },
                    mood: 'efficient',
                },
                description: 'Friday 16:30 → Monday 8:00, Madrid or Amsterdam, 5000 MAD budget',
            },
        ],
    },

    // ─── Events & Feedback ──────────────────────────────────────────
    {
        name: 'logEvent',
        description: 'Log a tracking event for the learning engine. Events drive profile updates, routine detection, and preference learning.',
        parameters: {
            type: 'object',
            required: ['user_id', 'session_id', 'event_type'],
            properties: {
                user_id: { type: 'string', format: 'uuid' },
                session_id: { type: 'string', format: 'uuid' },
                event_type: { type: 'string', enum: ['plan_viewed', 'plan_selected', 'plan_modified', 'plan_saved', 'chat_abandoned', 'feedback_given', 'routine_detected', 'mood_override_used', 'memory_access_denied'] },
                payload: { type: 'object', description: 'Event-specific data' },
            },
        },
        returns: { type: 'object', properties: { logged: { type: 'boolean' } } },
        examples: [
            { input: { user_id: '123', session_id: 's1', event_type: 'plan_selected', payload: { plan_id: 'p1', label: 'A' } }, description: 'User selected Plan A' },
        ],
    },

    {
        name: 'submitFeedback',
        description: 'Submit user feedback on a plan. Used by the learning engine to update preferences.',
        parameters: {
            type: 'object',
            required: ['user_id', 'plan_id', 'rating'],
            properties: {
                user_id: { type: 'string', format: 'uuid' },
                plan_id: { type: 'string', format: 'uuid' },
                rating: { type: 'string', enum: ['up', 'down'] },
                comment: { type: 'string', nullable: true },
            },
        },
        returns: { type: 'object', properties: { submitted: { type: 'boolean' } } },
        examples: [
            { input: { user_id: '123', plan_id: 'p1', rating: 'up', comment: 'Parfait !' }, description: 'Positive feedback on plan' },
        ],
    },
];
