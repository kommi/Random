import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, backgroundColor: colors.primary }}>
          <View style={{ paddingTop: 80, paddingBottom: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff' }}>StoleCheck</Text>
            <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Sign in to your account</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Email</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 }} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Password</Text>
            <TextInput value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 24 }} />
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign In</Text>}
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
              <Text style={{ color: colors.textSecondary }}>Don't have an account? </Text>
              <Link href="/(auth)/register"><Text style={{ color: colors.primary, fontWeight: '600' }}>Register</Text></Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
