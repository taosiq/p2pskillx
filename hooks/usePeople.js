import { collection, documentId, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { levelInfo } from '../utils/gamification';

// Only public, non-sensitive fields are kept from each profile.
export const toPerson = (d) => {
  const x = d.data();
  const skills = Object.keys(x.verifiedSkills || {});
  return {
    id: d.id,
    name: [x.firstName, x.lastName].filter(Boolean).join(' ') || 'Learner',
    photo: x.profileImage || null,
    info: levelInfo(Number(x.xp) || 0),
    subtitle: skills.length ? skills.slice(0, 3).join(' · ') : x.occupation ? x.occupation.replace(/^\w/, (c) => c.toUpperCase()) : '',
    skills,
  };
};

/** Load profiles by id (Firestore "in" queries take 30 ids at a time). */
export async function fetchPeopleByIds(ids = []) {
  const unique = [...new Set(ids.filter(Boolean))];
  const out = [];
  for (let i = 0; i < unique.length; i += 30) {
    const snap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', unique.slice(i, i + 30))));
    out.push(...snap.docs.map(toPerson));
  }
  return out.sort((a, b) => b.info.xp - a.info.xp);
}

/** Directory of learners, most active first. */
export async function fetchDirectory(max = 100) {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('xp', 'desc'), limit(max)));
  return snap.docs.map(toPerson);
}
