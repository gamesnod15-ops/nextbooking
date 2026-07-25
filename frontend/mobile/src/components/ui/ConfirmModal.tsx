import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Button } from './Button';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  destructive = false,
  loading = false,
  icon = 'help-circle-outline',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, destructive && styles.iconWrapDestructive]}>
            <Ionicons name={icon} size={28} color={destructive ? COLORS.error : COLORS.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button variant="outline" style={{ flex: 1 }} onPress={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? 'destructive' : 'primary'}
              style={{ flex: 1 }}
              onPress={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,22,56,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE[6],
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS['2xl'],
    padding: SPACE[6],
    alignItems: 'center',
    gap: SPACE[2],
    ...SHADOW.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE[2],
  },
  iconWrapDestructive: {
    backgroundColor: COLORS.errorLight,
  },
  title: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACE[4],
  },
  actions: {
    flexDirection: 'row',
    gap: SPACE[3],
    width: '100%',
  },
});
