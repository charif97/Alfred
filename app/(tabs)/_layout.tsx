import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarStyle: {
                    backgroundColor: COLORS.surface,
                    borderTopColor: COLORS.border,
                    height: 85,
                    paddingBottom: 20,
                    paddingTop: 10,
                },
                headerStyle: { backgroundColor: COLORS.background },
                headerTintColor: COLORS.text,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Découvrir',
                    tabBarIcon: ({ color }) => <MaterialIcons name="flight-takeoff" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Communauté',
                    tabBarIcon: ({ color }) => <MaterialIcons name="public" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="tribu"
                options={{
                    title: 'Plans',
                    tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
