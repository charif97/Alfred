import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../lib/constants';
import { SettingsProvider } from '../lib/SettingsContext';

export default function RootLayout() {
    return (
        <SettingsProvider>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: COLORS.background },
                    headerTintColor: COLORS.text,
                    headerTitleStyle: { fontWeight: '700' },
                    contentStyle: { backgroundColor: COLORS.background },
                }}
            >
                <Stack.Screen name="welcome" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ title: 'Ton profil', headerBackVisible: false }} />
                <Stack.Screen name="mood-picker" options={{ title: 'Ton mood', presentation: 'modal' }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="plan-details" options={{ title: 'Détails du plan' }} />
                <Stack.Screen name="trip-history" options={{ title: 'Historique' }} />
            </Stack>
        </SettingsProvider>
    );
}
