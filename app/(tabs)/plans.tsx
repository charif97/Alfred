import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../lib/constants';
import type { Plan, PlanLabel } from '../../lib/types';

// Mock plans for demo
const MOCK_PLANS: Plan[] = [
    {
        id: '1', trip_id: 't1', label: 'A', title: 'Vol direct Madrid',
        summary: 'Le plus rapide. Vol vendredi soir, retour dimanche soir.',
        score: 82, feasibility: 'ok', visa_risk: 'none',
        fatigue_estimate: 25, risk_level: 15, total_cost: 3200, currency: 'MAD',
        justification: 'Optimal temps/fatigue. Tu arrives à 21h vendredi, profites du samedi entier.',
        recommendation: null, legs: [], accommodation: [], calculation_steps: [],
    },
    {
        id: '2', trip_id: 't1', label: 'B', title: 'Train + Ferry Tanger→Tarifa',
        summary: 'Sans avion. Plus long mais moins cher et plus aventurier.',
        score: 68, feasibility: 'tight', visa_risk: 'none',
        fatigue_estimate: 55, risk_level: 30, total_cost: 1800, currency: 'MAD',
        justification: 'Budget friendly. Train de nuit + ferry le matin. Attention retour serré.',
        recommendation: 'Si tu poses le lundi, le retour est beaucoup plus tranquille.',
        legs: [], accommodation: [], calculation_steps: [],
    },
    {
        id: '3', trip_id: 't1', label: 'C', title: 'Weekend Amsterdam (YOLO)',
        summary: 'Plus cher mais une vraie aventure. Vol low-cost.',
        score: 55, feasibility: 'tight', visa_risk: 'check_required',
        fatigue_estimate: 70, risk_level: 50, total_cost: 5500, currency: 'MAD',
        justification: 'Franchement la Hollande ça va être compliqué sur un weekend. Tu vas passer ton temps dans les transports.',
        recommendation: 'L\'Espagne est beaucoup plus logique. Mais si tu insistes, prends le lundi.',
        legs: [], accommodation: [], calculation_steps: [],
    },
];

const LABEL_COLORS: Record<PlanLabel, string> = {
    A: COLORS.success,
    B: COLORS.warning,
    C: COLORS.secondary,
};

export default function PlansScreen() {
    const router = useRouter();

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.heading}>Tes plans</Text>
            <Text style={styles.subheading}>3 options, 3 compromis différents</Text>

            {MOCK_PLANS.map((plan) => (
                <TouchableOpacity
                    key={plan.id}
                    style={styles.card}
                    onPress={() => router.push({ pathname: '/plan-details', params: { planId: plan.id } })}
                >
                    <View style={styles.cardHeader}>
                        <View style={[styles.labelBadge, { backgroundColor: LABEL_COLORS[plan.label] }]}>
                            <Text style={styles.labelText}>Plan {plan.label}</Text>
                        </View>
                        <Text style={styles.score}>{plan.score}/100</Text>
                    </View>

                    <Text style={styles.cardTitle}>{plan.title}</Text>
                    <Text style={styles.cardSummary}>{plan.summary}</Text>

                    {/* Tags */}
                    <View style={styles.tagsRow}>
                        <Tag label={`${plan.total_cost} ${plan.currency}`} color={COLORS.accent} />
                        <Tag label={`Fatigue ${plan.fatigue_estimate}%`} color={plan.fatigue_estimate > 50 ? COLORS.warning : COLORS.success} />
                        <Tag label={plan.feasibility.toUpperCase()} color={plan.feasibility === 'ok' ? COLORS.success : plan.feasibility === 'tight' ? COLORS.warning : COLORS.error} />
                        {plan.visa_risk !== 'none' && (
                            <Tag label={`Visa: ${plan.visa_risk}`} color={COLORS.secondary} />
                        )}
                    </View>

                    {plan.recommendation && (
                        <View style={styles.recoBox}>
                            <Text style={styles.recoText}>💡 {plan.recommendation}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

function Tag({ label, color }: { label: string; color: string }) {
    return (
        <View style={[styles.tag, { backgroundColor: color + '22', borderColor: color + '44' }]}>
            <Text style={[styles.tagText, { color }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
    heading: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
    subheading: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
    card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    labelBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    labelText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    score: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
    cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
    cardSummary: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    tagText: { fontSize: 12, fontWeight: '600' },
    recoBox: { backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: 12, marginTop: 4 },
    recoText: { fontSize: 13, color: COLORS.accent, lineHeight: 18 },
});
