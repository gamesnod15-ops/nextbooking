import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Thin wrappers so screens can add tactile feedback without repeating the
 * platform guard and the promise-swallow every time.
 * Haptics are a no-op on web and must never surface an error.
 */

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tap — buttons, chips, tab switches. */
export function tapFeedback() {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Medium tap — toggles, selections that change state. */
export function selectionFeedback() {
  if (!isSupported) return;
  Haptics.selectionAsync().catch(() => {});
}

/** Completed action, e.g. an appointment was created. */
export function successFeedback() {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Rejected action, e.g. validation failed. */
export function errorFeedback() {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

/** Destructive or attention-worthy action. */
export function warningFeedback() {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
