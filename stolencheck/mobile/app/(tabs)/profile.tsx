import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, fontSize } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: fontSize.xxl, fontWeight: 'bold' }}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={{ fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text }}>
          {user?.name}
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
          {user?.email}
        </Text>
        <View style={{
          backgroundColor: colors.primary,
          borderRadius: 16,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          marginTop: spacing.sm,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: fontSize.xs, fontWeight: '600' }}>
            {user?.role}
          </Text>
        </View>
      </View>

      {user?.phone && (
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: spacing.lg,
          marginTop: spacing.md,
        }}>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>Phone</Text>
          <Text style={{ fontSize: fontSize.md, color: colors.text, marginTop: spacing.xs }}>
            {user.phone}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: colors.danger,
          borderRadius: 12,
          padding: spacing.md,
          alignItems: 'center',
          marginTop: spacing.xl,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' }}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
