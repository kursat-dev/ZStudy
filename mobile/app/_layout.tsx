import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { View } from 'react-native';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.dark.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="video/[id]"
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="quiz/[id]"
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="flashcards/[id]"
            options={{ animation: 'slide_from_bottom' }}
          />
        </Stack>
      </View>
    </AuthProvider>
  );
}
