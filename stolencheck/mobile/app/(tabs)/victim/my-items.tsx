import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useItemStore } from '../../../store/itemStore';
import { colors, spacing, fontSize } from '../../../constants/theme';

const statusColors: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: colors.dangerLight, text: colors.danger },
  FOUND: { bg: colors.successLight, text: colors.success },
  RECOVERED: { bg: colors.successLight, text: colors.success },
  CLOSED: { bg: '#F1F5F9', text: colors.textSecondary },
};

export default function MyItemsScreen() {
  const { items, isLoading, fetchMyItems } = useItemStore();

  useEffect(() => {
    fetchMyItems();
  }, []);

  const renderItem = ({ item }: { item: typeof items[0] }) => {
    const statusStyle = statusColors[item.status] || statusColors.ACTIVE;
    const primaryImage = item.images?.find((i) => i.isPrimary) || item.images?.[0];

    return (
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: spacing.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', padding: spacing.md }}>
          {primaryImage && (
            <Image
              source={{ uri: primaryImage.url }}
              style={{ width: 80, height: 80, borderRadius: 8, marginRight: spacing.md }}
            />
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text, flex: 1 }}>
                {item.title}
              </Text>
              <View style={{ backgroundColor: statusStyle.bg, borderRadius: 12, paddingHorizontal: spacing.sm, paddingVertical: 2, marginLeft: spacing.sm }}>
                <Text style={{ color: statusStyle.text, fontSize: fontSize.xs, fontWeight: '600' }}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
              SCID: {item.scid}
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.primary, backgroundColor: '#EFF6FF', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 }}>
                {item.category}
              </Text>
              {item.estimatedValue && (
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  ${item.estimatedValue.toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && items.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      {items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize.lg, color: colors.textSecondary, textAlign: 'center' }}>
            No items reported yet
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
            Report stolen items to help track and recover them
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchMyItems} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
