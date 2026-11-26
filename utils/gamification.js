// Gamification engine: pure functions, no Firebase.
//
// XP is *derived* from what a user has actually done (verified skills,
// courses taught and joined, followers, active days), so it is always
// consistent with their activity and cannot drift. The computed xp/level are
// written back to the user document only so other screens (leaderboard,
// other people's profiles) can read and sort them.

export const XP_RULES = {
  skill: { Beginner: 30, Intermediate: 50, Advanced: 75, Expert: 100 },
  skillDefault: 50,
  courseCreated: 80,
  coursesPerSkill: 3,
  courseEnrolled: 25,
  courseCompleted: 40,
  follower: 5,
  following: 2,
  followingCap: 50, // following more than this earns nothing extra
  activeDay: 5,
};

// ---------- dates ----------

/** Local calendar day as YYYY-MM-DD (streaks follow the user's own midnight). */
export const dayKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const daysBetween = (fromKey, toKey) => {
  const [y1, m1, d1] = fromKey.split('-').map(Number);
  const [y2, m2, d2] = toKey.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

// ---------- activity counts ----------

const toDate = (v) => {
  if (!v) return null;
  if (typeof v?.toDate === 'function') return v.toDate(); // Firestore Timestamp
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function activityCounts(profile = {}) {
  const skills = Object.entries(profile.verifiedSkills || {}).filter(([, s]) => s && s.verified !== false);
  const enrolled = Object.values(profile.enrolledCourses || {});
  const followers = Array.isArray(profile.followers) ? profile.followers.length : profile.followersCount || 0;
  const following = Array.isArray(profile.following) ? profile.following.length : profile.followingCount || 0;
  return {
    skills,
    skillCount: skills.length,
    expertSkills: skills.filter(([, s]) => ['Expert', 'Advanced'].includes(s.level)).length,
    // teachingCount is written by the server (counted from the courses collection); the
    // courses array is only a fallback for when the backend isn't deployed.
    coursesCreated: Number.isFinite(profile.teachingCount) ? profile.teachingCount : Array.isArray(profile.courses) ? profile.courses.length : 0,
    coursesEnrolled: enrolled.length,
    coursesCompleted: Object.entries(profile.courseProgress || {}).filter(([id, p]) => profile.enrolledCourses?.[id] && p?.total > 0 && (p.done?.length || 0) >= p.total).length,
    enrolled,
    followers,
    following,
    activeDays: profile.activity?.activeDays || 0,
    streak: currentStreak(profile.activity),
    bestStreak: profile.activity?.bestStreak || 0,
    credits: profile.credits || 0,
  };
}

// ---------- XP ----------

export function computeXP(profile = {}) {
  const c = activityCounts(profile);
  const skillXP = c.skills.reduce((sum, [, s]) => sum + (XP_RULES.skill[s.level] || XP_RULES.skillDefault), 0);

  const breakdown = [
    { key: 'skills', label: 'Verified skills', icon: 'ribbon', count: c.skillCount, xp: skillXP },
    // Up to 3 courses per verified skill earn XP, so publishing empty courses can't farm levels.
    {
      key: 'teach',
      label: 'Courses taught',
      icon: 'easel',
      count: c.coursesCreated,
      xp: Math.min(c.coursesCreated, c.skillCount * XP_RULES.coursesPerSkill) * XP_RULES.courseCreated,
    },
    { key: 'learn', label: 'Courses joined', icon: 'school', count: c.coursesEnrolled, xp: c.coursesEnrolled * XP_RULES.courseEnrolled },
    { key: 'complete', label: 'Courses completed', icon: 'checkmark-done-circle', count: c.coursesCompleted, xp: c.coursesCompleted * XP_RULES.courseCompleted },
    { key: 'followers', label: 'Followers', icon: 'people', count: c.followers, xp: c.followers * XP_RULES.follower },
    {
      key: 'following',
      label: 'Connections made',
      icon: 'person-add',
      count: c.following,
      xp: Math.min(c.following, XP_RULES.followingCap) * XP_RULES.following,
    },
    { key: 'active', label: 'Active days', icon: 'flame', count: c.activeDays, xp: c.activeDays * XP_RULES.activeDay },
  ];

  return { total: breakdown.reduce((s, b) => s + b.xp, 0), breakdown };
}

// ---------- levels & tiers ----------

export const MAX_LEVEL = 50;

/** Total XP needed to reach `level`. L1=0, L2=100, L3=300, L4=600, L5=1000 ... */
export const xpForLevel = (level) => 50 * (level - 1) * level;

export const TIERS = [
  { key: 'bronze', name: 'Bronze', title: 'Beginner', minLevel: 1, colors: ['#E7A574', '#9A5B36'], icon: 'shield', reward: 0 },
  { key: 'silver', name: 'Silver', title: 'Apprentice', minLevel: 3, colors: ['#F1F5F9', '#94A3B8'], icon: 'shield-half', reward: 70 },
  { key: 'gold', name: 'Gold', title: 'Skilled', minLevel: 5, colors: ['#FFE066', '#F59E0B'], icon: 'medal', reward: 100 },
  { key: 'platinum', name: 'Platinum', title: 'Expert', minLevel: 7, colors: ['#67E8F9', '#6366F1'], icon: 'trophy', reward: 150 },
  { key: 'diamond', name: 'Diamond', title: 'Master', minLevel: 10, colors: ['#A5F3FC', '#C084FC', '#F472B6'], icon: 'diamond', reward: 200 },
  { key: 'legend', name: 'Legend', title: 'Legend', minLevel: 15, colors: ['#FF4FD8', '#7C5CFF', '#22D3EE'], icon: 'planet', reward: 300 },
];

export const tierForLevel = (level) => [...TIERS].reverse().find((t) => level >= t.minLevel) || TIERS[0];

export function levelInfo(xp = 0) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  const floor = xpForLevel(level);
  const next = level >= MAX_LEVEL ? floor : xpForLevel(level + 1);
  const needed = next - floor;
  const current = xp - floor;
  const tier = tierForLevel(level);
  const nextTier = TIERS.find((t) => t.minLevel > level) || null;
  return {
    level,
    xp,
    current,
    needed,
    remaining: Math.max(0, next - xp),
    progress: needed > 0 ? current / needed : 1,
    nextLevelXp: next,
    tier,
    nextTier,
    isMax: level >= MAX_LEVEL,
  };
}

// ---------- streaks ----------

/** Streak still counts if the user was active today or yesterday. */
export function currentStreak(activity, today = dayKey()) {
  if (!activity?.lastActiveDate || !activity.streak) return 0;
  const gap = daysBetween(activity.lastActiveDate, today);
  return gap <= 1 ? activity.streak : 0;
}

/**
 * Activity record after opening the app today, or null if today is
 * already counted. Shape: { lastActiveDate, streak, bestStreak, activeDays }
 */
export function nextActivity(activity = {}, today = dayKey()) {
  if (activity.lastActiveDate === today) return null;
  const gap = activity.lastActiveDate ? daysBetween(activity.lastActiveDate, today) : Infinity;
  if (gap < 0) return null; // clock moved backwards: don't touch the streak
  const streak = gap === 1 ? (activity.streak || 0) + 1 : 1;
  return {
    lastActiveDate: today,
    streak,
    bestStreak: Math.max(activity.bestStreak || 0, streak),
    activeDays: (activity.activeDays || 0) + 1,
  };
}

/** Last 7 days (oldest first) marking which were part of the current streak. */
export function streakWeek(activity, today = dayKey()) {
  const streak = currentStreak(activity, today);
  const last = activity?.lastActiveDate;
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    let active = false;
    if (last && streak > 0) {
      const back = daysBetween(key, last); // days from this day to last active day
      active = back >= 0 && back < streak;
    }
    out.push({ key, label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), active, isToday: key === today });
  }
  return out;
}

