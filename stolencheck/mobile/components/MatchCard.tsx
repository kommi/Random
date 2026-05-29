import { View, Text, Image } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  match: {
    rank: number;
    similarityScore: number;
    tps: number;
    tpsBand: string;
    stolenItem: {
      scid: string;
      title: string;
      category: string;
      stolenAt: string;
      primaryImageUrl: string;
      identifiers: { type: string; value: string }[];
    };
  };
}

const bandColors: Record<string, string> = { RED: colors.tpsRed, AMBER: colors.tpsAmber, GREEN: colors.tpsGreen };

export default function MatchCard({ match }: Props) {
  const bandColor = bandColors[match.tpsBand] || colors.textSecondary;
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: `${bandColor}40` }}>
      <View style={{ height: 3, backgroundColor: bandColor }} />
      <View style={{ flexDirection: 'row', padding: 12 }}>
        <Image source={{ uri: match.stolenItem.primaryImageUrl }} style={{ width: 64, height: 64, borderRadius: 10, marginRight: 12, backgroundColor: '#F1F5F9' }} blurRadius={8} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }} numberOfLines={1}>{match.stolenItem.title}</Text>
            <View style={{ backgroundColor: `${bandColor}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: bandColor }}>{match.tps}%</Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{match.stolenItem.category} | {match.stolenItem.scid}</Text>
          {match.stolenItem.identifiers.length > 0 && (
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
              {match.stolenItem.identifiers.map((id) => `${id.type}: ${id.value}`).join(', ')}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
