import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';

export default function WhatsappBotScreen() {
  const insets = useSafeAreaInsets();
  const { data: settingsData = [] } = useQuery({
    queryKey: ['whatsapp-bot-settings'],
    queryFn: async () => { const res = await api.get('/whatsapp-bot/settings'); return Array.isArray(res.data) ? res.data : []; },
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['whatsapp-bot-messages'],
    queryFn: async () => { const res = await api.get('/whatsapp-bot/messages'); return Array.isArray(res.data) ? res.data : []; },
  });
  const [settings, setSettings] = useState(settingsData);
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');

  function toggle(key: string) {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value: !s.value } : s));
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="WhatsApp Bot" showBack />
      {/* Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.statusLeft}>
          <View style={styles.waIcon}><Text style={{ fontSize: 20 }}>📱</Text></View>
          <View>
            <Text style={styles.statusTitle}>WhatsApp Business API</Text>
            <Text style={styles.statusSub}>+90 212 XXX XX XX</Text>
          </View>
        </View>
        <Badge variant="success" size="sm">Bağlı</Badge>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'settings' && styles.tabActive]} onPress={() => setActiveTab('settings')}>
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>Ayarlar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'preview' && styles.tabActive]} onPress={() => setActiveTab('preview')}>
          <Text style={[styles.tabText, activeTab === 'preview' && styles.tabTextActive]}>Önizleme</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'settings' ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.section}>
            {settings.map((s) => (
              <View key={s.key} style={styles.settingRow}>
                <Text style={styles.settingLabel}>{s.label}</Text>
                <Switch value={s.value} onValueChange={() => toggle(s.key)} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.white} />
              </View>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Mesai Dışı Mesajı</Text>
          <View style={styles.textAreaWrap}>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              defaultValue="Merhaba! Şu anda çalışma saatleri dışındayız. Çalışma saatlerimiz: Pzt-Cts 09:00-20:00. En kısa sürede size dönüş yapacağız."
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.chatContainer}>
          {messages.length === 0 ? (
            <EmptyState icon="chatbubbles-outline" title="Mesaj yok" />
          ) : messages.map((msg) => (
            <View key={msg.id} style={[styles.bubble, msg.from === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
              <Text style={[styles.bubbleText, msg.from === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot]}>{msg.text}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginTop: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  waIcon: { width: 44, height: 44, borderRadius: RADIUS.lg, backgroundColor: '#DCF8C6', alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  statusSub: { fontSize: FONT.xs, color: COLORS.textMuted },
  tabs: { flexDirection: 'row', marginHorizontal: SPACE[5], marginTop: SPACE[4], backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  tabText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.text, fontWeight: FONT.bold },
  section: { marginHorizontal: SPACE[5], marginTop: SPACE[4], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACE[4], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  settingLabel: { fontSize: FONT.base, color: COLORS.text },
  sectionTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text, marginHorizontal: SPACE[5], marginTop: SPACE[5], marginBottom: SPACE[3] },
  textAreaWrap: { marginHorizontal: SPACE[5], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, padding: SPACE[4] },
  textArea: { fontSize: FONT.sm, color: COLORS.text, minHeight: 100, textAlignVertical: 'top' },
  chatContainer: { padding: SPACE[5], gap: SPACE[3], paddingBottom: 100 },
  bubble: { maxWidth: '80%', padding: SPACE[4], borderRadius: RADIUS.xl },
  bubbleBot: { backgroundColor: COLORS.surface, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.borderLight },
  bubbleUser: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: FONT.sm },
  bubbleTextBot: { color: COLORS.text },
  bubbleTextUser: { color: '#1a3a2a' },
});

