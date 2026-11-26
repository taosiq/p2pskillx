import {
  achievementsFor,
  computeXP,
  currentStreak,
  dailyQuests,
  dayKey,
  levelInfo,
  nextActivity,
  tierForLevel,
  xpForLevel,
} from '../utils/gamification';

describe('levels', () => {
  test('level thresholds grow: 0, 100, 300, 600, 1000', () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000]);
  });

  test('levelInfo places XP in the right level with progress', () => {
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    const mid = levelInfo(450); // level 3 spans 300..600
    expect(mid.level).toBe(3);
    expect(mid.current).toBe(150);
    expect(mid.needed).toBe(300);
    expect(mid.progress).toBeCloseTo(0.5);
    expect(mid.remaining).toBe(150);
  });

  test('tiers follow level bands', () => {
    expect(tierForLevel(1).key).toBe('bronze');
    expect(tierForLevel(3).key).toBe('silver');
    expect(tierForLevel(5).key).toBe('gold');
    expect(tierForLevel(7).key).toBe('platinum');
    expect(tierForLevel(10).key).toBe('diamond');
    expect(tierForLevel(15).key).toBe('legend');
  });
});

describe('XP is derived from activity', () => {
  test('empty profile has 0 XP', () => {
    expect(computeXP({}).total).toBe(0);
  });

  test('skills, courses, followers and active days all count', () => {
    const profile = {
      verifiedSkills: {
        JavaScript: { verified: true, level: 'Expert' }, // 100
        Python: { verified: true, level: 'Beginner' }, // 30
      },
      courses: ['c1'], // 80
      enrolledCourses: { a: {}, b: {} }, // 50
      followers: ['u1', 'u2'], // 10
      following: ['u3'], // 2
      activity: { activeDays: 3 }, // 15
    };
    expect(computeXP(profile).total).toBe(287);
  });

  test('following many people is capped', () => {
    const following = Array.from({ length: 500 }, (_, i) => `u${i}`);
    expect(computeXP({ following }).total).toBe(100);
  });

  test('a stored xp field is ignored (cannot be faked by editing it)', () => {
    expect(computeXP({ xp: 999999 }).total).toBe(0);
  });
});

describe('streaks', () => {
  test('first visit starts a streak of 1', () => {
    expect(nextActivity({}, '2026-11-26')).toEqual({
      lastActiveDate: '2026-11-26',
      streak: 1,
      bestStreak: 1,
      activeDays: 1,
    });
  });

  test('same day is not counted twice', () => {
    expect(nextActivity({ lastActiveDate: '2026-11-26', streak: 4 }, '2026-11-26')).toBeNull();
  });

  test('consecutive day extends, a gap resets but keeps the best', () => {
    const a = nextActivity({ lastActiveDate: '2026-11-25', streak: 4, bestStreak: 4, activeDays: 9 }, '2026-11-26');
    expect(a.streak).toBe(5);
    expect(a.bestStreak).toBe(5);
    const b = nextActivity({ lastActiveDate: '2026-11-20', streak: 5, bestStreak: 5, activeDays: 10 }, '2026-11-26');
    expect(b.streak).toBe(1);
    expect(b.bestStreak).toBe(5);
    expect(b.activeDays).toBe(11);
  });

  test('streak crosses month and year boundaries', () => {
    expect(nextActivity({ lastActiveDate: '2026-12-31', streak: 2 }, '2027-01-01').streak).toBe(3);
  });

  test('a clock moving backwards does not change anything', () => {
    expect(nextActivity({ lastActiveDate: '2026-11-26', streak: 3 }, '2026-11-20')).toBeNull();
  });

  test('current streak expires after a missed day', () => {
    expect(currentStreak({ lastActiveDate: '2026-11-25', streak: 6 }, '2026-11-26')).toBe(6);
    expect(currentStreak({ lastActiveDate: '2026-11-23', streak: 6 }, '2026-11-26')).toBe(0);
  });
});

describe('achievements and quests', () => {
  test('first skill unlocks First Proof, progress is capped at target', () => {
    const list = achievementsFor({ verifiedSkills: { Go: { level: 'Intermediate' } } });
    const first = list.find((a) => a.id === 'first_skill');
    expect(first.unlocked).toBe(true);
    const poly = list.find((a) => a.id === 'polymath');
    expect(poly.unlocked).toBe(false);
    expect(poly.value).toBe(1);
    expect(poly.progress).toBeCloseTo(0.2);
  });

  test('daily quests detect what was done today', () => {
    const today = dayKey();
    const quests = dailyQuests({
      activity: { lastActiveDate: today },
      verifiedSkills: { Rust: { level: 'Beginner', verifiedAt: new Date().toISOString() } },
      enrolledCourses: { c1: { enrolledAt: '2020-01-01T10:00:00.000Z' } },
    });
    const byId = Object.fromEntries(quests.map((q) => [q.id, q.done]));
    expect(byId).toEqual({ checkin: true, verify: true, learn: false });
  });
});
