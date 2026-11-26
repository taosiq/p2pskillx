import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { SelectField } from '../components/FormPickers';
import { AppText, Avatar, Button, Card, Chip, Header, PressableScale, Screen, TextField } from '../components/ui';
import { CATEGORIES } from '../constants/categories';
import { useUser } from '../context/UserContext';
import { removeProfilePhoto, setProfilePhoto, updateUserProfile } from '../services/userService';
import { useTheme } from '../theme';
import haptics from '../utils/haptics';
import { pickImage } from '../utils/media';

const OCCUPATIONS = [
  { label: 'Student', value: 'student', icon: 'school-outline' },
  { label: 'Professional', value: 'professional', icon: 'briefcase-outline' },
  { label: 'Self-employed', value: 'self-employed', icon: 'rocket-outline' },
  { label: 'Other', value: 'other', icon: 'ellipsis-horizontal-circle-outline' },
];

const INTERESTS = [...new Set(CATEGORIES.flatMap((c) => c.skills))].slice(0, 30);
const BIO_MAX = 200;

const EditProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, profile, game, displayName } = useUser();
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [occupation, setOccupation] = useState(profile?.occupation || '');
  const [interests, setInterests] = useState(profile?.interests || []);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const toggleInterest = (i) =>
    setInterests((list) => (list.includes(i) ? list.filter((x) => x !== i) : list.length < 8 ? [...list, i] : list));

  const changePhoto = async () => {
    const picked = await pickImage({ square: true, quality: 0.35 });
    if (!picked?.dataUri) return;
    setPhotoBusy(true);
    const r = await setProfilePhoto(picked.dataUri);
    setPhotoBusy(false);
    if (!r.success) Alert.alert('Couldn’t update photo', r.error === 'too_large' ? 'Try cropping closer.' : 'Please try again.');
  };

  const save = async () => {
    const e = {};
    if (!firstName.trim()) e.firstName = 'Required';
    if (!lastName.trim()) e.lastName = 'Required';
    setErrors(e);
    if (Object.keys(e).length) {
      haptics.warning();
      return;
    }
    setSaving(true);
    const r = await updateUserProfile({
      firstName: firstName.trim().slice(0, 40),
      lastName: lastName.trim().slice(0, 40),
      bio: bio.trim().slice(0, BIO_MAX),
      occupation,
      interests,
    });
    setSaving(false);
    if (r.success) {
      haptics.success();
      navigation.goBack();
    } else Alert.alert('Couldn’t save', 'Please try again.');
  };

  return (
    <Screen
      keyboard
      edges={['top', 'bottom']}
      header={<Header title="Edit profile" onBack={() => navigation.goBack()} right={<Button title="Save" size="sm" onPress={save} loading={saving} />} />}
    >
      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        <PressableScale onPress={changePhoto} accessibilityLabel="Change photo">
          <Avatar uri={profile?.profileImage} name={displayName} size={110} ring={game?.level.tier.colors} />
          <View style={[styles.cam, { backgroundColor: colors.primary, borderColor: colors.bg }]}>
            {photoBusy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
          </View>
        </PressableScale>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
          <AppText variant="smallStrong" tone="primary" onPress={changePhoto}>
            Change photo
          </AppText>
          {profile?.profileImage ? (
            <AppText variant="smallStrong" tone="danger" onPress={() => removeProfilePhoto()}>
              Remove
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TextField style={{ flex: 1 }} label="First name" required value={firstName} onChangeText={setFirstName} error={errors.firstName} maxLength={40} textContentType="givenName" />
        <TextField style={{ flex: 1 }} label="Last name" required value={lastName} onChangeText={setLastName} error={errors.lastName} maxLength={40} textContentType="familyName" />
      </View>
      <TextField
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={BIO_MAX}
        placeholder="What do you teach, and what do you want to learn?"
        hint={`${bio.length}/${BIO_MAX}`}
      />
      <SelectField label="Occupation" icon="briefcase-outline" value={occupation} options={OCCUPATIONS} onChange={setOccupation} placeholder="Select" />
      <TextField label="Email" icon="mail-outline" value={user?.email || ''} editable={false} hint="Your sign-in email can’t be changed here." />

      <AppText variant="smallStrong" tone="muted" style={{ marginTop: 6, marginBottom: 4 }}>
        I want to learn ({interests.length}/8)
      </AppText>
      <AppText variant="caption" tone="faint" style={{ marginBottom: 10 }}>
        Used to recommend courses and people.
      </AppText>
      <Card padding={12}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {INTERESTS.map((i) => (
            <Chip key={i} label={i} size="sm" selected={interests.includes(i)} onPress={() => toggleInterest(i)} />
          ))}
        </View>
      </Card>

      <Button title="Save changes" icon="checkmark" onPress={save} loading={saving} full size="lg" style={{ marginTop: 24 }} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  cam: { position: 'absolute', right: 4, bottom: 4, width: 34, height: 34, borderRadius: 17, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});

export default EditProfileScreen;
