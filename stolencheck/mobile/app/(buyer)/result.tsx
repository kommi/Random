import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/theme';

function getScoreColor(score: number) {
  if (score >= 70) return colors.tpsRed;
  if (score >= 40) return colors.tpsAmber;
  return colors.tpsGreen;
}

function getScoreLabel(score: number) {
  if (score >= 70) return 'HIGH RISK';
  if (score >= 40) return 'MODERATE RISK';
  return 'LOW RISK';
}

function getUrgencyMessage(score: number) {
  if (score >= 70) return 'This item has a high probability of being stolen. Do NOT proceed with purchase. Contact law enforcement immediately.';
  if (score >= 40) return 'This item shows some similarity to reported stolen items. Exercise caution and verify further before purchasing.';
  return 'No significant matches found in the stolen items database. This item appears safe to purchase.';
}

export default function VerificationResult() {
  const router = useRouter();
  const { result: resultStr } = useLocalSearchParams<{ result: string }>();
  const { user } = useAuthStore();
  const isOfficer = user?.role === 'OFFICER' || user?.role === 'ADMIN';

  const result = resultStr ? JSON.parse(resultStr) : null;
  if (!result) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 16, color: colors.textSecondary }}>No results available</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const tpsScore = result.tpsScore ?? result.score ?? 0;
  const scoreColor = getScoreColor(tpsScore);
  const matches = result.matches || result.items || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>&#8592; Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text }}>Verification Result</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* TPS Score Circle */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <View style={{
            width: 140, height: 140, borderRadius: 70,
            backgroundColor: scoreColor, justifyContent: 'center', alignItems: 'center',
            shadowColor: scoreColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
          }}>
            <Text style={{ fontSize: 42, fontWeight: '800', color: '#fff' }}>{tpsScore}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>TPS Score</Text>
          </View>
          <View style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: scoreColor + '20' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: scoreColor }}>{getScoreLabel(tpsScore)}</Text>
          </View>
        </View>

        {/* Urgency Message */}
        <View style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: tpsScore >= 70 ? colors.dangerLight : tpsScore >= 40 ? colors.warningLight : colors.successLight, borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: tpsScore >= 70 ? colors.danger : tpsScore >= 40 ? colors.warning : colors.success, lineHeight: 22 }}>
            {getUrgencyMessage(tpsScore)}
          </Text>
        </View>

        {/* Matched Items */}
        {matches.length > 0 && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 }}>
              Matched Items ({matches.length})
            </Text>
            {matches.map((item: any, idx: number) => (
              <View key={item.id || idx} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                {/* Images */}
                {item.images && item.images.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {item.images.map((img: any, imgIdx: number) => (
                        <View key={imgIdx} style={{ borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                          <Image
                            source={{ uri: img.url }}
                            style={{ width: 90, height: 90, backgroundColor: '#E2E8F0' }}
                            resizeMode="cover"
                            blurRadius={isOfficer ? 0 : 15}
                          />
                          {!isOfficer && (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>BLURRED</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}

                <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600', letterSpacing: 1 }}>{item.scid || 'N/A'}</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 }}>{item.title}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {item.category}{item.brand ? ` - ${item.brand}` : ''}{item.model ? ` ${item.model}` : ''}
                </Text>

                {item.matchScore !== undefined && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Match confidence: </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: getScoreColor(item.matchScore) }}>{item.matchScore}%</Text>
                  </View>
                )}

                {item.identifiers && item.identifiers.length > 0 && (
                  <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                    {item.identifiers.map((ident: any, iIdx: number) => (
                      <Text key={iIdx} style={{ fontSize: 12, color: colors.textSecondary }}>
                        {ident.type}: {ident.value}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {matches.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>&#9989;</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>No Matches Found</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>
              This item was not found in the stolen items database.
            </Text>
          </View>
        )}

        {/* Scan Again Button */}
        <View style={{ padding: 20, paddingBottom: 40 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Scan Another Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
