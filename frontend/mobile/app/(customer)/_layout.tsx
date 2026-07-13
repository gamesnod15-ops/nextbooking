import { Tabs, Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import type { RootState } from '@/store';
import { COLORS, FONT, RADIUS } from '@/lib/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, color }: { name: IoniconsName; focused: boolean; color: string | import('react-native').ColorValue }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Ionicons name={name} size={24} color={color} />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 48,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  iconWrapActive: {
    backgroundColor: COLORS.primaryMuted,
  },
});

export default function CustomerLayout() {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  if (!accessToken) return <Redirect href="/(auth)/login?role=customer" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryDark,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 74,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: FONT.bold },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Keşfet', tabBarIcon: ({ focused, color }) => <TabIcon name="search-outline" focused={focused} color={color} /> }} />
      <Tabs.Screen name="appointments" options={{ title: 'Randevularım', tabBarIcon: ({ focused, color }) => <TabIcon name="calendar-outline" focused={focused} color={color} /> }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoriler', tabBarIcon: ({ focused, color }) => <TabIcon name="heart-outline" focused={focused} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ focused, color }) => <TabIcon name="person-outline" focused={focused} color={color} /> }} />
    </Tabs>
  );
}

