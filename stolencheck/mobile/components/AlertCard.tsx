import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  alert: {
    id: string;
    urgencyLevel: string;
    overallTPS: number;
    topSimilarityScore: number;
    scanLocation?: string;
    scannedAt: string;
    alertStatus: string;
    matches?: any[];
  };
  onPress: () => void;
}

const urgencyColors: Record<string, string> = {
  HIGH: colors.tpsRed,
  MEDIUM: colors.tpsAmber,
  LOW: colors.tpsGreen,
};

export default function AlertCard({ alert, onPress }: Props) {
  const urgColor = urgencyColors[alert.urgencyLevel] || colors.textSecondary;
  const timeAgo = getTimeAgo(alert.scannedAt);
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
      <View style={{ height: 4, backgroundColor: urgColor }} />
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: `${urgColor}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: urgColor }}>{alert.urgencyLevel}</Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{alert.alertStatus}</Text>
          </View>
          <View style={{ backgroundColor: `${urgColor}15`, borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: urgColor }}>{Math.round(alert.overallTPS)}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 14, color: colors.text, marginTop: 8 }} numberOfLines={1}>{alert.scanLocation || 'Unknown location'}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Similarity: {Math.round(alert.topSimilarityScore * 100)}%</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>{timeAgo}</Text>
        </View>
        {alert.matches && <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{alert.matches.length} match(es)</Text>}
      </View>
    </TouchableOpacity>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
