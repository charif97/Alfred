// ALFRED Constraint Solver — Module 4
// Deterministic scoring with feasibility check + commute buffers

import { MOOD_WEIGHTS, TRAVEL_BUFFERS } from '../../lib/constants';
import type { Plan, PlanLabel, Feasibility, VisaRisk, Mood, TravelProfile, MoodWeights, CalculationStep } from '../../lib/types';

// ─── Types ───────────────────────────────────────────────────────
interface SolverInput {
    user_id: string;
    profile: TravelProfile;
    mood: Mood;
    constraints: {
        origin: string;
        destinations: string[];
        departure_earliest: string; // ISO datetime
        return_latest: string;
        budget_max: number;
        budget_currency: string;
        work_end_time?: string;    // "16:30"
        work_start_time?: string;  // "08:00"
        nationality?: string;
    };
}

interface SolverOutput {
    feasibility: Feasibility;
    plans: Plan[];
    recommendation: string | null;
}

// ─── Feasibility Check ──────────────────────────────────────────
function checkFeasibility(constraints: SolverInput['constraints']): { feasibility: Feasibility; recommendation: string | null } {
    const departure = new Date(constraints.departure_earliest);
    const returnBy = new Date(constraints.return_latest);
    const totalHours = (returnBy.getTime() - departure.getTime()) / (1000 * 60 * 60);

    // Account for commute buffers
    const departureBuffer = constraints.work_end_time
        ? (TRAVEL_BUFFERS.flight_check_in + TRAVEL_BUFFERS.security_buffer + 60) / 60 // ~2.5h
        : 0;
    const returnBuffer = constraints.work_start_time
        ? (TRAVEL_BUFFERS.flight_check_in + TRAVEL_BUFFERS.security_buffer + 60) / 60
        : 0;

    const effectiveHours = totalHours - departureBuffer - returnBuffer;

    if (effectiveHours < 12) {
        return {
            feasibility: 'impossible',
            recommendation: 'Le créneau est trop serré. Envisage de poser le lundi en congé (+24h) ou de choisir une destination plus proche.',
        };
    }

    if (effectiveHours < 36) {
        return {
            feasibility: 'tight',
            recommendation: 'Ça passe mais c\'est serré. Si tu poses le lundi, le retour est 85% plus confortable.',
        };
    }

    return { feasibility: 'ok', recommendation: null };
}

// ─── Calendar Optimization ──────────────────────────────────────
export interface DateVariation {
    label: string;
    estimated_price: number;
    travel_time_hours: number;
    time_on_ground_hours: number;
    fatigue_score: number;       // 0-100
    score?: number;              // Calculated
}

export function generateDateVariations(
    baseDates: { departure: string; return: string },
    basePrice: number,
    baseTravelTime: number
): { best_dates: string; savings_if_flexible: number; all_variations: DateVariation[] } {

    // Simulate the 4 variations with realistic tradeoffs
    // (In a real app, this would query Flight/Data APIs for actual shifts)

    const variations: DateVariation[] = [
        {
            label: 'Fri evening → Sun evening',
            estimated_price: basePrice,
            travel_time_hours: baseTravelTime,
            time_on_ground_hours: 48 - (baseTravelTime * 2),
            fatigue_score: 60
        },
        {
            label: 'Sat morning → Mon morning',
            estimated_price: basePrice * 0.85, // Usually cheaper
            travel_time_hours: baseTravelTime,
            time_on_ground_hours: 48 - (baseTravelTime * 2),
            fatigue_score: 50
        },
        {
            label: 'Thu evening → Sun evening',
            estimated_price: basePrice * 1.10, // Extra night = more expensive total
            travel_time_hours: baseTravelTime,
            time_on_ground_hours: 72 - (baseTravelTime * 2),
            fatigue_score: 40 // Less rushed
        },
        {
            label: 'Fri evening → Mon morning',
            estimated_price: basePrice * 0.90,
            travel_time_hours: baseTravelTime,
            time_on_ground_hours: 60 - (baseTravelTime * 2),
            fatigue_score: 65 // Monday morning rush
        }
    ];

    // Score each variation
    variations.forEach(v => {
        // Scoring system: lower price = better, higher ground time = better, lower travel time = better, lower fatigue = better
        const price_weight = (basePrice / v.estimated_price) * 40;
        const time_on_ground_weight = (v.time_on_ground_hours / 72) * 30; // Max ~72h
        const travel_time_penalty = (v.travel_time_hours / 10) * 15; // Max 15 points penalty
        const fatigue_penalty = (v.fatigue_score / 100) * 15; // Max 15 points penalty

        v.score = price_weight + time_on_ground_weight - travel_time_penalty - fatigue_penalty;
    });

    // Sort descending by score
    variations.sort((a, b) => (b.score || 0) - (a.score || 0));

    const bestVariation = variations[0];

    // Calculate savings if flexible (comparing base requested 'Fri-Sun' vs optimal found)
    const baseVariation = variations.find(v => v.label === 'Fri evening → Sun evening')!;
    const savings = Math.max(0, baseVariation.estimated_price - bestVariation.estimated_price);

    return {
        best_dates: bestVariation.label,
        savings_if_flexible: savings,
        all_variations: variations
    };
}

