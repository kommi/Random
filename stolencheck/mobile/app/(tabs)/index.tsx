import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, fontSize } from '../../constants/theme';

function QuickAction({ title, description, onPress, color }: { title: string; description: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: color,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text }}>{title}</Text>
      <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>{description}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg }}>
        <Text style={{ fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text }}>
          Welcome, {user?.name}
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
          Role: {user?.role}
        </Text>

        <View style={{ marginTop: spacing.xl }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
            Quick Actions
          </Text>

          {user?.role === 'VICTIM' && (
            <>
              <QuickAction
                title="Report Stolen Item"
                description="Register a new stolen item with photos and details"
                onPress={() => router.push('/(tabs)/victim/register-item')}
                color={colors.danger}
              />
              <QuickAction
                title="View My Items"
                description="Track the status of your reported items"
                onPress={() => router.push('/(tabs)/victim/my-items')}
                color={colors.primary}
              />
            </>
          )}

          {user?.role === 'BUYER' && (
            <>
              <QuickAction
                title="Scan Item"
                description="Take a photo or enter ID to check against database"
                onPress={() => router.push('/(tabs)/buyer/scan')}
                color={colors.warning}
              />
              <QuickAction
                title="Search Database"
                description="Search the stolen items database"
                onPress={() => router.push('/(tabs)/buyer/search')}
                color={colors.primary}
              />
            </>
          )}

          {user?.role === 'OFFICER' && (
            <>
              <QuickAction
                title="View Alerts"
                description="Review pending stolen item match alerts"
                onPress={() => router.push('/(tabs)/officer/alerts')}
                color={colors.danger}
              />
              <QuickAction
                title="Alert Map"
                description="View alerts on a map"
                onPress={() => router.push('/(tabs)/officer/map')}
                color={colors.primary}
              />
            </>
          )}
        </View>

        <View style={{
          marginTop: spacing.xl,
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: spacing.lg,
        }}>
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
            About StoleCheck
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            StoleCheck helps combat stolen goods by connecting victims, buyers, and law enforcement.
            Victims register stolen items, buyers can verify items before purchase, and officers
            receive real-time alerts on potential matches.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
