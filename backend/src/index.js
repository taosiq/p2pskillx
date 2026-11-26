// P2PSkillX secure API (Cloudflare Worker).
//
// Everything that involves trust happens here, with admin access to Firestore:
//   POST /v1/quiz/start       generate a quiz; answer key is sealed (encrypted) in a token
//   POST /v1/quiz/submit      grade on the server; write the verified skill on a pass
//   POST /v1/courses/enroll   atomic: pay credits, enrol, pay the instructor
//   POST /v1/profile/sync     daily streak, XP/level (authoritative) and tier rewards
//   POST /v1/rewards/claim    alias of profile/sync (kept for older clients)
//   POST /v1/account/cleanup  remove a user's posts, notifications and follow links before deletion
// The app never sees the OpenRouter key, the quiz answers, or the service account.

import { computeXP, dayKey, levelInfo, nextActivity, TIERS } from '../../utils/gamification.js';
import { verifyFirebaseToken } from './auth.js';
import { DELETE, deleteWrite, Firestore, setWrite, updateWrite } from './firestore.js';
import { cleanSkill, fromBank, generateWithAI, LEVELS, PASS_MARK, QUESTION_COUNT, SECONDS_PER_QUESTION, seal, unseal } from './quiz.js';

class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });

const readBody = async (request) => {
  if (Number(request.headers.get('content-length') || 0) > 32 * 1024) throw new HttpError(413, 'too_large');
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'bad_request', 'Invalid JSON body');
  }
};

const userDay = (tzOffsetMin) => {
  const off = Math.max(-840, Math.min(840, Number(tzOffsetMin) || 0));
  return dayKey(new Date(Date.now() - off * 60000));
};

// ---------------------------------------------------------------- quiz

async function quizStart(env, fs, uid, body) {
  const skill = cleanSkill(body.skill);
  const level = LEVELS.includes(body.level) ? body.level : 'Intermediate';
  const category = String(body.category || 'General').slice(0, 80);
  if (skill.length < 2) throw new HttpError(400, 'bad_request', 'Enter a skill name.');

  // Daily limit and cooldown after a failed attempt.
  const stateRef = `serverState/${uid}`;
  const state = (await fs.get(stateRef))?.data || {};
  const today = dayKey(new Date());
  const starts = state.quizDay === today ? state.quizStarts || 0 : 0;
  if (starts >= Number(env.QUIZ_STARTS_PER_DAY || 20)) throw new HttpError(429, 'rate_limited', 'You’ve reached today’s quiz limit. Come back tomorrow!');
  const lastFail = state.lastFail?.[skill.toLowerCase()];
  const cooldownMs = Number(env.FAIL_COOLDOWN_MINUTES || 10) * 60000;
  if (lastFail && Date.now() - lastFail < cooldownMs) {
    const mins = Math.ceil((cooldownMs - (Date.now() - lastFail)) / 60000);
    throw new HttpError(429, 'cooldown', `You can retry ${skill} in ${mins} minute${mins === 1 ? '' : 's'}. Review your answers in the meantime.`);
  }

  let questions = await generateWithAI(env, skill, level);
  let source = 'ai';
  if (questions.length < 8) {
    questions = fromBank(skill);
    source = 'bank';
  }
  questions = questions.slice(0, QUESTION_COUNT);
  if (questions.length < 5) throw new HttpError(503, 'generation_failed', 'Couldn’t create a quiz for this skill right now. Try again, or use a more common skill name.');

  await fs.commit([
    updateWrite(fs, stateRef, [
      [['quizDay'], today],
      [['quizStarts'], starts + 1],
    ]),
  ]);

  const quizId = crypto.randomUUID();
  const timeLimit = questions.length * SECONDS_PER_QUESTION;
  const token = await seal(env.QUIZ_SECRET, {
    quizId,
    uid,
    skill,
    level,
    category,
    exp: Date.now() + (timeLimit + 120) * 1000, // grace for slow networks
    answers: questions.map((q) => q.correctAnswer),
    explanations: questions.map((q) => q.explanation),
  });

  return {
    quizId,
    token,
    timeLimit,
    source,
    questions: questions.map((q, i) => ({ id: i, question: q.question, options: q.options })),
  };
}

