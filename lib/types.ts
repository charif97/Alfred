// Types shared across the ALFRED application
// Following agent-tool-builder: strict types for all data contracts

// ─── User & Profile ─────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  onboarded: boolean;

  // -- Stats --
  cities_visited?: number;
  countries_visited?: number;
  trips_count?: number;
  cheapest_trip?: number;
  longest_trip_days?: number;
}

export interface TravelProfile {
  user_id: string;
  archetype: Archetype | null;
  budget_sensitivity: number;    // 0-100
  fatigue_tolerance: number;     // 0-100
  nature_vs_city: number;        // 0=nature, 100=city
  transport_tolerance: number;   // 0-100
  comfort_level: number;         // 0-100
  spontaneity: number;           // 0-100
  weather_preference: number;    // 0=cold ok, 100=warm only
  time_sensitivity: number;      // 0=flexible, 100=every minute counts
  culture_priority: number;      // 0-100
  food_priority: number;         // 0-100
  nightlife_priority: number;    // 0-100
  passions: string[];            // separate from scores
  updated_at: string;
}

export type Archetype =
  | 'chill_explorer'
  | 'aventurier'
  | 'city_sprinter'
  | 'budget_hacker'
  | 'bon_vivant'
  | 'minimaliste'
  | 'yolo';

// ─── Mood ────────────────────────────────────────────────────────
export type Mood = 'chill' | 'budget_hacker' | 'yolo' | 'explorer' | 'efficient';

export interface MoodWeights {
  price: number;
  comfort: number;
  time: number;
  adventure: number;
  culture: number;
}

export const MOOD_WEIGHTS: Record<Mood, MoodWeights> = {
  chill: { price: 0.2, comfort: 0.4, time: 0.1, adventure: 0.1, culture: 0.2 },
  budget_hacker: { price: 0.5, comfort: 0.1, time: 0.1, adventure: 0.1, culture: 0.2 },
  yolo: { price: 0.05, comfort: 0.2, time: 0.05, adventure: 0.5, culture: 0.2 },
  explorer: { price: 0.15, comfort: 0.15, time: 0.1, adventure: 0.3, culture: 0.3 },
  efficient: { price: 0.2, comfort: 0.2, time: 0.4, adventure: 0.1, culture: 0.1 },
};

// ─── Session ─────────────────────────────────────────────────────
export interface Session {
  id: string;
  user_id: string;
  mood: Mood;
  consent_memory: boolean;
  started_at: string;
}

// ─── Plans ───────────────────────────────────────────────────────
export type Feasibility = 'ok' | 'tight' | 'impossible';
export type VisaRisk = 'none' | 'check_required' | 'visa_needed';
export type PlanLabel = 'A' | 'B' | 'C';

export interface Plan {
  id: string;
  trip_id: string;
  label: PlanLabel;
  title: string;
  summary: string;
  score: number;                 // 0-100 overall score
  feasibility: Feasibility;
  visa_risk: VisaRisk;
  fatigue_estimate: number;      // 0-100
  risk_level: number;            // 0-100
  total_cost: number;
  currency: string;
  justification: string;
  recommendation: string | null; // if impossible, suggest "take leave" etc.
  legs: PlanLeg[];
  accommodation: PlanAccommodation[];
  calculation_steps: CalculationStep[];

  // --- Optimized Trip Data (Calendar Engine) ---
  destination: string;
  duration_days: number;
  transport_mode: string;
  transport_time_hours: number;
  total_price_est: number;
  best_dates: string;
  savings_if_flexible: number;
  time_on_ground_hours: number;
  fatigue_level: 'low' | 'medium' | 'high';
  itinerary_teaser: string[];
  explanation: string;
  why_bullets: string[];
  tradeoff: string;
  savings_tip: string | null;
  alfred_narration?: string;
}

export interface PlanLeg {
  type: 'flight' | 'train' | 'bus' | 'ferry' | 'taxi' | 'walk';
  from: string;
  to: string;
  departure: string;
  arrival: string;
  cost: number;
  currency: string;
  source: string;               // "mock_estimation" during mock phase
  buffer_minutes: number;       // check-in, security, transfer buffer
}

