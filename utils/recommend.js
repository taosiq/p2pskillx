// Explainable course recommendations (no network calls: works on the course list).

/** Every course gets a score and a single best reason, so recommendations are explainable. */
export function rankCourses(courses, profile, uid) {
  const skills = Object.keys(profile?.verifiedSkills || {}).map((s) => s.toLowerCase());
  const skillCats = new Set(Object.values(profile?.verifiedSkills || {}).map((s) => s.category));
  const interests = (profile?.interests || []).map((s) => s.toLowerCase());
  const following = new Set(profile?.following || []);
  const enrolled = profile?.enrolledCourses || {};

  return courses
    .filter((c) => c.creatorId !== uid && !enrolled[c.id] && c.status !== 'archived')
    .map((c) => {
      const hay = [c.title, c.description, c.category, ...(c.skills || [])].join(' ').toLowerCase();
      const scores = {
        social: following.has(c.creatorId) ? 6 : 0,
        interest: interests.filter((i) => hay.includes(i)).length * 4,
        skill: skills.filter((s) => hay.includes(s)).length * 3 + (skillCats.has(c.category) ? 2 : 0),
        popular: Math.min(4, (c.enrollments || 0) / 3) + (c.ratingAvg || 0) / 2,
      };
      const reason = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
      return { course: c, reason, score: Object.values(scores).reduce((a, b) => a + b, 0) };
    })
    .sort((a, b) => b.score - a.score);
}

