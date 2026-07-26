import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Platform } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { store } from '@/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NetworkProvider } from '@/components/OfflineBanner';
import { ToastProvider } from '@/components/ui/Toast';
import { reportError } from '@/lib/errorReporting';
import { usePushNotifications } from '@/lib/pushNotifications';
import { UpdateGate } from '@/components/UpdateGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 2 },
    mutations: {
      // Surface write failures we would otherwise only see in a local catch.
      onError: (error) => reportError(error, { scope: 'mutation' }),
    },
  },
});

/** Lives inside the providers so it can use the router for notification taps. */
function PushBridge() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <NetworkProvider>
                <ToastProvider>
                  <UpdateGate>
                    <PushBridge />
                    <StatusBar style="dark" />
                    {Platform.OS === 'android' && <NavigationBar hidden style="dark" />}
                    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="welcome" />
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(business)" />
                      <Stack.Screen name="(customer)" />
                    </Stack>
                  </UpdateGate>
                </ToastProvider>
              </NetworkProvider>
            </SafeAreaProvider>
          </QueryClientProvider>
        </Provider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
