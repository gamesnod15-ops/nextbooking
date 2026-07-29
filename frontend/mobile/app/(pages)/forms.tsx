import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function FormsScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const { data: list = [] } = useQuery({
    queryKey: ['forms'],
    queryFn: async () => { const res = await api.get('/forms'); return Array.isArray(res.data) ? res.data : []; },
  });

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean }>({ open: false });
  const [form, setForm] = useState({ title: '', fields: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/forms', { title: form.title, fieldCount: Number(form.fields) || 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['forms'] }); setModal({ open: false }); },
    onError: () => toast.error('Form eklenemedi.'),
  });

  function handleSave() {
    if (!form.title) { toast.warning('Form adı zorunludur.'); return; }
    createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <ScreenHeader title="Formlar" subtitle={`${list.length} form`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={() => setModal({ open: true })} accessibilityRole="button" accessibilityLabel="Ekle"><Ionicons name="add" size={22} color={STATIC_WHITE} /></TouchableOpacity>}
      />
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="document-text-outline" title="Form yok" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} style={styles.card}>
            <View style={styles.iconBox}>
              <Ionicons name="document-text" size={22} color={COLORS.primaryDark} />
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.fields} alan · {formatDate(item.createdAt)}</Text>
              <View style={styles.row}>
                <Ionicons name="people-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.responses}>{item.responses} yanıt</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Badge variant={item.isActive ? 'success' : 'default'} size="sm">{item.isActive ? 'Aktif' : 'Pasif'}</Badge>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Bağlantıyı kopyala">
                <Ionicons name="link-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        title="Yeni Form"
        onSave={handleSave}
        saving={createMutation.isPending}
      >
        <FormField label="Form Adı" placeholder="Örn: İletişim Formu" value={form.title} onChangeText={(t) => setForm(p => ({ ...p, title: t }))} />
        <FormField label="Alan Sayısı" placeholder="Örn: 5" value={form.fields} onChangeText={(t) => setForm(p => ({ ...p, fields: t }))} keyboardType="numeric" />
      </FormModal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  list: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  iconBox: { width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  title: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  meta: { fontSize: FONT.xs, color: COLORS.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  responses: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[3] },
});