export interface PlanAccommodation {
  name: string;
  type: 'hotel' | 'hostel' | 'airbnb' | 'riad';
  cost_per_night: number;
  nights: number;
  total_cost: number;
  currency: string;
  source: string;
}

export interface CalculationStep {
  item: string;
  cost: number;
  currency: string;
  strikethrough: boolean;        // for the animated "rature"
  replacement?: string;
  replacement_cost?: number;
}

// ─── Hybrid Pricing ──────────────────────────────────────────────
export type PriceSource = 'estimate' | 'live';

export interface LivePriceCheckInput {
  origin: string;
  destination: string;
  dates: string;         // e.g. "2026-03-14_2026-03-17"
  passengers: number;
}

export interface LivePriceCheckOutput {
  live_price: number;
  currency: string;
  checked_at: string;
  price_source: PriceSource;
  cached: boolean;
}

// ─── Catalog Trip ────────────────────────────────────────────────
export interface CatalogTrip {
  id: string;
  origin: string;
  destination: string;
  duration_days: number;
  transport_mode: string;
  travel_time_est: number;
  total_price_min: number;
  total_price_max: number;
  price_source: PriceSource;
  score: number;
  why_bullets: string[];
  tradeoff: string;
  savings_tip: string | null;
  timeframe_tags: string[];
}

// ─── Social Trip Layer ───────────────────────────────────────────
export interface TripPost {
  post_id: string;
  user_id: string;
  username: string; // Inferred from relation
  trip_json: Partial<Plan>;
  caption: string;
  likes_count: number;
  remix_count: number;
  remixed_from_post_id: string | null;
  remixed_from_username?: string; // Appended if inherited
  created_at: string;
  liked_by_me?: boolean;
}

// ─── Routines ────────────────────────────────────────────────────
export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string;
  pattern: Record<string, any>;
  confidence: number;            // 0-1
  occurrences: number;
  created_at: string;
}

// ─── Memory ──────────────────────────────────────────────────────
export interface MemoryFact {
  id: string;
  user_id: string;
  key: string;
  value: string;
  stability: number;            // 0-1, how often confirmed
  source: 'explicit' | 'implicit';
  created_at: string;
}

// ─── Events & Feedback ──────────────────────────────────────────
export type EventType =
  | 'plan_viewed'
  | 'plan_selected'
  | 'plan_modified'
  | 'plan_saved'
  | 'chat_abandoned'
  | 'feedback_given'
  | 'routine_detected'
  | 'mood_override_used'
  | 'memory_access_denied';

export interface TrackingEvent {
  id: string;
  user_id: string;
  session_id: string;
  event_type: EventType;
  payload: Record<string, any>;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  plan_id: string;
  rating: 'up' | 'down';
  comment: string | null;
  created_at: string;
}

// ─── Chat ────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

// ─── SSE Streaming ───────────────────────────────────────────────
export interface SSETextEvent {
  type: 'text';
  content: string;
}

export interface SSEPlanEvent {
  type: 'plans';
  plans: Plan[];
}

export interface SSEDoneEvent {
  type: 'done';
  session_id: string;
}

export type SSEEvent = SSETextEvent | SSEPlanEvent | SSEDoneEvent;

// ─── Tool Inputs ─────────────────────────────────────────────────
export interface StartSessionInput {
  user_id: string;
  consent_memory: boolean;
  mood?: Mood;
}

export interface SearchFlightsInput {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  max_price?: number;
  currency?: string;
}

export interface EstimateLocalCommuteInput {
  origin: string;
  hub: string;              // airport/station
  departure_time: string;   // to calculate traffic
}

export interface EstimateLocalCommuteOutput {
  duration_minutes: number;
  buffer_minutes: number;    // check-in, security, transfers
  recommended_departure: string;
  transport_options: {
    type: string;
    duration: number;
    cost: number;
  }[];
  source: string;
}
