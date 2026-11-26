import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { DateField, SelectField } from '../components/FormPickers';
import { AppText, Button, Header, PressableScale, ProgressBar, Screen, TextField } from '../components/ui';
import { registerUser } from '../services/userService';
import { useTheme } from '../theme';
import { authErrorMessage, isValidEmail, passwordProblems, passwordStrength } from '../utils/authErrors';
import haptics from '../utils/haptics';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male', icon: 'male' },
  { label: 'Female', value: 'female', icon: 'female' },
  { label: 'Other', value: 'other', icon: 'transgender' },
  { label: 'Prefer not to say', value: 'undisclosed', icon: 'eye-off-outline' },
];

const OCCUPATION_OPTIONS = [
  { label: 'Student', value: 'student', icon: 'school-outline' },
  { label: 'Professional', value: 'professional', icon: 'briefcase-outline' },
  { label: 'Self-employed', value: 'self-employed', icon: 'rocket-outline' },
  { label: 'Other', value: 'other', icon: 'ellipsis-horizontal-circle-outline' },
];

const MIN_AGE = 13;
const STRENGTH = [
  { label: 'Too weak', tone: 'danger' },
  { label: 'Weak', tone: 'danger' },
  { label: 'Okay', tone: 'warning' },
  { label: 'Strong', tone: 'success' },
  { label: 'Very strong', tone: 'success' },
];

const ageOn = (dob, now = new Date()) => {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
};

