import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '../components/Logo';
import SkillOrbit from '../components/SkillOrbit';
import useKeyboardVisible from '../hooks/useKeyboardVisible';
import { AppText, Button, Card, PressableScale, Screen, Sheet, TextField } from '../components/ui';
import { loginUser, sendPasswordReset } from '../services/userService';
import { useTheme } from '../theme';
import { authErrorMessage, isValidEmail } from '../utils/authErrors';
import haptics from '../utils/haptics';

const PERKS = [
  { icon: 'ribbon', text: 'AI-verified skills' },
  { icon: 'swap-horizontal', text: 'Peer-to-peer' },
  { icon: 'trophy', text: 'XP & badges' },
];

const LoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetState, setResetState] = useState('idle'); // idle | sending | sent
  const passwordRef = useRef(null);

  // Fit the whole page on screen: size the hero to the phone, and fold it away
  // while typing so the fields stay above the keyboard.
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const room = height - insets.top - insets.bottom;
  const fit = room >= 740 ? 'regular' : room >= 660 ? 'compact' : 'tiny';
  const showPerks = room >= 800;
  const typing = useKeyboardVisible();

  const validate = () => {
    const e = {};
    if (!isValidEmail(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Enter your password.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    setFormError('');
    if (!validate()) {
      haptics.warning();
      return;
    }
    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);
    if (result.success) {
      haptics.success();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      haptics.error();
      setFormError(authErrorMessage(result.code));
    }
  };

  const openReset = () => {
    setResetEmail(email);
    setResetState('idle');
    setResetOpen(true);
  };

  const handleReset = async () => {
    if (!isValidEmail(resetEmail)) {
      Alert.alert('Check your email', 'Enter a valid email address.');
      return;
    }
    setResetState('sending');
    const r = await sendPasswordReset(resetEmail);
    if (r.success) {
      setResetState('sent');
      haptics.success();
    } else {
      setResetState('idle');
      Alert.alert('Couldn’t send email', authErrorMessage(r.code));
    }
  };

  return (
    <Screen keyboard bounce={false} edges={['top', 'bottom']} contentStyle={styles.content}>
      {typing ? (
        <Animated.View key="brand" entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.brandRow}>
          <LogoMark size={36} />
          <AppText style={[styles.wordmark, styles.wordmarkSmall]}>
            P2PSkill
            <AppText tone="primary" style={[styles.wordmark, styles.wordmarkSmall]}>
              X
            </AppText>
          </AppText>
        </Animated.View>
      ) : (
        <Animated.View
          key="hero"
          entering={FadeInDown.duration(500)}
          exiting={FadeOut.duration(150)}
          style={[styles.hero, fit !== 'regular' && { marginBottom: 14 }]}
        >
          {fit === 'regular' ? (
            <SkillOrbit size={76} height={158} spread={0.72} />
          ) : fit === 'compact' ? (
            <SkillOrbit size={64} height={128} spread={0.6} />
          ) : (
            <LogoMark size={56} style={{ marginBottom: 6 }} />
          )}
          <AppText style={[styles.wordmark, fit !== 'regular' && styles.wordmarkMid]}>
            P2PSkill
            <AppText tone="primary" style={[styles.wordmark, fit !== 'regular' && styles.wordmarkMid]}>
              X
            </AppText>
          </AppText>
          <AppText variant="h3" align="center" style={{ marginTop: 2 }}>
            Teach what you know.{'\n'}
            <AppText variant="h3" tone="primary">
              Learn what you don’t.
            </AppText>
          </AppText>
          {fit === 'regular' && showPerks ? (
            <View style={styles.perks}>
              {PERKS.map((p) => (
                <View key={p.icon} style={[styles.perk, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name={p.icon} size={14} color={colors.primary} />
                  <AppText variant="caption" tone="muted" style={{ marginLeft: 5, fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {p.text}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.delay(150).duration(600)} layout={LinearTransition.duration(220)}>
        <Card padding={20} elevation={3}>
          <AppText variant="h2">Welcome back</AppText>
          {typing ? (
            <View style={{ height: 14 }} />
          ) : (
            <AppText variant="small" tone="muted" style={{ marginTop: 2, marginBottom: 16 }}>
              Sign in to continue your streak
            </AppText>
          )}

          {formError ? (
            <View style={[styles.banner, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <AppText variant="small" tone="danger" style={{ flex: 1, marginLeft: 8 }}>
                {formError}
              </AppText>
            </View>
          ) : null}

          <TextField
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <TextField
            ref={passwordRef}
            label="Password"
            icon="lock-closed-outline"
            placeholder="Your password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
            secure
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <PressableScale onPress={openReset} style={styles.forgot} hitSlop={10}>
            <AppText variant="smallStrong" tone="primary">
              Forgot password?
            </AppText>
          </PressableScale>

          <Button title="Sign in" onPress={handleLogin} loading={loading} full iconRight="arrow-forward" size="lg" />
        </Card>
      </Animated.View>

      {typing ? null : (
        <Animated.View entering={FadeIn.duration(200)} style={styles.footer}>
          <AppText variant="body" tone="muted">
            New to P2PSkillX?{' '}
          </AppText>
          <PressableScale onPress={() => navigation.navigate('SignUp')} hitSlop={10}>
            <AppText variant="bodyStrong" tone="primary">
              Create an account
            </AppText>
          </PressableScale>
        </Animated.View>
      )}

      <Sheet
        visible={resetOpen}
        onClose={() => setResetOpen(false)}
        title={resetState === 'sent' ? 'Check your inbox' : 'Reset your password'}
        subtitle={
          resetState === 'sent'
            ? `If an account exists for ${resetEmail.trim()}, a reset link is on its way. It can take a minute, and may land in spam.`
            : 'We’ll email you a link to choose a new password.'
        }
      >
        {resetState === 'sent' ? (
          <Button title="Back to sign in" onPress={() => setResetOpen(false)} full />
        ) : (
          <>
            <TextField
              icon="mail-outline"
              placeholder="you@example.com"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <Button title="Send reset link" onPress={handleReset} loading={resetState === 'sending'} full />
          </>
        )}
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingTop: 8, paddingBottom: 12 },
  hero: { marginBottom: 18, alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  wordmark: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 32, lineHeight: 40, letterSpacing: -0.8 },
  wordmarkMid: { fontSize: 28, lineHeight: 34 },
  wordmarkSmall: { fontSize: 24, lineHeight: 30 },
  perks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 },
  perk: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16 },
  forgot: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, flexWrap: 'wrap' },
});

export default LoginScreen;
