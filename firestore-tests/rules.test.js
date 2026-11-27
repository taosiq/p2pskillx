// Security rules tests, run against the Firestore emulator:
//   cd firestore-tests && npm install && npm test
//
// "allowed" tests replay the exact writes the app makes, so a rules change that
// would break a feature fails here. "blocked" tests are attacks that must fail.

import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';

let env;
const db = (uid) => env.authenticatedContext(uid, { email_verified: true }).firestore();
const unverified = (uid) => env.authenticatedContext(uid, { email_verified: false }).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const now = new Date().toISOString();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-p2pskillx',
    firestore: { rules: readFileSync(process.env.RULES_FILE || new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(() => env.cleanup());

const profile = (name, extra = {}) => ({ firstName: name, lastName: 'Test', credits: 100, xp: 0, level: 1, badgeType: 'Bronze', createdAt: now, ...extra });
const course = (extra = {}) => ({
  id: 'course1',
  title: 'Python essentials',
  description: 'Learn Python',
  category: 'Information Technology & AI',
  skills: ['Python'],
  level: 'Beginner',
  credits: 20,
  thumbnail: null,
  sectionCount: 2,
  creatorId: 'alice',
  creatorName: 'Alice Test',
  createdAt: now,
  updatedAt: now,
  status: 'active',
  enrollments: 0,
  ratingAvg: 0,
  ratingCount: 0,
  ...extra,
});
const post = (uid, extra = {}) => ({
  userId: uid,
  userName: 'Someone',
  userInitials: 'ST',
  userProfileImage: null,
  text: 'Hello world',
  image: null,
  likes: [],
  comments: [],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...extra,
});
const comment = (uid, text = 'Nice!') => ({ id: String(Date.now()), userId: uid, userName: 'X', userInitials: 'X', userProfileImage: null, text, createdAt: now });

// alice teaches course1 (Python verified); bob is enrolled; carol is a stranger.
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.firestore();
    await setDoc(doc(s, 'users/alice'), profile('Alice', { verifiedSkills: { Python: { verified: true, level: 'Advanced' } }, skills: ['Python'], courses: ['course1'] }));
    await setDoc(doc(s, 'users/alice/private/details'), { email: 'alice@example.com', gender: 'F' });
    await setDoc(doc(s, 'users/bob'), profile('Bob', { enrolledCourses: { course1: { enrolledAt: now, creditsSpent: 20 } }, credits: 80 }));
    await setDoc(doc(s, 'users/carol'), profile('Carol'));
    await setDoc(doc(s, 'courses/course1'), course({ enrollments: 1 }));
    await setDoc(doc(s, 'courses/course1/private/content'), { sections: [{ title: 'Intro' }, { title: 'Loops' }] });
    await setDoc(doc(s, 'posts/p1'), post('alice', { likes: [], comments: [comment('bob', 'First!')] }));
    await setDoc(doc(s, 'conversations/alice_bob'), { participants: ['alice', 'bob'], lastMessage: '', unread: { alice: 0, bob: 0 } });
    await setDoc(doc(s, 'conversations/alice_bob/messages/m1'), { senderId: 'alice', text: 'hi', timestamp: new Date() });
    await setDoc(doc(s, 'notifications/n1'), { type: 'post_like', senderId: 'bob', recipientId: 'alice', read: false });
  });
});

// ------------------------------------------------------------------ allowed

