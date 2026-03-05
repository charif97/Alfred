import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { COLORS, ARCHETYPES } from '../../lib/constants';
import { useSettings } from '../../lib/SettingsContext';

export default function ProfileScreen() {
    const [memoryEnabled, setMemoryEnabled] = useState(true);
    const { isAlfredVoiceEnabled, toggleAlfredVoice } = useSettings();

    // Mock profile data
    const profile = {
        archetype: 'city_sprinter',
        scores: [
            { key: 'budget_sensitivity', label: 'Budget', value: 40 },
            { key: 'fatigue_tolerance', label: 'Fatigue', value: 70 },
            { key: 'nature_vs_city', label: 'Ville', value: 90 },
            { key: 'transport_tolerance', label: 'Transport', value: 60 },
            { key: 'comfort_level', label: 'Confort', value: 60 },
            { key: 'spontaneity', label: 'Spontanéité', value: 50 },
            { key: 'weather_preference', label: 'Météo', value: 50 },
            { key: 'time_sensitivity', label: 'Temps', value: 80 },
            { key: 'culture_priority', label: 'Culture', value: 70 },
            { key: 'food_priority', label: 'Food', value: 60 },
            { key: 'nightlife_priority', label: 'Nightlife', value: 70 },
        ],
        passions: ['architecture', 'street food', 'musées'],
        routines: [
            { name: 'Weekend Express', confidence: 0.85, description: 'Vol vendredi soir, retour dimanche soir, ville européenne' },
            { name: 'No Night Bus', confidence: 0.92, description: 'Tu refuses systématiquement les bus de nuit' },
        ],
    };

    const archetype = ARCHETYPES.find(a => a.id === profile.archetype);

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Archetype Card */}
            <View style={styles.archetypeCard}>
                <Text style={styles.archetypeEmoji}>{archetype?.emoji || '🧳'}</Text>
                <Text style={styles.archetypeName}>{archetype?.label || 'Non défini'}</Text>
                <Text style={styles.archetypeDesc}>{archetype?.description}</Text>
            </View>

            {/* Stats (MVP Placeholder) */}
            <Text style={styles.sectionTitle}>Your Travel Stats</Text>
            <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                    <Text style={styles.statsLabel}>Cities visited:</Text>
                    <Text style={styles.statsValue}>18</Text>
                </View>
                <View style={styles.statsRow}>
                    <Text style={styles.statsLabel}>Countries:</Text>
                    <Text style={styles.statsValue}>7</Text>
                </View>
                <View style={styles.statsRow}>
                    <Text style={styles.statsLabel}>Trips this year:</Text>
                    <Text style={styles.statsValue}>4</Text>
                </View>
                <View style={styles.statsRow}>
                    <Text style={styles.statsLabel}>Cheapest trip:</Text>
                    <Text style={styles.statsValue}>120€</Text>
                </View>
            </View>

            {/* Scores */}
            <Text style={styles.sectionTitle}>Tes scores de profil</Text>
            <View style={styles.scoresGrid}>
                {profile.scores.map((s) => (
                    <View key={s.key} style={styles.scoreItem}>
                        <View style={styles.scoreBarBg}>
                            <View style={[styles.scoreBarFill, { width: `${s.value}%`, backgroundColor: s.value > 70 ? COLORS.primary : s.value > 40 ? COLORS.accent : COLORS.textMuted }]} />
                        </View>
                        <View style={styles.scoreLabelRow}>
                            <Text style={styles.scoreLabel}>{s.label}</Text>
                            <Text style={styles.scoreValue}>{s.value}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Passions */}
            <Text style={styles.sectionTitle}>Passions</Text>
            <View style={styles.passionsRow}>
                {profile.passions.map((p) => (
                    <View key={p} style={styles.passionChip}>
                        <Text style={styles.passionText}>{p}</Text>
                    </View>
                ))}
            </View>

            {/* Routines */}
            <Text style={styles.sectionTitle}>Routines détectées</Text>
            {profile.routines.map((r, i) => (
                <View key={i} style={styles.routineCard}>
                    <View style={styles.routineHeader}>
                        <Text style={styles.routineName}>{r.name}</Text>
                        <Text style={styles.routineConfidence}>{Math.round(r.confidence * 100)}%</Text>
                    </View>
                    <Text style={styles.routineDesc}>{r.description}</Text>
                </View>
            ))}

            {/* Memory Controls */}
            <Text style={styles.sectionTitle}>Mémoire</Text>
            <View style={styles.memoryCard}>
                <View style={styles.memoryRow}>
                    <View>
                        <Text style={styles.memoryLabel}>Mémoire activée</Text>
                        <Text style={styles.memoryDesc}>Alfred se souvient de tes préférences</Text>
                    </View>
                    <Switch
                        value={memoryEnabled}
                        onValueChange={setMemoryEnabled}
                        trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
                        thumbColor={memoryEnabled ? COLORS.primary : COLORS.textMuted}
                    />
                </View>

                {/* Alfred Voice Settings */}
                <View style={styles.memoryRow}>
                    <View>
                        <Text style={styles.memoryLabel}>Alfred Voice (TTS)</Text>
                        <Text style={styles.memoryDesc}>Alfred lit les explications de voyage</Text>
                    </View>
                    <Switch
                        value={isAlfredVoiceEnabled}
                        onValueChange={toggleAlfredVoice}
                        trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
                        thumbColor={isAlfredVoiceEnabled ? COLORS.primary : COLORS.textMuted}
                    />
                </View>

                <TouchableOpacity style={styles.clearBtn}>
                    <Text style={styles.clearText}>🗑️ Effacer toute la mémoire</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
    archetypeCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
    archetypeEmoji: { fontSize: 48, marginBottom: 8 },
    archetypeName: { fontSize: 22, fontWeight: '700', color: COLORS.text },
    archetypeDesc: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 8 },

    // Stats Block
    statsCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    statsLabel: { fontSize: 15, color: COLORS.textSecondary },
    statsValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },

    scoresGrid: { gap: 8, marginBottom: 24 },
    scoreItem: { gap: 4 },
    scoreLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
    scoreLabel: { fontSize: 13, color: COLORS.textSecondary },
    scoreValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
    scoreBarBg: { height: 8, backgroundColor: COLORS.surfaceLight, borderRadius: 4, overflow: 'hidden' },
    scoreBarFill: { height: '100%', borderRadius: 4 },
    passionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    passionChip: { backgroundColor: COLORS.primary + '22', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.primary + '44' },
    passionText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
    routineCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    routineHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    routineName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    routineConfidence: { fontSize: 14, fontWeight: '700', color: COLORS.success },
    routineDesc: { fontSize: 13, color: COLORS.textMuted },
    memoryCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    memoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    memoryLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    memoryDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    clearBtn: { alignItems: 'center', paddingVertical: 10 },
    clearText: { fontSize: 14, color: COLORS.error },
});
