// Friendly messages for Firebase Auth error codes.
// Sign-in failures deliberately share one message, so the app never reveals
// whether an email address has an account (prevents account enumeration).

const GENERIC_SIGNIN = 'That email and password don’t match. Check them and try again.';

const MESSAGES = {
  'auth/invalid-credential': GENERIC_SIGNIN,
  'auth/wrong-password': GENERIC_SIGNIN,
  'auth/user-not-found': GENERIC_SIGNIN,
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Contact support for help.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes, then try again.',
  'auth/network-request-failed': 'No internet connection. Check your connection and try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Choose a stronger password (at least 8 characters, with letters and numbers).',
  'auth/missing-password': 'Enter your password.',
  'auth/requires-recent-login': 'For your security, sign in again before doing this.',
};

export const authErrorMessage = (code, fallback = 'Something went wrong. Please try again.') =>
  MESSAGES[code] || fallback;

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());

/** Returns a list of unmet password rules (empty when the password is strong enough). */
export const passwordProblems = (pw = '') => {
  const out = [];
  if (pw.length < 8) out.push('8+ characters');
  if (!/[A-Za-z]/.test(pw)) out.push('a letter');
  if (!/\d/.test(pw)) out.push('a number');
  return out;
};

/** 0..4 strength score for the strength meter. */
export const passwordStrength = (pw = '') => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