// ---------- achievements ----------

const A = (id, title, description, icon, gradient, target, pick, rarity = 'common') => ({
  id, title, description, icon, gradient, target, pick, rarity,
});

export const ACHIEVEMENTS = [
  A('first_skill', 'First Proof', 'Verify your first skill', 'ribbon', ['#7C5CFF', '#C04BFF'], 1, (c) => c.skillCount),
  A('polymath', 'Polymath', 'Verify 5 different skills', 'library', ['#7C5CFF', '#FF4FD8'], 5, (c) => c.skillCount, 'rare'),
  A('true_expert', 'True Expert', 'Verify a skill at Advanced or Expert level', 'flash', ['#FFC83D', '#FF8A3D'], 1, (c) => c.expertSkills, 'rare'),
  A('mentor', 'Mentor', 'Publish your first course', 'easel', ['#06B6D4', '#3B82F6'], 1, (c) => c.coursesCreated),
  A('professor', 'Professor', 'Publish 5 courses', 'school', ['#3B82F6', '#7C5CFF'], 5, (c) => c.coursesCreated, 'epic'),
  A('curious', 'Curious Mind', 'Join your first course', 'bulb', ['#10B981', '#2EE59D'], 1, (c) => c.coursesEnrolled),
  A('graduate', 'Graduate', 'Complete every lesson of a course', 'checkmark-done-circle', ['#2EE59D', '#12C2FF'], 1, (c) => c.coursesCompleted, 'rare'),
  A('lifelong', 'Lifelong Learner', 'Join 5 courses', 'book', ['#10B981', '#06B6D4'], 5, (c) => c.coursesEnrolled, 'rare'),
  A('connector', 'Connector', 'Follow 10 people', 'git-network', ['#22D3EE', '#7C5CFF'], 10, (c) => c.following),
  A('rising_star', 'Rising Star', 'Reach 10 followers', 'star', ['#FFC83D', '#FF4FD8'], 10, (c) => c.followers, 'rare'),
  A('influencer', 'Influencer', 'Reach 50 followers', 'megaphone', ['#FF4FD8', '#FF7A45'], 50, (c) => c.followers, 'legendary'),
  A('on_fire', 'On Fire', 'Keep a 7-day streak', 'flame', ['#FF8A3D', '#FF4F6D'], 7, (c) => c.bestStreak, 'rare'),
  A('unstoppable', 'Unstoppable', 'Keep a 30-day streak', 'rocket', ['#FF4F6D', '#C04BFF'], 30, (c) => c.bestStreak, 'legendary'),
  A('saver', 'Credit Saver', 'Hold 500 credits at once', 'wallet', ['#FFC83D', '#10B981'], 500, (c) => c.credits, 'epic'),
  A('gold_rush', 'Gold Rush', 'Reach Level 5 (Gold tier)', 'medal', ['#FFE066', '#F59E0B'], 5, (c, l) => l.level, 'epic'),
];

