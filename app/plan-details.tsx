import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { COLORS } from '../lib/constants';
import type { CalculationStep, Plan, LivePriceCheckOutput } from '../lib/types';
import { useSettings } from '../lib/SettingsContext';
import type { RefineMode, RoutineSuggestion } from '../server/api/refine-trip';

// Mock plan detail
const MOCK_CALCULATION: CalculationStep[] = [
    { item: 'Vol aller CMN→MAD', cost: 1400, currency: 'MAD', strikethrough: false },
    { item: 'Vol retour MAD→CMN', cost: 1400, currency: 'MAD', strikethrough: false },
    { item: 'Hôtel 3★ centre (2 nuits)', cost: 1200, currency: 'MAD', strikethrough: false },
    { item: 'Hôtel 4★ initial', cost: 2000, currency: 'MAD', strikethrough: true, replacement: 'Hôtel 3★ centre', replacement_cost: 1200 },
    { item: 'Transport local', cost: 200, currency: 'MAD', strikethrough: false },
    { item: 'Activités + repas', cost: 600, currency: 'MAD', strikethrough: false },
];

export default function PlanDetailsScreen() {
    const { planId } = useLocalSearchParams();
    const [isSharing, setIsSharing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [livePrice, setLivePrice] = useState<LivePriceCheckOutput | null>(null);
    const [isPriceFetching, setIsPriceFetching] = useState(false);

    // --- Trip Evolution State ---
    const [isRefining, setIsRefining] = useState(false);
    const [activeRefine, setActiveRefine] = useState<RefineMode | null>(null);
    const [refinedTeaser, setRefinedTeaser] = useState<string[] | null>(null);
    const [refinedWhy, setRefinedWhy] = useState<string[] | null>(null);
    const [refinedTradeoff, setRefinedTradeoff] = useState<string | null>(null);
    const [refinedNarration, setRefinedNarration] = useState<string | null>(null);
    const [routineSuggestion, setRoutineSuggestion] = useState<RoutineSuggestion | null>(null);

    const REFINE_CHIPS: { mode: RefineMode; emoji: string; label: string }[] = [
        { mode: 'food', emoji: '🍴', label: 'Food' },
        { mode: 'culture', emoji: '🏛️', label: 'Culture' },
        { mode: 'chill', emoji: '🛋️', label: 'Chill' },
        { mode: 'nightlife', emoji: '🌜', label: 'Nightlife' },
        { mode: 'nature', emoji: '🌿', label: 'Nature' },
        { mode: 'efficient', emoji: '⚡', label: 'Efficient' },
        { mode: 'budget', emoji: '💰', label: 'Budget' },
    ];

    // Using Context to see if TTS feature is enabled
    const { isAlfredVoiceEnabled } = useSettings();

    // Fetch live price on mount
    useEffect(() => {
        const fetchLivePrice = async () => {
            setIsPriceFetching(true);
            try {
                const res = await fetch('/api/live-price-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        origin: 'Casablanca',
                        destination: 'Madrid',
                        dates: 'next_weekend',
                        passengers: 1,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setLivePrice(data);
                }
            } catch (e) {
                // Silently fail — estimate is already shown
            } finally {
                setIsPriceFetching(false);
            }
        };
        fetchLivePrice();
    }, []);

    // In MVP, we have a fixed narration if not passed from previous screen
    const defaultNarration = refinedNarration || `Honestly, this option is hard to beat. Flights to Madrid are relatively cheap, and it's perfect for a 3-day city break.`;

    // --- Refine Trip Handler ---
    const handleRefine = async (mode: RefineMode) => {
        setIsRefining(true);
        setActiveRefine(mode);
        try {
            // Simulate calling POST /api/refine-trip locally
            const { refineTrip } = require('../server/api/refine-trip');
            const result = refineTrip({
                trip_id: planId as string || null,
                trip_json: { destination: 'Madrid', duration_days: 3 },
                refine_mode: mode,
                user_id: 'user_mvp',
            });

            setRefinedTeaser(result.trip.itinerary_teaser || null);
            setRefinedWhy(result.trip.why_bullets || null);
            setRefinedTradeoff(result.trip.tradeoff || null);
            setRefinedNarration(result.trip.alfred_narration || null);
            setRoutineSuggestion(result.routine_suggestion || null);
        } catch (e) {
            console.error('Refine error:', e);
        } finally {
            setIsRefining(false);
        }
    };

    const handleRoutineApply = async () => {
        if (!routineSuggestion) return;
        // Apply combined pattern by calling refine for each mode
        for (const mode of routineSuggestion.pattern) {
            await handleRefine(mode);
        }
    };

    const handleReset = () => {
        setActiveRefine(null);
        setRefinedTeaser(null);
        setRefinedWhy(null);
        setRefinedTradeoff(null);
        setRefinedNarration(null);
    };

    // Ensure speech stops if user navigates away
    useEffect(() => {
        return () => { Speech.stop(); };
    }, []);

    const handleSpeech = () => {
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
            return;
        }

        setIsSpeaking(true);
        Speech.speak(defaultNarration, {
            language: 'en-US', // Can be set dynamically based on user profile language eventually
            pitch: 1.0,
            rate: 0.95,
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
            onError: () => {
                setIsSpeaking(false);
                Alert.alert("Speech Error", "Could not play Alfred's narration.");
            }
        });
    };

    // Generate and share the Trip Brag Card
    const handleShare = async () => {
        setIsSharing(true);
        try {
            // Generate visual card via API
            const response = await fetch(`http://localhost:8081/api/generate-brag-card?post_id=${planId}`);
            const data = await response.json();

            if (data.success && data.image_url) {
                // If native share sheet supports base64 directly it shares the actual SVG file natively.
                // In iOS/Android real native builds, you'd save to Expo-FileSystem, then share the path.
                // For web/preview parity, passing URL works across boundaries perfectly.
                await Share.share({
                    title: `Steal my trip via Alfred`,
                    message: `Just built this trip with Alfred. Steal it here: alfred.travel/t/${planId}`,
                    // url: data.image_url // Uncomment if real devices can handle the raw Base64 natively
                });
            } else {
                throw new Error("Could not generate card");
            }
        } catch (error: any) {
            Alert.alert("Sharing failed", error.message);
        } finally {
            setIsSharing(false);
        }
    };

    const total = MOCK_CALCULATION
        .filter(s => !s.strikethrough)
        .reduce((sum, s) => sum + s.cost, 0);

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
            {/* Plan Header */}
            <View style={styles.headerCard}>
                <Text style={styles.planLabel}>Plan A</Text>
                <Text style={styles.planTitle}>Vol direct Madrid</Text>
                <Text style={styles.planScore}>82/100</Text>

                {/* Live Price Indicator */}
                {isPriceFetching && (
                    <Text style={styles.livePriceFetching}>🔄 Fetching live price...</Text>
                )}
                {livePrice && !isPriceFetching && (
                    <View style={styles.livePriceBadge}>
                        <Text style={styles.livePriceText}>
                            ✓ Live price: €{livePrice.live_price}
                        </Text>
                        <Text style={styles.livePriceChecked}>
                            Checked just now{livePrice.cached ? ' (cached)' : ''}
                        </Text>
                    </View>
                )}

                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShare}
                        disabled={isSharing}
                    >
                        <Text style={styles.shareText}>
                            {isSharing ? '...' : '↗ Share Trip'}
                        </Text>
                    </TouchableOpacity>

                    {isAlfredVoiceEnabled && (
                        <TouchableOpacity
                            style={[styles.shareButton, isSpeaking && styles.speakingButton]}
                            onPress={handleSpeech}
                        >
                            <Text style={[styles.shareText, isSpeaking && styles.speakingText]}>
                                {isSpeaking ? '⏹ Stop' : '🔊 Listen'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── Refine This Trip ─────────────────────────── */}
            <Text style={styles.sectionTitle}>🎯 Refine this trip</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
                {REFINE_CHIPS.map(chip => (
                    <TouchableOpacity
                        key={chip.mode}
                        style={[
                            styles.refineChip,
                            activeRefine === chip.mode && styles.refineChipActive,
                        ]}
                        onPress={() => handleRefine(chip.mode)}
                        disabled={isRefining}
                    >
                        <Text style={styles.refineChipText}>
                            {chip.emoji} {chip.label}
                        </Text>
                    </TouchableOpacity>
                ))}
                {activeRefine && (
                    <TouchableOpacity style={styles.resetChip} onPress={handleReset}>
                        <Text style={styles.resetChipText}>↩ Reset</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Routine Suggestion */}
            {routineSuggestion && (
                <TouchableOpacity style={styles.routineChip} onPress={handleRoutineApply}>
                    <Text style={styles.routineChipText}>⭐ {routineSuggestion.label}</Text>
                </TouchableOpacity>
            )}

            {/* Refine Loading */}
            {isRefining && (
                <View style={styles.refineLoading}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.refineLoadingText}>Refining for {activeRefine}...</Text>
                </View>
            )}

            {/* Refined Results */}
            {refinedTeaser && !isRefining && (
                <View style={styles.refinedCard}>
                    <Text style={styles.refinedLabel}>✨ Refined itinerary</Text>
                    {refinedTeaser.map((item, i) => (
                        <View key={i} style={styles.refinedItem}>
                            <Text style={styles.refinedDot}>•</Text>
                            <Text style={styles.refinedText}>{item}</Text>
                        </View>
                    ))}
                    {refinedWhy && (
                        <View style={styles.refinedWhyBox}>
                            {refinedWhy.map((bullet, i) => (
                                <Text key={i} style={styles.refinedWhyText}>✓ {bullet}</Text>
                            ))}
                        </View>
                    )}
                    {refinedTradeoff && (
                        <Text style={styles.refinedTradeoff}>⚠️ {refinedTradeoff}</Text>
                    )}
                    {refinedNarration && (
                        <View style={styles.narrativeBox}>
                            <Text style={styles.narrativeText}>🗣️ {refinedNarration}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Feuille de route */}
            <Text style={styles.sectionTitle}>📋 Feuille de route</Text>
            <View style={styles.timeline}>
                <TimelineItem time="Ven 17:00" event="Départ bureau" desc="Maarif → CMN Airport (1h + buffer)" />
                <TimelineItem time="Ven 20:00" event="Vol CMN → MAD" desc="Durée: 2h30 — *estimation mock*" />
                <TimelineItem time="Ven 22:30" event="Arrivée Madrid" desc="Check-in hôtel centre" />
                <TimelineItem time="Sam" event="Journée libre" desc="Visite, food, culture" />
                <TimelineItem time="Dim 19:00" event="Vol retour MAD → CMN" desc="Durée: 2h30" />
                <TimelineItem time="Dim 21:30" event="Retour Casablanca" desc="Marge pour lundi matin ✅" />
            </View>

            {/* Note de calcul */}
            <Text style={styles.sectionTitle}>🧮 Note de calcul</Text>
            <Text style={styles.calcMode}>Mode: full | *estimation mock*</Text>
            <View style={styles.calcSheet}>
                {MOCK_CALCULATION.map((step, i) => (
                    <View key={i} style={styles.calcRow}>
                        <Text style={[styles.calcItem, step.strikethrough && styles.strikethrough]}>
                            {step.item}
                        </Text>
                        <Text style={[styles.calcCost, step.strikethrough && styles.strikethrough]}>
                            {step.cost} {step.currency}
                        </Text>
                        {step.strikethrough && step.replacement && (
                            <View style={styles.replacementRow}>
                                <Text style={styles.replacementArrow}>↳</Text>
                                <Text style={styles.replacementText}>{step.replacement}</Text>
                                <Text style={styles.replacementCost}>{step.replacement_cost} {step.currency}</Text>
                            </View>
                        )}
                    </View>
                ))}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                    <Text style={styles.totalCost}>{total} MAD</Text>
                </View>
            </View>

            {/* Trade-off */}
            <Text style={styles.sectionTitle}>⚖️ Trade-off</Text>
            <View style={styles.warningBox}>
                <Text style={styles.warningText}>Slightly higher flight cost, but 6 extra hours in the city.</Text>
            </View>

            {/* How to save */}
            <Text style={styles.sectionTitle}>💰 How to save</Text>
            <View style={styles.savingsBox}>
                <Text style={styles.savingsText}>Save 120 MAD by returning Monday morning instead of Sunday evening.</Text>
            </View>
        </ScrollView>
    );
}

function TimelineItem({ time, event, desc }: { time: string; event: string; desc: string }) {
    return (
        <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
                <Text style={styles.timelineTime}>{time}</Text>
                <Text style={styles.timelineEvent}>{event}</Text>
                <Text style={styles.timelineDesc}>{desc}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
    headerCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.primary + '44' },
    planLabel: { fontSize: 14, fontWeight: '700', color: COLORS.success, marginBottom: 4 },
    planTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
    planScore: { fontSize: 36, fontWeight: '800', color: COLORS.primary, marginTop: 8 },
    livePriceFetching: { fontSize: 12, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' },
    livePriceBadge: {
        marginTop: 8,
        backgroundColor: COLORS.success + '22',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignItems: 'center',
    },
    livePriceText: { color: COLORS.success, fontWeight: '700', fontSize: 15 },
    livePriceChecked: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    shareButton: {
        backgroundColor: COLORS.primary + '22',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    speakingButton: {
        backgroundColor: COLORS.primary,
    },
    shareText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 15,
    },
    speakingText: {
        color: '#FFF',
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 8 },
    // Timeline
    timeline: { marginBottom: 24 },
    timelineItem: { flexDirection: 'row', marginBottom: 12, gap: 12 },
    timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, marginTop: 4 },
    timelineContent: { flex: 1 },
    timelineTime: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
    timelineEvent: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    timelineDesc: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    // Calculation Sheet
    calcMode: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
    calcSheet: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
    calcRow: { marginBottom: 8 },
    calcItem: { fontSize: 14, color: COLORS.text },
    calcCost: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
    strikethrough: { textDecorationLine: 'line-through', color: COLORS.textMuted },
    replacementRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
    replacementArrow: { fontSize: 14, color: COLORS.success },
    replacementText: { fontSize: 13, color: COLORS.success },
    replacementCost: { fontSize: 13, fontWeight: '600', color: COLORS.success },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginTop: 8 },
    totalLabel: { fontSize: 18, fontWeight: '800', color: COLORS.text },
    totalCost: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
    // Explanations
    justificationCard: { backgroundColor: COLORS.surfaceLight, borderRadius: 16, padding: 16, marginBottom: 8 },
    justificationText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
    warningBox: { backgroundColor: '#3A2E1A', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#5C4010' },
    warningText: { fontSize: 14, color: '#F8B145', fontWeight: '600' },
    savingsBox: { backgroundColor: COLORS.success + '11', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.success + '44' },
    savingsText: { fontSize: 14, color: COLORS.success, fontWeight: '700' },
    // Refine Chips
    chipScroll: { marginBottom: 12 },
    chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 2 },
    refineChip: {
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    refineChipActive: {
        backgroundColor: COLORS.primary + '22',
        borderColor: COLORS.primary,
    },
    refineChipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
    resetChip: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.warning + '66',
    },
    resetChipText: { fontSize: 13, fontWeight: '600', color: COLORS.warning },
    routineChip: {
        backgroundColor: COLORS.accent + '22',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.accent + '66',
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    routineChipText: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
    refineLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    refineLoadingText: { fontSize: 13, color: COLORS.textMuted },
    refinedCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.primary + '44',
    },
    refinedLabel: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 10 },
    refinedItem: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
    refinedDot: { color: COLORS.accent, fontSize: 16, marginRight: 8, lineHeight: 20 },
    refinedText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
    refinedWhyBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
    refinedWhyText: { fontSize: 13, color: COLORS.success, lineHeight: 18, marginBottom: 2 },
    refinedTradeoff: { fontSize: 13, color: COLORS.warning, fontWeight: '600', marginTop: 8 },
    narrativeBox: {
        marginTop: 10,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 12,
    },
    narrativeText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, fontStyle: 'italic' },
});
