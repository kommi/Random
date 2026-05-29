import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import client from '../../../api/client';
import { colors, spacing, fontSize } from '../../../constants/theme';

interface AlertItem {
  id: string;
  type: string;
  status: string;
  confidence: number;
  lat?: number;
  lng?: number;
  createdAt: string;
  item?: {
    id: string;
    scid: string;
    title: string;
    category: string;
  };
  notes?: string;
}

interface Stats {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
}

const STATUS_FILTERS = ['ALL', 'PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'];

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes] = await Promise.all([
        client.get('/alerts/'),
        client.get('/alerts/stats'),
      ]);
      setAlerts(alertsRes.data.alerts || alertsRes.data || []);
      setStats(statsRes.data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateAlert = async (alertId: string, status: string) => {
    try {
      await client.patch(`/alerts/${alertId}`, { status, notes: notes || undefined });
      setNotes('');
      setExpandedId(null);
      fetchData();
      Alert.alert('Updated', `Alert status changed to ${status}`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update alert');
    }
  };

  const filteredAlerts = filter === 'ALL' ? alerts : alerts.filter((a) => a.status === filter);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return colors.danger;
    if (confidence >= 0.5) return colors.warning;
    return colors.success;
  };

  const renderAlert = ({ item }: { item: AlertItem }) => {
    const isExpanded = expandedId === item.id;
    const confidenceColor = getConfidenceColor(item.confidence);

    return (
      <TouchableOpacity
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          marginBottom: spacing.md,
          borderLeftWidth: 4,
          borderLeftColor: confidenceColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View style={{ padding: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }}>
                {item.item?.title || 'Unknown Item'}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                {item.item?.scid || 'No SCID'} | {item.type}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{
                backgroundColor: confidenceColor === colors.danger ? colors.dangerLight :
                  confidenceColor === colors.warning ? colors.warningLight : colors.successLight,
                borderRadius: 12,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
              }}>
                <Text style={{ color: confidenceColor, fontSize: fontSize.xs, fontWeight: '600' }}>
                  {Math.round(item.confidence * 100)}%
                </Text>
              </View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                {item.status}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.sm }}>
            {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
          </Text>

          {isExpanded && (
            <View style={{ marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }}>
              {item.item && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>
                    Category: {item.item.category}
                  </Text>
                </View>
              )}

              {item.lat && item.lng && (
                <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
                  Location: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                </Text>
              )}

              <TextInput
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.md, minHeight: 60, textAlignVertical: 'top', color: colors.text, fontSize: fontSize.sm }}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {item.status !== 'INVESTIGATING' && (
                  <TouchableOpacity
                    onPress={() => updateAlert(item.id, 'INVESTIGATING')}
                    style={{ flex: 1, backgroundColor: colors.warning, borderRadius: 8, padding: spacing.sm, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '600', fontSize: fontSize.sm }}>Investigate</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => updateAlert(item.id, 'RESOLVED')}
                  style={{ flex: 1, backgroundColor: colors.success, borderRadius: 8, padding: spacing.sm, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: fontSize.sm }}>Resolve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateAlert(item.id, 'DISMISSED')}
                  style={{ flex: 1, backgroundColor: colors.textSecondary, borderRadius: 8, padding: spacing.sm, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: fontSize.sm }}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Stats */}
      {stats && (
        <View style={{ flexDirection: 'row', padding: spacing.md, gap: spacing.sm }}>
          {[
            { label: 'Total', value: stats.total, color: colors.primary },
            { label: 'Pending', value: stats.pending, color: colors.warning },
            { label: 'Active', value: stats.investigating, color: colors.danger },
            { label: 'Resolved', value: stats.resolved, color: colors.success },
          ].map((stat) => (
            <View key={stat.label} style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: spacing.sm,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: 'bold', color: stat.color }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Filters */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STATUS_FILTERS}
        keyExtractor={(item) => item}
        style={{ maxHeight: 44, paddingHorizontal: spacing.md }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setFilter(item)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: 20,
              backgroundColor: filter === item ? colors.primary : colors.surface,
              marginRight: spacing.sm,
            }}
          >
            <Text style={{ color: filter === item ? '#FFF' : colors.text, fontSize: fontSize.sm, fontWeight: '500' }}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Alert list */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: fontSize.lg, color: colors.textSecondary }}>No alerts</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
