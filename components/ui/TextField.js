import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../../theme';
import AppText from './AppText';

/**
 * Labelled input with an optional leading icon, error text and a
 * show/hide toggle for passwords (secure).
 */
const TextField = forwardRef(function TextField(
  { label, icon, error, hint, secure = false, required, style, inputStyle, multiline, right, onFocus, onBlur, ...rest },
  ref
) {
  const { colors, radius, fonts } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <AppText variant="smallStrong" tone="muted" style={styles.label}>
          {label}
          {required ? <AppText variant="smallStrong" tone="accent"> *</AppText> : null}
        </AppText>
      ) : null}
      <View
        style={[
          styles.box,
          {
            borderRadius: radius.md,
            backgroundColor: focused ? colors.surface : colors.surfaceAlt,
            borderColor,
            minHeight: multiline ? 110 : 52,
            alignItems: multiline ? 'flex-start' : 'center',
          },
          focused && !error && {
            shadowColor: colors.primary,
            shadowOpacity: colors.isDark ? 0.45 : 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={19}
            color={focused ? colors.primary : colors.textFaint}
            style={[styles.icon, multiline && { marginTop: 14 }]}
          />
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.primary}
          secureTextEntry={secure && hidden}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            { color: colors.text, fontFamily: fonts.medium },
            multiline && { paddingTop: 14, paddingBottom: 14 },
            inputStyle,
          ]}
          {...rest}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={styles.trailing}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textFaint} />
          </Pressable>
        ) : null}
        {right ? <View style={styles.trailing}>{right}</View> : null}
      </View>
      {error ? (
        <View style={styles.msgRow}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <AppText variant="caption" tone="danger" style={styles.msg}>
            {error}
          </AppText>
        </View>
      ) : hint ? (
        <AppText variant="caption" tone="faint" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { marginBottom: 8, marginLeft: 2 },
  box: { flexDirection: 'row', borderWidth: 1.5, paddingHorizontal: 14 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  trailing: { marginLeft: 8, alignSelf: 'center' },
  msgRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 2 },
  msg: { marginLeft: 4 },
  hint: { marginTop: 6, marginLeft: 2 },
});
