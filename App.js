import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';

import { Toasts } from './src/atomComponents';
import { LIGHT as c } from './src/globalStyle/tokens';
import { AppProvider } from './src/hooks/useStore';
import StackNavigator from './src/navigation/StackNavigator';

/**
 * Mirrors the web's `__root.tsx`: QueryClientProvider → AppProvider → shell.
 *
 * The web's `AppShell` draws a 390pt phone frame with a notch on a desktop
 * page; on a device that frame IS the screen, so the only part of it that
 * survives here is `<Toasts />`, which it rendered as a sibling of the routes.
 * It stays a sibling of the navigator for the same reason: a toast has to float
 * over whichever screen is on top.
 *
 * The status bar is dark-content because the web has one light theme and every
 * screen is light behind the bar — the dark splash, onboarding and auth headers
 * all paint their own background underneath a translucent bar.
 */
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppProvider>
          <View style={styles.root}>
            <StatusBar backgroundColor="transparent" translucent />
            <NavigationContainer>
              <StackNavigator />
            </NavigationContainer>
            <Toasts />
          </View>
        </AppProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
});
