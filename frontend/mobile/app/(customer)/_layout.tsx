import { useMemo } from 'react';
import { Tabs, Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import type { RootState } from '@/store';
import { FONT, RADIUS } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, color }: { name: IoniconsName; focused: boolean; color: string | import('react-native').ColorValue }) {
  const COLORS = useColors();
  const tabStyles = useMemo(() => createTabStyles(COLORS), [COLORS]);
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Ionicons name={name} size={24} color={color} />
    </View>
  );
}

const createTabStyles = (COLORS: Palette) => StyleSheet.create({
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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  if (!accessToken) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="businesses" />
        <Stack.Screen name="business/[id]" />
        <Stack.Screen name="booking/[id]" />
      </Stack>
    );
  }
  return <>{children}</>;
}

export default function CustomerLayout() {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const COLORS = useColors();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="businesses"
        options={{
          headerShown: true,
          headerTitle: 'İşletmeler',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: FONT.bold, fontSize: FONT.md },
        }}
      />
      <Stack.Screen
        name="business/[id]"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="booking/[id]"
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="reviews" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="gift-coupons" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="privacy" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="support" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
  );
}