// ─── Visa Risk Assessment ────────────────────────────────────────
function assessVisaRisk(nationality: string | undefined, destination: string): VisaRisk {
    if (!nationality) return 'check_required';

    // Mock visa logic for common routes
    const noVisaRoutes: Record<string, string[]> = {
        'MA': ['Turkey', 'Tunisia', 'Senegal', 'Malaysia', 'Indonesia'],
        'FR': ['Spain', 'Netherlands', 'Italy', 'Germany', 'Portugal', 'Turkey'],
    };

    const schengenCountries = ['Spain', 'Netherlands', 'France', 'Italy', 'Germany', 'Portugal', 'Belgium', 'Austria'];
    const isSchengen = schengenCountries.some(c => destination.toLowerCase().includes(c.toLowerCase()));

    if (nationality === 'MA' && isSchengen) return 'visa_needed';
    if (noVisaRoutes[nationality]?.some(c => destination.toLowerCase().includes(c.toLowerCase()))) return 'none';

    return 'check_required';
}

// ─── Score a Plan ────────────────────────────────────────────────
function scorePlan(
    plan: Partial<Plan>,
    profile: TravelProfile,
    moodWeights: MoodWeights,
    budget_max: number,
): number {
    const cost = plan.total_cost || 0;
    const fatigue = plan.fatigue_estimate || 50;

    // Component scores (0-1)
    const priceScore = Math.max(0, 1 - (cost / budget_max));
    const comfortScore = 1 - (fatigue / 100);
    const timeScore = plan.feasibility === 'ok' ? 1 : plan.feasibility === 'tight' ? 0.5 : 0.2;
    const adventureScore = plan.risk_level !== undefined ? Math.min(plan.risk_level / 50, 1) : 0.5;
    const cultureScore = 0.7; // placeholder

    // Weighted score using mood weights
    const raw = (
        priceScore * moodWeights.price +
        comfortScore * moodWeights.comfort +
        timeScore * moodWeights.time +
        adventureScore * moodWeights.adventure +
        cultureScore * moodWeights.culture
    );

    // Profile adjustment (subtle, ±10%)
    const profileBonus = (
        (profile.budget_sensitivity / 100) * priceScore * 0.1 +
        (profile.comfort_level / 100) * comfortScore * 0.1
    );

    return Math.round(Math.min(100, (raw + profileBonus) * 100));
}