async function quizSubmit(env, fs, uid, body) {
  const sealed = await unseal(env.QUIZ_SECRET, body.token);
  if (!sealed || sealed.uid !== uid) throw new HttpError(400, 'invalid_quiz', 'This quiz is no longer valid. Please start again.');
  if (Date.now() > sealed.exp) throw new HttpError(400, 'expired', 'Time ran out for this quiz. Please start a new one.');

  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const total = sealed.answers.length;
  const score = sealed.answers.filter((correct, i) => Number(answers[i]) === correct).length;
  const percent = total ? score / total : 0;
  const passed = percent >= PASS_MARK;

  const writes = [
    // Single use: this create fails if the quiz was already submitted.
    setWrite(fs, `quizResults/${sealed.quizId}`, { uid, skill: sealed.skill, level: sealed.level, score, total, passed, createdAt: new Date() }, { mustNotExist: true }),
  ];

  if (passed) {
    const user = (await fs.get(`users/${uid}`))?.data || {};
    const prev = user.verifiedSkills?.[sealed.skill];
    const level = prev && LEVELS.indexOf(prev.level) > LEVELS.indexOf(sealed.level) ? prev.level : sealed.level;
    writes.push(
      updateWrite(
        fs,
        `users/${uid}`,
        [[['verifiedSkills', sealed.skill], { verified: true, level, category: sealed.category, score: Math.round(percent * 100), verifiedAt: new Date().toISOString() }]],
        [{ path: ['skills'], append: [sealed.skill] }],
        { exists: true }
      )
    );
  } else {
    writes.push(updateWrite(fs, `serverState/${uid}`, [[['lastFail', sealed.skill.toLowerCase()], Date.now()]]));
  }

  try {
    await fs.commit(writes);
  } catch (e) {
    if (e.firestoreStatus === 'ALREADY_EXISTS' || e.status === 409) throw new HttpError(409, 'already_submitted', 'This quiz was already submitted.');
    throw e;
  }

  return {
    score,
    total,
    percent,
    passed,
    level: sealed.level,
    review: sealed.answers.map((correctAnswer, id) => ({ id, correctAnswer, explanation: sealed.explanations[id] || '' })),
  };
}

// ---------------------------------------------------------------- enrolment

async function enroll(env, fs, uid, body) {
  const courseId = String(body.courseId || '');
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(courseId)) throw new HttpError(400, 'bad_request', 'Invalid course.');
  const share = Math.max(0, Math.min(1, Number(env.INSTRUCTOR_SHARE || 0.8)));

  return fs.runTransaction(async (tx) => {
    const [u, c] = await Promise.all([fs.get(`users/${uid}`, tx), fs.get(`courses/${courseId}`, tx)]);
    if (!c || c.data.status === 'archived') throw new HttpError(404, 'not_found', 'This course is no longer available.');
    if (!u) throw new HttpError(404, 'no_profile', 'Your profile is missing. Please sign in again.');
    const course = c.data;
    const me = u.data;
    if (course.creatorId === uid) throw new HttpError(400, 'own_course', 'You can’t enrol in your own course.');
    if (me.enrolledCourses?.[courseId]) return { writes: [], result: { credits: me.credits || 0, already: true } };

    const price = Math.max(0, Math.round(Number(course.credits) || 0));
    const balance = Math.round(Number(me.credits) || 0);
    if (balance < price) throw new HttpError(402, 'insufficient_credits', `You need ${price - balance} more credits to join this course.`);
    const earned = Math.floor(price * share);
    const now = new Date();
    const nowIso = now.toISOString();
    const myName = [me.firstName, me.lastName].filter(Boolean).join(' ') || 'A learner';

    const writes = [
      updateWrite(fs, `users/${uid}`, [[['credits'], balance - price], [['enrolledCourses', courseId], { enrolledAt: nowIso, creditsSpent: price }]], [], { updateTime: u.updateTime }),
      updateWrite(fs, `courses/${courseId}`, [], [{ path: ['enrollments'], increment: 1 }], { exists: true }),
      setWrite(fs, `transactions/${uid}_${courseId}`, { userId: uid, type: 'enrollment', courseId, amount: -price, createdAt: now }),
      setWrite(fs, `notifications/enrol_${courseId}_${uid}`, {
        id: `enrol_${courseId}_${uid}`,
        type: 'course_enrollment',
        recipientId: course.creatorId,
        senderId: uid,
        senderName: myName,
        senderProfileImage: null,
        courseId,
        courseTitle: course.title || '',
        action: 'enrolled in your course',
        read: false,
        timestamp: now,
      }),
    ];
    if (earned > 0 && course.creatorId) {
      writes.push(
        updateWrite(fs, `users/${course.creatorId}`, [], [{ path: ['credits'], increment: earned }], { exists: true }),
        setWrite(fs, `transactions/${course.creatorId}_${courseId}_${uid}`, { userId: course.creatorId, type: 'teaching_income', courseId, learnerId: uid, amount: earned, createdAt: now }),
        setWrite(fs, `notifications/earn_${courseId}_${uid}`, {
          id: `earn_${courseId}_${uid}`,
          type: 'credit_earned',
          recipientId: course.creatorId,
          systemNotification: true,
          senderName: 'P2PSkillX',
          creditsAmount: earned,
          courseId,
          courseTitle: course.title || '',
          reason: `${myName} joined your course`,
          read: false,
          timestamp: now,
        })
      );
    }
    return { writes, result: { credits: balance - price, earnedByInstructor: earned } };
  });
}

