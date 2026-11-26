import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import SkillOrbit from '../components/SkillOrbit';
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
    <Screen keyboard edges={['top', 'bottom']} contentStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(600)} style={styles.hero}>
        <SkillOrbit />
        <AppText style={styles.wordmark}>
          P2PSkill
          <AppText tone="primary" style={styles.wordmark}>
            X
          </AppText>
        </AppText>
        <AppText variant="h2" align="center" style={{ marginTop: 6 }}>
          Teach what you know.{'\n'}
          <AppText variant="h2" tone="primary">
            Learn what you don’t.
          </AppText>
        </AppText>
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
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(150).duration(600)}>
        <Card padding={20} elevation={3}>
          <AppText variant="h2">Welcome back</AppText>
          <AppText variant="small" tone="muted" style={{ marginTop: 4, marginBottom: 20 }}>
            Sign in to continue your streak
          </AppText>

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

      <View style={styles.footer}>
        <AppText variant="body" tone="muted">
          New to P2PSkillX?{' '}
        </AppText>
        <PressableScale onPress={() => navigation.navigate('SignUp')} hitSlop={10}>
          <AppText variant="bodyStrong" tone="primary">
            Create an account
          </AppText>
        </PressableScale>
      </View>

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
  content: { flexGrow: 1, justifyContent: 'center', paddingTop: 4 },
  hero: { marginBottom: 22, alignItems: 'center' },
  wordmark: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 34, lineHeight: 42, letterSpacing: -0.8, marginTop: 4 },
  perks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 },
  perk: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16 },
  forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22, flexWrap: 'wrap' },
});

export default LoginScreen;
