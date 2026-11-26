import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { useUser } from '../context/UserContext';

/** Live count of the signed-in user's unread notifications. */
export default function useUnreadNotifications() {
  const { user } = useUser();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return undefined;
    }
    const q = query(collection(db, 'notifications'), where('recipientId', '==', user.uid), where('read', '==', false));
    return onSnapshot(
      q,
      (snap) => setCount(snap.size),
      () => setCount(0)
    );
  }, [user?.uid]);

  return count;
}