const SignUpScreen = ({ navigation }) => {
  const { colors, gradients } = useTheme();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
    dob: null,
    gender: '',
    occupation: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const refs = { lastName: useRef(), email: useRef(), password: useRef(), confirm: useRef() };

  const set = (key) => (v) => {
    setForm((f) => ({ ...f, [key]: v }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const strength = passwordStrength(form.password);

  const validateStep0 = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!isValidEmail(form.email)) e.email = 'Enter a valid email address.';
    const problems = passwordProblems(form.password);
    if (problems.length) e.password = `Needs ${problems.join(', ')}.`;
    if (!form.confirm) e.confirm = 'Confirm your password.';
    else if (form.confirm !== form.password) e.confirm = 'Passwords don’t match.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.dob) e.dob = 'Select your date of birth.';
    else if (ageOn(form.dob) < MIN_AGE) e.dob = `You must be at least ${MIN_AGE} to use P2PSkillX.`;
    if (!form.gender) e.gender = 'Select an option.';
    if (!form.occupation) e.occupation = 'Select an option.';
    if (!agreed) e.agreed = 'Please accept to continue.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (!validateStep0()) {
      haptics.warning();
      return;
    }
    haptics.tap();
    setStep(1);
  };

  const submit = async () => {
    setFormError('');
    if (!validateStep1()) {
      haptics.warning();
      return;
    }
    setLoading(true);
    const result = await registerUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      dateOfBirth: form.dob.toLocaleDateString('en-US'),
      gender: form.gender,
      occupation: form.occupation,
      password: form.password,
    });
    setLoading(false);
    if (result.success) {
      haptics.success();
      // Firebase signs the new user in automatically: go straight into the app.
      navigation.reset({ index: 0, routes: [{ name: 'Main', params: { welcome: true } }] });
    } else {
      haptics.error();
      setFormError(authErrorMessage(result.code));
      if (result.code === 'auth/email-already-in-use' || result.code === 'auth/invalid-email') setStep(0);
    }
  };

  const back = () => (step === 1 ? setStep(0) : navigation.goBack());
  const maxDob = new Date();

  return (
    <Screen
      keyboard
      edges={['top', 'bottom']}
      header={<Header title="Create account" subtitle={`Step ${step + 1} of 2`} onBack={back} />}
    >
      <ProgressBar value={(step + 1) / 2} height={6} style={{ marginBottom: 20 }} />

      <View style={[styles.bonus, { backgroundColor: colors.warningSoft, borderColor: colors.warning + '55' }]}>
        <Ionicons name="gift" size={20} color={colors.warning} />
        <AppText variant="small" style={{ flex: 1, marginLeft: 10 }}>
          <AppText variant="smallStrong" tone="warning">
            100 free credits
          </AppText>{' '}
          when you join: spend them on your first courses.
        </AppText>
      </View>

      {formError ? (
        <View style={[styles.banner, { backgroundColor: colors.dangerSoft }]}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <AppText variant="small" tone="danger" style={{ flex: 1, marginLeft: 8 }}>
            {formError}
          </AppText>
        </View>
      ) : null}

      {step === 0 ? (
        <Animated.View key="s0" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
          <AppText variant="h2">Let’s set up your account</AppText>
          <AppText variant="small" tone="muted" style={{ marginTop: 4, marginBottom: 20 }}>
            This is how other learners will find you.
          </AppText>
          <View style={styles.row}>
            <TextField
              style={styles.half}
              label="First name"
              required
              value={form.firstName}
              onChangeText={set('firstName')}
              error={errors.firstName}
              autoComplete="given-name"
              textContentType="givenName"
              returnKeyType="next"
              onSubmitEditing={() => refs.lastName.current?.focus()}
            />
            <TextField
              ref={refs.lastName}
              style={styles.half}
              label="Last name"
              required
              value={form.lastName}
              onChangeText={set('lastName')}
              error={errors.lastName}
              autoComplete="family-name"
              textContentType="familyName"
              returnKeyType="next"
              onSubmitEditing={() => refs.email.current?.focus()}
            />
          </View>
          <TextField
            ref={refs.email}
            label="Email"
            required
            icon="mail-outline"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={set('email')}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => refs.password.current?.focus()}
          />
          <TextField
            ref={refs.password}
            label="Password"
            required
            icon="lock-closed-outline"
            placeholder="At least 8 characters"
            value={form.password}
            onChangeText={set('password')}
            error={errors.password}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => refs.confirm.current?.focus()}
            style={{ marginBottom: form.password ? 8 : 16 }}
          />
          {form.password ? (
            <View style={styles.strength}>
              <View style={styles.bars}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.bar,
                      { backgroundColor: i < strength ? colors[STRENGTH[strength].tone] : colors.surfaceAlt },
                    ]}
                  />
                ))}
              </View>
              <AppText variant="caption" tone={STRENGTH[strength].tone} style={{ marginLeft: 10 }}>
                {STRENGTH[strength].label}
              </AppText>
            </View>
          ) : null}
          <TextField
            ref={refs.confirm}
            label="Confirm password"
            required
            icon="shield-checkmark-outline"
            placeholder="Type it again"
            value={form.confirm}
            onChangeText={set('confirm')}
            error={errors.confirm}
            secure
            autoCapitalize="none"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={next}
          />
          <Button title="Continue" onPress={next} full size="lg" iconRight="arrow-forward" style={{ marginTop: 6 }} />
        </Animated.View>
      ) : (
        <Animated.View key="s1" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
          <AppText variant="h2">A little about you</AppText>
          <AppText variant="small" tone="muted" style={{ marginTop: 4, marginBottom: 20 }}>
            Helps us recommend the right skills and courses.
          </AppText>
          <DateField
            label="Date of birth"
            required
            value={form.dob}
            onChange={set('dob')}
            maximumDate={maxDob}
            title="Date of birth"
            error={errors.dob}
          />
          <SelectField
            label="Gender"
            required
            icon="person-outline"
            value={form.gender}
            options={GENDER_OPTIONS}
            placeholder="Select"
            onChange={set('gender')}
            error={errors.gender}
          />
          <SelectField
            label="Occupation"
            required
            icon="briefcase-outline"
            value={form.occupation}
            options={OCCUPATION_OPTIONS}
            placeholder="Select your occupation"
            onChange={set('occupation')}
            error={errors.occupation}
          />

          <PressableScale
            onPress={() => {
              setAgreed((a) => !a);
              if (errors.agreed) setErrors((e) => ({ ...e, agreed: undefined }));
            }}
            haptic="select"
            scaleTo={0.99}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            style={styles.agree}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: errors.agreed ? colors.danger : agreed ? colors.primary : colors.borderStrong,
                  backgroundColor: agreed ? colors.primary : 'transparent',
                },
              ]}
            >
              {agreed ? <Ionicons name="checkmark" size={15} color="#fff" /> : null}
            </View>
            <AppText variant="small" tone="muted" style={{ flex: 1 }}>
              I agree to the{' '}
              <AppText variant="smallStrong" tone="primary" onPress={() => navigation.navigate('PrivacyPolicy')}>
                Privacy Policy
              </AppText>{' '}
              and community guidelines.
            </AppText>
          </PressableScale>

          <Button
            title="Create account"
            onPress={submit}
            loading={loading}
            full
            size="lg"
            icon="sparkles"
            gradient={gradients.primary}
            style={{ marginTop: 18 }}
          />
        </Animated.View>
      )}

      <View style={styles.footer}>
        <AppText variant="body" tone="muted">
          Already have an account?{' '}
        </AppText>
        <PressableScale onPress={() => navigation.navigate('Login')} hitSlop={10}>
          <AppText variant="bodyStrong" tone="primary">
            Sign in
          </AppText>
        </PressableScale>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  bonus: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16 },
  strength: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginLeft: 2 },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  agree: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, flexWrap: 'wrap' },
});

export default SignUpScreen;
