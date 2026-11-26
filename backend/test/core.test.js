import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decode, encode, fieldPath, nestedFields } from '../src/firestore.js';
import { cleanSkill, fromBank, sanitiseQuestions, seal, unseal } from '../src/quiz.js';

test('sealed quiz tokens round-trip and resist tampering', async () => {
  const payload = { uid: 'u1', answers: [1, 2, 3], exp: Date.now() + 1000 };
  const token = await seal('secret-1', payload);
  assert.deepEqual(await unseal('secret-1', token), payload);
  assert.equal(await unseal('wrong-secret', token), null);
  const flipped = token.slice(0, -2) + (token.at(-2) === 'A' ? 'B' : 'A') + token.at(-1);
  assert.equal(await unseal('secret-1', flipped), null);
  assert.ok(!token.includes('answers'), 'answer key must not be readable');
});

test('sanitiseQuestions keeps the right answer after shuffling', () => {
  const raw = [
    { question: 'Q1?', options: ['right', 'w1', 'w2', 'w3'], correctAnswer: 0, explanation: 'e' },
    { question: 'bad', options: ['a', 'b'], correctAnswer: 0 },
    { question: 'dup', options: ['a', 'a', 'b', 'c'], correctAnswer: 1 },
    { question: 'Q1?', options: ['x', 'y', 'z', 'w'], correctAnswer: 2 },
  ];
  const out = sanitiseQuestions(raw);
  assert.equal(out.length, 1);
  assert.equal(out[0].options[out[0].correctAnswer], 'right');
});

test('offline bank provides questions for known skills', () => {
  assert.ok(fromBank('Web Development').length >= 5);
  assert.equal(fromBank('Underwater basket weaving').length, 0);
});

test('skill names are made safe for Firestore field paths', () => {
  assert.equal(cleanSkill('  Node.js / React[Native]  '), 'Node js React Native');
});

test('Firestore value encoding round-trips', () => {
  const v = { a: 1, b: 1.5, c: 'x', d: [true, null], e: { f: 'g' } };
  assert.deepEqual(decode(encode(v)), v);
});

test('field paths quote non-identifier segments', () => {
  assert.equal(fieldPath('verifiedSkills', 'Web Development'), 'verifiedSkills.`Web Development`');
  assert.equal(fieldPath('enrolledCourses', 'abc123'), 'enrolledCourses.abc123');
  const nf = nestedFields([[['verifiedSkills', 'UI/UX'], { level: 'Expert' }], [['credits'], 5]]);
  assert.equal(nf.verifiedSkills.mapValue.fields['UI/UX'].mapValue.fields.level.stringValue, 'Expert');
  assert.equal(nf.credits.integerValue, '5');
});