export const RARITY = {
  common: { label: 'Common', color: '#94A3B8' },
  rare: { label: 'Rare', color: '#22D3EE' },
  epic: { label: 'Epic', color: '#C084FC' },
  legendary: { label: 'Legendary', color: '#FFC83D' },
};

export function achievementsFor(profile, level) {
  const c = activityCounts(profile);
  const l = level || levelInfo(computeXP(profile).total);
  return ACHIEVEMENTS.map((a) => {
    const value = Math.min(a.target, a.pick(c, l) || 0);
    return { ...a, value, progress: value / a.target, unlocked: value >= a.target };
  });
}

// ---------- daily quests ----------

export function dailyQuests(profile = {}, today = dayKey()) {
  const c = activityCounts(profile);
  const verifiedToday = c.skills.some(([, s]) => dayKey(toDate(s.verifiedAt)) === today);
  const joinedToday = c.enrolled.some((e) => dayKey(toDate(e?.enrolledAt)) === today);
  return [
    {
      id: 'checkin',
      title: 'Daily check-in',
      description: 'Open P2PSkillX today',
      icon: 'calendar',
      xp: XP_RULES.activeDay,
      done: profile.activity?.lastActiveDate === today,
      route: null,
    },
    {
      id: 'verify',
      title: 'Prove a skill',
      description: 'Pass a skill verification quiz',
      icon: 'ribbon',
      xp: XP_RULES.skill.Intermediate,
      done: verifiedToday,
      route: 'SkillCategory',
    },
    {
      id: 'learn',
      title: 'Learn something new',
      description: 'Join a course from the community',
      icon: 'school',
      xp: XP_RULES.courseEnrolled,
      done: joinedToday,
      route: 'LearnSkill',
    },
  ];
}

// ---------- one call for screens ----------

export function gamificationFor(profile = {}) {
  const xp = computeXP(profile);
  const level = levelInfo(xp.total);
  const achievements = achievementsFor(profile, level);
  return {
    xp,
    level,
    achievements,
    unlockedCount: achievements.filter((a) => a.unlocked).length,
    streak: currentStreak(profile.activity),
    bestStreak: profile.activity?.bestStreak || 0,
    week: streakWeek(profile.activity),
    quests: dailyQuests(profile),
  };
}