// ─── Generate Plans ──────────────────────────────────────────────
export function generatePlans(input: SolverInput): SolverOutput {
    const { profile, mood, constraints } = input;
    const moodWeights = MOOD_WEIGHTS[mood];

    // Step 1: Feasibility check
    const { feasibility, recommendation } = checkFeasibility(constraints);

    // Step 2: Generate 3 plans with different strategies
    const plans: Plan[] = [];
    const destinations = constraints.destinations;
    const mainDest = destinations[0] || 'Madrid';

    // Plan A: Optimal (balance of all factors)
    const datesA = generateDateVariations({ departure: constraints.departure_earliest, return: constraints.return_latest }, 3200, 2.5);
    const planA: Plan = {
        id: `plan_a_${Date.now()}`,
        trip_id: '',
        label: 'A',
        title: `Vol direct ${mainDest}`,
        summary: `Le plus rapide. Vol vendredi soir, retour dimanche soir.`,
        score: 0,
        feasibility,
        visa_risk: assessVisaRisk(constraints.nationality, mainDest),
        fatigue_estimate: 25,
        risk_level: 15,
        total_cost: 3200,
        currency: constraints.budget_currency || 'MAD',
        justification: `Optimal temps/fatigue. Tu arrives à 21h vendredi, profites du samedi entier.`,
        recommendation: feasibility !== 'ok' ? recommendation : null,
        legs: [
            { type: 'flight', from: constraints.origin, to: mainDest, departure: '20:00', arrival: '22:30', cost: 1400, currency: 'MAD', source: 'mock_estimation', buffer_minutes: TRAVEL_BUFFERS.flight_check_in + TRAVEL_BUFFERS.security_buffer },
            { type: 'flight', from: mainDest, to: constraints.origin, departure: '19:00', arrival: '21:30', cost: 1400, currency: 'MAD', source: 'mock_estimation', buffer_minutes: TRAVEL_BUFFERS.flight_check_in + TRAVEL_BUFFERS.security_buffer },
        ],
        accommodation: [
            { name: 'Hotel Centro', type: 'hotel', cost_per_night: 600, nights: 2, total_cost: 1200, currency: 'MAD', source: 'mock_estimation' },
        ],
        calculation_steps: [
            { item: 'Vol aller', cost: 1400, currency: 'MAD', strikethrough: false },
            { item: 'Vol retour', cost: 1400, currency: 'MAD', strikethrough: false },
            { item: 'Hôtel (2 nuits)', cost: 1200, currency: 'MAD', strikethrough: false },
            { item: 'Budget activités', cost: 600, currency: 'MAD', strikethrough: false },
        ],
        destination: mainDest,
        duration_days: 3,
        transport_mode: 'Flight',
        transport_time_hours: 2.5,
        total_price_est: 3200 - datesA.savings_if_flexible,
        best_dates: datesA.best_dates,
        savings_if_flexible: datesA.savings_if_flexible,
        time_on_ground_hours: datesA.all_variations.find(v => v.label === datesA.best_dates)?.time_on_ground_hours || 43,
        fatigue_level: 'low',
        itinerary_teaser: ['City center walk', 'Sunset viewpoints', 'Day trip'],
        explanation: datesA.savings_if_flexible > 0 ? `Choosing ${datesA.best_dates} saves ${Math.round(datesA.savings_if_flexible)} MAD and gives you more flexibility.` : `Standard dates are optimally priced.`,
    };

    // Plan B: Budget (minimize cost)
    const datesB = generateDateVariations({ departure: constraints.departure_earliest, return: constraints.return_latest }, 1800, 6);
    const planB: Plan = {
        id: `plan_b_${Date.now()}`,
        trip_id: '',
        label: 'B',
        title: `Train + Ferry via Tanger`,
        summary: `Sans avion. Plus long mais aventurier et économique.`,
        score: 0,
        feasibility: feasibility === 'ok' ? 'tight' : feasibility,
        visa_risk: 'none',
        fatigue_estimate: 55,
        risk_level: 30,
        total_cost: 1800,
        currency: constraints.budget_currency || 'MAD',
        justification: `Budget friendly. Train de nuit + ferry le matin. Tu économises 1400 MAD.`,
        recommendation: 'Si tu poses le lundi, le retour est beaucoup plus tranquille.',
        legs: [
            { type: 'train', from: constraints.origin, to: 'Tanger', departure: '18:00', arrival: '22:00', cost: 200, currency: 'MAD', source: 'mock_estimation', buffer_minutes: TRAVEL_BUFFERS.train_check_in },
            { type: 'ferry', from: 'Tanger', to: 'Tarifa', departure: '08:00', arrival: '09:00', cost: 350, currency: 'MAD', source: 'mock_estimation', buffer_minutes: TRAVEL_BUFFERS.ferry_check_in },
        ],
        accommodation: [
            { name: 'Hostel Budget', type: 'hostel', cost_per_night: 250, nights: 2, total_cost: 500, currency: 'MAD', source: 'mock_estimation' },
        ],
        calculation_steps: [
            { item: 'Train Casa→Tanger', cost: 200, currency: 'MAD', strikethrough: false },
            { item: 'Ferry Tanger→Tarifa', cost: 350, currency: 'MAD', strikethrough: false },
            { item: 'Hostel (2 nuits)', cost: 500, currency: 'MAD', strikethrough: false },
            { item: 'Vol low-cost initial', cost: 1200, currency: 'MAD', strikethrough: true, replacement: 'Train+Ferry', replacement_cost: 550 },
            { item: 'Budget activités', cost: 400, currency: 'MAD', strikethrough: false },
        ],
        destination: 'Tarifa',
        duration_days: 3,
        transport_mode: 'Train / Ferry',
        transport_time_hours: 6,
        total_price_est: 1800 - datesB.savings_if_flexible,
        best_dates: datesB.best_dates,
        savings_if_flexible: datesB.savings_if_flexible,
        time_on_ground_hours: datesB.all_variations.find(v => v.label === datesB.best_dates)?.time_on_ground_hours || 36,
        fatigue_level: 'medium',
        itinerary_teaser: ['Ferry crossing', 'Medina walk', 'Budget tapas'],
        explanation: datesB.savings_if_flexible > 0 ? `Traveling on ${datesB.best_dates} gives optimal balance of slow travel.` : `Slow travel focus.`,
    };

    // Plan C: YOLO (best experience, higher cost)
    const altDest = destinations.length > 1 ? destinations[1] : 'Amsterdam';
    const datesC = generateDateVariations({ departure: constraints.departure_earliest, return: constraints.return_latest }, 5500, 4);
    const planC: Plan = {
        id: `plan_c_${Date.now()}`,
        trip_id: '',
        label: 'C',
        title: `Weekend ${altDest} (YOLO)`,
        summary: `Plus cher mais une vraie aventure. ${altDest === 'Amsterdam' ? 'Attention au timing serré.' : ''}`,
        score: 0,
        feasibility: altDest === 'Amsterdam' ? 'tight' : feasibility,
        visa_risk: assessVisaRisk(constraints.nationality, altDest),
        fatigue_estimate: 70,
        risk_level: 50,
        total_cost: 5500,
        currency: constraints.budget_currency || 'MAD',
        justification: altDest === 'Amsterdam'
            ? 'Franchement la Hollande ça va être compliqué sur un weekend. Tu vas passer ton temps dans les transports. L\'Espagne est beaucoup plus logique.'
            : `${altDest} est faisable mais prévois un bon budget.`,
        recommendation: 'Prends le lundi si tu peux — ça change tout.',
        legs: [],
        accommodation: [],
        calculation_steps: [
            { item: `Vol aller ${altDest}`, cost: 2500, currency: 'MAD', strikethrough: false },
            { item: `Vol retour ${altDest}`, cost: 2500, currency: 'MAD', strikethrough: true, replacement: 'Low-cost retour', replacement_cost: 1800 },
            { item: 'Hôtel 3*', cost: 1500, currency: 'MAD', strikethrough: false },
            { item: 'Budget activités', cost: 700, currency: 'MAD', strikethrough: false },
        ],
        destination: altDest,
        duration_days: 3,
        transport_mode: 'Flight',
        transport_time_hours: 4,
        total_price_est: 5500 - datesC.savings_if_flexible,
        best_dates: datesC.best_dates,
        savings_if_flexible: datesC.savings_if_flexible,
        time_on_ground_hours: datesC.all_variations.find(v => v.label === datesC.best_dates)?.time_on_ground_hours || 40,
        fatigue_level: 'high',
        itinerary_teaser: ['Canal cruise', 'Museums', 'Nightlife VIP'],
        explanation: datesC.savings_if_flexible > 0 ? `Returning ${datesC.best_dates.split('→ ')[1]} saves ${Math.round(datesC.savings_if_flexible)} MAD. YOLO.` : `Treat yourself.`,
    };

    // Step 3: Score all plans
    planA.score = scorePlan(planA, profile, moodWeights, constraints.budget_max || 5000);
    planB.score = scorePlan(planB, profile, moodWeights, constraints.budget_max || 5000);
    planC.score = scorePlan(planC, profile, moodWeights, constraints.budget_max || 5000);

    // Sort by score descending
    plans.push(planA, planB, planC);
    plans.sort((a, b) => b.score - a.score);

    return {
        feasibility,
        plans,
        recommendation,
    };
}
