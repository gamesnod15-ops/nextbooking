import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

const BRANCHES = [
  { id: '1', name: 'Merkez Şube', address: 'Güngören Cad. No:12, Bağcılar, İstanbul', lat: 41.0422, lng: 28.8553, phone: '0212 111 2233' },
  { id: '2', name: 'Kadıköy Şube', address: 'Moda Cad. No:44, Kadıköy, İstanbul', lat: 40.9887, lng: 29.0269, phone: '0216 222 3344' },
];

function getMapUrl(lat: number, lng: number) {
  if (Platform.OS === 'ios') return `maps://maps.apple.com/?q=${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// Embedded map HTML using OpenStreetMap leaflet
function getMapHtml(lat: number, lng: number, name: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>body{margin:0;padding:0} #map{height:100vh;width:100vw}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([${lat}, ${lng}]).addTo(map).bindPopup("${name}").openPopup();
  </script>
</body>
</html>`;
}

export default function MapsScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(BRANCHES[0]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Harita & Konum" showBack />
      {/* Branch Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
        {BRANCHES.map((b) => (
          <TouchableOpacity key={b.id} style={[styles.branchChip, selected.id === b.id && styles.branchChipActive]} onPress={() => setSelected(b)} activeOpacity={0.8}>
            <Ionicons name="business" size={14} color={selected.id === b.id ? COLORS.black : COLORS.textSecondary} />
            <Text style={[styles.branchChipText, selected.id === b.id && styles.branchChipTextActive]}>{b.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: getMapHtml(selected.lat, selected.lng, selected.name) }}
          style={{ flex: 1, borderRadius: RADIUS.xl }}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
        />
      </View>

      {/* Branch Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="location" size={20} color={COLORS.primaryDark} />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.branchName}>{selected.name}</Text>
            <Text style={styles.branchAddress}>{selected.address}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(getMapUrl(selected.lat, selected.lng))}>
            <Ionicons name="navigate" size={18} color={COLORS.black} />
            <Text style={styles.actionBtnText}>Yol Tarifi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
            <Ionicons name="call-outline" size={18} color={COLORS.text} />
            <Text style={styles.actionBtnTextSecondary}>Ara</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  branchChip: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  branchChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  branchChipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  branchChipTextActive: { color: COLORS.black },
  mapContainer: { flex: 1, marginHorizontal: SPACE[5], borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  infoCard: { backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginVertical: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[5], gap: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  infoHeader: { flexDirection: 'row', gap: SPACE[3] },
  iconBox: { width: 44, height: 44, borderRadius: RADIUS.lg, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, gap: 4 },
  branchName: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  branchAddress: { fontSize: FONT.sm, color: COLORS.textMuted, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: SPACE[3] },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[2], backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACE[4], ...SHADOW.primary },
  actionBtnText: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.black },
  actionBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[2], backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight },
  actionBtnTextSecondary: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
});

