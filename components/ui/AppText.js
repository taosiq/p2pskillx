import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../theme';

const toneMap = {
  default: 'text',
  muted: 'textMuted',
  faint: 'textFaint',
  primary: 'primary',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  xp: 'xp',
  onBrand: 'textOnBrand',
};

/**
 * Themed text. variant picks the type style, tone picks a theme colour;
 * color overrides with any colour.
 */
export default function AppText({
  variant = 'body',
  tone = 'default',
  color,
  align,
  style,
  children,
  ...rest
}) {
  const { type, colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        type[variant] || type.body,
        { color: color || colors[toneMap[tone] || 'text'] },
        align && { textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
