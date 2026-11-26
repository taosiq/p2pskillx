import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import PeopleList from '../components/social/PeopleList';
import { Chip, Header, IconButton, Screen } from '../components/ui';
import { useUser } from '../context/UserContext';
import { fetchDirectory } from '../hooks/usePeople';
import { followUser } from '../services/userService';
import { useTheme } from '../theme';
import { createOrGetConversation } from '../utils/chatService';
import haptics from '../utils/haptics';

/** Find people: browse learners, follow them or start a chat. */
const UsersListScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, profile } = useUser();
  const [people, setPeople] = useState(null);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    fetchDirectory()
      .then((list) => setPeople(list.filter((p) => p.id !== user?.uid && !(profile?.blocked || []).includes(p.id))))
      .catch(() => setPeople([]));
  }, []);

  const following = profile?.following || [];
  const mySkills = Object.keys(profile?.verifiedSkills || {}).map((s) => s.toLowerCase());
  const shown =
    people &&
    people.filter((p) => {
      if (filter === 'teachers') return p.skills.length > 0;
      if (filter === 'similar') return p.skills.some((s) => mySkills.includes(s.toLowerCase()));
      if (filter === 'new') return !following.includes(p.id);
      return true;
    });

  const message = async (p) => {
    setBusy(p.id);
    try {
      const conversationId = await createOrGetConversation(p.id);
      navigation.navigate('ChatDetail', { conversationId, otherUserId: p.id, otherUserName: p.name });
    } catch {
      Alert.alert('Couldn’t open chat', 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const follow = async (p) => {
    haptics.success();
    const r = await followUser(p.id);
    if (!r.success) Alert.alert('Couldn’t follow', 'Please try again.');
  };

  return (
    <Screen scroll={false} padded={false} header={<Header title="Find people" onBack={() => navigation.goBack()} />}>
      <PeopleList
        people={shown}
        onOpen={(p) => navigation.navigate('UserProfile', { userId: p.id })}
        searchPlaceholder="Search by name or skill"
        emptyTitle="No learners here yet"
        emptyMessage="Invite friends to swap skills with you."
        header={
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {[
              ['all', 'Everyone', 'people'],
              ['teachers', 'Can teach', 'easel'],
              ['similar', 'Similar skills', 'git-compare'],
              ['new', 'Not followed', 'person-add'],
            ].map(([v, l, i]) => (
              <Chip key={v} label={l} icon={i} size="sm" selected={filter === v} onPress={() => setFilter(v)} />
            ))}
          </View>
        }
        renderAction={(p) => (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {!following.includes(p.id) ? <IconButton icon="person-add" variant="primary" size={38} iconSize={18} onPress={() => follow(p)} accessibilityLabel={`Follow ${p.name}`} /> : null}
            <IconButton icon="chatbubble-ellipses-outline" size={38} iconSize={18} onPress={() => message(p)} disabled={busy === p.id} color={colors.primary} accessibilityLabel={`Message ${p.name}`} />
          </View>
        )}
      />
    </Screen>
  );
};

export default UsersListScreen;
