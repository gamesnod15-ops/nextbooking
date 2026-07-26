import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { reportError } from '@/lib/errorReporting';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/lifecycle errors anywhere below it so a single bad screen
 * shows a recovery UI instead of an unexplained white screen.
 *
 * Note this cannot catch errors thrown in event handlers or async code —
 * those still need local try/catch.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, { componentStack: info.componentStack ?? undefined });
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.root}>
        <View style={styles.iconWrap}>
          <Ionicons name="warning-outline" size={38} color={COLORS.error} />
        </View>
        <Text style={styles.title}>Bir şeyler ters gitti</Text>
        <Text style={styles.text}>
          Beklenmedik bir hata oluştu. Tekrar denemek için aşağıdaki butonu kullanabilirsin.
        </Text>

        {__DEV__ && (
          <ScrollView style={styles.devBox} contentContainerStyle={{ padding: SPACE[3] }}>
            <Text style={styles.devText}>{error.message}</Text>
          </ScrollView>
        )}

        <TouchableOpacity style={styles.btn} onPress={this.reset} activeOpacity={0.85}>
          <Ionicons name="refresh" size={18} color={COLORS.white} />
          <Text style={styles.btnText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE[6],
    gap: SPACE[3],
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE[2],
  },
  title: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text, textAlign: 'center' },
  text: { fontSize: FONT.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  devBox: {
    maxHeight: 140,
    alignSelf: 'stretch',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: SPACE[2],
  },
  devText: { fontSize: FONT.xs, color: COLORS.errorText, fontFamily: 'monospace' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACE[6],
    paddingVertical: 14,
    marginTop: SPACE[4],
    ...SHADOW.primary,
  },
  btnText: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.white },
});
