import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Data model
// courses/{id}                 public listing: title, description, outline (section titles only), price...
// courses/{id}/private/content  full lessons (links, images). Readable only by the creator or enrolled
//                               learners (see firestore.rules), so paid content isn't free to read.
// courses/{id}/reviews/{uid}    one rating per learner
// users/{uid}.courseProgress.{courseId} = { done: [sectionIndex...], total, updatedAt }

const LIMITS = { title: 90, description: 2000, sections: 30, sectionTitle: 120, sectionText: 3000, minCredits: 5, maxCredits: 500 };

const clean = (s, max) => String(s || '').trim().slice(0, max);

const safeLink = (url) => {
  const u = clean(url, 500);
  if (!u) return '';
  const withScheme = /^https?:\/\//i.test(u) ? u : `https://${u}`;
  return /^https:\/\/[^\s]+\.[^\s]+/i.test(withScheme.replace(/^http:/i, 'https:')) ? withScheme.replace(/^http:/i, 'https:') : '';
};

/** Normalise sections from the editor (or legacy docs) into the stored shape. */
export const normaliseSections = (sections = []) =>
  sections
    .filter((s) => clean(s.title, LIMITS.sectionTitle))
    .slice(0, LIMITS.sections)
    .map((s, i) => ({
      id: s.id || `s${i}`,
      title: clean(s.title, LIMITS.sectionTitle),
      description: clean(s.description, LIMITS.sectionText),
      videoLink: safeLink(s.videoLink),
      documentLink: safeLink(s.documentLink),
      files: (s.files || [])
        .filter((f) => f && typeof f.base64 === 'string' && /^data:image\//.test(f.base64))
        .slice(0, 3)
        .map((f) => ({ id: f.id || String(Math.random()).slice(2), name: clean(f.name, 80) || 'Image', type: 'image', base64: f.base64 })),
    }));

const outlineOf = (sections) =>
  sections.map((s) => ({ title: s.title, hasVideo: !!s.videoLink, hasDocument: !!s.documentLink, images: s.files.length }));

// ---------- create / update / delete ----------

export const createCourse = async (courseData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return { success: false, error: 'No authenticated user' };

    const me = (await getDoc(doc(db, 'users', currentUser.uid))).data() || {};
    const sections = normaliseSections(courseData.sections);
    const title = clean(courseData.title, LIMITS.title);
    const credits = Math.round(Number(courseData.credits));
    if (!title) return { success: false, error: 'Add a course title.' };
    if (!sections.length) return { success: false, error: 'Add at least one lesson.' };
    if (!(credits >= LIMITS.minCredits && credits <= LIMITS.maxCredits)) return { success: false, error: `Price must be ${LIMITS.minCredits}–${LIMITS.maxCredits} credits.` };

    const courseRef = doc(collection(db, 'courses'));
    const now = new Date().toISOString();
    const batch = writeBatch(db);
    batch.set(courseRef, {
      id: courseRef.id,
      title,
      description: clean(courseData.description, LIMITS.description),
      category: clean(courseData.category, 80) || 'General',
      skills: (courseData.skills || []).map((s) => clean(s, 60)).filter(Boolean).slice(0, 5),
      level: ['Beginner', 'Intermediate', 'Advanced'].includes(courseData.level) ? courseData.level : 'Beginner',
      credits,
      thumbnail: typeof courseData.thumbnail === 'string' && /^data:image\//.test(courseData.thumbnail) ? courseData.thumbnail : null,
      outline: outlineOf(sections),
      sectionCount: sections.length,
      creatorId: currentUser.uid,
      creatorName: [me.firstName, me.lastName].filter(Boolean).join(' ') || 'Instructor',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      enrollments: 0,
      ratingAvg: 0,
      ratingCount: 0,
    });
    batch.set(doc(db, 'courses', courseRef.id, 'private', 'content'), { sections, updatedAt: now });
    batch.update(doc(db, 'users', currentUser.uid), { courses: arrayUnion(courseRef.id) });
    await batch.commit();

    // Tell followers (best effort).
    try {
      const followers = me.followers || [];
      if (followers.length) {
        const { createFollowingCourseNotification } = await import('./notificationService');
        await createFollowingCourseNotification(courseRef.id, currentUser.uid, me, title, followers);
      }
    } catch {}

    return { success: true, courseId: courseRef.id };
  } catch (error) {
    console.warn('Create course failed:', error?.code || error?.message);
    return { success: false, error: 'Couldn’t publish the course. Please try again.' };
  }
};

