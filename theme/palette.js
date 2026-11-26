// Colour themes. Each theme has a dark and a light variant; the user picks a
// theme in Settings (some unlock at higher tiers) and light/dark follows the
// phone unless they override it. Screens never use raw hex values for brand
// colours: they read everything through useTheme().

// Semantic colours shared by every theme.
const semantic = {
  dark: {
    success: '#2EE59D',
    successSoft: 'rgba(46,229,157,0.15)',
    warning: '#FFB547',
    warningSoft: 'rgba(255,181,71,0.16)',
    danger: '#FF5470',
    dangerSoft: 'rgba(255,84,112,0.16)',
    info: '#38BDF8',
    infoSoft: 'rgba(56,189,248,0.15)',
    xp: '#FFC83D',
    textOnBrand: '#FFFFFF',
    shadow: '#000000',
    overlay: 'rgba(3,5,12,0.74)',
  },
  light: {
    success: '#0FA968',
    successSoft: 'rgba(15,169,104,0.12)',
    warning: '#D98A00',
    warningSoft: 'rgba(217,138,0,0.13)',
    danger: '#E2334F',
    dangerSoft: 'rgba(226,51,79,0.10)',
    info: '#0284C7',
    infoSoft: 'rgba(2,132,199,0.10)',
    xp: '#E09A00',
    textOnBrand: '#FFFFFF',
    overlay: 'rgba(10,14,30,0.5)',
  },
};

// Neutral surfaces, lightly tinted towards the theme's hue.
const darkBase = (tint) => ({
  isDark: true,
  bg: tint.bg,
  bgElevated: tint.elevated,
  surface: tint.surface,
  surfaceAlt: tint.surfaceAlt,
  surfacePressed: tint.pressed,
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#F3F6FF',
  textMuted: tint.muted,
  textFaint: tint.faint,
  skeleton: tint.surfaceAlt,
  skeletonHighlight: tint.pressed,
  tabBar: tint.tabBar,
  headerBg: tint.header,
  ...semantic.dark,
});

const lightBase = (tint) => ({
  isDark: false,
  bg: tint.bg,
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: tint.surfaceAlt,
  surfacePressed: tint.pressed,
  border: 'rgba(15,23,60,0.08)',
  borderStrong: 'rgba(15,23,60,0.16)',
  text: '#0E1330',
  textMuted: '#556080',
  textFaint: '#97A0BA',
  skeleton: tint.surfaceAlt,
  skeletonHighlight: '#FFFFFF',
  tabBar: 'rgba(255,255,255,0.97)',
  headerBg: tint.header,
  shadow: tint.shadow,
  ...semantic.light,
});

const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

function makeTheme({ key, name, description, unlockLevel = 1, primary, primaryLight, accent, accentLight, gradient, hero, dark, light, swatch }) {
  return {
    key,
    name,
    description,
    unlockLevel,
    swatch: swatch || gradient,
    dark: {
      ...darkBase(dark),
      primary,
      primarySoft: hexA(primary, 0.18),
      accent,
      accentSoft: hexA(accent, 0.16),
      glowA: hexA(gradient[0], 0.32),
      glowB: hexA(gradient[gradient.length - 1], 0.22),
    },
    light: {
      ...lightBase(light),
      primary: primaryLight || primary,
      primarySoft: hexA(primaryLight || primary, 0.11),
      accent: accentLight || accent,
      accentSoft: hexA(accentLight || accent, 0.12),
      glowA: hexA(gradient[0], 0.16),
      glowB: hexA(gradient[gradient.length - 1], 0.1),
    },
    gradient,
    hero,
  };
}

