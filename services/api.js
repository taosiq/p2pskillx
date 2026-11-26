import Constants from 'expo-constants';
import { doc, increment, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { addVerifiedSkill } from './skillService';

// Secure backend (Cloudflare Worker in /backend). Set expo.extra.apiUrl in
// app.json once it's deployed. Until then the app falls back to the old
// in-app logic so it keeps working during development.
const API_URL = (Constants.expoConfig?.extra?.apiUrl || '').replace(/\/+$/, '');
export const apiConfigured = /^https:\/\//.test(API_URL);

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message || code);
    this.code = code;
    this.status = status;
  }
}

async function call(path, body, { timeoutMs = 60000 } = {}) {
  const user = auth.currentUser;
  if (!user) throw new ApiError('unauthenticated', 'Please sign in again.');
  const token = await user.getIdToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error || 'server_error', data.message, res.status);
    return data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e?.name === 'AbortError') throw new ApiError('timeout', 'The server took too long. Please try again.');
    throw new ApiError('network', 'No connection to the server. Check your internet and try again.');
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------- enrolment

/**
 * Join a course with credits. Server: atomic, pays the instructor.
 * Fallback: client transaction (before the backend is deployed).
 * Resolves { credits } (new balance) or throws ApiError.
 */
export async function enrollInCourse(courseId) {
  if (apiConfigured) return call('/v1/courses/enroll', { courseId });

  const uid = auth.currentUser?.uid;
  if (!uid) throw new ApiError('unauthenticated');
  const userRef = doc(db, 'users', uid);
  const courseRef = doc(db, 'courses', courseId);
  const result = await runTransaction(db, async (tx) => {
    const [u, c] = await Promise.all([tx.get(userRef), tx.get(courseRef)]);
    if (!c.exists() || c.data().status === 'archived') throw new ApiError('not_found', 'This course is no longer available.');
    const course = c.data();
    const me = u.data() || {};
    if (course.creatorId === uid) throw new ApiError('own_course', 'You can’t enrol in your own course.');
    if (me.enrolledCourses?.[courseId]) return { credits: me.credits || 0, already: true };
    const price = Number(course.credits) || 0;
    const balance = Number(me.credits) || 0;
    if (balance < price) throw new ApiError('insufficient_credits', `You need ${price - balance} more credits.`);
    tx.update(userRef, {
      credits: balance - price,
      [`enrolledCourses.${courseId}`]: { enrolledAt: new Date().toISOString(), creditsSpent: price },
    });
    tx.update(courseRef, { enrollments: increment(1) });
    return { credits: balance - price, price, course, me };
  });
  if (!result.already) {
    setDoc(doc(db, 'transactions', `${uid}_${courseId}`), {
      userId: uid,
      type: 'enrollment',
      courseId,
      amount: -result.price,
      createdAt: serverTimestamp(),
    }).catch(() => {});
    import('./notificationService')
      .then(({ createCourseEnrollmentNotification }) =>
        createCourseEnrollmentNotification(courseId, result.course.creatorId, uid, result.me, result.course.title)
      )
      .catch(() => {});
  }
  return { credits: result.credits };
}

// ---------------------------------------------------------------- skill quiz

/**
 * Start a verification quiz. Returns { quizId, token, questions: [{ id, question, options }], timeLimit }.
 * With the backend, correct answers never reach the phone.
 */
export async function startQuiz({ skill, level, category }) {
  if (apiConfigured) return call('/v1/quiz/start', { skill, level, category }, { timeoutMs: 75000 });

  const { generateQuestions } = await import('../utils/questionGenerator');
  const raw = await generateQuestions(skill, true);
  const questions = (raw || [])
    .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length >= 2)
    .slice(0, 10)
    .map((q, i) => ({ id: i, question: q.question, options: q.options.slice(0, 4), correctAnswer: q.correctAnswer, explanation: q.explanation }));
  if (questions.length < 5) throw new ApiError('generation_failed', 'Couldn’t create a quiz for this skill. Try a more specific skill name.');
  return { quizId: `local-${Date.now()}`, local: true, questions, timeLimit: questions.length * 30, skill, level, category };
}

export const PASS_MARK = 0.7;

/**
 * Submit answers ({ [questionId]: optionIndex }). Returns
 * { score, total, percent, passed, level, review: [{ id, correctAnswer, explanation }] }.
 */
export async function submitQuiz(quiz, answers) {
  if (apiConfigured && !quiz.local) return call('/v1/quiz/submit', { token: quiz.token, answers });

  const total = quiz.questions.length;
  const score = quiz.questions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const percent = total ? score / total : 0;
  const passed = percent >= PASS_MARK;
  if (passed) await addVerifiedSkill(quiz.skill, quiz.level || 'Intermediate', quiz.category || 'General', Math.round(percent * 100));
  return {
    score,
    total,
    percent,
    passed,
    level: quiz.level,
    review: quiz.questions.map((q) => ({ id: q.id, correctAnswer: q.correctAnswer, explanation: q.explanation })),
  };
}

// ---------------------------------------------------------------- rewards

/** Claim the credit reward for reaching a new tier (server-only; no-op without backend). */
export async function claimTierRewards() {
  if (!apiConfigured) return { granted: 0 };
  return call('/v1/rewards/claim', {});
}

// ---------------------------------------------------------------- profile

/** Server-side streak + XP/level + tier rewards. Returns { xp, level, granted } or null without backend. */
export async function syncProfile() {
  if (!apiConfigured) return null;
  return call('/v1/profile/sync', { tzOffset: new Date().getTimezoneOffset() });
}

/** Remove the user's posts, notifications and follow links before the account is deleted. */
export async function cleanupAccount() {
  if (!apiConfigured) return null;
  return call('/v1/account/cleanup', {});
}