// ---------------------------------------------------------------- XP / streak / rewards

/**
 * Lesson progress is written by the app, so before it earns XP, check each
 * "completed" course against the real number of lessons in that course.
 */
async function verifiedProgress(fs, user) {
  const progress = user.courseProgress && typeof user.courseProgress === 'object' ? user.courseProgress : {};
  const claims = Object.entries(progress)
    .filter(([id, p]) => user.enrolledCourses?.[id] && p?.total > 0 && (p.done?.length || 0) >= p.total)
    .slice(0, 200);
  const out = {};
  await Promise.all(
    claims.map(async ([id, p]) => {
      if (!SAFE_ID.test(id)) return;
      const course = (await fs.get(`courses/${id}`))?.data;
      const lessons = Number(course?.sectionCount) || (Array.isArray(course?.sections) ? course.sections.length : 0);
      const done = new Set((p.done || []).filter((n) => Number.isInteger(n) && n >= 0 && n < lessons));
      if (lessons > 0 && done.size >= lessons) out[id] = { done: [...done], total: lessons };
    })
  );
  return out;
}

async function syncProfile(env, fs, uid, body) {
  const teachingCount = await fs.count('courses', [['creatorId', 'EQUAL', uid]]);

  return fs.runTransaction(async (tx) => {
    const u = await fs.get(`users/${uid}`, tx);
    if (!u) throw new HttpError(404, 'no_profile', 'Profile not found.');
    const profile = { ...u.data, teachingCount, courseProgress: await verifiedProgress(fs, u.data) };

    const activity = nextActivity(profile.activity || {}, userDay(body.tzOffset)) || profile.activity || null;
    const withActivity = { ...profile, activity };
    const xp = computeXP(withActivity).total;
    const info = levelInfo(xp);

    // Tier rewards: grant every reached tier not yet claimed.
    const claimed = Array.isArray(profile.claimedTiers) ? profile.claimedTiers : [];
    const due = TIERS.filter((t) => t.reward > 0 && info.level >= t.minLevel && !claimed.includes(t.key));
    const granted = due.reduce((s, t) => s + t.reward, 0);

    const fields = [
      [['xp'], xp],
      [['level'], info.level],
      [['badgeType'], info.tier.name],
      [['teachingCount'], teachingCount],
    ];
    if (activity) fields.push([['activity'], activity]);
    if (due.length) {
      fields.push([['claimedTiers'], [...claimed, ...due.map((t) => t.key)]]);
      fields.push([['credits'], Math.round(Number(profile.credits) || 0) + granted]);
    }

    const was = u.data;
    const changed =
      was.xp !== xp ||
      was.level !== info.level ||
      was.badgeType !== info.tier.name ||
      was.teachingCount !== teachingCount ||
      JSON.stringify(was.activity || null) !== JSON.stringify(activity || null) ||
      due.length > 0;

    // Older accounts kept email / date of birth / gender on the public profile: move them.
    const legacy = ['email', 'dateOfBirth', 'gender'].filter((k) => was[k] !== undefined);
    if (legacy.length) {
      legacy.forEach((k) => fields.push([[k], DELETE]));
    }

    const writes = changed || legacy.length ? [updateWrite(fs, `users/${uid}`, fields, [], { updateTime: u.updateTime })] : [];
    if (legacy.length) {
      writes.push(updateWrite(fs, `users/${uid}/private/details`, legacy.map((k) => [[k], was[k]])));
    }
    const now = new Date();
    due.forEach((t) =>
      writes.push(
        setWrite(fs, `notifications/tier_${t.key}_${uid}`, {
          id: `tier_${t.key}_${uid}`,
          type: 'tier_reward',
          recipientId: uid,
          systemNotification: true,
          senderName: 'P2PSkillX',
          creditsAmount: t.reward,
          reason: `You reached the ${t.name} tier!`,
          read: false,
          timestamp: now,
        }),
        setWrite(fs, `transactions/${uid}_tier_${t.key}`, { userId: uid, type: 'tier_reward', tier: t.key, amount: t.reward, createdAt: now })
      )
    );

    return { writes, result: { xp, level: info.level, tier: info.tier.key, granted, streak: activity?.streak || 0 } };
  });
}

