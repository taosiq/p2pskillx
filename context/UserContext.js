import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth, db } from '../config/firebase';
import { apiConfigured, syncProfile } from '../services/api';
import { removeEmailFromMyPosts } from '../services/postService';
import { dayKey, gamificationFor, nextActivity } from '../utils/gamification';

const UserContext = createContext(null);

/**
 * App-wide session state:
 *  - user: Firebase auth user (or null)
 *  - profile: live users/{uid} document
 *  - game: derived XP, level, tier, achievements, streak, quests
 *  - celebration: the next level-up / achievement to show (or null)
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(auth.currentUser);
  const [initializing, setInitializing] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(!!auth.currentUser);
  const [queue, setQueue] = useState([]);
  const writing = useRef(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setInitializing(false);
        if (!u) {
          lastLevel.current = null;
          setProfile(null);
          setQueue([]);
        }
      }),
    []
  );

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return undefined;
    }
    setProfileLoading(true);
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setProfileLoading(false);
      },
      (err) => {
        console.warn('Profile listener error:', err?.code || err?.message);
        setProfileLoading(false);
      }
    );
  }, [user?.uid]);

  // One-time privacy clean-up of posts made by older app versions.
  useEffect(() => {
    if (!user) return;
    removeEmailFromMyPosts().catch(() => {});
  }, [user?.uid]);

  const game = useMemo(() => (profile ? gamificationFor(profile) : null), [profile]);

  // Level-ups are celebrated when the stored level goes up (whoever wrote it).
  const lastLevel = useRef(null);
  useEffect(() => {
    if (!profile || typeof profile.level !== 'number') return;
    if (lastLevel.current != null && profile.level > lastLevel.current) {
      const info = gamificationFor(profile).level;
      const tier = info.tier;
      setQueue((q) => [...q, { type: 'level', level: profile.level, tier, tierChanged: tier.minLevel > lastLevel.current }]);
    }
    lastLevel.current = profile.level;
  }, [profile?.level]);

  // Keep streak / XP / level in step with what the user has done.
  // With the secure backend the server computes and writes them (so they
  // can't be faked); without it the app writes them itself.
  const lastSync = useRef(0);
  useEffect(() => {
    if (!user || !profile || !game || writing.current) return;

    const activity = nextActivity(profile.activity || {}, dayKey());
    const { level, tier } = game.level;
    const stale = !!activity || profile.xp !== game.xp.total || profile.level !== level;

    const updates = {};
    if (!apiConfigured) {
      if (activity) updates.activity = activity;
      if (profile.xp !== game.xp.total) updates.xp = game.xp.total;
      if (profile.level !== level) {
        updates.level = level;
        updates.badgeType = tier.name;
      }
    } else if (stale && Date.now() - lastSync.current > 15000) {
      lastSync.current = Date.now();
      syncProfile().catch((e) => console.warn('Profile sync failed:', e?.code || e?.message));
    }

    // "Seen" badges are a UI concern, so the app records them directly.
    const celebrations = [];
    const unlocked = game.achievements.filter((a) => a.unlocked).map((a) => a.id);
    const seen = profile.achievements;
    if (!Array.isArray(seen)) {
      // First run with the new system: record silently, no flood of pop-ups.
      updates.achievements = unlocked;
    } else {
      const fresh = unlocked.filter((id) => !seen.includes(id));
      if (fresh.length) {
        updates.achievements = [...seen, ...fresh];
        fresh.forEach((id) => celebrations.push({ type: 'achievement', achievement: game.achievements.find((a) => a.id === id) }));
      }
    }

    if (!Object.keys(updates).length) return;
    writing.current = true;
    updateDoc(doc(db, 'users', user.uid), updates)
      .then(() => {
        if (celebrations.length) setQueue((q) => [...q, ...celebrations]);
      })
      .catch((e) => console.warn('Could not sync progress:', e?.code || e?.message))
      .finally(() => {
        writing.current = false;
      });
  }, [user, profile, game]);

  const dismissCelebration = useCallback(() => setQueue((q) => q.slice(1)), []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      game,
      initializing,
      profileLoading,
      celebration: queue[0] || null,
      dismissCelebration,
      signOut,
      displayName: profile
        ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Learner'
        : user?.email?.split('@')[0] || 'Learner',
    }),
    [user, profile, game, initializing, profileLoading, queue, dismissCelebration, signOut]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
