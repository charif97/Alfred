/**
 * ALFRED — Discover Screen (Infinite Feed)
 * app/(tabs)/index.tsx
 *
 * Implements:
 *  - Infinite cursor-paginated feed via GET /api/next-trips
 *  - "Surprise me" mode with stable per-session seed
 *  - 🔥 Trip of the Day via GET /api/trip-of-the-day
 *  - Expandable "Why this trip?" section per card
 *  - Pull-to-refresh, footer spinner, error resilience
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../lib/constants';

// ─── Types ────────────────────────────────────────────────────────
// We mirror the shape expected from /api/next-trips here to avoid
// touching lib/types unless strictly needed.
interface TripCard {
    id?: string;
    destination: string;
    duration_days: number;
    total_price_est?: number;
    total_price_min?: number;
    total_price_max?: number;
    price_source?: string;
    transport_mode?: string;
    transport_time_est?: string;
    travel_time_est?: number;
    best_dates?: string;
    savings_tip?: string | null;
    savings_if_flexible?: number;
    itinerary_teaser?: string[];
    why_bullets?: string[];
    tradeoff?: string;
    alfred_narration?: string;
    reason?: string;
    score?: number;
    timeframe_tags?: string[];
}

interface NextTripsResponse {
    trips: TripCard[];
    next_cursor: string | null;
}

interface TripOfDayResponse {
    trip: TripCard;
}

// ─── Stable key helper ────────────────────────────────────────────
function tripKey(trip: TripCard, index: number): string {
    return trip.id ?? `${trip.destination}-${trip.duration_days}-${trip.best_dates ?? ''}-${index}`;
}

// ─── API base (Expo uses HTTP interceptors; localhost for dev) ────
const API_BASE = 'http://localhost:8081';

// ─── Main Screen ──────────────────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();

    // Session seed — stable per mount, regenerated on Surprise
    const initialSeed = useRef(Math.random().toString(36).substring(7));

    // ── State ──────────────────────────────────────────────────────
    const [trips, setTrips] = useState<TripCard[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [mode, setMode] = useState<'default' | 'surprise'>('default');
    const [seedOverride, setSeedOverride] = useState(initialSeed.current);
    const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});
    const [tripOfDay, setTripOfDay] = useState<TripCard | null>(null);
    const [loadingTripOfDay, setLoadingTripOfDay] = useState(false);

    // ── Fetch: Trip of the Day ─────────────────────────────────────
    const fetchTripOfDay = useCallback(async () => {
        setLoadingTripOfDay(true);
        try {
            const res = await fetch(`${API_BASE}/api/trip-of-the-day`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: TripOfDayResponse = await res.json();
            if (data.trip) setTripOfDay(data.trip);
        } catch (e) {
            // Non-blocking — silently skip Trip of Day if it fails
        } finally {
            setLoadingTripOfDay(false);
        }
    }, []);

    // ── Fetch: First Page (reset) ──────────────────────────────────
    const fetchFirstPage = useCallback(async (
        activeMode: 'default' | 'surprise' = mode,
        activeSeed: string = seedOverride,
    ) => {
        setLoadingInitial(true);
        setTrips([]);
        setNextCursor(null);
        try {
            const url = new URL(`${API_BASE}/api/next-trips`);
            url.searchParams.set('limit', '10');
            url.searchParams.set('mode', activeMode);
            url.searchParams.set('seed_override', activeSeed);
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: NextTripsResponse = await res.json();
            setTrips(data.trips ?? []);
            setNextCursor(data.next_cursor ?? null);
        } catch (e) {
            Alert.alert('Oops', 'Could not load trips. Check your connection.');
        } finally {
            setLoadingInitial(false);
        }
    }, [mode, seedOverride]);

    // ── Fetch: Next Page (append) ─────────────────────────────────
    const fetchNextPage = useCallback(async () => {
        if (loadingMore || loadingInitial || refreshing || !nextCursor) return;
        setLoadingMore(true);
        try {
            const url = new URL(`${API_BASE}/api/next-trips`);
            url.searchParams.set('limit', '10');
            url.searchParams.set('cursor', nextCursor);
            url.searchParams.set('mode', mode);
            url.searchParams.set('seed_override', seedOverride);
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: NextTripsResponse = await res.json();

            // Deduplicate by stable key
            setTrips(prev => {
                const existingKeys = new Set(prev.map((t, i) => tripKey(t, i)));
                const newTrips = (data.trips ?? []).filter(
                    (t, i) => !existingKeys.has(tripKey(t, i))
                );
                return [...prev, ...newTrips];
            });
            setNextCursor(data.next_cursor ?? null);
        } catch (e) {
            // Silently fail on pagination — user can scroll again
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, loadingInitial, refreshing, nextCursor, mode, seedOverride]);

    // ── Pull-to-refresh ───────────────────────────────────────────
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchFirstPage(mode, seedOverride), fetchTripOfDay()]);
        setRefreshing(false);
    }, [fetchFirstPage, fetchTripOfDay, mode, seedOverride]);

    // ── Surprise mode ─────────────────────────────────────────────
    const handleSurprise = useCallback(() => {
        const newSeed = Math.random().toString(36).substring(7);
        setSeedOverride(newSeed);
        setMode('surprise');
        fetchFirstPage('surprise', newSeed);
    }, [fetchFirstPage]);

    const handleDefault = useCallback(() => {
        const defaultSeed = initialSeed.current;
        setSeedOverride(defaultSeed);
        setMode('default');
        fetchFirstPage('default', defaultSeed);
    }, [fetchFirstPage]);

    // ── Initial load ──────────────────────────────────────────────
    useEffect(() => {
        fetchTripOfDay();
        fetchFirstPage('default', initialSeed.current);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Toggle Why ────────────────────────────────────────────────
    const toggleWhy = useCallback((key: string) => {
        setExpandedWhy(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    // ── Navigation ────────────────────────────────────────────────
    const navigateToDetails = useCallback((trip: TripCard, key: string) => {
        router.push({
            pathname: '/plan-details',
            params: { planId: key, destination: trip.destination },
        });
    }, [router]);

    // ── Renderers ─────────────────────────────────────────────────
    const renderTripCard = useCallback(({ item: trip, index }: { item: TripCard; index: number }) => {
        const key = tripKey(trip, index);
        const isExpanded = expandedWhy[key] ?? false;
        const hasWhy = (trip.why_bullets?.length ?? 0) > 0;
        const priceMin = trip.total_price_min ?? trip.total_price_est;
        const priceMax = trip.total_price_max ?? trip.total_price_est;
        const priceLabel = priceMin && priceMax && priceMin !== priceMax
            ? `${Math.round(priceMin)}–${Math.round(priceMax)}`
            : priceMin ? `~${Math.round(priceMin)}` : '–';

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigateToDetails(trip, key)}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <Text style={styles.destination}>{trip.destination}</Text>
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceEst}>Est.</Text>
                        <Text style={styles.price}>{priceLabel} MAD</Text>
                    </View>
                </View>

                {/* Meta row */}
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>🗓 {trip.duration_days} days</Text>
                    {trip.best_dates ? (
                        <Text style={styles.metaText}>📅 {trip.best_dates}</Text>
                    ) : null}
                    {trip.travel_time_est != null ? (
                        <Text style={styles.metaText}>✈️ {trip.travel_time_est}h</Text>
                    ) : null}
                </View>

                {/* Itinerary teaser */}
                {(trip.itinerary_teaser?.length ?? 0) > 0 && (
                    <View style={styles.teaserBox}>
                        {trip.itinerary_teaser!.slice(0, 3).map((item, i) => (
                            <Text key={i} style={styles.teaserText}>• {item}</Text>
                        ))}
                    </View>
                )}

                {/* Savings tip */}
                {trip.savings_tip ? (
                    <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>💰 {trip.savings_tip}</Text>
                    </View>
                ) : null}

                {/* Why this trip toggle */}
                {hasWhy && (
                    <TouchableOpacity
                        style={styles.whyToggle}
                        onPress={() => toggleWhy(key)}
                        hitSlop={{ top: 8, bottom: 8 }}
                    >
                        <Text style={styles.whyToggleText}>
                            {isExpanded ? '▲ Hide details' : '▼ Why this trip?'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Expanded Why section */}
                {isExpanded && (
                    <View style={styles.whyBox}>
                        {trip.why_bullets!.slice(0, 3).map((bullet, i) => (
                            <Text key={i} style={styles.whyBullet}>✓ {bullet}</Text>
                        ))}
                        {trip.tradeoff ? (
                            <Text style={styles.tradeoff}>⚖️ {trip.tradeoff}</Text>
                        ) : null}
                    </View>
                )}
            </TouchableOpacity>
        );
    }, [expandedWhy, toggleWhy, navigateToDetails]);

    // ── List Header ───────────────────────────────────────────────
    const renderHeader = useCallback(() => (
        <View>
            {/* Trip of the Day */}
            <View style={styles.todSection}>
                <Text style={styles.todLabel}>🔥 Trip of the Day</Text>
                {loadingTripOfDay && !tripOfDay ? (
                    <View style={styles.todSkeleton}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                ) : tripOfDay ? (
                    <TouchableOpacity
                        style={styles.todCard}
                        activeOpacity={0.85}
                        onPress={() => navigateToDetails(tripOfDay, `tod_${tripOfDay.destination}`)}
                    >
                        <View style={styles.todCardHeader}>
                            <Text style={styles.todDestination}>{tripOfDay.destination}</Text>
                            <Text style={styles.todPrice}>
                                {tripOfDay.total_price_min
                                    ? `~${Math.round(tripOfDay.total_price_min)} MAD`
                                    : tripOfDay.total_price_est
                                        ? `~${tripOfDay.total_price_est} MAD`
                                        : ''}
                            </Text>
                        </View>
                        <Text style={styles.todMeta}>
                            {tripOfDay.duration_days} days
                            {tripOfDay.best_dates ? ` · ${tripOfDay.best_dates}` : ''}
                        </Text>
                        {(tripOfDay.why_bullets?.length ?? 0) > 0 && (
                            <View style={styles.todWhyBox}>
                                {tripOfDay.why_bullets!.slice(0, 3).map((b, i) => (
                                    <Text key={i} style={styles.todWhyBullet}>✓ {b}</Text>
                                ))}
                            </View>
                        )}
                        <View style={styles.todActions}>
                            <View style={styles.todCta}>
                                <Text style={styles.todCtaText}>Steal this trip →</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Mode controls */}
            <View style={styles.controls}>
                <View>
                    <Text style={styles.feedTitle}>Your next trips</Text>
                    <Text style={styles.feedSubtitle}>
                        {mode === 'surprise'
                            ? '✨ Unexpected picks just for you'
                            : 'Curated for your profile'}
                    </Text>
                </View>
                {mode === 'default' ? (
                    <TouchableOpacity style={styles.surpriseBtn} onPress={handleSurprise}>
                        <Text style={styles.surpriseBtnText}>🎲 Surprise me</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.defaultBtn} onPress={handleDefault}>
                        <Text style={styles.defaultBtnText}>← Back to normal</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    ), [tripOfDay, loadingTripOfDay, mode, handleSurprise, handleDefault, navigateToDetails]);

    // ── List Footer ───────────────────────────────────────────────
    const renderFooter = useCallback(() => {
        if (loadingMore) {
            return (
                <View style={styles.footerSpinner}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
            );
        }
        if (!nextCursor && trips.length > 0) {
            return <Text style={styles.endText}>You've seen everything! Pull to refresh.</Text>;
        }
        return null;
    }, [loadingMore, nextCursor, trips.length]);

    // ── Empty / Initial loading state ─────────────────────────────
    if (loadingInitial && trips.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Alfred is finding your trips…</Text>
            </View>
        );
    }

    // ── Render ────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <FlatList
                data={trips}
                keyExtractor={(item, index) => tripKey(item, index)}
                renderItem={renderTripCard}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.listContent}
                onEndReached={fetchNextPage}
                onEndReachedThreshold={0.4}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    listContent: { paddingBottom: 32 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: COLORS.background },
    loadingText: { color: COLORS.textMuted, fontSize: 14 },

    // ── Trip of the Day ──────────────────────────────────
    todSection: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 8 },
    todLabel: { fontSize: 13, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    todSkeleton: { height: 120, borderRadius: 20, backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center' },
    todCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1.5,
        borderColor: COLORS.primary + '44',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    todCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    todDestination: { fontSize: 24, fontWeight: '900', color: COLORS.text, flex: 1 },
    todPrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
    todMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, marginBottom: 12 },
    todWhyBox: { gap: 4, marginBottom: 12 },
    todWhyBullet: { fontSize: 13, color: COLORS.success, fontWeight: '500' },
    todActions: { flexDirection: 'row', justifyContent: 'flex-end' },
    todCta: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    todCtaText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

    // ── Mode controls ────────────────────────────────────
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 8,
    },
    feedTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
    feedSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    surpriseBtn: {
        backgroundColor: COLORS.primary + '22',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary + '55',
    },
    surpriseBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
    defaultBtn: {
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    defaultBtnText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 13 },

    // ── Trip Card ────────────────────────────────────────
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 14,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    destination: { fontSize: 20, fontWeight: '800', color: COLORS.text, flex: 1 },
    priceBadge: { alignItems: 'flex-end' },
    priceEst: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500', textTransform: 'uppercase' },
    price: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    metaText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
    teaserBox: { gap: 4, marginBottom: 10 },
    teaserText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
    savingsBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.success + '18',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.success + '40',
    },
    savingsText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
    whyToggle: { paddingVertical: 6 },
    whyToggleText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
    whyBox: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    whyBullet: { fontSize: 13, color: COLORS.success, fontWeight: '500', lineHeight: 19 },
    tradeoff: { fontSize: 12, color: COLORS.warning, fontWeight: '600', fontStyle: 'italic', lineHeight: 17, marginTop: 4 },

    // ── Footer ───────────────────────────────────────────
    footerSpinner: { paddingVertical: 20, alignItems: 'center' },
    endText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, paddingVertical: 20 },
});
