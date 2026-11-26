import { authErrorMessage, isValidEmail, passwordProblems, passwordStrength } from '../utils/authErrors';
import { safeImageUri } from '../utils/media';
import { rankCourses } from '../utils/recommend';
import { chatTime, timeAgo } from '../utils/time';

jest.mock('expo-image-picker', () => ({}));

describe('auth helpers', () => {
  test('sign-in failures never reveal whether the email exists', () => {
    expect(authErrorMessage('auth/user-not-found')).toBe(authErrorMessage('auth/wrong-password'));
    expect(authErrorMessage('auth/invalid-credential')).toBe(authErrorMessage('auth/wrong-password'));
  });

  test('unknown codes fall back to a friendly message', () => {
    expect(authErrorMessage('auth/something-new')).toMatch(/try again/i);
  });

  test('email validation', () => {
    expect(isValidEmail('learner@uni.edu.pk')).toBe(true);
    expect(isValidEmail('no-at-sign.com')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });

  test('password rules and strength', () => {
    expect(passwordProblems('abc')).toEqual(['8+ characters', 'a number']);
    expect(passwordProblems('abcdefg1')).toEqual([]);
    expect(passwordStrength('abcdefg1')).toBeLessThan(passwordStrength('Abcdefgh1234!'));
  });
});

describe('image safety', () => {
  test('only https and inline images are rendered', () => {
    expect(safeImageUri('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(safeImageUri('data:image/jpeg;base64,AAAA')).toBe('data:image/jpeg;base64,AAAA');
    expect(safeImageUri('http://insecure.com/a.png')).toBeNull();
    expect(safeImageUri('javascript:alert(1)')).toBeNull();
    expect(safeImageUri('data:text/html;base64,AAAA')).toBeNull();
  });
});

describe('time formatting', () => {
  const now = new Date('2026-11-26T12:00:00');
  test('timeAgo', () => {
    expect(timeAgo(new Date('2026-11-26T11:59:50'), now)).toBe('Just now');
    expect(timeAgo(new Date('2026-11-26T11:30:00'), now)).toBe('30m ago');
    expect(timeAgo(new Date('2026-11-26T09:00:00'), now)).toBe('3h ago');
    expect(timeAgo(new Date('2026-11-23T12:00:00'), now)).toBe('3d ago');
    expect(timeAgo({ seconds: now.getTime() / 1000 - 120 }, now)).toBe('2m ago');
  });
  test('chatTime', () => {
    expect(chatTime(new Date('2026-11-25T18:00:00'), now)).toBe('Yesterday');
  });
});

describe('recommendations', () => {
  const courses = [
    { id: 'a', title: 'React Native basics', category: 'Information Technology & AI', creatorId: 'x', enrollments: 0 },
    { id: 'b', title: 'Baking bread', category: 'Culinary Arts & Food Services', creatorId: 'friend', enrollments: 0 },
    { id: 'c', title: 'Mine', creatorId: 'me', enrollments: 50 },
    { id: 'd', title: 'Already joined', creatorId: 'x', enrollments: 50 },
    { id: 'e', title: 'Old', creatorId: 'x', status: 'archived', enrollments: 99 },
  ];
  const profile = {
    verifiedSkills: { 'React Native': { category: 'Information Technology & AI' } },
    following: ['friend'],
    enrolledCourses: { d: {} },
  };

  test('excludes own, joined and archived courses', () => {
    const ids = rankCourses(courses, profile, 'me').map((r) => r.course.id);
    expect(ids).toEqual(expect.arrayContaining(['a', 'b']));
    expect(ids).not.toContain('c');
    expect(ids).not.toContain('d');
    expect(ids).not.toContain('e');
  });

  test('gives each course an explainable reason', () => {
    const byId = Object.fromEntries(rankCourses(courses, profile, 'me').map((r) => [r.course.id, r.reason]));
    expect(byId.a).toBe('skill');
    expect(byId.b).toBe('social');
  });
});
