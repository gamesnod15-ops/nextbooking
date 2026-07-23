import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/lib/api';

const CATEGORIES = ['Tümü', 'Kuaför', 'Güzellik', 'Tırnak', 'Berber', 'Masaj'];
const MOCK_BUSINESSES = [
  { id: '1', name: 'Elit Güzellik Salonu', category: 'Güzellik', rating: 4.9, reviewCount: 248, distance: '0.4 km', priceFrom: 150, services: ['Saç', 'Cilt', 'Manikür'], isOpen: true, nextSlot: 'Bugün 15:30' },
  { id: '2', name: 'Master Berber', category: 'Berber', rating: 4.7, reviewCount: 182, distance: '0.8 km', priceFrom: 80, services: ['Saç Kesimi', 'Sakal'], isOpen: true, nextSlot: 'Bugün 14:00' },
  { id: '3', name: 'Nail Studio Pro', category: 'Tırnak', rating: 4.8, reviewCount: 97, distance: '1.2 km', priceFrom: 120, services: ['Manikür', 'Pedikür', 'Oje'], isOpen: false, nextSlot: 'Yarın 10:00' },
  { id: '4', name: 'Saç & Stil Atölyesi', category: 'Kuaför', rating: 4.6, reviewCount: 304, distance: '1.5 km', priceFrom: 200, services: ['Saç Kesimi', 'Boyama', 'Fön'], isOpen: true, nextSlot: 'Bugün 17:00' },
];

export default function CustomerHomeScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tümü');
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => { const res = await api.get('/businesses'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
    placeholderData: MOCK_BUSINESSES,
  });

  const filtered = (businesses ?? MOCK_BUSINESSES).filter((b: any) => {
    const matchCat = category === 'Tümü' || b.category === category;
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Hero Header */}
      <LinearGradient colors={[COLORS.primaryDark, '#08224B']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greet}>Merhaba 👋</Text>
            <Text style={styles.heroTitle}>Ne arıyorsunuz?</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Salon, hizmet veya konum ara…"
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], gap: SPACE[2] }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipActive]} onPress={() => setCategory(c)} activeOpacity={0.8}>
              <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured */}
        {category === 'Tümü' && !search && (
          <>
            <Text style={styles.sectionTitle}>Öne Çıkanlar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], gap: SPACE[3] }}>
              {MOCK_BUSINESSES.slice(0, 3).map((b: any) => (
                <TouchableOpacity key={b.id} activeOpacity={0.9} style={styles.featuredCard}>
                  <LinearGradient colors={['rgba(8,34,75,0)', 'rgba(8,34,75,0.7)']} style={styles.featuredOverlay} />
                  <View style={styles.featuredHeader}>
                    <Badge variant={b.isOpen ? 'success' : 'default'} size="sm">{b.isOpen ? 'Açık' : 'Kapalı'}</Badge>
                  </View>
                  <View style={styles.featuredBottom}>
                    <Text style={styles.featuredName}>{b.name}</Text>
                    <View style={styles.featuredMeta}>
                      <Ionicons name="star" size={12} color={COLORS.warning} />
                      <Text style={styles.featuredRating}>{b.rating}</Text>
                      <Text style={styles.featuredDist}>{b.distance}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* List */}
        <Text style={styles.sectionTitle}>{filtered.length} Sonuç</Text>
        {filtered.map((b: any) => (
          <TouchableOpacity key={b.id} activeOpacity={0.9} style={styles.listCard}>
            <View style={styles.listCardLeft}>
              <Avatar name={b.name} size={56} />
            </View>
            <View style={styles.listInfo}>
              <View style={styles.listTitleRow}>
                <Text style={styles.listName}>{b.name}</Text>
                <TouchableOpacity>
                  <Ionicons name="heart-outline" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="star" size={13} color={COLORS.warning} />
                <Text style={styles.rating}>{b.rating}</Text>
                <Text style={styles.reviews}>({b.reviewCount})</Text>
                <Text style={styles.dot}>·</Text>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.dist}>{b.distance}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {b.services.map((s: string) => <Badge key={s} variant="default" size="sm">{s}</Badge>)}
                </View>
              </ScrollView>
              <View style={styles.listFooter}>
                <Text style={styles.priceFrom}>₺{b.priceFrom}'den</Text>
                <TouchableOpacity style={styles.bookBtn}>
                  <Text style={styles.bookBtnText}>{b.nextSlot}</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[5], gap: SPACE[4] },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: SPACE[4] },
  greet: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.5)' },
  heroTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.white },
  notifBtn: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, borderWidth: 1.5, borderColor: COLORS.primaryDark },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, paddingHorizontal: SPACE[4], gap: SPACE[2], height: 48 },
  searchInput: { flex: 1, fontSize: FONT.base, color: COLORS.text },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  catTextActive: { color: COLORS.white },
  sectionTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text, paddingHorizontal: SPACE[5], marginBottom: SPACE[3] },
  featuredCard: { width: 200, height: 130, borderRadius: RADIUS.xl, backgroundColor: COLORS.surfaceAlt, justifyContent: 'space-between', padding: SPACE[4], overflow: 'hidden', ...SHADOW.sm },
  featuredOverlay: { ...StyleSheet.absoluteFill, borderRadius: RADIUS.xl },
  featuredHeader: {},
  featuredBottom: { gap: 3 },
  featuredName: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredRating: { fontSize: FONT.xs, color: COLORS.white, fontWeight: FONT.semibold },
  featuredDist: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.7)' },
  listCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginBottom: SPACE[3], borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  listCardLeft: {},
  listInfo: { flex: 1, gap: 6 },
  listTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listName: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  reviews: { fontSize: FONT.xs, color: COLORS.textMuted },
  dot: { color: COLORS.textMuted },
  dist: { fontSize: FONT.xs, color: COLORS.textMuted },
  listFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  priceFrom: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, ...SHADOW.primary },
  bookBtnText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.white },
});