describe('allowed: what the app does', () => {
  test('sign up (public profile + private details in one batch)', async () => {
    const d = db('dave');
    const b = writeBatch(d);
    b.set(doc(d, 'users/dave'), { firstName: 'Dave', lastName: 'New', occupation: 'Student', credits: 100, xp: 0, level: 1, badgeType: 'Bronze', createdAt: now, updatedAt: now });
    b.set(doc(d, 'users/dave/private/details'), { email: 'd@example.com', dateOfBirth: '2000-01-01', gender: 'M', createdAt: now });
    await assertSucceeds(b.commit());
  });

  test('edit profile, photo and achievements', async () => {
    const d = db('carol');
    await assertSucceeds(updateDoc(doc(d, 'users/carol'), { firstName: 'Caro', lastName: 'Line', bio: 'Hi there', occupation: 'Designer', interests: ['Design'], updatedAt: now }));
    await assertSucceeds(updateDoc(doc(d, 'users/carol'), { profileImage: 'data:image/jpeg;base64,AAAA', updatedAt: now }));
    await assertSucceeds(updateDoc(doc(d, 'users/carol'), { profileImage: null }));
    await assertSucceeds(updateDoc(doc(d, 'users/carol'), { achievements: ['first_steps'] }));
  });

  test('read own private details; lesson progress; block/unblock', async () => {
    await assertSucceeds(getDoc(doc(db('alice'), 'users/alice/private/details')));
    await assertSucceeds(updateDoc(doc(db('bob'), 'users/bob'), { 'courseProgress.course1.done': arrayUnion(0), 'courseProgress.course1.total': 2, 'courseProgress.course1.updatedAt': now }));
    await assertSucceeds(updateDoc(doc(db('carol'), 'users/carol'), { blocked: arrayUnion('bob') }));
    await assertSucceeds(updateDoc(doc(db('carol'), 'users/carol'), { blocked: arrayRemove('bob') }));
  });

  test('remove one of my verified skills', async () => {
    await assertSucceeds(updateDoc(doc(db('alice'), 'users/alice'), new FieldPath('verifiedSkills', 'Python'), deleteField(), 'skills', arrayRemove('Python')));
  });

  test('follow, unfollow, remove a follower', async () => {
    const b = db('bob');
    let batch = writeBatch(b);
    batch.update(doc(b, 'users/bob'), { following: arrayUnion('carol'), followingCount: increment(1) });
    batch.update(doc(b, 'users/carol'), { followers: arrayUnion('bob'), followersCount: increment(1) });
    await assertSucceeds(batch.commit());

    batch = writeBatch(b);
    batch.update(doc(b, 'users/bob'), { following: arrayRemove('carol'), followingCount: increment(-1) });
    batch.update(doc(b, 'users/carol'), { followers: arrayRemove('bob'), followersCount: increment(-1) });
    await assertSucceeds(batch.commit());

    // bob follows carol again; carol removes him as a follower
    batch = writeBatch(b);
    batch.update(doc(b, 'users/bob'), { following: arrayUnion('carol'), followingCount: increment(1) });
    batch.update(doc(b, 'users/carol'), { followers: arrayUnion('bob'), followersCount: increment(1) });
    await batch.commit();
    const c = db('carol');
    batch = writeBatch(c);
    batch.update(doc(c, 'users/carol'), { followers: arrayRemove('bob'), followersCount: increment(-1) });
    batch.update(doc(c, 'users/bob'), { following: arrayRemove('carol'), followingCount: increment(-1) });
    await assertSucceeds(batch.commit());
  });

  test('posts: create, like, unlike, comment, edit, delete', async () => {
    const c = db('carol');
    await assertSucceeds(setDoc(doc(c, 'posts/p2'), post('carol')));
    await assertSucceeds(updateDoc(doc(c, 'users/carol'), { posts: arrayUnion('p2') }));
    await assertSucceeds(updateDoc(doc(c, 'posts/p1'), { likes: arrayUnion('carol') }));
    await assertSucceeds(updateDoc(doc(c, 'posts/p1'), { likes: arrayRemove('carol') }));
    await assertSucceeds(updateDoc(doc(c, 'posts/p1'), { comments: arrayUnion(comment('carol')), updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(c, 'posts/p2'), { text: 'Edited', userEmail: deleteField() }));
    await assertSucceeds(deleteDoc(doc(c, 'posts/p2')));
  });

  test('courses: create (batch), edit, archive, delete an unsold course', async () => {
    const a = db('alice');
    const batch = writeBatch(a);
    batch.set(doc(a, 'courses/course2'), course({ id: 'course2' }));
    batch.set(doc(a, 'courses/course2/private/content'), { sections: [{ title: 'Intro' }], updatedAt: now });
    batch.update(doc(a, 'users/alice'), { courses: arrayUnion('course2') });
    await assertSucceeds(batch.commit());

    await assertSucceeds(updateDoc(doc(a, 'courses/course2'), { title: 'Python basics', description: 'New', updatedAt: now }));
    await assertSucceeds(updateDoc(doc(a, 'courses/course1'), { status: 'archived', updatedAt: now }));

    const del = writeBatch(a);
    del.delete(doc(a, 'courses/course2/private/content'));
    del.delete(doc(a, 'courses/course2'));
    del.update(doc(a, 'users/alice'), { courses: arrayRemove('course2') });
    await assertSucceeds(del.commit());
  });

  test('lessons: instructor and enrolled learner can read; enrolled learner reviews', async () => {
    await assertSucceeds(getDoc(doc(db('alice'), 'courses/course1/private/content')));
    await assertSucceeds(getDoc(doc(db('bob'), 'courses/course1/private/content')));
    await assertSucceeds(setDoc(doc(db('bob'), 'courses/course1/reviews/bob'), { rating: 5, text: 'Great', userId: 'bob', userName: 'Bob', createdAt: serverTimestamp() }));
  });

  test('chat: open a new chat, send, read, mark read', async () => {
    const c = db('carol');
    await assertSucceeds(getDoc(doc(c, 'conversations/bob_carol'))); // doesn't exist yet
    await assertSucceeds(
      setDoc(doc(c, 'conversations/bob_carol'), {
        participants: ['carol', 'bob'],
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        lastMessage: '',
        lastSenderId: null,
        unread: { carol: 0, bob: 0 },
      })
    );
    const batch = writeBatch(c);
    batch.set(doc(c, 'conversations/bob_carol/messages/x1'), { senderId: 'carol', text: 'Hey Bob', timestamp: serverTimestamp() });
    batch.update(doc(c, 'conversations/bob_carol'), { lastMessage: 'Hey Bob', lastMessageTime: serverTimestamp(), lastSenderId: 'carol', 'unread.bob': increment(1) });
    await assertSucceeds(batch.commit());

    const b = db('bob');
    await assertSucceeds(getDoc(doc(b, 'conversations/bob_carol/messages/x1')));
    await assertSucceeds(updateDoc(doc(b, 'conversations/bob_carol'), { 'unread.bob': 0 }));
    // delete the chat for me
    await assertSucceeds(updateDoc(doc(b, 'conversations/bob_carol'), { 'clearedAt.bob': serverTimestamp(), 'unread.bob': 0 }));
  });

  test('notifications: send a like, read, mark read, delete; report content', async () => {
    await assertSucceeds(
      setDoc(doc(db('carol'), 'notifications/n2'), {
        type: 'post_like', recipientId: 'alice', senderId: 'carol', senderName: 'Carol Test', postId: 'p1', timestamp: serverTimestamp(), read: false, id: 'n2',
      })
    );
    const a = db('alice');
    await assertSucceeds(getDoc(doc(a, 'notifications/n1')));
    await assertSucceeds(updateDoc(doc(a, 'notifications/n1'), { read: true }));
    await assertSucceeds(deleteDoc(doc(a, 'notifications/n1')));
    await assertSucceeds(setDoc(doc(db('carol'), 'reports/r1'), { reporterId: 'carol', reason: 'spam', details: '', targetType: 'post', targetId: 'p1', createdAt: now }));
  });
});

// ------------------------------------------------------------------ blocked

describe('blocked: attacks', () => {
  test('an unverified email can sign up and edit its profile, but not reach other people', async () => {
    const u = unverified('newbie');
    await assertSucceeds(setDoc(doc(u, 'users/newbie'), profile('Newbie')));
    await assertSucceeds(updateDoc(doc(u, 'users/newbie'), { bio: 'Hello' }));
    await assertFails(setDoc(doc(u, 'posts/spam'), post('newbie')));
    await assertFails(updateDoc(doc(u, 'posts/p1'), { likes: arrayUnion('newbie') }));
    await assertFails(updateDoc(doc(u, 'posts/p1'), { comments: arrayUnion(comment('newbie')) }));
    await assertFails(setDoc(doc(u, 'conversations/alice_newbie'), { participants: ['newbie', 'alice'] }));
    await assertFails(setDoc(doc(u, 'notifications/spam'), { type: 'post_like', recipientId: 'alice', senderId: 'newbie', read: false }));
    await assertFails(updateDoc(doc(u, 'users/alice'), { followers: arrayUnion('newbie'), followersCount: increment(1) }));
    await assertFails(setDoc(doc(u, 'reports/r9'), { reporterId: 'newbie', reason: 'spam', details: '' }));
  });

  test('no access without signing in', async () => {
    await assertFails(getDoc(doc(anon(), 'users/alice')));
    await assertFails(getDoc(doc(anon(), 'posts/p1')));
  });

  test('cannot give myself credits, XP, levels, skills or enrolments', async () => {
    const c = doc(db('carol'), 'users/carol');
    await assertFails(updateDoc(c, { credits: 99999 }));
    await assertFails(updateDoc(c, { xp: 50000, level: 50 }));
    await assertFails(updateDoc(c, { badgeType: 'Legend' }));
    await assertFails(updateDoc(c, { 'activity.activeDays': 999 }));
    await assertFails(updateDoc(c, { 'enrolledCourses.course1': { enrolledAt: now } }));
    await assertFails(updateDoc(c, { 'verifiedSkills.Python': { verified: true, level: 'Expert' } }));
    await assertFails(updateDoc(c, { claimedTiers: [] }));
    await assertFails(updateDoc(c, { teachingCount: 100 }));
    // alice can remove a skill but not upgrade one
    await assertFails(updateDoc(doc(db('alice'), 'users/alice'), { 'verifiedSkills.Python.level': 'Expert' }));
    await assertFails(updateDoc(doc(db('alice'), 'users/alice'), { skills: arrayUnion('Rust') }));
  });

  test('cannot sign up with a bigger balance or extra fields', async () => {
    await assertFails(setDoc(doc(db('eve'), 'users/eve'), profile('Eve', { credits: 5000 })));
    await assertFails(setDoc(doc(db('eve'), 'users/eve'), profile('Eve', { activity: { activeDays: 900 } })));
    await assertFails(setDoc(doc(db('eve'), 'users/eve'), profile('Eve', { verifiedSkills: { Python: { verified: true } } })));
    await assertFails(setDoc(doc(db('eve'), 'users/mallory'), profile('Mallory')));
  });

  test('a deleted account cannot re-create its profile for new credits', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'deletedAccounts/zed'), { deletedAt: now }));
    await assertFails(setDoc(doc(db('zed'), 'users/zed'), profile('Zed')));
    await assertFails(deleteDoc(doc(db('carol'), 'users/carol')));
  });

  test('cannot read or edit other people’s private data', async () => {
    await assertFails(getDoc(doc(db('carol'), 'users/alice/private/details')));
    await assertFails(updateDoc(doc(db('carol'), 'users/alice'), { bio: 'hacked' }));
    await assertFails(getDoc(doc(db('carol'), 'notifications/n1')));
    await assertFails(getDoc(doc(db('carol'), 'reports/r1')));
    await assertFails(setDoc(doc(db('carol'), 'transactions/t1'), { userId: 'carol', amount: 500 }));
    await assertFails(getDoc(doc(db('carol'), 'serverState/carol')));
  });

  test('cannot fake followers', async () => {
    await assertFails(updateDoc(doc(db('carol'), 'users/alice'), { followers: arrayUnion('bob'), followersCount: increment(1) }));
    await assertFails(updateDoc(doc(db('carol'), 'users/alice'), { followers: arrayUnion('carol'), followersCount: increment(5) }));
    await assertFails(updateDoc(doc(db('carol'), 'users/carol'), { followers: ['a', 'b', 'c'], followersCount: 3 }));
  });

  test('posts: no impersonation, no tampering, no email', async () => {
    const c = db('carol');
    await assertFails(setDoc(doc(c, 'posts/x'), post('alice')));
    await assertFails(setDoc(doc(c, 'posts/x'), post('carol', { userEmail: 'carol@example.com' })));
    await assertFails(setDoc(doc(c, 'posts/x'), post('carol', { likes: ['a', 'b'] })));
    await assertFails(updateDoc(doc(c, 'posts/p1'), { text: 'hacked' }));
    await assertFails(updateDoc(doc(c, 'posts/p1'), { likes: arrayUnion('bob') }));
    await assertFails(updateDoc(doc(c, 'posts/p1'), { comments: arrayUnion(comment('bob', 'fake')) }));
    await assertFails(updateDoc(doc(c, 'posts/p1'), { comments: [comment('bob', 'rewritten'), comment('carol')] }));
    await assertFails(deleteDoc(doc(c, 'posts/p1')));
  });

  test('courses: only on verified skills, no free lessons, no price/counter tampering', async () => {
    await assertFails(setDoc(doc(db('carol'), 'courses/c9'), course({ id: 'c9', creatorId: 'carol' })));
    await assertFails(setDoc(doc(db('alice'), 'courses/c9'), course({ id: 'c9', enrollments: 50 })));
    await assertFails(setDoc(doc(db('alice'), 'courses/c9'), course({ id: 'c9', skills: ['Rust'] })));
    await assertFails(setDoc(doc(db('alice'), 'courses/c9'), course({ id: 'c9', creatorId: 'bob' })));
    await assertFails(updateDoc(doc(db('alice'), 'courses/course1'), { enrollments: 999 }));
    await assertFails(updateDoc(doc(db('alice'), 'courses/course1'), { credits: 1 }));
    await assertFails(updateDoc(doc(db('carol'), 'courses/course1'), { title: 'hacked' }));
    await assertFails(deleteDoc(doc(db('alice'), 'courses/course1'))); // has a paying learner
    await assertFails(getDoc(doc(db('carol'), 'courses/course1/private/content')));
    await assertFails(setDoc(doc(db('carol'), 'courses/course1/private/content'), { sections: [] }));
    await assertFails(setDoc(doc(db('carol'), 'courses/course1/reviews/carol'), { rating: 1, text: 'bad', userId: 'carol' }));
    await assertFails(setDoc(doc(db('bob'), 'courses/course1/reviews/bob'), { rating: 50, text: '', userId: 'bob' }));
  });

  test('chat: no eavesdropping, no hijacking, no spoofing, blocks are enforced', async () => {
    const c = db('carol');
    await assertFails(getDoc(doc(c, 'conversations/alice_bob')));
    await assertFails(getDoc(doc(c, 'conversations/alice_bob/messages/m1')));
    await assertFails(setDoc(doc(c, 'conversations/alice_bob/messages/x'), { senderId: 'carol', text: 'hi', timestamp: serverTimestamp() }));
    await assertFails(setDoc(doc(db('bob'), 'conversations/alice_bob/messages/x'), { senderId: 'alice', text: 'spoof', timestamp: serverTimestamp() }));
    await assertFails(updateDoc(doc(db('bob'), 'conversations/alice_bob/messages/m1'), { text: 'edited by bob' }));
    // bob can't delete alice's copy of their chat
    await assertFails(updateDoc(doc(db('bob'), 'conversations/alice_bob'), { 'clearedAt.alice': serverTimestamp() }));
    // carol tries to grab the id of another pair's chat
    await assertFails(setDoc(doc(c, 'conversations/alice_dave'), { participants: ['carol', 'alice'] }));
    await assertFails(setDoc(doc(c, 'conversations/random123'), { participants: ['carol', 'alice'] }));
    // alice blocks bob: bob can no longer message her or open a new chat
    await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'users/alice'), { blocked: ['bob', 'carol'] }));
    await assertFails(setDoc(doc(db('bob'), 'conversations/alice_bob/messages/x'), { senderId: 'bob', text: 'hi', timestamp: serverTimestamp() }));
    await assertFails(setDoc(doc(c, 'conversations/alice_carol'), { participants: ['carol', 'alice'] }));
  });

  test('notifications: no fake credit or system messages, no spam to blockers', async () => {
    const c = db('carol');
    const base = { type: 'post_like', recipientId: 'alice', senderId: 'carol', read: false };
    await assertFails(setDoc(doc(c, 'notifications/x1'), { ...base, senderId: 'bob' }));
    await assertFails(setDoc(doc(c, 'notifications/x2'), { ...base, type: 'credit_earned', creditsAmount: 500 }));
    await assertFails(setDoc(doc(c, 'notifications/x3'), { ...base, systemNotification: true, senderName: 'P2PSkillX' }));
    await assertFails(setDoc(doc(c, 'notifications/x4'), { ...base, type: 'tier_reward' }));
    await assertFails(updateDoc(doc(db('alice'), 'notifications/n1'), { recipientId: 'carol' }));
    await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'users/alice'), { blocked: ['carol'] }));
    await assertFails(setDoc(doc(c, 'notifications/x5'), base));
  });
});
