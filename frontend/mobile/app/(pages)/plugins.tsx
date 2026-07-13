import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';

const PLUGINS = [
  { id: 'whatsapp', name: 'WhatsApp Bot', desc: 'Müşteri iletişimi ve randevu otomasyonu', icon: 'logo-whatsapp', color: '#25D366', enabled: true, category: 'İletişim' },
  { id: 'chatbot', name: 'AI Chatbot', desc: 'Web sitesi için yapay zeka asistanı', icon: 'hardware-chip-outline', color: '#6366F1', enabled: true, category: 'İletişim' },
  { id: 'sms', name: 'SMS Bildirimi', desc: 'Otomatik SMS hatırlatıcıları', icon: 'chatbubble-outline', color: '#10B981', enabled: false, category: 'İletişim' },
  { id: 'loyalty', name: 'Sadakat Programı', desc: 'Puan tabanlı müşteri bağlılık sistemi', icon: 'star-outline', color: '#F59E0B', enabled: true, category: 'Müşteri' },
  { id: 'giftcoupon', name: 'Hediye Kuponları', desc: 'Hediye kartı ve kupon yönetimi', icon: 'gift-outline', color: '#EC4899', enabled: true, category: 'Müşteri' },
  { id: 'survey', name: 'Anket Modülü', desc: 'Müşteri memnuniyet anketleri', icon: 'clipboard-outline', color: '#8B5CF6', enabled: false, category: 'Müşteri' },
  { id: 'googlecal', name: 'Google Takvim', desc: 'Takvim senkronizasyonu', icon: 'calendar-outline', color: '#4285F4', enabled: false, category: 'Entegrasyon' },
  { id: 'accounting', name: 'Muhasebe Entegrasyonu', desc: 'ERP ve muhasebe sistemleri', icon: 'calculator-outline', color: '#6B7280', enabled: false, category: 'Entegrasyon' },
  { id: 'maps', name: 'Harita & Konum', desc: 'İşletme konumu ve yön tarifi', icon: 'map-outline', color: '#14B8A6', enabled: true, category: 'Entegrasyon' },
];

const CATEGORIES = ['Tümü', 'İletişim', 'Müşteri', 'Entegrasyon'];

export default function PluginsScreen() {
  const insets = useSafeAreaInsets();
  const [plugins, setPlugins] = useState(PLUGINS);
  const [category, setCategory] = useState('Tümü');

  function toggle(id: string) {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  }

  const filtered = plugins.filter(p => category === 'Tümü' || p.category === category);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Modüller & Eklentiler" showBack />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)} activeOpacity={0.8}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingBottom: 100 }}>
        {filtered.map((plugin, idx) => {
          const isNewGroup = idx === 0 || filtered[idx - 1].category !== plugin.category;
          return (
            <View key={plugin.id}>
              {isNewGroup && category === 'Tümü' && (
                <Text style={styles.groupLabel}>{plugin.category}</Text>
              )}
              <View style={[styles.card, idx < filtered.length - 1 && filtered[idx + 1]?.category === plugin.category ? styles.cardGrouped : undefined]}>
                <View style={[styles.iconBox, { backgroundColor: plugin.color + '20' }]}>
                  <Ionicons name={plugin.icon as any} size={22} color={plugin.color} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{plugin.name}</Text>
                  <Text style={styles.desc}>{plugin.desc}</Text>
                  <Badge variant={plugin.enabled ? 'success' : 'default'} size="sm">{plugin.enabled ? 'Aktif' : 'Pasif'}</Badge>
                </View>
                <Switch value={plugin.enabled} onValueChange={() => toggle(plugin.id)} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.white} />
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
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.black },
  groupLabel: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: SPACE[4], marginBottom: SPACE[2] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], marginBottom: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardGrouped: { marginBottom: SPACE[2] },
  iconBox: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  desc: { fontSize: FONT.xs, color: COLORS.textMuted },
});

