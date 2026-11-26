import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText, Button, PressableScale, Sheet } from './ui';

/** Looks like a TextField but opens a picker. */
function FieldButton({ label, required, text, isPlaceholder, icon, trailing, onPress, error, style }) {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <AppText variant="smallStrong" tone="muted" style={styles.label}>
          {label}
          {required ? <AppText variant="smallStrong" tone="accent"> *</AppText> : null}
        </AppText>
      ) : null}
      <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={label ? `${label}: ${text}` : text}>
        <View
          style={[
            styles.field,
            { backgroundColor: colors.surfaceAlt, borderColor: error ? colors.danger : colors.border, borderRadius: radius.md },
          ]}
        >
          {icon ? <Ionicons name={icon} size={19} color={colors.textFaint} style={{ marginRight: 10 }} /> : null}
          <AppText variant="body" tone={isPlaceholder ? 'faint' : 'default'} numberOfLines={1} style={{ flex: 1 }}>
            {text}
          </AppText>
          <Ionicons name={trailing} size={18} color={colors.textFaint} />
        </View>
      </PressableScale>
      {error ? (
        <AppText variant="caption" tone="danger" style={{ marginTop: 6, marginLeft: 2 }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

/** Dropdown replacement: options = [{ label, value, icon? }] */
export function SelectField({ label, required, value, options, placeholder = 'Select', onChange, title, icon, error, style }) {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <FieldButton
        label={label}
        required={required}
        text={selected ? selected.label : placeholder}
        isPlaceholder={!selected}
        icon={icon}
        trailing="chevron-down"
        onPress={() => setOpen(true)}
        error={error}
        style={style}
      />
      <Sheet visible={open} title={title || label || placeholder} onClose={() => setOpen(false)}>
        <View style={{ gap: 8 }}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <PressableScale
                key={option.value}
                haptic="select"
                scaleTo={0.98}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.option,
                    {
                      borderRadius: radius.md,
                      backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {option.icon ? (
                    <Ionicons name={option.icon} size={20} color={isSelected ? colors.primary : colors.textMuted} style={{ marginRight: 12 }} />
                  ) : null}
                  <AppText variant="bodyStrong" tone={isSelected ? 'primary' : 'default'} style={{ flex: 1 }}>
                    {option.label}
                  </AppText>
                  {isSelected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
                </View>
              </PressableScale>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

/** Date input: native dialog on Android, bottom sheet with a wheel on iOS. */
export function DateField({ label, required, value, onChange, placeholder = 'Select date', maximumDate, minimumDate, title = 'Select date', error, style }) {
  const { isDark, colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || new Date(2000, 0, 1));
  const text = value ? value.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder;

  const openPicker = () => {
    setDraft(value || new Date(2000, 0, 1));
    setOpen(true);
  };

  return (
    <>
      <FieldButton
        label={label}
        required={required}
        text={text}
        isPlaceholder={!value}
        icon="calendar-outline"
        trailing="chevron-down"
        onPress={openPicker}
        error={error}
        style={style}
      />

      {Platform.OS === 'ios' ? (
        <Sheet visible={open} title={title} onClose={() => setOpen(false)}>
          <DateTimePicker
            value={draft}
            mode="date"
            display="spinner"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            themeVariant={isDark ? 'dark' : 'light'}
            textColor={colors.text}
            onChange={(_, d) => d && setDraft(d)}
            style={styles.iosPicker}
          />
          <Button
            title="Done"
            full
            onPress={() => {
              onChange(draft);
              setOpen(false);
            }}
          />
        </Sheet>
      ) : (
        open && (
          <DateTimePicker
            value={draft}
            mode="date"
            display="default"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={(event, d) => {
              setOpen(false);
              if (event.type === 'set' && d) onChange(d);
            }}
          />
        )
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { marginBottom: 8, marginLeft: 2 },
  field: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1.5 },
  iosPicker: { alignSelf: 'stretch', marginBottom: 12 },
});
