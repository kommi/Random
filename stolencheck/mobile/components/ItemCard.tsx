import { View, Text, TouchableOpacity, Image } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  item: {
    scid: string;
    title: string;
    category: string;
    status: string;
    stolenAt: string;
    brand?: string;
    images?: { url: string; isPrimary: boolean }[];
  };
  onPress: () => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: colors.dangerLight, text: colors.danger },
  RECOVERED: { bg: colors.successLight, text: colors.success },
  CLOSED: { bg: '#F1F5F9', text: colors.textSecondary },
};

export default function ItemCard({ item, onPress }: Props) {
  const sc = statusColors[item.status] || statusColors.ACTIVE;
  const primaryImage = item.images?.find((i) => i.isPrimary) || item.images?.[0];
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 12, marginBottom: 12, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
      {primaryImage && <Image source={{ uri: primaryImage.url }} style={{ width: 72, height: 72, borderRadius: 12, marginRight: 12, backgroundColor: '#F1F5F9' }} />}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={1}>{item.title}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{item.scid} | {item.category}</Text>
        {item.brand && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.brand}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
          <View style={{ backgroundColor: sc.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: sc.text }}>{item.status}</Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>{new Date(item.stolenAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
