import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { generateNextTrips } from '../../server/api/next-trips';
import type { NextTripRecommendation } from '../../server/api/next-trips';
import type { CatalogTrip } from '../../lib/types';

export default function HomeScreen() {
    const router = useRouter();
    const [trips, setTrips] = useState<NextTripRecommendation[]>([]);
    const [tod, setTod] = useState<CatalogTrip | null>(null);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [mode, setMode] = useState<'default' | 'surprise'>('default');

    const [seed] = useState(() => Math.random().toString(36).substring(7));

    // Toggle state specifically for the "Why?" sections
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    const fetchTrips = useCallback(async (isRefresh = false, activeMode: 'default' | 'surprise' = mode) => {
        if (!isRefresh && (!hasMore || loading)) return;

        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            // Also attempt to grab TOD parallelly on first load
            if (isRefresh || !tod) {
                fetch('/api/trip-of-the-day')
                    .then(r => r.json())
                    .then(data => data.trip && setTod(data.trip))
                    .catch(() => { });
            }

            // Simulate network latency
            setTimeout(() => {
                const currentCursor = isRefresh ? null : cursor;
                const response = generateNextTrips(undefined, 'Casablanca', {
                    limit: 10,
                    cursor: currentCursor,
                    mode: activeMode,
                    seed_override: seed
                });

                setTrips(prev => isRefresh ? response.trips : [...prev, ...response.trips]);
                setCursor(response.next_cursor);
                setHasMore(!!response.next_cursor);

                setLoading(false);
                setIsRefreshing(false);
            }, 800);
        } catch (error) {
            console.error("Failed to load trips", error);
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [cursor, hasMore, mode, seed, loading, tod]);

    useEffect(() => {
        fetchTrips(true); // Initial load
    }, []); // Run only once

    const handleSurpriseMe = () => {
        const newMode = mode === 'default' ? 'surprise' : 'default';
        setMode(newMode);
        fetchTrips(true, newMode);
    };

    const renderTrip = ({ item: trip, index }: { item: NextTripRecommendation; index: number }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/plan-details', params: { planId: trip.id } })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.destinationTitle}>{trip.destination} Weekend</Text>
                <Text style={styles.price}>{trip.total_price_est} MAD</Text>
            </View>

            <Text style={styles.duration}>
                {trip.duration_days} days • {trip.best_dates}
            </Text>

            <View style={styles.teaserBox}>
                {trip.itinerary_teaser.map((item, idx) => (
                    <View key={`teaser_${trip.id}_${idx} `} style={styles.teaserItem}>
                        <Text style={styles.teaserDot}>•</Text>
                        <Text style={styles.teaserText}>{item}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.reasonBox}>
                <Text style={styles.reasonText}>💡 {trip.reason}</Text>
            </View>

            {/* Expander for Why Bullets */}
            <TouchableOpacity
                style={styles.whyToggle}
                onPress={() => setExpandedItem(expandedItem === trip.id ? null : trip.id)}
            >
                <Text style={styles.whyToggleText}>
                    {expandedItem === trip.id ? 'Hide Details' : 'Why this trip?'}
                </Text>
            </TouchableOpacity>

            {expandedItem === trip.id && (
                <View style={styles.whyBox}>
                    {trip.why_bullets.map((bullet, i) => (
                        <View key={`why_${trip.id}_${i} `} style={styles.teaserItem}>
                            <Text style={styles.teaserDot}>✓</Text>
                            <Text style={styles.whyText}>{bullet}</Text>
                        </View>
                    ))}
                    <Text style={styles.tradeoffText}>⚠️ {trip.tradeoff}</Text>
                </View>
            )}

            {trip.savings_tip && (
                <View style={styles.savingsTag}>
                    <Text style={styles.savingsText}>💰 {trip.savings_tip}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.title}>Your next trips</Text>
                    <Text style={styles.subtitle}>
                        {mode === 'surprise' ? 'Unexpected deals & new horizons' : 'Curated based on your profile'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.surpriseBtn, mode === 'surprise' && styles.surpriseBtnActive]}
                    onPress={handleSurpriseMe}
                >
                    <Text style={styles.surpriseText}>🎲 Surprise me</Text>
                </TouchableOpacity>
            </View>

            {tod && mode !== 'surprise' && (
                <View style={styles.todContainer}>
                    <Text style={styles.todTitle}>🔥 Trip of the Day</Text>
                    <View style={styles.todCard}>
                        <View style={styles.todHeader}>
                            <Text style={styles.todDestination}>{tod.destination}</Text>
                            <Text style={styles.todPrice}>~{tod.total_price_min} MAD</Text>
                        </View>
                        <Text style={styles.todDuration}>{tod.duration_days} days • {tod.timeframe_tags?.[0] || 'soon'}</Text>
                        <View style={styles.whyBox}>
                            {tod.why_bullets.map((bullet, i) => (
                                <Text key={`tod_why_${i} `} style={styles.whyText}>✓ {bullet}</Text>
                            ))}
                        </View>
                        <View style={styles.todActions}>
                            <TouchableOpacity
                                style={styles.todPrimaryBtn}
                                onPress={() => router.push({ pathname: '/plan-details', params: { planId: tod.id } })}
                            >
                                <Text style={styles.todPrimaryBtnText}>Steal this trip</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.todSecondaryBtn}>
                                <Text style={styles.todSecondaryBtnText}>Remix</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );

    const renderFooter = () => {
        if (!loading || isRefreshing) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={trips}
                keyExtractor={(item, idx) => `${item.id} -${idx} `}
                renderItem={renderTrip}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.list}
                onEndReached={() => fetchTrips(false)}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchTrips(true)}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
    subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
    surpriseBtn: {
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    surpriseBtnActive: {
        backgroundColor: COLORS.primary + '22',
        borderColor: COLORS.primary,
    },
    surpriseText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    footerLoader: { paddingVertical: 20, justifyContent: 'center', alignItems: 'center' },
    list: { paddingBottom: 40 },
    card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 16, marginHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    destinationTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, flex: 1 },
    price: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
    duration: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
    teaserBox: { marginBottom: 12 },
    teaserItem: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start', paddingRight: 10 },
    teaserDot: { color: COLORS.accent, fontSize: 16, marginRight: 8, lineHeight: 20 },
    teaserText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
    reasonBox: { backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: 12, marginBottom: 8 },
    reasonText: { fontSize: 13, color: COLORS.secondary, lineHeight: 18, fontStyle: 'italic' },
    whyToggle: { paddingVertical: 4, marginBottom: 8 },
    whyToggleText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
    whyBox: { backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    whyText: { fontSize: 13, color: COLORS.success, flex: 1, lineHeight: 18 },
    tradeoffText: { fontSize: 13, color: COLORS.warning, marginTop: 8, fontStyle: 'italic', fontWeight: '600' },
    savingsTag: { alignSelf: 'flex-start', backgroundColor: COLORS.success + '22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.success + '44' },
    savingsText: { fontSize: 12, color: COLORS.success, fontWeight: '700' },

    // TOD Styles
    todContainer: { marginTop: 24, marginBottom: 8 },
    todTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    todCard: { backgroundColor: COLORS.primary + '11', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.primary + '33' },
    todHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    todDestination: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    todPrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
    todDuration: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, marginBottom: 12 },
    todActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    todPrimaryBtn: { flex: 2, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    todPrimaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    todSecondaryBtn: { flex: 1, backgroundColor: COLORS.surfaceLight, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    todSecondaryBtnText: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
});
