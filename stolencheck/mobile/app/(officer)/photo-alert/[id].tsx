import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../../api/client';
import { colors } from '../../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_ACTIONS = [
  { status: 'ACKNOWLEDGED', label: 'Acknowledge', color: colors.warning, desc: 'Mark as reviewed' },
  { status: 'DISPATCHED', label: 'Dispatch', color: colors.primary, desc: 'Send unit to location' },
  { status: 'RESOLVED', label: 'Resolve', color: colors.success, desc: 'Case resolved' },
  { status: 'FALSE_POSITIVE', label: 'False Positive', color: '#64748B', desc: 'Not a match' },
];

const URGENCY_STYLES: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: colors.dangerLight, text: colors.danger },
  MEDIUM: { bg: colors.warningLight, text: colors.warning },
  LOW: { bg: colors.successLight, text: colors.success },
};

export default function PhotoAlertDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [alertData, setAlertData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAlert();
  }, [id]);

  const loadAlert = async () => {
    try {
      const { data } = await client.get(`/alerts/${id}`);
      setAlertData(data);
    } catch (err) {
      console.error('Failed to load alert:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    const action = STATUS_ACTIONS.find((a) => a.status === newStatus);
    Alert.alert(
      `${action?.label || newStatus}`,
      `Are you sure you want to mark this alert as "${newStatus.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              const { data } = await client.patch(`/alerts/${id}/status`, { status: newStatus });
              setAlertData(data);
              Alert.alert('Updated', `Alert status changed to ${newStatus.replace('_', ' ')}`);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!alertData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 16, color: colors.textSecondary }}>Alert not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const tpsScore = alertData.overallTPS ?? alertData.tpsScore ?? alertData.tps ?? 0;
  const scoreColor = tpsScore >= 70 ? colors.tpsRed : tpsScore >= 40 ? colors.tpsAmber : colors.tpsGreen;
  const alertStatus = alertData.alertStatus ?? alertData.status ?? 'OPEN';
  const urgencyLevel = alertData.urgencyLevel ?? 'LOW';
  const urgencyStyle = URGENCY_STYLES[urgencyLevel] || URGENCY_STYLES.LOW;
  const scanImage = alertData.scanImageUrl || alertData.imageUrl;
  const matches = alertData.matches || [];
  const victimContact = alertData.victimContact || alertData.victim || {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>&#8592; Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text }}>Alert Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Score and Urgency Header */}
        <View style={{ backgroundColor: colors.primary, paddingVertical: 24, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 20 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: scoreColor, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>{Math.round(tpsScore)}</Text>
              <Text style={{ fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>TPS</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: urgencyStyle.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: urgencyStyle.text }}>{urgencyLevel} URGENCY</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>{alertStatus.replace('_', ' ')}</Text>
                </View>
              </View>
              {(alertData.scanLocation || alertData.location) && (
                <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>&#128205; {alertData.scanLocation || alertData.location}</Text>
              )}
              <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                {alertData.scannedAt ? new Date(alertData.scannedAt).toLocaleString() : alertData.createdAt ? new Date(alertData.createdAt).toLocaleString() : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {/* Scan Image */}
          {scanImage && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, padding: 16, paddingBottom: 8 }}>Scan Image</Text>
              <Image
                source={{ uri: scanImage }}
                style={{ width: '100%', height: 220, backgroundColor: '#E2E8F0' }}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Scan Details */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 }}>Scan Details</Text>
            {(alertData.scanLocation || alertData.location) && <DetailRow label="Location" value={alertData.scanLocation || alertData.location} />}
            {alertData.scanLatitude && alertData.scanLongitude && <DetailRow label="Coordinates" value={`${alertData.scanLatitude.toFixed(4)}, ${alertData.scanLongitude.toFixed(4)}`} />}
            {alertData.topSimilarityScore != null && <DetailRow label="Similarity" value={`${Math.round(alertData.topSimilarityScore * 100)}%`} />}
            {alertData.scannedBy && <DetailRow label="Scanned By" value={alertData.scannedBy.name || alertData.scannedBy} />}
            {alertData.assignedOfficer && <DetailRow label="Assigned To" value={alertData.assignedOfficer.name || alertData.assignedOfficer} />}
            {alertData.resolutionNotes && <DetailRow label="Notes" value={alertData.resolutionNotes} />}
          </View>

          {/* Matched Items with full unblurred photos */}
          {matches.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
                Matched Items ({matches.length})
              </Text>
              {matches.map((match: any, idx: number) => {
                const item = match.stolenItem || match.item || match;
                const similarity = match.similarityScore ?? match.matchScore ?? 0;
                return (
                  <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                    {/* Unblurred images for officers */}
                    {item.images && item.images.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          {item.images.map((img: any, imgIdx: number) => (
                            <Image
                              key={img.id || imgIdx}
                              source={{ uri: img.url }}
                              style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: '#E2E8F0' }}
                              resizeMode="cover"
                            />
                          ))}
                        </View>
                      </ScrollView>
                    )}

                    <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600', letterSpacing: 1 }}>{item.scid || 'N/A'}</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 }}>{item.title || 'Unknown Item'}</Text>
                    {item.description && (
                      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 19 }} numberOfLines={3}>{item.description}</Text>
                    )}

                    {similarity > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>Match: </Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: similarity >= 0.7 ? colors.tpsRed : similarity >= 0.4 ? colors.tpsAmber : colors.tpsGreen }}>
                          {typeof similarity === 'number' && similarity <= 1 ? `${Math.round(similarity * 100)}%` : `${similarity}%`}
                        </Text>
                      </View>
                    )}

                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

                    <View style={{ gap: 6 }}>
                      {item.category && <DetailRow label="Category" value={item.category} />}
                      {item.brand && <DetailRow label="Brand" value={item.brand} />}
                      {item.model && <DetailRow label="Model" value={item.model} />}
                      {item.color && <DetailRow label="Color" value={item.color} />}
                      {item.estimatedValue && <DetailRow label="Est. Value" value={`$${Number(item.estimatedValue).toLocaleString()}`} />}
                      {item.stolenAt && <DetailRow label="Stolen Date" value={new Date(item.stolenAt).toLocaleDateString()} />}
                      {item.stolenLocation && <DetailRow label="Stolen From" value={item.stolenLocation} />}
                      {item.firNumber && <DetailRow label="FIR Number" value={item.firNumber} />}
                    </View>

                    {/* Identifiers */}
                    {item.identifiers && item.identifiers.length > 0 && (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Identifiers</Text>
                        {item.identifiers.map((ident: any, iIdx: number) => (
                          <View key={ident.id || iIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{ident.type}</Text>
                            <Text style={{ fontSize: 12, color: colors.text }}>{ident.value}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Victim Contact for this match */}
                    {(item.owner || match.victim) && (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Victim Contact</Text>
                        {(item.owner?.name || match.victim?.name) && <DetailRow label="Name" value={item.owner?.name || match.victim?.name} />}
                        {(item.owner?.email || match.victim?.email) && <DetailRow label="Email" value={item.owner?.email || match.victim?.email} />}
                        {(item.owner?.phone || match.victim?.phone) && <DetailRow label="Phone" value={item.owner?.phone || match.victim?.phone} />}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Top-level Victim Contact (if provided separately) */}
          {(victimContact.name || victimContact.email || victimContact.phone) && matches.length === 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 }}>Victim Contact</Text>
              {victimContact.name && <DetailRow label="Name" value={victimContact.name} />}
              {victimContact.email && <DetailRow label="Email" value={victimContact.email} />}
              {victimContact.phone && <DetailRow label="Phone" value={victimContact.phone} />}
            </View>
          )}

          {/* Action Buttons */}
          {!['RESOLVED', 'FALSE_POSITIVE'].includes(alertStatus) && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 }}>Actions</Text>
              <View style={{ gap: 10 }}>
                {STATUS_ACTIONS.map((action) => {
                  const isCurrentStatus = alertStatus === action.status;
                  return (
                    <TouchableOpacity
                      key={action.status}
                      onPress={() => handleStatusUpdate(action.status)}
                      disabled={isCurrentStatus || updating}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        padding: 16, borderRadius: 12,
                        backgroundColor: isCurrentStatus ? action.color + '15' : '#F8FAFC',
                        borderWidth: isCurrentStatus ? 2 : 1,
                        borderColor: isCurrentStatus ? action.color : colors.border,
                        opacity: updating ? 0.6 : 1,
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: isCurrentStatus ? action.color : colors.text }}>{action.label}</Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{action.desc}</Text>
                      </View>
                      {isCurrentStatus && (
                        <View style={{ backgroundColor: action.color, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>CURRENT</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Resolved/False Positive indicator */}
          {['RESOLVED', 'FALSE_POSITIVE'].includes(alertStatus) && (
            <View style={{ backgroundColor: alertStatus === 'RESOLVED' ? colors.successLight : '#F1F5F9', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: alertStatus === 'RESOLVED' ? colors.success : colors.textSecondary }}>
                {alertStatus === 'RESOLVED' ? 'Case Resolved' : 'Marked as False Positive'}
              </Text>
              {alertData.resolutionNotes && (
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>{alertData.resolutionNotes}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {updating && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, fontSize: 14, color: colors.text, fontWeight: '600' }}>Updating status...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500', flex: 2, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
