import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/theme';

interface Stats {
  open: number;
  acknowledged: number;
  resolvedToday: number;
  highUrgencyOpen: number;
}

const URGENCY_STYLES: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: colors.dangerLight, text: colors.danger },
  MEDIUM: { bg: colors.warningLight, text: colors.warning },
  LOW: { bg: colors.successLight, text: colors.success },
};

export default function OfficerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        client.get('/alerts/stats'),
        client.get('/alerts'),
      ]);
      setStats(statsRes.data);
      const alertsList = alertsRes.data.alerts || alertsRes.data || [];
      // Sort by urgency: HIGH first, then MEDIUM, then LOW
      const urgencyOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      alertsList.sort((a: any, b: any) => (urgencyOrder[a.urgencyLevel] ?? 3) - (urgencyOrder[b.urgencyLevel] ?? 3));
      setAlerts(alertsList);
    } catch (err) {
      console.error('Failed to fetch officer data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const renderAlert = ({ item }: { item: any }) => {
    const urgencyStyle = URGENCY_STYLES[item.urgencyLevel] || URGENCY_STYLES.LOW;
    const tpsScore = item.tpsScore ?? item.tps ?? 0;
    const scoreColor = tpsScore >= 70 ? colors.tpsRed : tpsScore >= 40 ? colors.tpsAmber : colors.tpsGreen;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(officer)/photo-alert/${item.id}`)}
        style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderLeftWidth: 4, borderLeftColor: urgencyStyle.text }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: urgencyStyle.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: urgencyStyle.text }}>{item.urgencyLevel}</Text>
              </View>
              <View style={{ backgroundColor: item.status === 'OPEN' ? colors.dangerLight : item.status === 'ACKNOWLEDGED' ? colors.warningLight : colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: item.status === 'OPEN' ? colors.danger : item.status === 'ACKNOWLEDGED' ? colors.warning : colors.success }}>{item.status}</Text>
              </View>
            </View>
            {item.matchedItem && (
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 8 }}>{item.matchedItem.title || 'Unknown Item'}</Text>
            )}
            {item.location && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>&#128205; {item.location}</Text>
            )}
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown time'}
            </Text>
          </View>

          {/* TPS Score Badge */}
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: scoreColor, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{Math.round(tpsScore)}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 8, fontWeight: '600' }}>TPS</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 14, color: '#94A3B8' }}>Officer Dashboard</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>{user?.name || 'Officer'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => router.push('/(officer)/map')} style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats Bar */}
      {stats && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 8 }}>
          <StatBox label="Open" value={stats.open} color={colors.danger} />
          <StatBox label="Acknowledged" value={stats.acknowledged} color={colors.warning} />
          <StatBox label="Resolved Today" value={stats.resolvedToday} color={colors.success} />
          <StatBox label="High Urgency" value={stats.highUrgencyOpen} color={colors.tpsRed} />
        </View>
      )}

      {/* Alerts List */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Active Alerts</Text>
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlert}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>&#128274;</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>No active alerts</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>All clear! No alerts to review.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderLeftWidth: 3, borderLeftColor: color, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
