import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SPACE } from '@/lib/theme';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Customer } from '@/types';

interface Props {
  customer: Customer | null;
  visible: boolean;
  onClose: () => void;
}

export function CustomerModal({ customer, visible, onClose }: Props) {
  if (!customer) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Müşteri Detayı</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
            <View style={styles.profile}>
              <Avatar name={customer.name} size={64} />
              <Text style={styles.name}>{customer.name}</Text>
              {customer.tags?.includes('VIP') && <Badge variant="primary">VIP</Badge>}
            </View>
            {[
              { label: 'Telefon', value: customer.phone, icon: 'call-outline' },
              ...(customer.email ? [{ label: 'E-posta', value: customer.email, icon: 'mail-outline' }] : []),
              { label: 'Randevu', value: `${customer.totalVisits ?? 0} randevu`, icon: 'calendar-outline' },
              { label: 'Harcama', value: formatCurrency(customer.totalSpent ?? 0), icon: 'cash-outline' },
              ...(customer.lastVisitAt ? [{ label: 'Son Ziyaret', value: formatDate(customer.lastVisitAt), icon: 'time-outline' }] : []),
            ].map((row) => (
              <View key={row.label} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name={row.icon as any} size={16} color={COLORS.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>Kapat</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], maxHeight: '85%' },
  handle: { width: 40, height: 4, backgroundColor: COLORS.borderLight, borderRadius: 2, alignSelf: 'center', marginTop: SPACE[3] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  closeBtn: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  body: { padding: SPACE[5], gap: SPACE[4] },
  profile: { alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[2] },
  name: { fontSize: FONT.xl, fontWeight: FONT.semibold, color: COLORS.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  rowIcon: { width: 36, height: 36, borderRadius: RADIUS.lg, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: FONT.xs, color: COLORS.textMuted },
  rowValue: { fontSize: FONT.base, color: COLORS.text, fontWeight: FONT.medium },
  footer: { padding: SPACE[5], borderTopWidth: 1, borderTopColor: COLORS.borderLight, flexDirection: 'row', gap: SPACE[3] },
});
