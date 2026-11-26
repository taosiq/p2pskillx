import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import AppText from './AppText';
import Card from './Card';

/** Compact number tile: gradient icon, big value, small label. */
export default function StatTile({ icon, label, value, gradient, onPress, style, suffix }) {
  const { gradients } = useTheme();
  return (
    <Card onPress={onPress} padding={14} style={[styles.tile, style]} accessibilityLabel={`${label}: ${value}`}>
      <LinearGradient colors={gradient || gradients.primary} style={styles.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon} size={18} color="#fff" />
      </LinearGradient>
      <View style={styles.valueRow}>
        <AppText variant="stat" numberOfLines={1}>
          {value}
        </AppText>
        {suffix ? (
          <AppText variant="smallStrong" tone="muted" style={{ marginLeft: 3, marginBottom: 3 }}>
            {suffix}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1 },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end' },
});
