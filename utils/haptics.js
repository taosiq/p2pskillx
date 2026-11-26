import * as Haptics from 'expo-haptics';

// Haptics are a nice-to-have: never let a failure surface to the user.
const safe = (fn) => (...args) => {
  try {
    fn(...args)?.catch?.(() => {});
  } catch {}
};

export const tap = safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const press = safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const select = safe(() => Haptics.selectionAsync());
export const success = safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const warning = safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
export const error = safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));

export default { tap, press, select, success, warning, error };
