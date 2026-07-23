import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/lib/api';

interface BusinessItem {
  id: string;
  name: string;
  categoryId: number;
  categoryName: string;
  city: string | null;
  phone: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  description: string | null;
  isActive: boolean;
}

interface CategoryItem {
  id: number;
  name: string;
  count: number;
}

interface CityItem {
  name: string;
  count: number;
}

interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const PAGE_SIZE = 20;

export default function BusinessesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResult<BusinessItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filterSource, setFilterSource] = useState<BusinessItem[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(true);
  const [expandedCities, setExpandedCities] = useState(true);

  const fetchBusinesses = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategories.length > 0) params.set('categoryIds', selectedCategories.join(','));
      if (selectedCities.length > 0) params.set('cities', selectedCities.join(','));
      params.set('pageNumber', String(pageNum));
      params.set('pageSize', String(PAGE_SIZE));

      const res = await api.get(`/businesses?${params.toString()}`);
      setData(res.data);
    } catch (e: any) {
      setError('İşletmeler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategories, selectedCities]);

  useEffect(() => {
    fetchBusinesses(1);
  }, [fetchBusinesses]);

  useEffect(() => {
    api.get('/businesses?pageNumber=1&pageSize=200')
      .then((res) => {
        const items = res.data?.items ?? (Array.isArray(res.data) ? res.data : []);
        setFilterSource(items);
      })
      .catch(() => {});
  }, []);

  const allCategories = useMemo(() => {
    const byId = new Map<number, { name: string; count: number }>();
    for (const b of filterSource) {
      const existing = byId.get(b.categoryId);
      if (existing) existing.count++;
      else byId.set(b.categoryId, { name: b.categoryName, count: 1 });
    }
    return [...byId.entries()]
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [filterSource]);

  const allCities = useMemo(() => {
    const cityMap = new Map<string, number>();
    for (const b of filterSource) {
      if (b.city) cityMap.set(b.city, (cityMap.get(b.city) || 0) + 1);
    }
    return [...cityMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [filterSource]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return allCities;
    return allCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()));
  }, [allCities, citySearch]);

  const activeFilterCount = selectedCategories.length + selectedCities.length;

  function toggleCategory(id: number) {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    setPage(1);
  }

  function toggleCity(cityName: string) {
    setSelectedCities(prev =>
      prev.includes(cityName) ? prev.filter(c => c !== cityName) : [...prev, cityName]
    );
    setPage(1);
  }

  function clearAllFilters() {
    setSelectedCategories([]);
    setSelectedCities([]);
    setSearch('');
    setPage(1);
  }

  function removeFilter(type: 'category' | 'city', value: number | string) {
    if (type === 'category') {
      setSelectedCategories(prev => prev.filter(c => c !== value));
    } else {
      setSelectedCities(prev => prev.filter(c => c !== value));
    }
    setPage(1);
  }

  function handleSearch(text: string) {
    setSearch(text);
    setPage(1);
  }

  function renderBusinessCard({ item }: { item: BusinessItem }) {
    const initials = item.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.listCard}
        onPress={() => router.push(`/(customer)/business/${item.id}`)}
      >
        <View style={styles.listCardLeft}>
          {item.coverImageUrl ? (
            <Avatar name={item.name} size={56} url={item.coverImageUrl} />
          ) : item.logoUrl ? (
            <Avatar name={item.name} size={56} url={item.logoUrl} />
          ) : (
            <Avatar name={item.name} size={56} />
          )}
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Badge variant="default" size="sm">{item.categoryName}</Badge>
            {item.city && (
              <View style={styles.cityBadge}>
                <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
                <Text style={styles.cityText}>{item.city}</Text>
              </View>
            )}
          </View>
          {item.description && (
            <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
          )}
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push(`/(customer)/business/${item.id}`)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={14} color={COLORS.white} />
            <Text style={styles.bookBtnText}>Randevu Al</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[COLORS.primaryDark, '#08224B']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greet}>İşletmeler</Text>
            <Text style={styles.heroTitle}>Keşfedin</Text>
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={20} color={COLORS.white} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="İşletme adı veya kategori ara..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={handleSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFilters}
        >
          {selectedCategories.map(catId => {
            const cat = allCategories.find(c => c.id === catId);
            return cat ? (
              <TouchableOpacity key={`cat-${catId}`} style={styles.filterChip} onPress={() => removeFilter('category', catId)} activeOpacity={0.7}>
                <Text style={styles.filterChipText}>{cat.name}</Text>
                <Ionicons name="close" size={12} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null;
          })}
          {selectedCities.map(cityName => (
            <TouchableOpacity key={`city-${cityName}`} style={[styles.filterChip, styles.cityChip]} onPress={() => removeFilter('city', cityName)} activeOpacity={0.7}>
              <Text style={[styles.filterChipText, styles.cityChipText]}>{cityName}</Text>
              <Ionicons name="close" size={12} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.clearChip} onPress={clearAllFilters} activeOpacity={0.7}>
            <Text style={styles.clearChipText}>Tümünü Temizle</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBusinesses(1)} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : !data || data.items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="business-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>İşletme bulunamadı</Text>
        </View>
      ) : (
        <FlatList
          data={data.items}
          keyExtractor={(item) => item.id}
          renderItem={renderBusinessCard}
          contentContainerStyle={{ padding: SPACE[4], paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBusinesses(page, true)} tintColor={COLORS.primary} />}
          onEndReached={() => {
            if (data.hasNextPage) {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchBusinesses(nextPage);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            data.hasNextPage ? (
              <View style={{ paddingVertical: SPACE[4] }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
        />
      )}

      <Modal visible={showFilterModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtreler</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.filterSection}
              activeOpacity={1}
              onPress={() => setExpandedCategories(!expandedCategories)}
            >
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterSectionTitle}>Kategoriler</Text>
                <Ionicons
                  name={expandedCategories ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </View>
            </TouchableOpacity>
            {expandedCategories && (
              <View style={styles.filterSectionContent}>
                {allCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.filterItem}
                    onPress={() => toggleCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, selectedCategories.includes(cat.id) && styles.checkboxActive]}>
                      {selectedCategories.includes(cat.id) && (
                        <Ionicons name="checkmark" size={12} color={COLORS.white} />
                      )}
                    </View>
                    <Text style={styles.filterItemText}>{cat.name}</Text>
                    <Text style={styles.filterItemCount}>{cat.count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.filterSection}
              activeOpacity={1}
              onPress={() => setExpandedCities(!expandedCities)}
            >
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterSectionTitle}>Şehirler</Text>
                <Ionicons
                  name={expandedCities ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </View>
            </TouchableOpacity>
            {expandedCities && (
              <View style={styles.filterSectionContent}>
                <View style={styles.citySearchBox}>
                  <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.citySearchInput}
                    placeholder="Şehir ara..."
                    placeholderTextColor={COLORS.textMuted}
                    value={citySearch}
                    onChangeText={setCitySearch}
                  />
                </View>
                {filteredCities.map((cityItem) => (
                  <TouchableOpacity
                    key={cityItem.name}
                    style={styles.filterItem}
                    onPress={() => toggleCity(cityItem.name)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, selectedCities.includes(cityItem.name) && styles.checkboxActive]}>
                      {selectedCities.includes(cityItem.name) && (
                        <Ionicons name="checkmark" size={12} color={COLORS.white} />
                      )}
                    </View>
                    <Text style={styles.filterItemText}>{cityItem.name}</Text>
                    <Text style={styles.filterItemCount}>{cityItem.count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + SPACE[4] }]}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearAllFilters} activeOpacity={0.8}>
              <Text style={styles.clearBtnText}>Temizle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => { setShowFilterModal(false); fetchBusinesses(1); }}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Uygula</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[5], gap: SPACE[4] },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: SPACE[4] },
  greet: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.5)' },
  heroTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.white },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 10, fontWeight: FONT.bold, color: COLORS.white },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACE[4],
    gap: SPACE[2],
    height: 48,
  },
  searchInput: { flex: 1, fontSize: FONT.base, color: COLORS.text },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    gap: SPACE[2],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  filterChipText: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.primary },
  cityChip: { backgroundColor: COLORS.primaryMuted, borderColor: COLORS.primary + '30' },
  cityChipText: { color: COLORS.primary },
  clearChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearChipText: { fontSize: FONT.xs, fontWeight: FONT.medium, color: COLORS.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE[3] },
  errorText: { fontSize: FONT.sm, color: COLORS.error, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  retryBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  emptyText: { fontSize: FONT.sm, color: COLORS.textMuted },
  listCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    gap: SPACE[3],
    marginBottom: SPACE[3],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  listCardLeft: {},
  listInfo: { flex: 1, gap: 6 },
  listName: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cityBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cityText: { fontSize: FONT.xs, color: COLORS.textMuted },
  descText: { fontSize: FONT.xs, color: COLORS.textSecondary, lineHeight: 18 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: 2,
    ...SHADOW.primary,
  },
  bookBtnText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.white },
  modalRoot: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  modalScroll: { flex: 1 },
  filterSection: {
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[4],
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterSectionTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  filterSectionContent: {
    paddingHorizontal: SPACE[5],
    paddingBottom: SPACE[4],
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE[3],
    gap: SPACE[3],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterItemText: { flex: 1, fontSize: FONT.sm, color: COLORS.text },
  filterItemCount: { fontSize: FONT.xs, color: COLORS.textMuted },
  citySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACE[3],
    gap: SPACE[2],
    height: 40,
    marginBottom: SPACE[3],
  },
  citySearchInput: { flex: 1, fontSize: FONT.sm, color: COLORS.text },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[4],
    gap: SPACE[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  clearBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtnText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  applyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    ...SHADOW.primary,
  },
  applyBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
});
