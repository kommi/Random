import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import client from '../../../api/client';
import { colors, spacing, fontSize } from '../../../constants/theme';

const CATEGORIES = ['All', 'Electronics', 'Jewelry', 'Vehicle', 'Document', 'Clothing', 'Other'];

interface SearchResult {
  id: string;
  scid: string;
  title: string;
  category: string;
  description: string;
  brand?: string;
  model?: string;
  status: string;
  images: { url: string; isPrimary: boolean }[];
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (resetPage = true) => {
    const currentPage = resetPage ? 1 : page;
    setLoading(true);
    if (resetPage) setPage(1);

    try {
      const params: any = { page: currentPage };
      if (query.trim()) params.q = query.trim();
      if (category !== 'All') params.category = category;

      const { data } = await client.get('/verify/search', { params });

      if (resetPage) {
        setResults(data.items || []);
      } else {
        setResults((prev) => [...prev, ...(data.items || [])]);
      }
      setHasMore(data.hasMore || false);
      setSearched(true);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [query, category, page]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
      search(false);
    }
  };

  const renderItem = ({ item }: { item: SearchResult }) => {
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
              style={{ width: 70, height: 70, borderRadius: 8, marginRight: spacing.md }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }}>{item.title}</Text>
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
              {item.brand && (
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  {item.brand} {item.model || ''}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <TextInput
            style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, backgroundColor: colors.surface, color: colors.text, fontSize: fontSize.md }}
            value={query}
            onChangeText={setQuery}
            placeholder="Search stolen items..."
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={() => search(true)}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={() => search(true)}
            style={{ backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: spacing.lg, justifyContent: 'center' }}
          >
            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: fontSize.sm }}>Search</Text>
          </TouchableOpacity>
        </View>

        <ScrollableCategories
          selected={category}
          onSelect={(cat) => { setCategory(cat); }}
        />
      </View>

      {loading && results.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : results.length === 0 && searched ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <Text style={{ fontSize: fontSize.lg, color: colors.textSecondary, textAlign: 'center' }}>
            No results found
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
            Try different search terms or categories
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ padding: spacing.md }} /> : null}
        />
      )}
    </View>
  );
}

function ScrollableCategories({ selected, onSelect }: { selected: string; onSelect: (cat: string) => void }) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={CATEGORIES}
      keyExtractor={(item) => item}
      style={{ marginBottom: spacing.sm }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onSelect(item)}
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: 20,
            backgroundColor: selected === item ? colors.primary : colors.surface,
            marginRight: spacing.sm,
          }}
        >
          <Text style={{ color: selected === item ? '#FFF' : colors.text, fontSize: fontSize.sm, fontWeight: '500' }}>
            {item}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}
