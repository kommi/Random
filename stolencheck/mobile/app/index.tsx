import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { colors } from '../constants/theme';

export default function Index() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/(auth)/login'); return; }
    switch (user.role) {
      case 'VICTIM': router.replace('/(victim)/dashboard'); break;
      case 'BUYER': router.replace('/(buyer)/verify'); break;
      case 'OFFICER': case 'ADMIN': router.replace('/(officer)/dashboard'); break;
      default: router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>StoleCheck</Text>
      <Text style={{ fontSize: 14, color: '#94A3B8' }}>AI-Powered Stolen Goods Detection</Text>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 32 }} />
    </View>
  );
}
