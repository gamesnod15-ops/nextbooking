import React, { useState, useMemo, useCallback } from 'react';
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
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonList } from '@/components/ui/Skeleton';
import api, { fixImageUrl } from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';
import { useUserLocation } from '@/lib/useUserLocation';

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
  averageRating: number;
  reviewCount: number;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
}

function formatDistance(km: number | null): string | null {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

interface CategoryItem {
  id: number;
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
const SLIDE_WIDTH = Math.round(Dimensions.get('window').width * 0.66);

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Kuaför & Berber': 'cut-outline',
  'Güzellik Salonu': 'sparkles-outline',
  'Spa & Masaj': 'flower-outline',
  'Tırnak Salonu': 'hand-left-outline',
  'Klinik': 'medkit-outline',
  'Diş Hekimi': 'medical-outline',
  'Fizyoterapi': 'body-outline',
  'Spor Salonu': 'barbell-outline',
  'Kişisel Antrenör': 'fitness-outline',
  'Yoga': 'leaf-outline',
  'Dövme': 'brush-outline',
  'Veteriner': 'paw-outline',
  'Oto Servis': 'car-outline',
  'Oto Yıkama': 'water-outline',
  'Tamir & Bakım': 'construct-outline',
  'Danışmanlık': 'briefcase-outline',
  'Psikolog': 'happy-outline',
  'Diyetisyen': 'nutrition-outline',
  'Özel Ders': 'book-outline',
  'Fotoğrafçı': 'camera-outline',
};

function categoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICONS[name] ?? 'pricetag-outline';
}