// ---------------------------------------------------------------- account cleanup

const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

async function accountCleanup(env, fs, uid) {
  const me = (await fs.get(`users/${uid}`))?.data || {};
  const [posts, notes, convs] = await Promise.all([
    fs.query('posts', [['userId', 'EQUAL', uid]], { select: ['userId'] }),
    fs.query('notifications', [['recipientId', 'EQUAL', uid]], { select: ['recipientId'] }),
    fs.query('conversations', [['participants', 'ARRAY_CONTAINS', uid]], { select: ['participants'] }),
  ]);

  // Only touch people who really are connected: the owner controls their own
  // "following" list, so it can't be trusted to name whose counts to lower.
  const ids = (list) => [...new Set((Array.isArray(list) ? list : []).filter((id) => typeof id === 'string' && SAFE_ID.test(id) && id !== uid))].slice(0, 500);
  const load = (list) => Promise.all(ids(list).map(async (id) => ({ id, data: (await fs.get(`users/${id}`))?.data })));
  const [followed, followers] = await Promise.all([load(me.following), load(me.followers)]);

  const writes = [
    ...posts.map((p) => deleteWrite(fs, p.path)),
    ...notes.map((n) => deleteWrite(fs, n.path)),
    // Others keep their side of a chat, but this person disappears from it.
    ...convs.map((c) => updateWrite(fs, c.path, [[['deletedParticipant'], uid]], [], { exists: true })),
    ...followed
      .filter((o) => (o.data?.followers || []).includes(uid))
      .map((o) => updateWrite(fs, `users/${o.id}`, [], [{ path: ['followers'], remove: [uid] }, { path: ['followersCount'], increment: -1 }], { exists: true })),
    ...followers
      .filter((o) => (o.data?.following || []).includes(uid))
      .map((o) => updateWrite(fs, `users/${o.id}`, [], [{ path: ['following'], remove: [uid] }, { path: ['followingCount'], increment: -1 }], { exists: true })),
    deleteWrite(fs, `serverState/${uid}`),
  ];
  for (let i = 0; i < writes.length; i += 400) {
    await fs.commit(writes.slice(i, i + 400)).catch(() => {}); // best effort: missing docs shouldn't block deletion
  }

  // Last: remove the profile, and remember the account was deleted so the same
  // login can't re-create a profile and collect a second starting balance.
  await fs.commit([
    setWrite(fs, `deletedAccounts/${uid}`, { deletedAt: new Date() }),
    deleteWrite(fs, `users/${uid}/private/details`),
    deleteWrite(fs, `users/${uid}`),
  ]);
  return { removedPosts: posts.length };
}

// ---------------------------------------------------------------- router

const OPEN_TO_UNVERIFIED = new Set(['/v1/account/cleanup']);

const ROUTES = {
  '/v1/quiz/start': quizStart,
  '/v1/quiz/submit': quizSubmit,
  '/v1/courses/enroll': enroll,
  '/v1/profile/sync': syncProfile,
  '/v1/rewards/claim': syncProfile,
  '/v1/account/cleanup': accountCleanup,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true });
    const handler = ROUTES[url.pathname];
    if (!handler) return json({ error: 'not_found' }, 404);
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    try {
      for (const k of ['FIREBASE_SERVICE_ACCOUNT', 'QUIZ_SECRET', 'OPENROUTER_API_KEY']) {
        if (!env[k]) throw new HttpError(500, 'misconfigured', `Server secret ${k} is not set.`);
      }
      const { uid, emailVerified } = await verifyFirebaseToken(request, env.FIREBASE_PROJECT_ID);
      // A verified email is required for anything involving credits, skills or XP.
      // Account deletion is always allowed.
      if (!emailVerified && !OPEN_TO_UNVERIFIED.has(url.pathname)) {
        throw new HttpError(403, 'email_unverified', 'Please verify your email address first.');
      }
      const body = await readBody(request);
      const fs = new Firestore(env);
      return json(await handler(env, fs, uid, body));
    } catch (e) {
      const known = e instanceof HttpError || e.code === 'unauthenticated';
      if (!known) {
        console.error(url.pathname, e.message);
        return json({ error: 'server_error', message: 'Something went wrong on our side. Please try again.' }, 500);
      }
      return json({ error: e.code, message: e.message }, e.status || 400);
    }
  },
};
