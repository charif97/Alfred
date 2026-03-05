import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../lib/constants';

export default function TripHistoryScreen() {
    const trips = [
        { id: '1', destination: 'Madrid', date: 'Mars 2026', plan: 'A', score: 82, status: 'completed', feedback: 'up' },
        { id: '2', destination: 'Istanbul', date: 'Fév 2026', plan: 'B', score: 74, status: 'completed', feedback: 'up' },
        { id: '3', destination: 'Tanger', date: 'Jan 2026', plan: 'A', score: 88, status: 'completed', feedback: null },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.heading}>Historique</Text>
            <Text style={styles.subheading}>Tes voyages passés et feedbacks</Text>

            {trips.map((trip) => (
                <View key={trip.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.destination}>{trip.destination}</Text>
                        <Text style={styles.date}>{trip.date}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.detail}>Plan {trip.plan} — Score {trip.score}/100</Text>
                        <Text style={styles.feedback}>
                            {trip.feedback === 'up' ? '👍' : trip.feedback === 'down' ? '👎' : '—'}
                        </Text>
                    </View>
                    {!trip.feedback && (
                        <View style={styles.feedbackRow}>
                            <TouchableOpacity style={styles.feedbackBtn}>
                                <Text style={styles.feedbackBtnText}>👍</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.feedbackBtn}>
                                <Text style={styles.feedbackBtnText}>👎</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16 },
    heading: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
    subheading: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
    card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    destination: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    date: { fontSize: 14, color: COLORS.textMuted },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detail: { fontSize: 14, color: COLORS.textSecondary },
    feedback: { fontSize: 20 },
    feedbackRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    feedbackBtn: { flex: 1, backgroundColor: COLORS.surfaceLight, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    feedbackBtnText: { fontSize: 24 },
});
