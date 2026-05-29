import { useEffect, useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useItemStore } from '../../store/itemStore';
import { colors } from '../../constants/theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: colors.dangerLight, text: colors.danger },
  RECOVERED: { bg: colors.successLight, text: colors.success },
  UNDER_INVESTIGATION: { bg: colors.warningLight, text: colors.warning },
  CLOSED: { bg: '#E2E8F0', text: '#64748B' },
};

export default function VictimDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { items, isLoading, fetchMyItems } = useItemStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchMyItems(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyItems();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const activeCount = items.filter((i) => i.status === 'ACTIVE').length;
  const recoveredCount = items.filter((i) => i.status === 'RECOVERED').length;
  const investigatingCount = items.filter((i) => i.status === 'UNDER_INVESTIGATION').length;

  const renderItem = ({ item }: { item: typeof items[0] }) => {
    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.ACTIVE;
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(victim)/item/${item.id}`)}
        style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600', letterSpacing: 1 }}>{item.scid}</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 4 }}>{item.title}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{item.category} {item.brand ? `- ${item.brand}` : ''}</Text>
          </View>
          <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: statusStyle.text }}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>
        {item.stolenLocation && (
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>Location: {item.stolenLocation}</Text>
        )}
        {item.stolenAt && (
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Stolen: {new Date(item.stolenAt).toLocaleDateString()}</Text>
        )}
        {item.images && item.images.length > 0 && (
          <Text style={{ fontSize: 11, color: colors.primary, marginTop: 6 }}>{item.images.length} photo(s) attached</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 14, color: '#94A3B8' }}>Welcome back,</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>{items.length}</Text>
            <Text style={{ fontSize: 11, color: '#94A3B8' }}>Total</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.danger }}>{activeCount}</Text>
            <Text style={{ fontSize: 11, color: '#94A3B8' }}>Active</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.warning }}>{investigatingCount}</Text>
            <Text style={{ fontSize: 11, color: '#94A3B8' }}>Investigating</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.success }}>{recoveredCount}</Text>
            <Text style={{ fontSize: 11, color: '#94A3B8' }}>Recovered</Text>
          </View>
        </View>
      </View>

      {/* Items List */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>My Stolen Items</Text>
        {isLoading && items.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>&#128274;</Text>
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>No items registered</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>Tap the + button below to register a stolen item</Text>
              </View>
            }
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/(victim)/register-item/step1-category')}
        style={{
          position: 'absolute', bottom: 30, right: 20, width: 60, height: 60,
          borderRadius: 30, backgroundColor: colors.primary,
          justifyContent: 'center', alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
        }}
      >
        <Text style={{ fontSize: 28, color: '#fff', fontWeight: '300', marginTop: -2 }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
