import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/theme';

const ROLES = [
  { label: 'Buyer', value: 'BUYER', desc: 'Check items before purchasing' },
  { label: 'Victim', value: 'VICTIM', desc: 'Register stolen items' },
  { label: 'Officer', value: 'OFFICER', desc: 'Manage alerts & cases' },
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('BUYER');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) { Alert.alert('Error', 'Please fill in required fields'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register({ name, email, password, phone: phone || undefined, role });
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, backgroundColor: colors.primary }}>
          <View style={{ paddingTop: 60, paddingBottom: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>Create Account</Text>
            <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Join StoleCheck today</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Full Name *</Text>
            <TextInput value={name} onChangeText={setName} placeholder="John Doe" style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 }} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Email *</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 }} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Password *</Text>
            <TextInput value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 }} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Phone</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="+91-9876543210" keyboardType="phone-pad" style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 }} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>I am a...</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {ROLES.map((r) => (
                <TouchableOpacity key={r.value} onPress={() => setRole(r.value)} style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: role === r.value ? colors.primary : colors.border, backgroundColor: role === r.value ? '#EFF6FF' : '#fff', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '600', color: role === r.value ? colors.primary : colors.text, fontSize: 14 }}>{r.label}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleRegister} disabled={loading} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create Account</Text>}
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
              <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
              <Link href="/(auth)/login"><Text style={{ color: colors.primary, fontWeight: '600' }}>Sign In</Text></Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
