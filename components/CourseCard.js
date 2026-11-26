import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { categoryByName } from '../constants/categories';
import { categoryColors, useTheme } from '../theme';
import { safeImageUri } from '../utils/media';
import { AppText, Pill, PressableScale } from './ui';

const CATEGORY_ICONS = {
  'Web Development': 'code-slash',
  'Mobile App Development': 'phone-portrait',
  'Data Science': 'analytics',
  'Machine Learning': 'hardware-chip',
  'Artificial Intelligence': 'hardware-chip',
  AI: 'hardware-chip',
  Design: 'color-palette',
  'UI/UX': 'color-palette',
  'Cyber Security': 'shield-checkmark',
  Cybersecurity: 'shield-checkmark',
  Leadership: 'people',
  Marketing: 'megaphone',
  Photography: 'camera',
  Music: 'musical-notes',
  Languages: 'language',
  Business: 'briefcase',
  'Health & Fitness': 'fitness',
  General: 'sparkles',
};

export const iconForCategory = (category = '') => categoryByName(category)?.icon || CATEGORY_ICONS[category] || 'sparkles';

export const gradientForCategory = (category = '') => {
  const known = categoryByName(category);
  if (known) return known.gradient;
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) | 0;
  const a = categoryColors[Math.abs(h) % categoryColors.length];
  const b = categoryColors[(Math.abs(h) + 3) % categoryColors.length];
  return [a, b];
};

// Course thumbnails are stored either as https URLs or base64 data URIs.
const safeThumb = safeImageUri;

/**
 * Course card. layout: 'wide' (horizontal scroller) | 'row' (list item)
 */
export default function CourseCard({ course, onPress, layout = 'wide', badge, style }) {
  const { colors, radius } = useTheme();
  const thumb = safeThumb(course.thumbnail);
  const gradient = gradientForCategory(course.category);
  const sections = Array.isArray(course.sections) ? course.sections.length : 0;

  const art = (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
      <Ionicons name={iconForCategory(course.category)} size={layout === 'row' ? 28 : 44} color="rgba(255,255,255,0.9)" style={styles.artIcon} />
    </LinearGradient>
  );

  if (layout === 'row') {
    return (
      <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={`${course.title}, ${course.credits || 0} credits`}>
        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }, style]}>
          <View style={[styles.rowThumb, { borderRadius: radius.md }]}>
            {thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} /> : art}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText variant="caption" tone="primary" numberOfLines={1} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              {course.category || 'General'}
            </AppText>
            <AppText variant="title" numberOfLines={2} style={{ marginTop: 2 }}>
              {course.title || 'Untitled course'}
            </AppText>
            <View style={styles.meta}>
              <Meta icon="flash" text={`${course.credits || 0} credits`} color={colors.warning} />
              <Meta icon="people" text={`${course.enrollments || 0}`} color={colors.textMuted} />
              {sections ? <Meta icon="layers" text={`${sections}`} color={colors.textMuted} /> : null}
            </View>
          </View>
          {badge}
        </View>
      </PressableScale>
    );
  }

  return (
    <PressableScale onPress={onPress} scaleTo={0.97} accessibilityLabel={`${course.title}, ${course.credits || 0} credits`}>
      <View style={[styles.wide, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }, style]}>
        <View style={[styles.wideThumb, { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }]}>
          {thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : art}
          <View style={styles.creditTag}>
            <Ionicons name="flash" size={12} color="#FFC83D" />
            <AppText variant="caption" color="#fff" style={{ marginLeft: 3, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
              {course.credits || 0}
            </AppText>
          </View>
        </View>
        <View style={{ padding: 12 }}>
          {badge || <Pill label={course.category || 'General'} color={gradient[0]} />}
          <AppText variant="title" numberOfLines={2} style={{ marginTop: 8, minHeight: 44 }}>
            {course.title || 'Untitled course'}
          </AppText>
          <View style={styles.meta}>
            <Meta icon="people" text={`${course.enrollments || 0} learners`} color={colors.textMuted} />
            {course.rating ? <Meta icon="star" text={Number(course.rating).toFixed(1)} color={colors.warning} /> : null}
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

function Meta({ icon, text, color }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={color} />
      <AppText variant="caption" tone="muted" style={{ marginLeft: 4 }}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wide: { width: 230, borderWidth: 1, overflow: 'hidden' },
  wideThumb: { height: 112, overflow: 'hidden', backgroundColor: '#222' },
  artIcon: { position: 'absolute', right: 14, bottom: 12 },
  creditTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,9,24,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  meta: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1 },
  rowThumb: { width: 76, height: 76, overflow: 'hidden' },
});
