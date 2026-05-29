import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../../api/client';
import OfficerMatchCard from '../../../components/OfficerMatchCard';
import ThreatScoreBadge from '../../../components/ThreatScoreBadge';
import { colors } from '../../../constants/theme';

const STATUS_ACTIONS = [
  { status: 'ACKNOWLEDGED', label: 'Acknowledge', color: colors.warning },
  { status: 'DISPATCHED', label: 'Dispatch', color: colors.primary },
  { status: 'RESOLVED', label: 'Resolve', color: colors.success },
  { status: 'FALSE_POSITIVE', label: 'False Positive', color: colors.textSecondary },
];

export default function PhotoAlertDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    client.get(`/alerts/${id}`).then(({ data }) => setAlert(data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const { data } = await client.patch(`/alerts/${id}`, { status });
      setAlert({ ...alert, ...data });
      Alert.alert('Updated', `Alert status changed to ${status}`);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update status');
    } finally { setUpdating(false); }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!alert) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary }}>Alert not found</Text>
      </SafeAreaView>
    );
  }

  const urgColor = alert.urgencyLevel === 'HIGH' ? colors.tpsRed : alert.urgencyLevel === 'MEDIUM' ? colors.tpsAmber : colors.tpsGreen;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.primary }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: '#fff', fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#fff' }}>Alert Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <ThreatScoreBadge score={alert.overallTPS} size={100} band={alert.urgencyLevel} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <View style={{ backgroundColor: `${urgColor}20`, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: urgColor }}>{alert.urgencyLevel}</Text>
            </View>
            <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>{alert.alertStatus}</Text>
            </View>
          </View>
        </View>

        {alert.scanImageUrl && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Scanned Image</Text>
            <Image source={{ uri: alert.scanImageUrl }} style={{ width: '100%', height: 200, borderRadius: 16, backgroundColor: '#F1F5F9' }} resizeMode="cover" />
          </View>
        )}

        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 }}>Scan Details</Text>
          <DetailRow label="Location" value={alert.scanLocation || 'Unknown'} />
          {alert.scanLatitude && <DetailRow label="Coordinates" value={`${alert.scanLatitude.toFixed(4)}, ${alert.scanLongitude?.toFixed(4)}`} />}
          <DetailRow label="Scanned At" value={new Date(alert.scannedAt).toLocaleString()} />
          <DetailRow label="Similarity" value={`${Math.round(alert.topSimilarityScore * 100)}%`} />
          {alert.scannedBy && <DetailRow label="Scanned By" value={alert.scannedBy.name} />}
          {alert.assignedOfficer && <DetailRow label="Assigned To" value={alert.assignedOfficer.name} />}
          {alert.resolutionNotes && <DetailRow label="Notes" value={alert.resolutionNotes} />}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
          Matched Items ({alert.matches?.length || 0})
        </Text>
        {alert.matches?.map((match: any, i: number) => (
          <OfficerMatchCard key={i} match={match} />
        ))}

        {!['RESOLVED', 'FALSE_POSITIVE'].includes(alert.alertStatus) && (
          <View style={{ marginTop: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 }}>Actions</Text>
            <View style={{ gap: 8 }}>
              {STATUS_ACTIONS.filter((a) => a.status !== alert.alertStatus).map((action) => (
                <TouchableOpacity
                  key={action.status}
                  onPress={() => updateStatus(action.status)}
                  disabled={updating}
                  style={{ backgroundColor: action.color, borderRadius: 12, padding: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      <Text style={{ fontSize: 13, color: colors.textSecondary, width: 100 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.text, flex: 1 }}>{value}</Text>
    </View>
  );
}
