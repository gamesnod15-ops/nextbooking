import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C', bg: '#FCE4EC', connected: true, followers: 4280 },
  { id: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2', bg: '#E3F2FD', connected: true, followers: 1840 },
  { id: 'google', label: 'Google İşletme', icon: 'logo-google', color: '#4285F4', bg: '#E8F0FE', connected: false, followers: null },
  { id: 'twitter', label: 'Twitter / X', icon: 'logo-twitter', color: '#1DA1F2', bg: '#E3F2FD', connected: false, followers: null },
];

const RECENT_POSTS = [
  { id: '1', platform: 'instagram', text: 'Yaz indirimlerimiz başladı! Tüm hizmetlerde %20 indirim 🌞', likes: 128, comments: 14, time: '2s önce' },
  { id: '2', platform: 'facebook', text: 'Haziran kampanyamızdan yararlanmak için hemen arayın!', likes: 45, comments: 3, time: '1g önce' },
];

export default function SocialMediaScreen() {
  const insets = useSafeAreaInsets();
  const [autoPost, setAutoPost] = useState(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Sosyal Medya" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Platforms */}
        <Text style={styles.sectionTitle}>Bağlı Hesaplar</Text>
        <View style={styles.platformList}>
          {PLATFORMS.map((p) => (
            <View key={p.id} style={styles.platformCard}>
              <View style={[styles.platformIcon, { backgroundColor: p.bg }]}>
                <Ionicons name={p.icon as any} size={24} color={p.color} />
              </View>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>{p.label}</Text>
                {p.connected && p.followers ? (
                  <Text style={styles.platformSub}>{p.followers.toLocaleString('tr')} takipçi</Text>
                ) : (
                  <Text style={styles.platformSub}>Bağlı değil</Text>
                )}
              </View>
              <TouchableOpacity style={[styles.connectBtn, p.connected && styles.connectBtnConnected]}>
                <Text style={[styles.connectBtnText, p.connected && styles.connectBtnTextConnected]}>
                  {p.connected ? 'Bağlı' : 'Bağla'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Auto Post */}
        <View style={styles.autoPostCard}>
          <View style={styles.autoPostLeft}>
            <Ionicons name="flash" size={20} color={COLORS.primaryDark} />
            <View>
              <Text style={styles.autoPostTitle}>Otomatik Paylaşım</Text>
              <Text style={styles.autoPostSub}>Yeni kampanyaları otomatik paylaş</Text>
            </View>
          </View>
          <Switch value={autoPost} onValueChange={setAutoPost} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.white} />
        </View>

        {/* Recent Posts */}
        <Text style={styles.sectionTitle}>Son Paylaşımlar</Text>
        {RECENT_POSTS.map((post) => {
          const platform = PLATFORMS.find(p => p.id === post.platform)!;
          return (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={[styles.postPlatformIcon, { backgroundColor: platform.bg }]}>
                  <Ionicons name={platform.icon as any} size={16} color={platform.color} />
                </View>
                <Text style={styles.postPlatform}>{platform.label}</Text>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>
              <Text style={styles.postText}>{post.text}</Text>
              <View style={styles.postStats}>
                <View style={styles.postStat}>
                  <Ionicons name="heart-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.postStatText}>{post.likes}</Text>
                </View>
                <View style={styles.postStat}>
                  <Ionicons name="chatbubble-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.postStatText}>{post.comments}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  sectionTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text, paddingHorizontal: SPACE[5], marginTop: SPACE[4], marginBottom: SPACE[3] },
  platformList: { paddingHorizontal: SPACE[5], gap: SPACE[3] },
  platformCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  platformIcon: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  platformInfo: { flex: 1, gap: 3 },
  platformName: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  platformSub: { fontSize: FONT.xs, color: COLORS.textMuted },
  connectBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.primary },
  connectBtnConnected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryLight },
  connectBtnText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.primaryDark },
  connectBtnTextConnected: { color: COLORS.primaryDark },
  autoPostCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: SPACE[5], marginTop: SPACE[4], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  autoPostLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], flex: 1 },
  autoPostTitle: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  autoPostSub: { fontSize: FONT.xs, color: COLORS.textMuted },
  postCard: { marginHorizontal: SPACE[5], marginBottom: SPACE[3], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  postPlatformIcon: { width: 28, height: 28, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  postPlatform: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text, flex: 1 },
  postTime: { fontSize: FONT.xs, color: COLORS.textMuted },
  postText: { fontSize: FONT.sm, color: COLORS.text, lineHeight: 20 },
  postStats: { flexDirection: 'row', gap: SPACE[4] },
  postStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatText: { fontSize: FONT.xs, color: COLORS.textMuted },
});

