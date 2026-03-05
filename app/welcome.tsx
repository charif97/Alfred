import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../lib/constants';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.hero}>
                <Text style={styles.emoji}>✈️</Text>
                <Text style={styles.title}>ALFRED</Text>
                <Text style={styles.subtitle}>Ton poto voyage</Text>
                <Text style={styles.description}>
                    Je t'aide à organiser tes voyages de A à Z.{'\n'}
                    Budget, transport, hébergement — je gère tout.
                </Text>
            </View>
            <View style={styles.features}>
                <FeatureRow emoji="🧠" text="J'apprends ton style de voyage" />
                <FeatureRow emoji="📊" text="3 plans optimisés à chaque fois" />
                <FeatureRow emoji="💬" text="On discute comme des potes" />
                <FeatureRow emoji="🔒" text="Tes données restent privées" />
            </View>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/onboarding')}
            >
                <Text style={styles.buttonText}>Commencer avec Alfred</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.skipButton}
                onPress={() => router.replace('/(tabs)')}
            >
                <Text style={styles.skipText}>Passer pour l'instant</Text>
            </TouchableOpacity>
        </View>
    );
}

function FeatureRow({ emoji, text }: { emoji: string; text: string }) {
    return (
        <View style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{emoji}</Text>
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 24, justifyContent: 'center' },
    hero: { alignItems: 'center', marginBottom: 40 },
    emoji: { fontSize: 64, marginBottom: 16 },
    title: { fontSize: 48, fontWeight: '800', color: COLORS.primary, letterSpacing: 4 },
    subtitle: { fontSize: 20, color: COLORS.textSecondary, marginTop: 8 },
    description: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 22 },
    features: { marginBottom: 40 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 20 },
    featureEmoji: { fontSize: 24, marginRight: 16 },
    featureText: { fontSize: 16, color: COLORS.text },
    button: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
    buttonText: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
    skipButton: { alignItems: 'center', paddingVertical: 12 },
    skipText: { color: COLORS.textMuted, fontSize: 14 },
});
