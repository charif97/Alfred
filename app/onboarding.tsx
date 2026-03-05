import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, ARCHETYPES, MICRO_QUESTIONS, ARCHETYPE_PROFILES, DEFAULT_PROFILE_SCORES } from '../lib/constants';
import { Archetype } from '../lib/types';

type OnboardingMode = 'choice' | 'archetypes' | 'questions';

export default function OnboardingScreen() {
    const router = useRouter();
    const [mode, setMode] = useState<OnboardingMode>('choice');
    const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);
    const [answers, setAnswers] = useState<Record<string, 'A' | 'B'>>({});
    const [currentQ, setCurrentQ] = useState(0);

    const handleArchetypeSelect = (id: Archetype) => {
        setSelectedArchetype(id);
    };

    const handleAnswer = (qId: string, answer: 'A' | 'B') => {
        const newAnswers = { ...answers, [qId]: answer };
        setAnswers(newAnswers);
        if (currentQ < MICRO_QUESTIONS.length - 1) {
            setCurrentQ(currentQ + 1);
        }
    };

    const handleConfirm = () => {
        // TODO: save profile to Supabase via API
        router.replace('/(tabs)');
    };

    if (mode === 'choice') {
        return (
            <View style={styles.container}>
                <Text style={styles.heading}>Comment tu veux qu'on fasse ?</Text>
                <Text style={styles.subheading}>Je veux comprendre ton style de voyage.</Text>

                <TouchableOpacity style={styles.optionCard} onPress={() => setMode('archetypes')}>
                    <Text style={styles.optionEmoji}>🎭</Text>
                    <View>
                        <Text style={styles.optionTitle}>Choisis ton profil</Text>
                        <Text style={styles.optionDesc}>7 archétypes, tu te reconnais dans lequel ?</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionCard} onPress={() => setMode('questions')}>
                    <Text style={styles.optionEmoji}>❓</Text>
                    <View>
                        <Text style={styles.optionTitle}>5 questions rapides</Text>
                        <Text style={styles.optionDesc}>30 secondes chrono pour cerner ton style</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipBtn} onPress={handleConfirm}>
                    <Text style={styles.skipText}>Passer — on verra plus tard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (mode === 'archetypes') {
        return (
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={styles.heading}>Tu te reconnais dans lequel ?</Text>
                <View style={styles.grid}>
                    {ARCHETYPES.map((a) => (
                        <TouchableOpacity
                            key={a.id}
                            style={[styles.archetypeCard, selectedArchetype === a.id && styles.archetypeSelected]}
                            onPress={() => handleArchetypeSelect(a.id)}
                        >
                            <Text style={styles.archetypeEmoji}>{a.emoji}</Text>
                            <Text style={styles.archetypeLabel}>{a.label}</Text>
                            <Text style={styles.archetypeDesc}>{a.description}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {selectedArchetype && (
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                        <Text style={styles.confirmText}>C'est moi → Continuer</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        );
    }

    // Micro-questions mode
    const q = MICRO_QUESTIONS[currentQ];
    const allAnswered = Object.keys(answers).length === MICRO_QUESTIONS.length;

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Question {currentQ + 1}/{MICRO_QUESTIONS.length}</Text>
            <Text style={styles.question}>{q.question}</Text>

            <View style={styles.answersRow}>
                <TouchableOpacity
                    style={[styles.answerBtn, answers[q.id] === 'A' && styles.answerSelected]}
                    onPress={() => handleAnswer(q.id, 'A')}
                >
                    <Text style={styles.answerText}>{q.optionA}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.answerBtn, answers[q.id] === 'B' && styles.answerSelected]}
                    onPress={() => handleAnswer(q.id, 'B')}
                >
                    <Text style={styles.answerText}>{q.optionB}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.dotsRow}>
                {MICRO_QUESTIONS.map((_, i) => (
                    <View key={i} style={[styles.dot, i <= currentQ && styles.dotActive]} />
                ))}
            </View>

            {allAnswered && (
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                    <Text style={styles.confirmText}>C'est bon → Continuer</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 24, paddingTop: 40 },
    heading: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    subheading: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 32 },
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, marginBottom: 16, gap: 16 },
    optionEmoji: { fontSize: 32 },
    optionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    optionDesc: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
    skipBtn: { alignItems: 'center', marginTop: 24 },
    skipText: { color: COLORS.textMuted, fontSize: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    archetypeCard: { width: '47%', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginBottom: 4, borderWidth: 2, borderColor: 'transparent' },
    archetypeSelected: { borderColor: COLORS.primary },
    archetypeEmoji: { fontSize: 32, marginBottom: 8 },
    archetypeLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    archetypeDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    confirmBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 24 },
    confirmText: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
    question: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 60, marginBottom: 40, textAlign: 'center' },
    answersRow: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
    answerBtn: { flex: 1, backgroundColor: COLORS.surface, paddingVertical: 24, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    answerSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceLight },
    answerText: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 32 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border },
    dotActive: { backgroundColor: COLORS.primary },
});
