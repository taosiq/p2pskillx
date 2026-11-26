import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { AppText, Button, Card, Screen } from '../components/ui';
import { useUser } from '../context/UserContext';
import { resendVerificationEmail } from '../services/userService';
import { useTheme } from '../theme';
import haptics from '../utils/haptics';

const RESEND_SECONDS = 60;

/**
 * Shown instead of the app until the user confirms their email address.
 * Verified emails keep throwaway accounts from collecting starting credits.
 */
export default function VerifyEmailScreen({ navigation }) {
  const { colors, gradients, glow } = useTheme();
  const { user, refreshVerification, signOut } = useUser();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(null); // { tone, text }
  const [cooldown, setCooldown] = useState(0);
  const busy = useRef(false);

  const check = useCallback(
    async (manual) => {
      if (busy.current) return;
      busy.current = true;
      if (manual) setChecking(true);
      try {
        const ok = await refreshVerification();
        if (ok) haptics.success();
        else if (manual) {
          haptics.warning();
          setMessage({ tone: 'warning', text: 'Not verified yet. Open the link in the email, then tap the button again.' });
        }
      } catch {
        if (manual) setMessage({ tone: 'danger', text: 'Couldn’t check right now. Check your connection and try again.' });
      } finally {
        busy.current = false;
        if (manual) setChecking(false);
      }
    },
    [refreshVerification]
  );

  // Check automatically when the user comes back from their email app, and every few seconds.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => state === 'active' && check(false));
    const timer = setInterval(() => check(false), 6000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [check]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    setMessage(null);
    const r = await resendVerificationEmail();
    if (r.success) {
      haptics.success();
      setCooldown(RESEND_SECONDS);
      setMessage({ tone: 'success', text: 'Sent! It can take a minute to arrive.' });
    } else if (r.code === 'auth/too-many-requests') {
      setCooldown(RESEND_SECONDS);
      setMessage({ tone: 'warning', text: 'Too many emails sent. Please wait a few minutes before trying again.' });
    } else {
      setMessage({ tone: 'danger', text: 'Couldn’t send the email. Check your connection and try again.' });
    }
  };

  const switchAccount = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <Screen contentStyle={styles.content}>
      <Animated.View entering={FadeInUp.duration(500)} style={styles.hero}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.icon, glow(colors.primary, 1)]}>
          <Ionicons name="mail-unread" size={44} color="#FFFFFF" />
        </LinearGradient>
        <AppText variant="h1" style={styles.center}>
          Verify your email
        </AppText>
        <AppText tone="muted" style={[styles.center, { marginTop: 8 }]}>
          We sent a link to
        </AppText>
        <AppText variant="bodyStrong" style={styles.center}>
          {user?.email}
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)}>
        <Card style={{ marginTop: 28 }}>
          {[
            ['mail-open', 'Open the email from P2PSkillX'],
            ['link', 'Tap the verification link'],
            ['checkmark-circle', 'Come back here: you’ll go straight in'],
          ].map(([icon, text], i) => (
            <View key={icon} style={[styles.step, i > 0 && { marginTop: 14 }]}>
              <View style={[styles.stepIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={icon} size={18} color={colors.primary} />
              </View>
              <AppText style={{ flex: 1 }}>{text}</AppText>
            </View>
          ))}
          <AppText variant="small" tone="muted" style={{ marginTop: 16 }}>
            Can’t find it? Check your spam or junk folder.
          </AppText>
        </Card>

        {message ? (
          <AppText variant="small" tone={message.tone} style={[styles.center, { marginTop: 16 }]}>
            {message.text}
          </AppText>
        ) : null}

        <Button title="I’ve verified my email" icon="checkmark-done" onPress={() => check(true)} loading={checking} full style={{ marginTop: 20 }} />
        <Button
          title={cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email'}
          icon="refresh"
          variant="secondary"
          onPress={resend}
          disabled={cooldown > 0}
          full
          style={{ marginTop: 12 }}
        />
        <Button title="Use a different account" variant="ghost" onPress={switchAccount} full style={{ marginTop: 8 }} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 48, paddingBottom: 40 },
  hero: { alignItems: 'center' },
  icon: { width: 96, height: 96, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  center: { textAlign: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