export const updateCourse = async (courseId, updateData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return { success: false, error: 'No authenticated user' };
    const allowed = {};
    if (updateData.title != null) allowed.title = clean(updateData.title, LIMITS.title);
    if (updateData.description != null) allowed.description = clean(updateData.description, LIMITS.description);
    if (updateData.status != null) allowed.status = updateData.status === 'archived' ? 'archived' : 'active';
    await updateDoc(doc(db, 'courses', courseId), { ...allowed, updatedAt: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteCourse = async (courseId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return { success: false, error: 'No authenticated user' };
    const course = await getDoc(doc(db, 'courses', courseId));
    if (!course.exists()) return { success: false, error: 'Course not found' };
    if (course.data().creatorId !== currentUser.uid) return { success: false, error: 'Only the instructor can delete this course' };
    if ((course.data().enrollments || 0) > 0) {
      // Learners paid for it: archive instead so they keep access.
      await updateDoc(doc(db, 'courses', courseId), { status: 'archived', updatedAt: new Date().toISOString() });
      return { success: true, archived: true };
    }
    const batch = writeBatch(db);
    batch.delete(doc(db, 'courses', courseId, 'private', 'content'));
    batch.delete(doc(db, 'courses', courseId));
    batch.update(doc(db, 'users', currentUser.uid), { courses: arrayRemove(courseId) });
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.warn('Delete course failed:', error?.code);
    return { success: false, error: 'Couldn’t delete the course.' };
  }
};

// ---------- read ----------

export const getCourseById = async (courseId) => {
  try {
    const snap = await getDoc(doc(db, 'courses', courseId));
    if (!snap.exists()) return { success: false, error: 'Course not found' };
    const data = snap.data();
    // Legacy courses kept full sections on the public doc: derive an outline.
    const outline = data.outline || (data.sections || []).map((s) => ({ title: s.title, hasVideo: !!s.videoLink, hasDocument: !!s.documentLink, images: (s.files || []).length }));
    return { success: true, course: { id: snap.id, ...data, outline, sectionCount: data.sectionCount ?? outline.length } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/** Full lessons. Only works for the creator or an enrolled learner. */
export const getCourseContent = async (courseId) => {
  try {
    const priv = await getDoc(doc(db, 'courses', courseId, 'private', 'content'));
    if (priv.exists()) return { success: true, sections: normaliseSections(priv.data().sections || []) };
    const pub = await getDoc(doc(db, 'courses', courseId));
    return { success: true, sections: normaliseSections(pub.data()?.sections || []) };
  } catch (error) {
    return { success: false, code: error?.code, error: error.message, sections: [] };
  }
};

export const getAllCourses = async (categoryFilter = null) => {
  try {
    const q = categoryFilter
      ? query(collection(db, 'courses'), where('category', '==', categoryFilter), limit(100))
      : query(collection(db, 'courses'), orderBy('enrollments', 'desc'), limit(100));
    const snap = await getDocs(q);
    return { success: true, courses: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    console.warn('Load courses failed:', error?.code);
    return { success: false, error: error.message, courses: [] };
  }
};

export const getCoursesByUserId = async (userId) => {
  try {
    const snap = await getDocs(query(collection(db, 'courses'), where('creatorId', '==', userId)));
    return { success: true, courses: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    return { success: false, error: error.message, courses: [] };
  }
};

export const getUserCourses = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return { success: false, error: 'No authenticated user', courses: [] };
  return getCoursesByUserId(uid);
};

export const isUserEnrolledInCourse = async (courseId) => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, enrolled: false };
    const me = await getDoc(doc(db, 'users', uid));
    return { success: true, enrolled: !!me.data()?.enrolledCourses?.[courseId] };
  } catch (error) {
    return { success: false, error: error.message, enrolled: false };
  }
};

export const getUserEnrolledCourses = async () => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, courses: [] };
    const me = (await getDoc(doc(db, 'users', uid))).data() || {};
    const enrolled = me.enrolledCourses || {};
    const progress = me.courseProgress || {};
    const ids = Object.keys(enrolled);
    const results = await Promise.all(ids.map((id) => getCourseById(id)));
    const courses = results
      .filter((r) => r.success)
      .map((r) => {
        const c = r.course;
        const p = progress[c.id];
        const total = p?.total || c.sectionCount || 0;
        return {
          ...c,
          enrolledAt: enrolled[c.id]?.enrolledAt,
          creditsSpent: enrolled[c.id]?.creditsSpent,
          progress: total ? Math.round(((p?.done?.length || 0) / total) * 100) : 0,
        };
      })
      .sort((a, b) => String(b.enrolledAt || '').localeCompare(String(a.enrolledAt || '')));
    return { success: true, courses };
  } catch (error) {
    return { success: false, error: error.message, courses: [] };
  }
};

// ---------- progress ----------

export const setLessonDone = async (courseId, index, done, total) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return { success: false };
  try {
    await updateDoc(doc(db, 'users', uid), {
      [`courseProgress.${courseId}.done`]: done ? arrayUnion(index) : arrayRemove(index),
      [`courseProgress.${courseId}.total`]: total,
      [`courseProgress.${courseId}.updatedAt`]: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ---------- reviews ----------

export const getCourseReviews = async (courseId) => {
  try {
    const snap = await getDocs(query(collection(db, 'courses', courseId, 'reviews'), orderBy('createdAt', 'desc'), limit(30)));
    const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;
    return { success: true, reviews, avg, count: reviews.length };
  } catch (error) {
    return { success: false, reviews: [], avg: 0, count: 0 };
  }
};

export const submitCourseReview = async (courseId, rating, text = '') => {
  const user = auth.currentUser;
  if (!user) return { success: false };
  const r = Math.max(1, Math.min(5, Math.round(rating)));
  try {
    const me = (await getDoc(doc(db, 'users', user.uid))).data() || {};
    await setDoc(doc(db, 'courses', courseId, 'reviews', user.uid), {
      rating: r,
      text: clean(text, 500),
      userId: user.uid,
      userName: [me.firstName, me.lastName].filter(Boolean).join(' ') || 'Learner',
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.warn('Review failed:', error?.code);
    return { success: false, error: error.message };
  }
};

export { LIMITS as COURSE_LIMITS };

// Legacy helpers some screens still import.
export const uploadCourseThumbnail = async () => ({ success: false, error: 'Thumbnails are saved with the course' });
export const fileToBase64 = async () => ({ success: false, error: 'Use utils/media pickImage' });
