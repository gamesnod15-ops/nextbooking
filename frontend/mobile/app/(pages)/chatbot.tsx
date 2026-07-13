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

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const { data: settingsData = [] } = useQuery({
    queryKey: ['chatbot-settings'],
    queryFn: async () => { const res = await api.get('/chatbot/settings'); return Array.isArray(res.data) ? res.data : []; },
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['chatbot-messages'],
    queryFn: async () => { const res = await api.get('/chatbot/messages'); return Array.isArray(res.data) ? res.data : []; },
  });
  const [settings, setSettings] = useState(settingsData);
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('preview');

  function toggle(key: string) {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value: !s.value } : s));
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="AI Chatbot" showBack />
      <View style={styles.statusBanner}>
        <View style={styles.statusLeft}>
          <View style={styles.botIcon}><Ionicons name="hardware-chip" size={22} color={COLORS.primaryDark} /></View>
          <View>
            <Text style={styles.statusTitle}>GPT-4o Destekli</Text>
            <Text style={styles.statusSub}>Web sitesine entegre</Text>
          </View>
        </View>
        <Badge variant="success" size="sm">Aktif</Badge>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'preview' && styles.tabActive]} onPress={() => setActiveTab('preview')}>
          <Text style={[styles.tabText, activeTab === 'preview' && styles.tabTextActive]}>Önizleme</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'settings' && styles.tabActive]} onPress={() => setActiveTab('settings')}>
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>Ayarlar</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'preview' ? (
        <ScrollView contentContainerStyle={styles.chatContainer}>
          {messages.length === 0 ? (
            <EmptyState icon="chatbubbles-outline" title="Mesaj yok" />
          ) : messages.map((msg) => (
            <View key={msg.id} style={[styles.bubble, msg.from === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
              {msg.from === 'bot' && (
                <View style={styles.botAvatar}>
                  <Ionicons name="hardware-chip" size={14} color={COLORS.primaryDark} />
                </View>
              )}
              <View style={[styles.bubbleContent, msg.from === 'user' ? styles.bubbleContentUser : styles.bubbleContentBot]}>
                <Text style={[styles.bubbleText, msg.from === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot]}>{msg.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.section}>
            {settings.map((s) => (
              <View key={s.key} style={styles.settingRow}>
                <Text style={styles.settingLabel}>{s.label}</Text>
                <Switch value={s.value} onValueChange={() => toggle(s.key)} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.white} />
              </View>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Bot Hoş Geldin Mesajı</Text>
          <View style={styles.textAreaWrap}>
            <TextInput
              style={styles.textArea}
              multiline
              defaultValue="Merhaba! Ben RandevumKolay AI asistanıyım. Randevu almak, hizmetlerimiz veya fiyatlar hakkında bilgi almak için buradayım. Size nasıl yardımcı olabilirim?"
              placeholderTextColor={COLORS.textMuted}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginTop: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  botIcon: { width: 44, height: 44, borderRadius: RADIUS.lg, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  statusSub: { fontSize: FONT.xs, color: COLORS.textMuted },
  tabs: { flexDirection: 'row', marginHorizontal: SPACE[5], marginTop: SPACE[4], backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  tabText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.text, fontWeight: FONT.bold },
  chatContainer: { padding: SPACE[5], gap: SPACE[3], paddingBottom: 100 },
  bubble: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACE[2] },
  bubbleBot: { alignSelf: 'flex-start', maxWidth: '85%' },
  bubbleUser: { alignSelf: 'flex-end', maxWidth: '85%', flexDirection: 'row-reverse' },
  botAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  bubbleContent: { padding: SPACE[4], borderRadius: RADIUS.xl },
  bubbleContentBot: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.borderLight },
  bubbleContentUser: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: FONT.sm, lineHeight: 20 },
  bubbleTextBot: { color: COLORS.text },
  bubbleTextUser: { color: COLORS.black },
  section: { marginHorizontal: SPACE[5], marginTop: SPACE[4], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACE[4], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  settingLabel: { fontSize: FONT.base, color: COLORS.text },
  sectionTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text, marginHorizontal: SPACE[5], marginTop: SPACE[5], marginBottom: SPACE[3] },
  textAreaWrap: { marginHorizontal: SPACE[5], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, padding: SPACE[4] },
  textArea: { fontSize: FONT.sm, color: COLORS.text, minHeight: 100 },
});

