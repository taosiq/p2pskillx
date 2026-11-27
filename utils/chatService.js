import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
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
// conversations/{id}: { participants: [uidA, uidB], lastMessage, lastMessageTime, lastSenderId,
//                       unread: { [uid]: number }, courseId?, courseTitle? }
// conversations/{id}/messages/{msgId}: { senderId, text, timestamp }
// New conversations use a deterministic id (sorted uids) so two people can
// never end up with duplicate threads. Security rules only let participants
// read or write a conversation and its messages.

const MAX_MESSAGE = 2000;
const pairId = (a, b) => [a, b].sort().join('_');

const userCache = new Map();

export const getUserDetailsForChat = async (userId) => {
  if (userCache.has(userId)) return userCache.get(userId);
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    const d = snap.data() || {};
    const details = {
      id: userId,
      name: [d.firstName, d.lastName].filter(Boolean).join(' ') || 'Learner',
      photo: d.profileImage || null,
      xp: Number(d.xp) || 0,
      exists: snap.exists(),
    };
    userCache.set(userId, details);
    return details;
  } catch {
    return { id: userId, name: 'Learner', photo: null, xp: 0, exists: false };
  }
};

/** Find or start the 1:1 conversation with another user. Returns its id. */
export const createOrGetConversation = async (otherUserId, extra = {}) => {
  const me = auth.currentUser?.uid;
  if (!me) throw new Error('You must be signed in to chat');
  if (!otherUserId || me === otherUserId) throw new Error('You can’t message yourself');

  // Legacy conversations (random ids) are reused if they exist.
  const legacy = await getDocs(query(collection(db, 'conversations'), where('participants', 'array-contains', me)));
  const found = legacy.docs.find((d) => (d.data().participants || []).includes(otherUserId));
  if (found) {
    if (extra.courseId && !found.data().courseId) updateDoc(found.ref, extra).catch(() => {});
    return found.id;
  }

  const id = pairId(me, otherUserId);
  const ref = doc(db, 'conversations', id);
  const snap = await getDoc(ref).catch(() => null);
  if (!snap?.exists()) {
    await setDoc(ref, {
      participants: [me, otherUserId],
      createdAt: serverTimestamp(),
      lastMessageTime: serverTimestamp(),
      lastMessage: '',
      lastSenderId: null,
      unread: { [me]: 0, [otherUserId]: 0 },
      ...extra,
    });
  }
  return id;
};

/** Conversation with a course's instructor (tagged with the course). */
export const createCourseConversation = async (courseId, creatorId) => {
  let courseTitle = null;
  try {
    courseTitle = (await getDoc(doc(db, 'courses', courseId))).data()?.title || null;
  } catch {}
  return createOrGetConversation(creatorId, { courseId, courseTitle });
};

export const sendMessage = async (conversationId, text) => {
  const me = auth.currentUser?.uid;
  if (!me) throw new Error('You must be signed in to send messages');
  const body = String(text || '').trim().slice(0, MAX_MESSAGE);
  if (!body) return null;

  const convRef = doc(db, 'conversations', conversationId);
  const conv = (await getDoc(convRef)).data();
  const other = (conv?.participants || []).find((p) => p !== me);

  const msgRef = doc(collection(db, 'conversations', conversationId, 'messages'));
  const batch = writeBatch(db);
  batch.set(msgRef, { senderId: me, text: body, timestamp: serverTimestamp() });
  batch.update(convRef, {
    lastMessage: body.length > 80 ? `${body.slice(0, 80)}…` : body,
    lastMessageTime: serverTimestamp(),
    lastSenderId: me,
    ...(other ? { [`unread.${other}`]: increment(1) } : {}),
  });
  await batch.commit();
  return msgRef.id;
};

const millis = (t) => (t?.toMillis ? t.toMillis() : t instanceof Date ? t.getTime() : 0);

/**
 * Live messages, oldest first. callback(messages, error)
 * Messages from before the user deleted the chat (clearedAt) are left out.
 */
export const getMessages = (conversationId, callback, max = 200) => {
  const me = auth.currentUser?.uid;
  let clearedAt = 0;
  let lastDocs = null;

  const emit = () => {
    if (!lastDocs) return;
    const list = lastDocs
      .map((d) => {
        const m = d.data({ serverTimestamps: 'estimate' });
        return { id: d.id, ...m, timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : new Date(), pending: d.metadata.hasPendingWrites };
      })
      .filter((m) => !clearedAt || m.timestamp.getTime() > clearedAt)
      .reverse();
    callback(list, null);
  };

  const stopConv = onSnapshot(
    doc(db, 'conversations', conversationId),
    (snap) => {
      clearedAt = millis(snap.data({ serverTimestamps: 'estimate' })?.clearedAt?.[me]);
      emit();
    },
    () => {}
  );
  const stopMessages = onSnapshot(
    query(collection(db, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'desc'), limit(max)),
    (snap) => {
      lastDocs = snap.docs;
      emit();
    },
    (error) => callback([], error)
  );
  return () => {
    stopConv();
    stopMessages();
  };
};

/**
 * Delete a chat for the current user only (like WhatsApp's "Delete chat"):
 * it leaves their list and its history is hidden. The other person keeps
 * their copy; if either sends a new message, the chat comes back with only
 * the new messages.
 */
export const deleteConversationForMe = async (conversationId) => {
  const me = auth.currentUser?.uid;
  if (!me) throw new Error('You must be signed in');
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`clearedAt.${me}`]: serverTimestamp(),
    [`unread.${me}`]: 0,
  });
};

export const markMessagesAsRead = async (conversationId) => {
  const me = auth.currentUser?.uid;
  if (!me) return;
  try {
    await updateDoc(doc(db, 'conversations', conversationId), { [`unread.${me}`]: 0 });
  } catch {}
};

/** Live list of my conversations with the other person's details. */
export const getUserConversations = (callback) => {
  const me = auth.currentUser?.uid;
  if (!me) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', me), orderBy('lastMessageTime', 'desc'));
  return onSnapshot(
    q,
    async (snap) => {
      const rows = await Promise.all(
        snap.docs.map(async (d) => {
          const c = d.data({ serverTimestamps: 'estimate' });
          const otherUserId = (c.participants || []).find((p) => p !== me);
          if (!otherUserId) return null;
          // Deleted by me, and nothing new since.
          const cleared = millis(c.clearedAt?.[me]);
          if (cleared && millis(c.lastMessageTime) <= cleared) return null;
          const other = await getUserDetailsForChat(otherUserId);
          return {
            conversationId: d.id,
            otherUserId,
            otherUserDetails: other,
            lastMessage: c.lastMessage || '',
            lastSenderId: c.lastSenderId || null,
            lastMessageTime: c.lastMessageTime?.toDate ? c.lastMessageTime.toDate() : new Date(),
            unreadCount: c.unread?.[me] || 0,
            courseId: c.courseId || null,
            courseTitle: c.courseTitle || null,
          };
        })
      );
      callback(rows.filter(Boolean));
    },
    (error) => {
      console.warn('Conversations listener:', error?.code);
      callback([], error);
    }
  );
};

/** Total unread messages across conversations (for the tab badge). */
export const listenUnreadTotal = (callback) => {
  const me = auth.currentUser?.uid;
  if (!me) return () => {};
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', me));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.reduce((s, d) => s + (d.data().unread?.[me] || 0), 0)),
    () => callback(0)
  );
};
