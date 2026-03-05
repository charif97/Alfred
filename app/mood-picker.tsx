import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { COLORS, MOODS } from '../lib/constants';
import type { Mood } from '../lib/types';

export default function MoodPickerScreen() {
    const router = useRouter();
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

    const handleConfirm = () => {
        // TODO: update session mood via API
        router.back();
    };

    return (
        <View style={styles.container}>
            {/* "Comme d'habitude?" section */}
            <View style={styles.routineCard}>
                <Text style={styles.routineEmoji}>🔄</Text>
                <Text style={styles.routineTitle}>On fait comme d'habitude ?</Text>
                <Text style={styles.routineDesc}>
                    Weekend Express — Vol vendredi soir, retour dimanche{'\n'}
                    <Text style={styles.confidence}>Confiance: 85%</Text>
                </Text>
                <TouchableOpacity style={styles.routineBtn} onPress={handleConfirm}>
                    <Text style={styles.routineBtnText}>Oui, on fait ça !</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.divider}>— ou choisis un mood —</Text>

            {/* Mood Grid */}
            <View style={styles.moodGrid}>
                {MOODS.map((m) => (
                    <TouchableOpacity
                        key={m.id}
                        style={[styles.moodCard, selectedMood === m.id && styles.moodSelected]}
                        onPress={() => setSelectedMood(m.id)}
                    >
                        <Text style={styles.moodEmoji}>{m.emoji}</Text>
                        <Text style={styles.moodLabel}>{m.label}</Text>
                        <Text style={styles.moodDesc}>{m.description}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {selectedMood && (
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                    <Text style={styles.confirmText}>Allons-y en mode {MOODS.find(m => m.id === selectedMood)?.label}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 24 },
    routineCard: { backgroundColor: COLORS.surfaceLight, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.primary + '44' },
    routineEmoji: { fontSize: 36, marginBottom: 8 },
    routineTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    routineDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
    confidence: { color: COLORS.success, fontWeight: '600' },
    routineBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
    routineBtnText: { color: COLORS.text, fontWeight: '700', fontSize: 16 },
    divider: { color: COLORS.textMuted, textAlign: 'center', fontSize: 13, marginBottom: 20 },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    moodCard: { width: '47%', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    moodSelected: { borderColor: COLORS.primary },
    moodEmoji: { fontSize: 32, marginBottom: 8 },
    moodLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    moodDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
    confirmBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 24 },
    confirmText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
});
