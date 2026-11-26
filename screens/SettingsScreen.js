import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { TierBadge } from '../components/game';
import { AppText, Avatar, Button, Card, Divider, Header, ListItem, PressableScale, Screen, Segmented, Sheet, TextField } from '../components/ui';
import { useUser } from '../context/UserContext';
import { deleteAccount, sendPasswordReset } from '../services/userService';
import { useTheme } from '../theme';
import { authErrorMessage } from '../utils/authErrors';
import haptics from '../utils/haptics';

function Group({ title, children }) {
  return (
    <>
      <AppText variant="overline" tone="faint" style={styles.groupTitle}>
        {title}
      </AppText>
      <Card padding={6} style={{ paddingHorizontal: 14 }}>
        {React.Children.toArray(children).map((child, i, arr) => (
          <View key={i}>
            {child}
            {i < arr.length - 1 ? <Divider style={{ marginLeft: 54 }} /> : null}
          </View>
        ))}
      </Card>
    </>
  );
}

const SettingsScreen = ({ navigation }) => {
  const { colors, themes, themeKey, setThemeKey, appearance, setAppearance } = useTheme();
  const { user, profile, game, displayName, signOut } = useUser();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const goToLogin = () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] });

  const handleSignOut = () =>
    Alert.alert('Sign out?', 'Your progress is saved to your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          goToLogin();
        },
      },
    ]);

  const handlePasswordReset = async () => {
    const r = await sendPasswordReset(user.email);
    if (r.success) Alert.alert('Check your inbox', `We sent a password reset link to ${user.email}.`);
    else Alert.alert('Couldn’t send email', authErrorMessage(r.code));
  };

  const handleDelete = async () => {
    if (!password) {
      setDeleteError('Enter your password to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    const r = await deleteAccount(password);
    setDeleting(false);
    if (r.success) {
      haptics.success();
      setDeleteOpen(false);
      goToLogin();
      Alert.alert('Account deleted', 'Your account and profile have been permanently deleted.');
    } else {
      haptics.error();
      setDeleteError(authErrorMessage(r.code, 'Couldn’t delete your account. Please try again.'));
    }
  };

  const version = Constants.expoConfig?.version || '1.0.0';

  return (
    <Screen header={<Header title="Settings" onBack={() => navigation.goBack()} />}>
      <Card style={styles.profile}>
        <Avatar uri={profile?.profileImage} name={displayName} size={60} ring={game?.level.tier.colors} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <AppText variant="h3" numberOfLines={1}>
            {displayName}
          </AppText>
          <AppText variant="small" tone="muted" numberOfLines={1} style={{ marginBottom: 6 }}>
            {user?.email}
          </AppText>
          {game ? <TierBadge tier={game.level.tier} /> : null}
        </View>
      </Card>

      <Group title="Account">
        <ListItem icon="person-outline" title="Edit profile" subtitle="Name, bio, photo" onPress={() => navigation.navigate('EditProfile')} />
        <ListItem icon="key-outline" title="Change password" subtitle="We’ll email you a secure link" onPress={handlePasswordReset} />
      </Group>

      <Group title="Progress">
        <ListItem icon="trophy-outline" iconColor={colors.warning} title="Achievements & tiers" onPress={() => navigation.navigate('Achievements')} />
        <ListItem icon="podium-outline" iconColor={colors.info} title="Leaderboard" onPress={() => navigation.navigate('Leaderboard')} />
      </Group>

      <AppText variant="overline" tone="faint" style={styles.groupTitle}>
        Appearance
      </AppText>
      <Card padding={16}>
        <Segmented
          value={appearance}
          onChange={setAppearance}
          options={[
            { value: 'system', label: 'Auto' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        <AppText variant="smallStrong" tone="muted" style={{ marginTop: 18, marginBottom: 10 }}>
          Colour theme
        </AppText>
        <View style={styles.themes}>
          {themes.map((t) => {
            const locked = (game?.level.level || 1) < t.unlockLevel;
            const active = t.key === themeKey;
            return (
              <PressableScale
                key={t.key}
                onPress={() => {
                  if (locked) {
                    haptics.warning();
                    Alert.alert(`${t.name} is locked`, `Reach Level ${t.unlockLevel} to unlock this theme. Verify skills, teach and keep your streak to earn XP.`);
                  } else {
                    haptics.select();
                    setThemeKey(t.key);
                  }
                }}
                style={styles.themeItem}
                accessibilityLabel={`${t.name} theme${locked ? `, unlocks at level ${t.unlockLevel}` : ''}`}
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.swatchRing, { borderColor: active ? colors.primary : 'transparent' }]}>
                  <LinearGradient colors={t.swatch} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.swatch, locked && { opacity: 0.35 }]}>
                    {locked ? <Ionicons name="lock-closed" size={18} color="#fff" /> : active ? <Ionicons name="checkmark" size={22} color="#fff" /> : null}
                  </LinearGradient>
                </View>
                <AppText variant="caption" tone={active ? 'default' : 'muted'} style={{ marginTop: 6, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {t.name}
                </AppText>
                <AppText variant="caption" tone="faint" style={{ fontSize: 10 }}>
                  {locked ? `Level ${t.unlockLevel}` : t.description.split(' ')[0]}
                </AppText>
              </PressableScale>
            );
          })}
        </View>
      </Card>

      <Group title="Help & legal">
        <ListItem icon="book-outline" title="User manual" onPress={() => navigation.navigate('UserManual')} />
        <ListItem icon="help-circle-outline" title="Help & FAQs" onPress={() => navigation.navigate('HelpGuide')} />
        <ListItem icon="shield-checkmark-outline" title="Privacy policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
      </Group>

      <Group title="Session">
        <ListItem icon="log-out-outline" title="Sign out" onPress={handleSignOut} showChevron={false} />
        <ListItem
          icon="trash-outline"
          title="Delete account"
          subtitle="Permanently remove your account and data"
          danger
          onPress={() => {
            setPassword('');
            setDeleteError('');
            setDeleteOpen(true);
          }}
        />
      </Group>

      <AppText variant="caption" tone="faint" align="center" style={{ marginTop: 24 }}>
        P2PSkillX v{version}
      </AppText>

      <Sheet
        visible={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="Delete your account?"
        subtitle="This permanently deletes your profile, skills, XP and credits. It can’t be undone."
      >
        <TextField
          label="Confirm with your password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setDeleteError('');
          }}
          error={deleteError}
          secure
          autoCapitalize="none"
          textContentType="password"
        />
        <Button title="Delete permanently" variant="danger" onPress={handleDelete} loading={deleting} full icon="trash" />
        <Button title="Keep my account" variant="ghost" onPress={() => setDeleteOpen(false)} full style={{ marginTop: 6 }} disabled={deleting} />
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  groupTitle: { marginTop: 24, marginBottom: 8, marginLeft: 4 },
  themes: { flexDirection: 'row', justifyContent: 'space-between' },
  themeItem: { alignItems: 'center', flex: 1 },
  swatchRing: { padding: 3, borderRadius: 22, borderWidth: 2 },
  swatch: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});

export default SettingsScreen;
