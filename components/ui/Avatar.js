import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { categoryColors, useTheme } from '../../theme';
import { safeImageUri } from '../../utils/media';
import AppText from './AppText';

export const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase() || '?';

// Stable colour per name so the same person always gets the same avatar colour.
const colorFor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const a = categoryColors[Math.abs(h) % categoryColors.length];
  const b = categoryColors[Math.abs(h >> 3) % categoryColors.length];
  return [a, a === b ? '#FF4FD8' : b];
};

/**
 * Photo or gradient initials. `ring` draws a gradient ring (e.g. tier colours);
 * `online` shows a green presence dot.
 */
export default function Avatar({ uri, name = '', size = 48, ring, online, style }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const safe = safeImageUri(uri);
  const showImage = !!safe && !failed;
  const inner = ring ? size - 6 : size;

  const face = showImage ? (
    <Image
      source={{ uri: safe }}
      onError={() => setFailed(true)}
      style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: colors.surfaceAlt }}
    />
  ) : (
    <LinearGradient
      colors={colorFor(name)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.center, { width: inner, height: inner, borderRadius: inner / 2 }]}
    >
      <AppText
        color="#fff"
        style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: inner * 0.38, lineHeight: inner * 0.46 }}
      >
        {initialsOf(name)}
      </AppText>
    </LinearGradient>
  );

  return (
    <View style={[{ width: size, height: size }, style]}>
      {ring ? (
        <LinearGradient
          colors={ring}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.center, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <View style={[styles.center, { width: size - 3, height: size - 3, borderRadius: size / 2, backgroundColor: colors.bg }]}>
            {face}
          </View>
        </LinearGradient>
      ) : (
        face
      )}
      {online ? (
        <View
          style={[
            styles.dot,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size,
              backgroundColor: colors.success,
              borderColor: colors.bg,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dot: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2 },
});
