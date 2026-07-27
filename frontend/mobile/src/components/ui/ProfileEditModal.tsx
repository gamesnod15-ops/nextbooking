import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { Avatar } from './Avatar';
import { Button } from './Button';

export interface ProfileEditValues {
  ad: string;
  soyad: string;
  telefon: string;
  email: string;
  sehir: string;
}

interface ProfileEditModalProps {
  visible: boolean;
  initialValues: ProfileEditValues;
  initialPhotoUri: string | null;
  onClose: () => void;
  onSave: (values: ProfileEditValues, photoUri: string | null) => Promise<void> | void;
}

export function ProfileEditModal({ visible, initialValues, initialPhotoUri, onClose, onSave }: ProfileEditModalProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [values, setValues] = useState<ProfileEditValues>(initialValues);
  const [photoUri, setPhotoUri] = useState<string | null>(initialPhotoUri);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setValues(initialValues);
      setPhotoUri(initialPhotoUri);
    }
  }, [visible, initialValues, initialPhotoUri]);

  function set<K extends keyof ProfileEditValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin gerekli', 'Fotoğraf seçmek için galeri erişimine izin vermelisiniz.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!values.ad.trim() || !values.soyad.trim()) {
      Alert.alert('Eksik bilgi', 'Ad ve soyad zorunludur.');
      return;
    }
    setSaving(true);
    try {
      await onSave(values, photoUri);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Profili Düzenle</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto} activeOpacity={0.8}>
              <Avatar name={`${values.ad} ${values.soyad}`} url={photoUri} size={88} />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color={COLORS.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Fotoğrafı değiştirmek için dokunun</Text>

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Ad</Text>
                <TextInput style={styles.input} value={values.ad} onChangeText={(v) => set('ad', v)} placeholder="Ad" placeholderTextColor={COLORS.textMuted} />
              </View>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Soyad</Text>
                <TextInput style={styles.input} value={values.soyad} onChangeText={(v) => set('soyad', v)} placeholder="Soyad" placeholderTextColor={COLORS.textMuted} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Telefon</Text>
              <TextInput style={styles.input} value={values.telefon} onChangeText={(v) => set('telefon', v)} placeholder="Telefon" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput style={styles.input} value={values.email} onChangeText={(v) => set('email', v)} placeholder="E-posta" placeholderTextColor={COLORS.textMuted} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Şehir</Text>
              <TextInput style={styles.input} value={values.sehir} onChangeText={(v) => set('sehir', v)} placeholder="Şehir" placeholderTextColor={COLORS.textMuted} />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button variant="outline" style={{ flex: 1 }} onPress={onClose} disabled={saving}>
              Vazgeç
            </Button>
            <Button variant="primary" style={{ flex: 1 }} onPress={handleSave} loading={saving}>
              Kaydet
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(5,22,56,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    height: '85%',
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: RADIUS.full, alignSelf: 'center', marginTop: SPACE[3] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACE[5],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt },
  content: { padding: SPACE[5], gap: SPACE[4], alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  photoHint: { fontSize: FONT.xs, color: COLORS.textMuted },
  row: { flexDirection: 'row', gap: SPACE[3], width: '100%' },
  field: { width: '100%', gap: 6 },
  halfField: { width: undefined, flex: 1 },
  label: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    fontSize: FONT.base,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACE[3],
    padding: SPACE[5],
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
