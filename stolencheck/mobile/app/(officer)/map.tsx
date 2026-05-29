import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import client from '../../api/client';
import { colors } from '../../constants/theme';

interface MapAlert {
  id: string;
  lat: number;
  lng: number;
  tps: number;
  urgencyLevel: string;
  status: string;
  createdAt: string;
  location?: string;
  matchedItemTitle?: string;
}

const urgencyPinColors: Record<string, string> = {
  HIGH: colors.tpsRed,
  MEDIUM: colors.tpsAmber,
  LOW: colors.tpsGreen,
};

export default function OfficerMap() {
  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    client.get('/alerts/map')
      .then(({ data }) => {
        setAlerts(Array.isArray(data) ? data : data.alerts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredAlerts = filter ? alerts.filter((a) => a.urgencyLevel === filter) : alerts;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const initialRegion = filteredAlerts.length > 0
    ? { latitude: filteredAlerts[0].lat, longitude: filteredAlerts[0].lng, latitudeDelta: 0.15, longitudeDelta: 0.15 }
    : { latitude: 17.385, longitude: 78.4867, latitudeDelta: 0.2, longitudeDelta: 0.2 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.primary }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: '#fff', fontWeight: '600' }}>&#8592; Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#fff' }}>Alert Map</Text>
        <Text style={{ color: '#94A3B8', fontSize: 13, width: 60, textAlign: 'right' }}>{filteredAlerts.length} alerts</Text>
      </View>

      {/* Filter Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity
          onPress={() => setFilter(null)}
          style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: filter === null ? colors.primary : '#F1F5F9' }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: filter === null ? '#fff' : colors.textSecondary }}>All</Text>
        </TouchableOpacity>
        {[
          { label: 'High', value: 'HIGH', color: colors.tpsRed },
          { label: 'Medium', value: 'MEDIUM', color: colors.tpsAmber },
          { label: 'Low', value: 'LOW', color: colors.tpsGreen },
        ].map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setFilter(filter === f.value ? null : f.value)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: filter === f.value ? f.color : '#F1F5F9' }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: filter === f.value ? '#fff' : f.color }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: filter === f.value ? '#fff' : colors.textSecondary }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map */}
      <MapView style={{ flex: 1 }} initialRegion={initialRegion}>
        {filteredAlerts.map((alert) => (
          <Marker
            key={alert.id}
            coordinate={{ latitude: alert.lat, longitude: alert.lng }}
            pinColor={urgencyPinColors[alert.urgencyLevel] || colors.textSecondary}
            title={`TPS: ${Math.round(alert.tps)} | ${alert.urgencyLevel}`}
            description={`${alert.status}${alert.location ? ` | ${alert.location}` : ''}`}
            onCalloutPress={() => router.push(`/(officer)/photo-alert/${alert.id}`)}
          />
        ))}
      </MapView>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border }}>
        {[
          { label: 'High Risk', color: colors.tpsRed },
          { label: 'Medium Risk', color: colors.tpsAmber },
          { label: 'Low Risk', color: colors.tpsGreen },
        ].map((l) => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: l.color }} />
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{l.label}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
