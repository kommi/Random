import { View, Text, Image } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  match: {
    rank: number;
    similarityScore: number;
    tps: number;
    stolenItem: {
      scid: string;
      title: string;
      category: string;
      stolenAt: string;
      images: { url: string; isPrimary: boolean }[];
      identifiers: { type: string; value: string }[];
      user?: { name: string; phone?: string };
    };
    matchedImage?: { url: string };
  };
}

export default function OfficerMatchCard({ match }: Props) {
  const primaryImage = match.matchedImage?.url || match.stolenItem.images?.find((i) => i.isPrimary)?.url || match.stolenItem.images?.[0]?.url;
  const bandColor = match.tps >= 70 ? colors.tpsRed : match.tps >= 40 ? colors.tpsAmber : colors.tpsGreen;
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: `${bandColor}40` }}>
      <View style={{ height: 3, backgroundColor: bandColor }} />
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row' }}>
          {primaryImage && <Image source={{ uri: primaryImage }} style={{ width: 80, height: 80, borderRadius: 12, marginRight: 12, backgroundColor: '#F1F5F9' }} />}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{match.stolenItem.title}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{match.stolenItem.scid} | {match.stolenItem.category}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
              <View style={{ backgroundColor: `${bandColor}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: bandColor }}>TPS: {match.tps}%</Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Similarity: {Math.round(match.similarityScore * 100)}%</Text>
            </View>
          </View>
        </View>
        {match.stolenItem.identifiers.length > 0 && (
          <View style={{ marginTop: 10, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text, marginBottom: 4 }}>IDENTIFIERS</Text>
            {match.stolenItem.identifiers.map((id, i) => (
              <Text key={i} style={{ fontSize: 12, color: colors.text }}>{id.type}: {id.value}</Text>
            ))}
          </View>
        )}
        {match.stolenItem.user && (
          <View style={{ marginTop: 8, backgroundColor: '#F0FDF4', borderRadius: 8, padding: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.success, marginBottom: 2 }}>VICTIM</Text>
            <Text style={{ fontSize: 12, color: colors.text }}>{match.stolenItem.user.name}</Text>
            {match.stolenItem.user.phone && <Text style={{ fontSize: 12, color: colors.text }}>{match.stolenItem.user.phone}</Text>}
          </View>
        )}
      </View>
    </View>
  );
}
