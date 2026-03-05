import { Archetype, Mood, MoodWeights, MOOD_WEIGHTS } from './types';

// ─── Archetypes ──────────────────────────────────────────────────
export const ARCHETYPES: { id: Archetype; label: string; emoji: string; description: string }[] = [
    { id: 'chill_explorer', label: 'Chill Explorer', emoji: '🌴', description: 'Tu voyages pour te poser et découvrir à ton rythme' },
    { id: 'aventurier', label: 'Aventurier', emoji: '🧗', description: 'Tu cherches les sensations et les endroits insolites' },
    { id: 'city_sprinter', label: 'City Sprinter', emoji: '🏙️', description: 'Weekend en ville, max de trucs en peu de temps' },
    { id: 'budget_hacker', label: 'Budget Hacker', emoji: '💰', description: 'Tu optimises chaque dirham / euro' },
    { id: 'bon_vivant', label: 'Bon Vivant', emoji: '🍷', description: 'Bonne bouffe, bons endroits, le confort avant tout' },
    { id: 'minimaliste', label: 'Minimaliste', emoji: '🎒', description: 'Sac à dos, pas de plan, on verra sur place' },
    { id: 'yolo', label: 'YOLO', emoji: '🚀', description: 'Budget ? Quel budget ? On part !' },
];

// ─── Moods ───────────────────────────────────────────────────────
export const MOODS: { id: Mood; label: string; emoji: string; description: string }[] = [
    { id: 'chill', label: 'Chill', emoji: '😌', description: 'Tranquille, pas pressé' },
    { id: 'budget_hacker', label: 'Budget', emoji: '💸', description: 'On optimise le budget' },
    { id: 'yolo', label: 'YOLO', emoji: '🔥', description: 'On se fait plaisir !' },
    { id: 'explorer', label: 'Explorer', emoji: '🧭', description: 'Découvrir de nouveaux endroits' },
    { id: 'efficient', label: 'Efficace', emoji: '⚡', description: 'Max de trucs, minimum de temps' },
];

// ─── Micro Questions ─────────────────────────────────────────────
export const MICRO_QUESTIONS = [
    { id: 'comfort_adventure', question: 'Confort ou aventure ?', optionA: 'Confort', optionB: 'Aventure' },
    { id: 'budget_time', question: 'Économiser ou gagner du temps ?', optionA: 'Économiser', optionB: 'Temps' },
    { id: 'city_nature', question: 'Ville ou nature ?', optionA: 'Ville', optionB: 'Nature' },
    { id: 'surprise_ok', question: 'Imprévus, ça te va ?', optionA: 'Non merci', optionB: 'Carrément' },
    { id: 'long_transport', question: 'Trajet long, ça passe ?', optionA: 'Non', optionB: 'Oui' },
];

// ─── Default Profile Scores ─────────────────────────────────────
export const DEFAULT_PROFILE_SCORES = {
    budget_sensitivity: 50,
    fatigue_tolerance: 50,
    nature_vs_city: 50,
    transport_tolerance: 50,
    comfort_level: 50,
    spontaneity: 50,
    weather_preference: 50,
    time_sensitivity: 50,
    culture_priority: 50,
    food_priority: 50,
    nightlife_priority: 50,
};

// ─── Archetype → Default Scores mapping ─────────────────────────
export const ARCHETYPE_PROFILES: Record<Archetype, typeof DEFAULT_PROFILE_SCORES> = {
    chill_explorer: { budget_sensitivity: 40, fatigue_tolerance: 30, nature_vs_city: 40, transport_tolerance: 40, comfort_level: 70, spontaneity: 60, weather_preference: 70, time_sensitivity: 20, culture_priority: 70, food_priority: 60, nightlife_priority: 30 },
    aventurier: { budget_sensitivity: 50, fatigue_tolerance: 80, nature_vs_city: 30, transport_tolerance: 80, comfort_level: 30, spontaneity: 90, weather_preference: 30, time_sensitivity: 30, culture_priority: 60, food_priority: 40, nightlife_priority: 40 },
    city_sprinter: { budget_sensitivity: 40, fatigue_tolerance: 70, nature_vs_city: 90, transport_tolerance: 60, comfort_level: 60, spontaneity: 50, weather_preference: 50, time_sensitivity: 80, culture_priority: 70, food_priority: 60, nightlife_priority: 70 },
    budget_hacker: { budget_sensitivity: 95, fatigue_tolerance: 70, nature_vs_city: 50, transport_tolerance: 80, comfort_level: 30, spontaneity: 60, weather_preference: 40, time_sensitivity: 40, culture_priority: 50, food_priority: 40, nightlife_priority: 30 },
    bon_vivant: { budget_sensitivity: 20, fatigue_tolerance: 30, nature_vs_city: 70, transport_tolerance: 30, comfort_level: 95, spontaneity: 40, weather_preference: 80, time_sensitivity: 40, culture_priority: 80, food_priority: 95, nightlife_priority: 70 },
    minimaliste: { budget_sensitivity: 60, fatigue_tolerance: 80, nature_vs_city: 40, transport_tolerance: 90, comfort_level: 20, spontaneity: 95, weather_preference: 30, time_sensitivity: 20, culture_priority: 50, food_priority: 30, nightlife_priority: 20 },
    yolo: { budget_sensitivity: 10, fatigue_tolerance: 70, nature_vs_city: 50, transport_tolerance: 70, comfort_level: 60, spontaneity: 95, weather_preference: 50, time_sensitivity: 30, culture_priority: 60, food_priority: 70, nightlife_priority: 80 },
};

// ─── Colors ──────────────────────────────────────────────────────
export const COLORS = {
    primary: '#6C63FF',
    primaryDark: '#5A52D5',
    secondary: '#FF6B6B',
    accent: '#4ECDC4',
    background: '#0D0D1A',
    surface: '#1A1A2E',
    surfaceLight: '#25254A',
    text: '#FFFFFF',
    textSecondary: '#A0A0C0',
    textMuted: '#6B6B8D',
    success: '#4CAF50',
    warning: '#FFB74D',
    error: '#EF5350',
    border: '#2A2A4A',
};

// ─── Buffers (Module 4 commute) ─────────────────────────────────
export const TRAVEL_BUFFERS = {
    flight_check_in: 90,          // minutes
    train_check_in: 15,
    bus_check_in: 10,
    ferry_check_in: 30,
    security_buffer: 30,
    transfer_buffer: 20,
    fatigue_recovery: 15,
};

export { MOOD_WEIGHTS };
