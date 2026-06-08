import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { theme } from './constants/theme';
import { initDatabase, getAllInspirations, saveSyncInspiration } from './services/database';
import { SyncManager } from './services/sync';
import { BarScreen } from './screens/BarScreen';
import { CaptureScreen } from './screens/CaptureScreen';
import { DetailScreen } from './screens/DetailScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    const initApp = async () => {
      try {
        await initDatabase();
        
        const syncManager = SyncManager.getInstance();
        await syncManager.init(
          {
            deviceName: '灵感调酒师',
            port: 3002,
            autoSync: true,
            syncInterval: 5,
          },
          {
            getLocalInspirations: async () => {
              return await getAllInspirations();
            },
            saveInspiration: async (data: any) => {
              await saveSyncInspiration(data);
            },
            onInspirationReceived: (inspiration) => {
              console.log('[App] Received inspiration:', inspiration.title);
            },
            onDeviceDiscovered: (device) => {
              console.log('[App] Discovered device:', device.name);
            },
            onError: (error) => {
              console.error('[App] Sync error:', error);
            },
          }
        );
      } catch (error) {
        console.error('[App] Initialization error:', error);
      }
    };

    initApp();

    return () => {
      const syncManager = SyncManager.getInstance();
      syncManager.shutdown().catch(console.error);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: theme.colors.surface,
                },
                headerTintColor: theme.colors.onSurface,
                headerTitleStyle: {
                  color: theme.colors.onSurface,
                },
                contentStyle: {
                  backgroundColor: theme.colors.background,
                },
              }}
            >
              <Stack.Screen 
                name="Bar" 
                component={BarScreen} 
                options={{ title: '灵感调酒师' }}
              />
              <Stack.Screen 
                name="Capture" 
                component={CaptureScreen} 
                options={{ title: '捕获灵感' }}
              />
              <Stack.Screen 
                name="Detail" 
                component={DetailScreen} 
                options={{ title: '灵感详情' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="light" />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
