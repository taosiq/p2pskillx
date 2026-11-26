import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import PeopleList from '../components/social/PeopleList';
import { Button, Header, Screen } from '../components/ui';
import { db } from '../config/firebase';
import { useUser } from '../context/UserContext';
import { fetchPeopleByIds } from '../hooks/usePeople';
import { followUser, removeFollower, unfollowUser } from '../services/userService';
import haptics from '../utils/haptics';

/**
 * Followers or following list for any user (mode = 'followers' | 'following').
 * On your own lists you can remove followers / unfollow; elsewhere you can follow back.
 */
export function FollowList({ navigation, route, mode }) {
  const { userId, userName } = route.params || {};
  const { user, profile } = useUser();
  const isMe = !userId || userId === user?.uid;
  const [ids, setIds] = useState(null);
  const [people, setPeople] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(
    () =>
      onSnapshot(
        doc(db, 'users', userId || user.uid),
        (snap) => setIds(snap.data()?.[mode] || []),
        () => setIds([])
      ),
    [userId, mode]
  );

  useEffect(() => {
    if (ids === null) return;
    fetchPeopleByIds(ids)
      .then((list) => setPeople(list.filter((p) => !(profile?.blocked || []).includes(p.id))))
      .catch(() => setPeople([]));
  }, [ids]);

  const myFollowing = profile?.following || [];

  const act = async (p) => {
    setBusy(p.id);
    let r;
    if (isMe && mode === 'followers') {
      const ok = await new Promise((res) =>
        Alert.alert(`Remove ${p.name}?`, 'They won’t be told, and they’ll stop seeing you in their following list.', [
          { text: 'Cancel', style: 'cancel', onPress: () => res(false) },
          { text: 'Remove', style: 'destructive', onPress: () => res(true) },
        ])
      );
      r = ok ? await removeFollower(p.id) : { success: true };
    } else if (myFollowing.includes(p.id)) {
      r = await unfollowUser(p.id);
    } else {
      r = await followUser(p.id);
    }
    setBusy(null);
    if (r.success) haptics.success();
    else Alert.alert('Something went wrong', 'Please try again.');
  };

  const title = mode === 'followers' ? 'Followers' : 'Following';

  return (
    <Screen scroll={false} padded={false} header={<Header title={title} subtitle={isMe ? 'You' : userName} onBack={() => navigation.goBack()} />}>
      <PeopleList
        people={people}
        onOpen={(p) => (p.id === user?.uid ? navigation.navigate('Main', { screen: 'Profile' }) : navigation.push('UserProfile', { userId: p.id }))}
        emptyIcon={mode === 'followers' ? 'people-outline' : 'person-add-outline'}
        emptyTitle={mode === 'followers' ? 'No followers yet' : 'Not following anyone'}
        emptyMessage={isMe ? (mode === 'followers' ? 'Teach a course or post tips to get noticed.' : 'Follow people to see their posts and courses.') : undefined}
        renderAction={(p) => {
          if (p.id === user?.uid) return null;
          if (isMe && mode === 'followers') {
            return <Button title="Remove" size="sm" variant="outline" onPress={() => act(p)} loading={busy === p.id} />;
          }
          const f = myFollowing.includes(p.id);
          return <Button title={f ? 'Following' : 'Follow'} size="sm" variant={f ? 'outline' : 'primary'} onPress={() => act(p)} loading={busy === p.id} />;
        }}
      />
    </Screen>
  );
}

const FollowersListScreen = (props) => <FollowList {...props} mode="followers" />;
export default FollowersListScreen;
