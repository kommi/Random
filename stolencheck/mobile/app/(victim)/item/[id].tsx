import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItemStore } from '../../../store/itemStore';
import { colors } from '../../../constants/theme';
import client from '../../../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: colors.dangerLight, text: colors.danger },
  RECOVERED: { bg: colors.successLight, text: colors.success },
  UNDER_INVESTIGATION: { bg: colors.warningLight, text: colors.warning },
  CLOSED: { bg: '#E2E8F0', text: '#64748B' },
};

interface VerificationRecord {
  id: string;
  tpsScore: number;
  urgency: string;
  scanType: string;
  createdAt: string;
  location?: string;
}

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getItem = useItemStore((s) => s.getItem);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const data = await getItem(id!);
      setItem(data);
      // Fetch verification history
      try {
        const { data: vData } = await client.get(`/items/${id}/verifications`);
        setVerifications(vData.verifications || []);
      } catch {
        // Verification endpoint may not exist yet
      }
    } catch (err) {
      console.error('Failed to load item:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 16, color: colors.textSecondary }}>Item not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.ACTIVE;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>&#8592; Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text }}>Item Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Images */}
        {item.images && item.images.length > 0 && (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIdx(idx);
              }}
            >
              {item.images.map((img: any, idx: number) => (
                <Image
                  key={img.id || idx}
                  source={{ uri: img.url }}
                  style={{ width: SCREEN_WIDTH, height: 260, backgroundColor: '#E2E8F0' }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {item.images.length > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 }}>
                {item.images.map((_: any, idx: number) => (
                  <View key={idx} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: idx === activeImageIdx ? colors.primary : '#CBD5E1' }} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Info Card */}
        <View style={{ margin: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600', letterSpacing: 1 }}>{item.scid}</Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4 }}>{item.title}</Text>
              </View>
              <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: statusStyle.text }}>{item.status?.replace('_', ' ')}</Text>
              </View>
            </View>

            {item.description && (
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12, lineHeight: 20 }}>{item.description}</Text>
            )}

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

            {/* Detail rows */}
            <View style={{ gap: 10 }}>
              {item.category && <DetailRow label="Category" value={item.category} />}
              {item.brand && <DetailRow label="Brand" value={item.brand} />}
              {item.model && <DetailRow label="Model" value={item.model} />}
              {item.color && <DetailRow label="Color" value={item.color} />}
              {item.estimatedValue && <DetailRow label="Estimated Value" value={`$${item.estimatedValue.toLocaleString()}`} />}
              {item.stolenAt && <DetailRow label="Stolen Date" value={new Date(item.stolenAt).toLocaleDateString()} />}
              {item.stolenLocation && <DetailRow label="Stolen Location" value={item.stolenLocation} />}
              {item.firNumber && <DetailRow label="FIR Number" value={item.firNumber} />}
            </View>
          </View>

          {/* Identifiers */}
          {item.identifiers && item.identifiers.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Identifiers</Text>
              {item.identifiers.map((ident: any, idx: number) => (
                <View key={ident.id || idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx < item.identifiers.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>{ident.type}</Text>
                  <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>{ident.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Verification History */}
          {verifications.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Verification History</Text>
              {verifications.map((v, idx) => {
                const scoreColor = v.tpsScore >= 70 ? colors.tpsRed : v.tpsScore >= 40 ? colors.tpsAmber : colors.tpsGreen;
                return (
                  <View key={v.id || idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: idx < verifications.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: scoreColor, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{v.tpsScore}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{v.scanType} scan</Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>{new Date(v.createdAt).toLocaleString()}</Text>
                      {v.location && <Text style={{ fontSize: 11, color: colors.textSecondary }}>{v.location}</Text>}
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: v.urgency === 'HIGH' ? colors.dangerLight : v.urgency === 'MEDIUM' ? colors.warningLight : colors.successLight }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: v.urgency === 'HIGH' ? colors.danger : v.urgency === 'MEDIUM' ? colors.warning : colors.success }}>{v.urgency}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 13, color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
