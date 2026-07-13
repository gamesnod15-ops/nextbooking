import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SPACE } from '@/lib/theme';
import { Button } from './Button';

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  saving?: boolean;
  deleteLabel?: string;
  onDelete?: () => void;
  children: React.ReactNode;
}

export function FormModal({ visible, onClose, onSave, title, saving, deleteLabel, onDelete, children }: FormModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          <View style={styles.footer}>
            {onDelete && deleteLabel ? (
              <Button variant="destructive" onPress={() => {
                Alert.alert('Onay', `${deleteLabel}?`, [
                  { text: 'İptal', style: 'cancel' },
                  { text: deleteLabel, style: 'destructive', onPress: onDelete },
                ]);
              }} style={{ flex: 1 }}>{deleteLabel}</Button>
            ) : null}
            <Button onPress={onSave} loading={saving} style={{ flex: onDelete ? 1 : undefined }}>Kaydet</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { flex: 1, backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], maxHeight: '85%' },
  handle: { width: 40, height: 4, backgroundColor: COLORS.borderLight, borderRadius: 2, alignSelf: 'center', marginTop: SPACE[3] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  closeBtn: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  body: { padding: SPACE[5], gap: SPACE[4] },
  footer: { padding: SPACE[5], borderTopWidth: 1, borderTopColor: COLORS.borderLight, flexDirection: 'row', gap: SPACE[3] },
});
