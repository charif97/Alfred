import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Share, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import type { TripPost } from '../../lib/types';

export default function ExploreScreen() {
    const [feed, setFeed] = useState<TripPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchFeed = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await fetch('/api/social-feed');
            const data = await res.json();
            if (data.feed) {
                setFeed(data.feed);
            }
        } catch (error) {
            console.error('Failed to load social feed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchFeed(true);
    }, []);

    const handleLike = async (postId: string, currentIndex: number) => {
        try {
            const res = await fetch('/api/like-trip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, user_id: 'user_mvp' })
            });
            const data = await res.json();

            if (data.success) {
                // Optimistic UI update
                const newFeed = [...feed];
                newFeed[currentIndex].liked_by_me = data.liked_by_me;
                newFeed[currentIndex].likes_count = data.likes_count;
                setFeed(newFeed);
            }
        } catch (e) {
            console.error('Like failed:', e);
        }
    };

    const handleRemix = async (post: TripPost) => {
        Alert.alert(
            "Remix this trip?",
            `We will adapt ${post.username}'s ${post.trip_json.destination} trip to match your dates and origin.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remix",
                    onPress: async () => {
                        // Mocking a remix action directly branching to plan details
                        // In reality, this would navigate to a date/origin picker first
                        router.push({
                            pathname: "/plan-details",
                            params: {
                                planId: post.post_id,
                                remixed_from: post.username
                            }
                        });
                    }
                }
            ]
        );
    };

    const handleShare = async (post: TripPost) => {
        try {
            await Share.share({
                message: `Check out this trip to ${post.trip_json.destination} by @${post.username} on ALFRED!`,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    const renderPost = ({ item, index }: { item: TripPost, index: number }) => (
        <View style={styles.postCard}>
            {/* Header: User & Remix Badge */}
            <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarPlaceholder} />
                    <Text style={styles.username}>@{item.username}</Text>
                </View>
                {item.remixed_from_username && (
                    <View style={styles.remixBadge}>
                        <MaterialIcons name="repeat" size={12} color={COLORS.primary} />
                        <Text style={styles.remixText}>Remixed from @{item.remixed_from_username}</Text>
                    </View>
                )}
            </View>

            {/* Caption */}
            {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}

            {/* Embedded Trip Card */}
            <View style={styles.embeddedTrip}>
                <View style={styles.tripHeader}>
                    <Text style={styles.destination}>{item.trip_json.destination}</Text>
                    <Text style={styles.price}>~{item.trip_json.total_price_est} MAD</Text>
                </View>
                <Text style={styles.duration}>{item.trip_json.duration_days} Days</Text>

                {/* Why Bullets */}
                <View style={styles.whyBox}>
                    {item.trip_json.why_bullets?.map((bullet: string, i: number) => (
                        <Text key={i} style={styles.whyBullet}>✓ {bullet}</Text>
                    ))}
                </View>

                {/* Tradeoff */}
                {item.trip_json.tradeoff && (
                    <Text style={styles.tradeoffBox}>⚖️ {item.trip_json.tradeoff}</Text>
                )}

                <TouchableOpacity
                    style={styles.viewPlanButton}
                    onPress={() => router.push({ pathname: "/plan-details", params: { planId: item.post_id } })}
                >
                    <Text style={styles.viewPlanText}>View Full Plan</Text>
                </TouchableOpacity>
            </View>

            {/* Social Actions */}
            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.post_id, index)}>
                    <MaterialIcons
                        name={item.liked_by_me ? "favorite" : "favorite-border"}
                        size={22}
                        color={item.liked_by_me ? COLORS.danger : COLORS.textMuted}
                    />
                    <Text style={styles.actionText}>{item.likes_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleRemix(item)}>
                    <MaterialIcons name="alt-route" size={22} color={COLORS.textMuted} />
                    <Text style={styles.actionText}>Remix ({item.remix_count})</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={styles.actionBtnIcon} onPress={() => handleShare(item)}>
                    <MaterialIcons name="share" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnIcon}>
                    <MaterialIcons name="bookmark-border" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Communauté</Text>
            <FlatList
                data={feed}
                keyExtractor={(item) => item.post_id}
                renderItem={renderPost}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListFooterComponent={loading && !refreshing ? <Text style={styles.loadingText}>Loading...</Text> : null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: COLORS.surface },
    listContent: { padding: 16, gap: 20 },
    loadingText: { textAlign: 'center', margin: 20, color: COLORS.textMuted },

    postCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '33' },
    username: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    remixBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '11', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    remixText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },

    caption: { fontSize: 15, color: COLORS.text, lineHeight: 22, marginBottom: 16 },

    embeddedTrip: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 16,
    },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    destination: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    price: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
    duration: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, marginBottom: 12 },

    whyBox: { marginBottom: 12 },
    whyBullet: { fontSize: 13, color: COLORS.success, marginBottom: 4 },
    tradeoffBox: { fontSize: 13, color: COLORS.warning, fontWeight: '600', marginBottom: 16, fontStyle: 'italic' },

    viewPlanButton: { backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    viewPlanText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

    actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 4 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionBtnIcon: { padding: 4 },
    actionText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
});
