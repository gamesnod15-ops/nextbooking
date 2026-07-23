import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  TextInput,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

interface ServiceDto {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  imageUrl: string | null;
}

interface EmployeeDto {
  id: string;
  name: string;
  title: string | null;
  avatarUrl: string | null;
}

interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface BusinessDetail {
  id: string;
  name: string;
  categoryId: number;
  categoryName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  workingHours: string | null;
  galleryImages: string[];
  services: ServiceDto[];
  employees: EmployeeDto[];
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= rating ? 'star' : 'star-outline'}
          size={size}
          color={s <= rating ? COLORS.warning : COLORS.border}
        />
      ))}
    </View>
  );
}

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [biz, setBiz] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    api.get(`/businesses/${id}`)
      .then((res) => setBiz(res.data))
      .catch((e) => setError('İşletme bulunamadı.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    api.get(`/reviews/${id}`)
      .then((res) => setReviews(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [id]);

  function toggleFavorite() {
    if (!id) return;
    const updated = favoriteIds.includes(id) ? favoriteIds.filter(x => x !== id) : [...favoriteIds, id];
    setFavoriteIds(updated);
  }

  async function submitReview() {
    if (!authorName.trim() || rating === 0 || !id) return;
    setSubmitting(true);
    try {
      const res = await api.post('/reviews', {
        businessId: id,
        authorName: authorName.trim(),
        rating,
        comment: comment.trim() || null,
      });
      setReviews((prev) => [res.data, ...prev]);
      setAuthorName('');
      setRating(0);
      setComment('');
    } catch {
      Alert.alert('Hata', 'Değerlendirme gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (error || !biz) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Ionicons name="business-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>{error || 'İşletme bulunamadı'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const initials = biz.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  let workingHours: { open: boolean; start: string; end: string }[] = [];
  try { workingHours = biz.workingHours ? JSON.parse(biz.workingHours) : []; } catch {}
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={[COLORS.primaryDark, '#08224B']} style={styles.hero}>
          <View style={[styles.heroNav, { paddingTop: insets.top + SPACE[3] }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroActionBtn} onPress={toggleFavorite} activeOpacity={0.7}>
                <Ionicons
                  name={favoriteIds.includes(id!) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={favoriteIds.includes(id!) ? COLORS.error : COLORS.white}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroActionBtn} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          {biz.galleryImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
              {biz.galleryImages.slice(0, 5).map((img, i) => (
                <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => setSelectedImage(i)}>
                  <Image source={{ uri: img }} style={styles.galleryImage} />
                  {i === 4 && biz.galleryImages.length > 5 && (
                    <View style={styles.galleryMore}>
                      <Text style={styles.galleryMoreText}>+{biz.galleryImages.length - 5}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.heroInfo}>
            {biz.logoUrl ? (
              <Image source={{ uri: biz.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={styles.logoText}>{initials}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={styles.businessName}>{biz.name}</Text>
                <Badge variant="default" size="sm">{biz.categoryName}</Badge>
              </View>
              <View style={styles.heroMeta}>
                {biz.city && (
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.heroMetaText}>{biz.city}</Text>
                  </View>
                )}
                {biz.phone && (
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="call-outline" size={13} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.heroMetaText}>{biz.phone}</Text>
                  </View>
                )}
                {reviews.length > 0 && (
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="star" size={13} color={COLORS.warning} />
                    <Text style={styles.heroMetaText}>{avgRating.toFixed(1)} ({reviews.length})</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {biz.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hakkında</Text>
              <Text style={styles.sectionText}>{biz.description}</Text>
            </View>
          )}

          {biz.services.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hizmetler</Text>
              {biz.services.map((s) => (
                <View key={s.id} style={styles.serviceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{s.name}</Text>
                    {s.description && <Text style={styles.serviceDesc}>{s.description}</Text>}
                    <View style={styles.serviceMeta}>
                      <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.serviceMetaText}>{s.durationMinutes} dk</Text>
                    </View>
                  </View>
                  <Text style={styles.servicePrice}>₺{s.price.toLocaleString('tr-TR')}</Text>
                </View>
              ))}
            </View>
          )}

          {biz.employees.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Çalışanlar</Text>
              <View style={styles.employeesGrid}>
                {biz.employees.map((e) => (
                  <View key={e.id} style={styles.employeeCard}>
                    {e.avatarUrl ? (
                      <Image source={{ uri: e.avatarUrl }} style={styles.employeeAvatar} />
                    ) : (
                      <View style={[styles.employeeAvatar, styles.employeeAvatarPlaceholder]}>
                        <Text style={styles.employeeAvatarText}>
                          {e.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.employeeName}>{e.name}</Text>
                    {e.title && <Text style={styles.employeeTitle}>{e.title}</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
            {biz.address && (
              <TouchableOpacity style={styles.contactRow} activeOpacity={0.7}>
                <View style={styles.contactIcon}>
                  <Ionicons name="location" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Adres</Text>
                  <Text style={styles.contactValue}>{biz.address}</Text>
                </View>
              </TouchableOpacity>
            )}
            {biz.phone && (
              <TouchableOpacity style={styles.contactRow} activeOpacity={0.7} onPress={() => Linking.openURL(`tel:${biz.phone}`)}>
                <View style={styles.contactIcon}>
                  <Ionicons name="call" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Telefon</Text>
                  <Text style={styles.contactValue}>{biz.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
            {biz.website && (
              <TouchableOpacity style={styles.contactRow} activeOpacity={0.7} onPress={() => Linking.openURL(`https://${biz.website.replace(/^https?:\/\//, '')}`)}>
                <View style={styles.contactIcon}>
                  <Ionicons name="globe" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Web Sitesi</Text>
                  <Text style={[styles.contactValue, { color: COLORS.primary }]}>{biz.website}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {workingHours.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Çalışma Saatleri</Text>
              <View style={styles.hoursCard}>
                {DAYS_TR.map((day, i) => {
                  const h = workingHours[i];
                  if (!h) return null;
                  const isToday = i === todayIdx;
                  return (
                    <View key={day} style={[styles.hourRow, isToday && styles.hourRowToday]}>
                      <Text style={[styles.hourDay, isToday && styles.hourDayToday]}>{day}</Text>
                      {h.open ? (
                        <Text style={[styles.hourTime, isToday && styles.hourTimeToday]}>{h.start} – {h.end}</Text>
                      ) : (
                        <Text style={styles.hourClosed}>Kapalı</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
              {reviews.length > 0 && (
                <View style={styles.ratingSummary}>
                  <Ionicons name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.ratingSummaryText}>{avgRating.toFixed(1)}</Text>
                  <Text style={styles.ratingSummaryCount}>({reviews.length})</Text>
                </View>
              )}
            </View>

            {reviewsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACE[4] }} />
            ) : reviews.length > 0 ? (
              reviews.map((r) => (
                <View key={r.id} style={styles.reviewItem}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewAuthor}>{r.authorName}</Text>
                    <Text style={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString('tr-TR')}</Text>
                  </View>
                  <StarRating rating={r.rating} size={12} />
                  {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                </View>
              ))
            ) : (
              <Text style={styles.emptyReviewText}>Henüz değerlendirme yapılmamış.</Text>
            )}

            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormTitle}>Değerlendirme Yap</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Adınız"
                placeholderTextColor={COLORS.textMuted}
                value={authorName}
                onChangeText={setAuthorName}
              />
              <View style={styles.starInput}>
                <Text style={styles.starInputLabel}>Puan: </Text>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.7}>
                    <Ionicons
                      name={s <= rating ? 'star' : 'star-outline'}
                      size={28}
                      color={s <= rating ? COLORS.warning : COLORS.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.reviewInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Yorumunuz (isteğe bağlı)"
                placeholderTextColor={COLORS.textMuted}
                value={comment}
                onChangeText={setComment}
                multiline
              />
              <TouchableOpacity
                style={[styles.submitBtn, (!authorName.trim() || rating === 0 || submitting) && styles.submitBtnDisabled]}
                onPress={submitReview}
                disabled={!authorName.trim() || rating === 0 || submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>{submitting ? 'Gönderiliyor...' : 'Gönder'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACE[3] }]}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarLabel}>Başlangıç</Text>
          <Text style={styles.bottomBarPrice}>
            {biz.services.length > 0 ? `₺${Math.min(...biz.services.map(s => s.price)).toLocaleString('tr-TR')}` : '—'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push(`/(customer)/booking/${biz.id}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={18} color={COLORS.white} />
          <Text style={styles.bookBtnText}>Randevu Al</Text>
        </TouchableOpacity>
      </View>

      {selectedImage !== null && biz.galleryImages[selectedImage] && (
        <TouchableOpacity
          style={styles.lightbox}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setSelectedImage(null)} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Image source={{ uri: biz.galleryImages[selectedImage] }} style={styles.lightboxImage} resizeMode="contain" />
          <View style={styles.lightboxCounter}>
            <Text style={styles.lightboxCounterText}>{selectedImage + 1} / {biz.galleryImages.length}</Text>
          </View>
          <View style={styles.lightboxNav}>
            {selectedImage > 0 && (
              <TouchableOpacity style={styles.lightboxNavBtn} onPress={() => setSelectedImage(selectedImage - 1)} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={28} color={COLORS.white} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {selectedImage < biz.galleryImages.length - 1 && (
              <TouchableOpacity style={styles.lightboxNavBtn} onPress={() => setSelectedImage(selectedImage + 1)} activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={28} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE[3] },
  emptyText: { fontSize: FONT.sm, color: COLORS.textMuted },
  retryBtn: {
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  retryBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  hero: { paddingBottom: SPACE[5] },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE[5],
    paddingBottom: SPACE[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActions: { flexDirection: 'row', gap: SPACE[2] },
  heroActionBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryRow: { paddingHorizontal: SPACE[5], gap: SPACE[2] },
  galleryImage: {
    width: 160,
    height: 120,
    borderRadius: RADIUS.lg,
  },
  galleryMore: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryMoreText: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.white },
  heroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE[5],
    gap: SPACE[3],
    marginTop: SPACE[4],
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
  },
  logoPlaceholder: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: FONT.xl, fontWeight: FONT.bold, color: COLORS.white },
  businessName: {
    fontSize: FONT.xl,
    fontWeight: FONT.extrabold,
    color: COLORS.white,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    marginTop: SPACE[2],
    flexWrap: 'wrap',
  },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroMetaText: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.6)' },
  content: { padding: SPACE[5], gap: SPACE[5] },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACE[5],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  sectionTitle: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: COLORS.text,
    marginBottom: SPACE[3],
  },
  sectionText: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  serviceName: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  serviceDesc: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  serviceMetaText: { fontSize: FONT.xs, color: COLORS.textMuted },
  servicePrice: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.primary },
  employeesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3] },
  employeeCard: {
    width: '47%',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    padding: SPACE[3],
    gap: SPACE[2],
  },
  employeeAvatar: { width: 48, height: 48, borderRadius: 24 },
  employeeAvatarPlaceholder: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeAvatarText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  employeeName: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text, textAlign: 'center' },
  employeeTitle: { fontSize: FONT.xs, color: COLORS.textMuted, textAlign: 'center' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: { fontSize: FONT.xs, color: COLORS.textMuted },
  contactValue: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  hoursCard: { gap: 2 },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACE[2],
    paddingHorizontal: SPACE[3],
    borderRadius: RADIUS.md,
  },
  hourRowToday: { backgroundColor: COLORS.primaryMuted },
  hourDay: { fontSize: FONT.sm, color: COLORS.textSecondary },
  hourDayToday: { fontWeight: FONT.bold, color: COLORS.primary },
  hourTime: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  hourTimeToday: { color: COLORS.primary },
  hourClosed: { fontSize: FONT.sm, color: COLORS.textMuted },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE[2],
  },
  ratingSummary: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingSummaryText: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  ratingSummaryCount: { fontSize: FONT.xs, color: COLORS.textMuted },
  reviewItem: {
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  reviewDate: { fontSize: FONT.xs, color: COLORS.textMuted },
  reviewComment: { fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 4, lineHeight: 20 },
  emptyReviewText: { fontSize: FONT.sm, color: COLORS.textMuted, marginVertical: SPACE[4] },
  reviewForm: {
    marginTop: SPACE[4],
    paddingTop: SPACE[4],
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACE[3],
  },
  reviewFormTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  reviewInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    fontSize: FONT.sm,
    color: COLORS.text,
  },
  starInput: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starInputLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, marginRight: 4 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACE[3],
    alignItems: 'center',
    ...SHADOW.primary,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE[5],
    paddingTop: SPACE[4],
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOW.lg,
  },
  bottomBarInfo: { gap: 2 },
  bottomBarLabel: { fontSize: FONT.xs, color: COLORS.textMuted },
  bottomBarPrice: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE[6],
    paddingVertical: SPACE[4],
    borderRadius: RADIUS.lg,
    ...SHADOW.primary,
  },
  bookBtnText: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.white },
  lightbox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 101,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: { width: SCREEN_WIDTH - 40, height: SCREEN_WIDTH - 40 },
  lightboxCounter: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },
  lightboxCounterText: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.6)' },
  lightboxNav: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: SPACE[5],
  },
  lightboxNavBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