export default function BusinessesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(true);
  const [expandedCities, setExpandedCities] = useState(true);

  const location = useUserLocation();

  const { data: favorites = [], refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const deviceId = await getDeviceId();
      const res = await api.get(`/favorites/by-device?deviceId=${deviceId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });
  useFocusEffect(useCallback(() => { refetchFavorites(); }, [refetchFavorites]));
  const favoriteIds = useMemo(() => new Set(favorites.map((f: any) => f.businessId)), [favorites]);

  const favoriteMutation = useMutation({
    mutationFn: async ({ businessId, isFavorite }: { businessId: string; isFavorite: boolean }) => {
      const deviceId = await getDeviceId();
      if (isFavorite) await api.delete(`/favorites/by-device/${businessId}?deviceId=${deviceId}`);
      else await api.post(`/favorites/by-device/${businessId}?deviceId=${deviceId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const businessesQuery = useQuery({
    queryKey: ['businesses-list', search, selectedCategories, selectedCities, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategories.length > 0) params.set('categoryIds', selectedCategories.join(','));
      if (selectedCities.length > 0) params.set('cities', selectedCities.join(','));
      params.set('pageNumber', String(page));
      params.set('pageSize', String(PAGE_SIZE));
      const res = await api.get(`/businesses?${params.toString()}`);
      return res.data as PaginatedResult<BusinessItem>;
    },
    staleTime: 60 * 1000,
    placeholderData: (prev: PaginatedResult<BusinessItem> | undefined) => prev,
  });
  // Nearby slider — only meaningful once we have a GPS fix.
  const nearbyQuery = useQuery({
    queryKey: ['businesses-nearby', location.coords?.latitude, location.coords?.longitude],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('pageNumber', '1');
      params.set('pageSize', '10');
      params.set('lat', String(location.coords!.latitude));
      params.set('lng', String(location.coords!.longitude));
      const res = await api.get(`/businesses?${params.toString()}`);
      return res.data as PaginatedResult<BusinessItem>;
    },
    enabled: !!location.coords,
    staleTime: 2 * 60 * 1000,
  });
  const nearby = nearbyQuery.data?.items ?? [];

  const data = businessesQuery.data ?? null;
  const loading = businessesQuery.isLoading;
  const refreshing = businessesQuery.isFetching && !businessesQuery.isLoading;
  const error = businessesQuery.isError ? 'İşletmeler yüklenirken bir hata oluştu.' : '';

  const { data: filterSource = [] } = useQuery({
    queryKey: ['businesses-filter-source'],
    queryFn: async () => {
      const res = await api.get('/businesses?pageNumber=1&pageSize=200');
      return (res.data?.items ?? (Array.isArray(res.data) ? res.data : [])) as BusinessItem[];
    },
    staleTime: 5 * 60 * 1000,
  });

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

  function selectQuickCategory(id: number | null) {
    setSelectedCategories(id === null ? [] : [id]);
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

  function renderNearbyCard({ item }: { item: BusinessItem }) {
    const imageUrl = item.coverImageUrl || item.logoUrl;
    const isFavorite = favoriteIds.has(item.id);
    const dist = formatDistance(item.distanceKm);
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.slideCard}
        onPress={() => router.push(`/(customer)/business/${item.id}`)}
      >
        <View style={styles.slideImageWrap}>
          {imageUrl ? (
            <Image source={{ uri: fixImageUrl(imageUrl) }} style={styles.slideImage} />
          ) : (
            <View style={[styles.slideImage, styles.cardImageFallback]}>
              <Avatar name={item.name} size={48} />
            </View>
          )}
          {dist && (
            <View style={styles.distancePill}>
              <Ionicons name="navigate" size={10} color={COLORS.white} />
              <Text style={styles.distancePillText}>{dist}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.slideBookmark}
            onPress={() => favoriteMutation.mutate({ businessId: item.id, isFavorite })}
            disabled={favoriteMutation.isPending}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Ionicons name={isFavorite ? 'bookmark' : 'bookmark-outline'} size={15} color={isFavorite ? COLORS.primary : COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.slideBody}>
          <Text style={styles.slideName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.slideCategory} numberOfLines={1}>{item.categoryName}</Text>
          <View style={styles.slideMetaRow}>
            {item.reviewCount > 0 ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={COLORS.warning} />
                <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({item.reviewCount})</Text>
              </View>
            ) : (
              <Text style={styles.ratingCount}>Yeni</Text>
            )}
            {item.city ? <Text style={styles.slideCity} numberOfLines={1}>{item.city}</Text> : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderNearbySection() {
    const granted = location.status === 'granted';
    const asking = location.status === 'loading';

    return (
      <View style={styles.nearbyWrap}>
        <View style={styles.sectionHeaderInline}>
          <Text style={styles.sectionTitle}>Yakındaki İşletmeler</Text>
          {granted && nearby.length > 0 && (
            <View style={styles.sectionAction}>
              <Ionicons name="location" size={13} color={COLORS.primary} />
              <Text style={styles.sectionActionText}>Konumuna göre</Text>
            </View>
          )}
        </View>

        {!granted ? (
          <View style={styles.locationCard}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationTitle}>
                {location.status === 'disabled' ? 'Konum servisi kapalı' : 'Yakınındakileri gör'}
              </Text>
              <Text style={styles.locationText}>
                {location.status === 'denied'
                  ? 'Konum izni reddedildi. Ayarlardan izin vererek en yakın işletmeleri sıralayabilirsin.'
                  : location.status === 'disabled'
                  ? 'Cihazının konum servisini açtıktan sonra tekrar dene.'
                  : location.status === 'unavailable'
                  ? 'Konum alınamadı. Tekrar denemek ister misin?'
                  : 'Konumunu paylaş, sana en yakın işletmeleri mesafeye göre sıralayalım.'}
              </Text>
              <TouchableOpacity
                style={styles.locationBtn}
                onPress={location.status === 'denied' ? location.openSettings : location.request}
                disabled={asking}
                activeOpacity={0.85}
              >
                {asking ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="navigate" size={14} color={COLORS.white} />
                    <Text style={styles.locationBtnText}>
                      {location.status === 'denied' ? 'Ayarları Aç' : 'Konumu Aç'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : nearbyQuery.isLoading ? (
          <View style={styles.nearbyLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : nearby.length === 0 ? (
          <Text style={styles.nearbyEmpty}>Yakınında kayıtlı işletme bulunamadı.</Text>
        ) : (
          <FlatList
            data={nearby}
            keyExtractor={(i) => `nearby-${i.id}`}
            renderItem={renderNearbyCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SLIDE_WIDTH + SPACE[3]}
            decelerationRate="fast"
            contentContainerStyle={styles.sliderContent}
          />
        )}

        <Text style={[styles.sectionTitle, styles.allTitle]}>Tüm İşletmeler</Text>
      </View>
    );
  }

  function renderBusinessCard({ item }: { item: BusinessItem }) {
    const imageUrl = item.coverImageUrl || item.logoUrl;
    const isFavorite = favoriteIds.has(item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.card}
        onPress={() => router.push(`/(customer)/business/${item.id}`)}
      >
        <View style={styles.cardImageWrap}>
          {imageUrl ? (
            <Image source={{ uri: fixImageUrl(imageUrl) }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardImageFallback]}>
              <Avatar name={item.name} size={56} />
            </View>
          )}
          <TouchableOpacity
            style={styles.bookmarkBtn}
            onPress={() => favoriteMutation.mutate({ businessId: item.id, isFavorite })}
            disabled={favoriteMutation.isPending}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Ionicons name={isFavorite ? 'bookmark' : 'bookmark-outline'} size={18} color={isFavorite ? COLORS.primary : COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Badge variant="default" size="sm">{item.categoryName}</Badge>
          </View>

          <View style={styles.subRow}>
            {item.reviewCount > 0 ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={COLORS.warning} />
                <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({item.reviewCount} değerlendirme)</Text>
              </View>
            ) : (
              <Text style={styles.ratingCount}>Henüz değerlendirme yok</Text>
            )}
          </View>

          <View style={styles.bottomRow}>
            {item.city ? (
              <View style={styles.cityRow}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.cityText}>{item.city}</Text>
              </View>
            ) : <View />}
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => router.push(`/(customer)/business/${item.id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={14} color={COLORS.white} />
              <Text style={styles.bookBtnText}>Randevu Al</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[COLORS.primaryDark, '#08224B']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>İşletmeler</Text>
            <Text style={styles.heroTitle}>Keşfedin</Text>
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Filtrele"
          >
            <Ionicons name="options-outline" size={20} color={COLORS.white} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.heroSubtitle}>{'Hizmet almak istediğin işletmeyi\nkeşfet, randevunu kolayca al.'}</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="İşletme adı veya kategori ara..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={handleSearch}
            accessibilityLabel="İşletme ara"
          />
          {search ? (
            <TouchableOpacity onPress={() => handleSearch('')} accessibilityRole="button" accessibilityLabel="Aramayı temizle">
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        style={styles.quickCatsScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickCats}
      >
        <TouchableOpacity
          style={[styles.quickChip, selectedCategories.length === 0 && styles.quickChipActive]}
          onPress={() => selectQuickCategory(null)}
          activeOpacity={0.8}
        >
          <Ionicons name="apps-outline" size={15} color={selectedCategories.length === 0 ? COLORS.white : COLORS.text} />
          <Text style={[styles.quickChipText, selectedCategories.length === 0 && styles.quickChipTextActive]}>Tümü</Text>
        </TouchableOpacity>
        {allCategories.map((cat) => {
          const active = selectedCategories.length === 1 && selectedCategories[0] === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.quickChip, active && styles.quickChipActive]}
              onPress={() => selectQuickCategory(active ? null : cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons name={categoryIcon(cat.name)} size={15} color={active ? COLORS.white : COLORS.text} />
              <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          style={styles.activeFiltersScroll}
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
        <View style={{ paddingHorizontal: SPACE[5] }}>
          <SkeletonList variant="card" count={4} />
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderBusinessCard}
          contentContainerStyle={{ padding: SPACE[4], paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          // Kept as the list header (not a sibling) so the nearby slider and the
          // location prompt scroll with the list — and stay visible even when the
          // list below is empty or errored.
          ListHeaderComponent={renderNearbySection}
          ListEmptyComponent={
            error ? (
              <View style={styles.inlineState}>
                <Ionicons name="alert-circle-outline" size={44} color={COLORS.textSecondary} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => businessesQuery.refetch()} activeOpacity={0.8}>
                  <Text style={styles.retryBtnText}>Tekrar Dene</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inlineState}>
                <Ionicons name="business-outline" size={44} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>İşletme bulunamadı</Text>
              </View>
            )
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => businessesQuery.refetch()} tintColor={COLORS.primary} />}
          onEndReached={() => {
            if (data?.hasNextPage) {
              setPage(page + 1);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            <View style={{ gap: SPACE[3] }}>
              {data?.hasNextPage && (
                <View style={{ paddingVertical: SPACE[3] }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              )}
              <View style={styles.promoCard}>
                <View style={styles.promoIconWrap}>
                  <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoTitle}>Hızlı Randevu, Kolay Yönetim</Text>
                  <Text style={styles.promoText}>İşletmelerle hızlıca iletişime geçin, randevunuzu kolayca oluşturun.</Text>
                </View>
              </View>
            </View>
          }
        />
      )}

      <Modal visible={showFilterModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtreler</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Kapat">
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
                    accessibilityLabel="Şehir ara"
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
              onPress={() => setShowFilterModal(false)}
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

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[5], gap: SPACE[4], borderBottomLeftRadius: RADIUS['2xl'], borderBottomRightRadius: RADIUS['2xl'], overflow: 'hidden' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: SPACE[4] },
  greet: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.5)' },
  heroTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.white },
  heroSubtitle: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.65)', lineHeight: 19 },
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
  quickCatsScroll: { flexGrow: 0, flexShrink: 0, height: 64 },
  quickCats: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE[4], paddingTop: SPACE[3], paddingBottom: SPACE[2], gap: SPACE[2] },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  quickChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  quickChipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  quickChipTextActive: { color: COLORS.white },
  activeFiltersScroll: { flexGrow: 0, flexShrink: 0, height: 54 },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACE[5], paddingTop: SPACE[3] },
  nearbyWrap: { marginBottom: SPACE[2] },
  sectionHeaderInline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE[3] },
  allTitle: { marginTop: SPACE[5], marginBottom: SPACE[3] },
  sliderContent: { gap: SPACE[3], paddingRight: SPACE[2] },
  nearbyLoading: { paddingVertical: SPACE[6], alignItems: 'center' },
  nearbyEmpty: { fontSize: FONT.sm, color: COLORS.textMuted, paddingVertical: SPACE[4] },

  slideCard: {
    width: SLIDE_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  slideImageWrap: { position: 'relative' },
  slideImage: { width: '100%', height: 104 },
  slideBookmark: {
    position: 'absolute', top: SPACE[2], right: SPACE[2],
    width: 30, height: 30, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm,
  },
  distancePill: {
    position: 'absolute', bottom: SPACE[2], left: SPACE[2],
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(8,34,75,0.82)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  distancePillText: { fontSize: 10, fontWeight: FONT.bold, color: COLORS.white },
  slideBody: { padding: SPACE[3], gap: 3 },
  slideName: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  slideCategory: { fontSize: FONT.xs, color: COLORS.textMuted },
  slideMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, gap: SPACE[2] },
  slideCity: { fontSize: FONT.xs, color: COLORS.textMuted, flexShrink: 1 },

  locationCard: {
    flexDirection: 'row',
    gap: SPACE[3],
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    borderWidth: 1,
    borderColor: COLORS.primary + '22',
  },
  locationIconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  locationTitle: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  locationText: { fontSize: FONT.xs, color: COLORS.textSecondary, lineHeight: 17, marginTop: 3 },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    alignSelf: 'flex-start', marginTop: SPACE[3],
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: 16, paddingVertical: 9, minWidth: 130,
    ...SHADOW.primary,
  },
  locationBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  sectionTitle: { fontSize: FONT.lg, fontWeight: FONT.extrabold, color: COLORS.text },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE[3] },
  inlineState: { alignItems: 'center', justifyContent: 'center', gap: SPACE[3], paddingVertical: SPACE[8] },
  errorText: { fontSize: FONT.sm, color: COLORS.error, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  retryBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  emptyText: { fontSize: FONT.sm, color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginBottom: SPACE[4],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: 140 },
  cardImageFallback: { backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  bookmarkBtn: {
    position: 'absolute',
    top: SPACE[3],
    right: SPACE[3],
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  cardBody: { padding: SPACE[4], gap: 6 },
  cardName: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  subRow: { flexDirection: 'row', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  ratingCount: { fontSize: FONT.xs, color: COLORS.textMuted },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cityText: { fontSize: FONT.xs, color: COLORS.textMuted },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    ...SHADOW.primary,
  },
  bookBtnText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.white },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    marginTop: SPACE[1],
  },
  promoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  promoText: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
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