export const THEMES = [
  makeTheme({
    key: 'cyber',
    name: 'Cyber',
    description: 'Electric blue with neon lime',
    primary: '#2F8CFF',
    primaryLight: '#1565E8',
    accent: '#B8F33A',
    accentLight: '#5E9C00',
    gradient: ['#12C2FF', '#2F6BFF'],
    hero: ['#071C46', '#0A3A86', '#0B6FA8'],
    swatch: ['#12C2FF', '#2F6BFF', '#B8F33A'],
    dark: {
      bg: '#050A17',
      elevated: '#0A1224',
      surface: '#0E182E',
      surfaceAlt: '#16223D',
      pressed: '#1E2D4F',
      muted: '#9AA8C7',
      faint: '#5E6C8C',
      tabBar: 'rgba(9,16,34,0.97)',
      header: 'rgba(5,10,23,0.92)',
    },
    light: { bg: '#F2F6FF', surfaceAlt: '#E7EEFD', pressed: '#DCE6FB', header: 'rgba(242,246,255,0.94)', shadow: '#123A8C' },
  }),
  makeTheme({
    key: 'nebula',
    name: 'Nebula',
    description: 'Cosmic violet and magenta',
    primary: '#8B6CFF',
    primaryLight: '#6A47FF',
    accent: '#FF4FD8',
    accentLight: '#D22DB5',
    gradient: ['#7C5CFF', '#C04BFF', '#FF4FD8'],
    hero: ['#24165E', '#4C1D95', '#7C2D8F'],
    dark: {
      bg: '#0A0918',
      elevated: '#100F24',
      surface: '#17162F',
      surfaceAlt: '#211F42',
      pressed: '#2A2852',
      muted: '#A9A7CC',
      faint: '#6F6D96',
      tabBar: 'rgba(16,15,36,0.97)',
      header: 'rgba(10,9,24,0.92)',
    },
    light: { bg: '#F5F4FF', surfaceAlt: '#EEEBFF', pressed: '#E4E0FF', header: 'rgba(245,244,255,0.94)', shadow: '#2A1F7A' },
  }),
  makeTheme({
    key: 'ember',
    name: 'Ember',
    description: 'Blazing orange and red',
    unlockLevel: 3,
    primary: '#FF7A2F',
    primaryLight: '#E8590C',
    accent: '#FFD23F',
    accentLight: '#B7791F',
    gradient: ['#FFA62B', '#FF5E3A', '#E8384F'],
    hero: ['#3A0F0F', '#7A1F1F', '#A8431B'],
    dark: {
      bg: '#120A08',
      elevated: '#1A100C',
      surface: '#221612',
      surfaceAlt: '#2E1E18',
      pressed: '#3A2820',
      muted: '#C9AFA4',
      faint: '#86695E',
      tabBar: 'rgba(26,16,12,0.97)',
      header: 'rgba(18,10,8,0.92)',
    },
    light: { bg: '#FFF6F1', surfaceAlt: '#FDEAE0', pressed: '#FADDCF', header: 'rgba(255,246,241,0.94)', shadow: '#7A2E0F' },
  }),
  makeTheme({
    key: 'jungle',
    name: 'Jungle',
    description: 'Emerald and gold',
    unlockLevel: 5,
    primary: '#14C98B',
    primaryLight: '#0A9C6B',
    accent: '#FFD166',
    accentLight: '#B98900',
    gradient: ['#3EE6A8', '#0FA3B1'],
    hero: ['#05261F', '#0B4A3A', '#0E6B5E'],
    dark: {
      bg: '#04110E',
      elevated: '#081914',
      surface: '#0D221C',
      surfaceAlt: '#142E26',
      pressed: '#1C3B31',
      muted: '#9FC2B5',
      faint: '#5D8274',
      tabBar: 'rgba(8,25,20,0.97)',
      header: 'rgba(4,17,14,0.92)',
    },
    light: { bg: '#F0FBF6', surfaceAlt: '#E0F5EC', pressed: '#D0EEE1', header: 'rgba(240,251,246,0.94)', shadow: '#0B4A3A' },
  }),
  makeTheme({
    key: 'sakura',
    name: 'Sakura',
    description: 'Neon pink and lilac',
    unlockLevel: 7,
    primary: '#FF5FA8',
    primaryLight: '#E0347F',
    accent: '#8BE9FF',
    accentLight: '#0E8FB0',
    gradient: ['#FF8AC2', '#FF4F9A', '#B04BFF'],
    hero: ['#3A0A2C', '#6E1352', '#5A1F8F'],
    dark: {
      bg: '#12070F',
      elevated: '#1A0C16',
      surface: '#22111D',
      surfaceAlt: '#2E1828',
      pressed: '#3B2034',
      muted: '#CCA8BF',
      faint: '#8A6680',
      tabBar: 'rgba(26,12,22,0.97)',
      header: 'rgba(18,7,15,0.92)',
    },
    light: { bg: '#FFF4F9', surfaceAlt: '#FDE6F1', pressed: '#FAD7E8', header: 'rgba(255,244,249,0.94)', shadow: '#6E1352' },
  }),
];

export const DEFAULT_THEME = 'cyber';
export const themeByKey = (key) => THEMES.find((t) => t.key === key) || THEMES[0];

// Semantic gradients look the same in every theme.
export const fixedGradients = {
  ocean: ['#06B6D4', '#3B82F6'],
  cool: ['#3B82F6', '#6366F1'],
  success: ['#10B981', '#2EE59D'],
  gold: ['#FFC83D', '#FF8A3D'],
  fire: ['#FF8A3D', '#FF4F6D'],
  pink: ['#FF4FD8', '#FF7A9C'],
  violet: ['#6A47FF', '#9B6BFF'],
  lime: ['#A3E635', '#22C55E'],
};

// One accent per skill category / avatar, used for icons and chips.
export const categoryColors = ['#2F8CFF', '#FF4FD8', '#12C2FF', '#2EE59D', '#FFB547', '#FF7A45', '#8B6CFF', '#B8F33A'];

export { hexA };
