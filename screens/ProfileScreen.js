import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CourseCard from '../components/CourseCard';
import { AchievementTile, TierBadge } from '../components/game';
import Composer, { ComposerPrompt } from '../components/social/Composer';
import PostCard from '../components/social/PostCard';
import { ActionRow, ContentOptionsSheet } from '../components/social/SafetySheets';
import { TAB_BAR_SPACE } from '../components/TabBar';
import {
  AppText,
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  IconButton,
  Pill,
  PressableScale,
  ProgressBar,
  Screen,
  Segmented,
  Sheet,
  Skeleton,
} from '../components/ui';
import { db } from '../config/firebase';
import { useUser } from '../context/UserContext';
import usePosts from '../hooks/usePosts';
import { getUserEnrolledCourses } from '../services/courseService';
import { followUser, removeProfilePhoto, setProfilePhoto, unfollowUser } from '../services/userService';
import { useTheme } from '../theme';
import { createOrGetConversation } from '../utils/chatService';
import { gamificationFor } from '../utils/gamification';
import haptics from '../utils/haptics';
import { pickImage } from '../utils/media';

const LEVEL_COLORS = { Beginner: '#10B981', Intermediate: '#3B82F6', Advanced: '#8B6CFF', Expert: '#FF7A45' };

const ProfileScreen = ({ navigation, route }) => {
  const { colors, gradients, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile: myProfile, game: myGame, displayName: myName } = useUser();

  const viewedId = route.params?.userId && route.params.userId !== user?.uid ? route.params.userId : null;
  const isMe = !viewedId;
  const isStackScreen = route.name === 'UserProfile';

  const [other, setOther] = useState(undefined); // other user's profile (live)
  const [tab, setTab] = useState(route.params?.initialTab || 'posts');
  const [courses, setCourses] = useState(null);
  const [enrolled, setEnrolled] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [options, setOptions] = useState(null);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);

  useEffect(() => {
    if (route.params?.initialTab) setTab(route.params.initialTab);
  }, [route.params?.initialTab]);

  // Other people's profiles stay live too (follower counts, new skills...).
  useEffect(() => {
    if (!viewedId) return undefined;
    setOther(undefined);
    return onSnapshot(
      doc(db, 'users', viewedId),
      (snap) => setOther(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setOther(null)
    );
  }, [viewedId]);

  const profile = isMe ? myProfile : other;
  const uid = isMe ? user?.uid : viewedId;
  const game = useMemo(() => (isMe ? myGame : profile ? gamificationFor(profile) : null), [isMe, myGame, profile]);
  const name = isMe ? myName : profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Learner' : '';
  const blockedByMe = !isMe && (myProfile?.blocked || []).includes(viewedId);

  const { posts, load: loadPosts, like, comment, remove, prepend, blocked } = usePosts({ userId: uid });

  const loadCourses = useCallback(async () => {
    if (!uid) return;
    try {
      const snap = await getDocs(query(collection(db, 'courses'), where('creatorId', '==', uid)));
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setCourses([]);
    }
  }, [uid]);

  const loadEnrolled = useCallback(async () => {
    const r = await getUserEnrolledCourses();
    setEnrolled(r.success ? r.courses : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      loadPosts();
      loadCourses();
      if (isMe) loadEnrolled();
    }, [uid, isMe])
  );

  const followers = profile?.followers?.length ?? profile?.followersCount ?? 0;
  const following = profile?.following?.length ?? profile?.followingCount ?? 0;
  const students = (courses || []).reduce((s, c) => s + (c.enrollments || 0), 0);
  const isFollowing = !isMe && (myProfile?.following || []).includes(viewedId);
  const skills = Object.entries(profile?.verifiedSkills || {});

  const toggleFollow = async () => {
    setFollowBusy(true);
    const r = isFollowing ? await unfollowUser(viewedId) : await followUser(viewedId);
    setFollowBusy(false);
    if (r.success) haptics.success();
    else Alert.alert('Something went wrong', 'Please try again.');
  };

  const message = async () => {
    setMessageBusy(true);
    try {
      const conversationId = await createOrGetConversation(viewedId);
      navigation.navigate('ChatDetail', { conversationId, otherUserId: viewedId, otherUserName: name });
    } catch {
      Alert.alert('Couldn’t open chat', 'Please try again.');
    } finally {
      setMessageBusy(false);
    }
  };

  const changePhoto = async () => {
    setPhotoSheet(false);
    const picked = await pickImage({ square: true, quality: 0.35 });
    if (!picked?.dataUri) return;
    setPhotoBusy(true);
    const r = await setProfilePhoto(picked.dataUri);
    setPhotoBusy(false);
    if (r.success) haptics.success();
    else Alert.alert(r.error === 'too_large' ? 'Photo too large' : 'Couldn’t update photo', r.error === 'too_large' ? 'Try cropping closer or choosing a different photo.' : 'Please try again.');
  };

  const deletePhoto = async () => {
    setPhotoSheet(false);
    await removeProfilePhoto();
  };

  if (!isMe && other === null) {
    return (
      <Screen>
        <View style={{ paddingTop: 12 }}>
          <IconButton icon="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        </View>
        <EmptyState icon="person-remove-outline" title="Profile not found" message="This account may have been deleted." />
      </Screen>
    );
  }

  const tabs = [
    { value: 'posts', label: 'Posts' },
    { value: 'courses', label: 'Teaching' },
    { value: 'skills', label: 'Skills' },
    ...(isMe ? [{ value: 'enrolled', label: 'Learning' }] : []),
    { value: 'badges', label: 'Badges' },
  ];

  const openCourse = (c, mineOrEnrolled) =>
    navigation.navigate(mineOrEnrolled ? 'CourseAccess' : 'CourseDetails', { courseId: c.id });

  const renderTab = () => {
    if (blockedByMe) {
      return <EmptyState icon="ban-outline" title="You blocked this person" message="Unblock them from the menu (•••) to see their content." />;
    }
    switch (tab) {
      case 'posts':
        return (
          <View style={{ gap: 12 }}>
            {isMe ? <ComposerPrompt author={{ name, photo: profile?.profileImage }} onPress={() => setComposerOpen(true)} /> : null}
            {posts === null ? (
              <Skeleton height={160} radius={18} />
            ) : posts.length ? (
              posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  currentUid={user?.uid}
                  blocked={blocked}
                  onLike={like}
                  onComment={comment}
                  onOpenProfile={(id) => id !== uid && navigation.push('UserProfile', { userId: id })}
                  onMore={(post, mine) => setOptions({ type: 'post', id: post.id, userId: post.userId, userName: post.userName, mine })}
                />
              ))
            ) : (
              <EmptyState icon="chatbubble-ellipses-outline" title="No posts yet" message={isMe ? 'Share a tip, a win or a question.' : `${name.split(' ')[0]} hasn’t posted yet.`} />
            )}
          </View>
        );
      case 'courses':
        return courses === null ? (
          <Skeleton height={100} radius={18} />
        ) : courses.length ? (
          <View style={{ gap: 10 }}>
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} layout="row" onPress={() => openCourse(c, isMe)} />
            ))}
            {isMe ? <Button title="Create a course" icon="add" variant="secondary" onPress={() => navigation.navigate('CourseTypeSelection')} full /> : null}
          </View>
        ) : (
          <EmptyState
            icon="easel-outline"
            title={isMe ? 'Share what you know' : 'No courses yet'}
            message={isMe ? 'Teach a course to earn credits and +80 XP.' : undefined}
            actionLabel={isMe ? 'Create a course' : undefined}
            onAction={() => navigation.navigate('CourseTypeSelection')}
          />
        );
      case 'skills':
        return skills.length ? (
          <View style={{ gap: 10 }}>
            {skills.map(([skill, data]) => {
              const c = LEVEL_COLORS[data.level] || colors.primary;
              return (
                <Card key={skill} padding={14} style={styles.skillRow}>
                  <View style={[styles.skillIcon, { backgroundColor: c + '22' }]}>
                    <Ionicons name="ribbon" size={20} color={c} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <AppText variant="title">{skill}</AppText>
                    <AppText variant="caption" tone="muted">
                      {data.category || 'General'}
                      {data.verifiedAt ? ` · verified ${new Date(data.verifiedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` : ''}
                    </AppText>
                  </View>
                  <Pill label={data.level || 'Verified'} color={c} icon="checkmark-circle" />
                </Card>
              );
            })}
            {isMe ? <Button title="Verify another skill" icon="add" variant="secondary" onPress={() => navigation.navigate('SkillCategory')} full /> : null}
          </View>
        ) : (
          <EmptyState
            icon="ribbon-outline"
            title="No verified skills"
            message={isMe ? 'Pass an AI quiz to prove a skill and earn up to +100 XP.' : undefined}
            actionLabel={isMe ? 'Verify a skill' : undefined}
            onAction={() => navigation.navigate('SkillCategory')}
          />
        );
      case 'enrolled':
        return enrolled === null ? (
          <Skeleton height={100} radius={18} />
        ) : enrolled.length ? (
          <View style={{ gap: 10 }}>
            {enrolled.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                layout="row"
                onPress={() => openCourse(c, true)}
                badge={
                  <View style={{ width: 54, alignItems: 'flex-end' }}>
                    <AppText variant="smallStrong" tone="primary">
                      {Math.round(c.progress || 0)}%
                    </AppText>
                    <ProgressBar value={(c.progress || 0) / 100} height={4} style={{ width: 50, marginTop: 4 }} />
                  </View>
                }
              />
            ))}
          </View>
        ) : (
          <EmptyState icon="school-outline" title="Not learning anything yet" message="Join a course with your credits." actionLabel="Explore courses" onAction={() => navigation.navigate('LearnSkill')} />
        );
      case 'badges':
        return game ? (
          <View style={styles.badges}>
            {game.achievements.map((a) => (
              <AchievementTile key={a.id} achievement={a} width="31%" onPress={() => isMe && navigation.navigate('Achievements')} />
            ))}
          </View>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Screen padded={false} edges={[]} ambient={false} statusBarStyle="light" contentStyle={{ paddingBottom: isStackScreen ? 40 : TAB_BAR_SPACE }}>
      {/* Cover */}
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cover, { paddingTop: insets.top + 8 }]}>
        <View style={styles.coverShine} />
        <View style={styles.coverBar}>
          {isStackScreen || !isMe ? (
            <IconButton icon="chevron-back" variant="glass" color="#fff" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
          ) : (
            <View />
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {isMe ? (
              <>
                <IconButton icon="trophy-outline" variant="glass" color="#fff" onPress={() => navigation.navigate('Achievements')} accessibilityLabel="Progress" />
                <IconButton icon="settings-outline" variant="glass" color="#fff" onPress={() => navigation.navigate('Settings')} accessibilityLabel="Settings" />
              </>
            ) : (
              <IconButton
                icon="ellipsis-horizontal"
                variant="glass"
                color="#fff"
                onPress={() => setOptions({ type: 'user', id: viewedId, userId: viewedId, userName: name, mine: false, profile: true })}
                accessibilityLabel="More options"
              />
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: spacing.xl }}>
        {/* Identity */}
        <View style={styles.identity}>
          <PressableScale onPress={() => isMe && setPhotoSheet(true)} disabled={!isMe} accessibilityLabel={isMe ? 'Change profile photo' : name}>
            <View style={[styles.avatarWrap, { backgroundColor: colors.bg }]}>
              {profile ? <Avatar uri={profile.profileImage} name={name} size={104} ring={game?.level.tier.colors} /> : <Skeleton width={104} height={104} radius={52} />}
              {isMe ? (
                <View style={[styles.camera, { backgroundColor: colors.primary, borderColor: colors.bg }]}>
                  {photoBusy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={15} color="#fff" />}
                </View>
              ) : null}
            </View>
          </PressableScale>
          {game ? (
            <View style={[styles.levelChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppText variant="overline" tone="muted" style={{ fontSize: 9 }}>
                LEVEL
              </AppText>
              <AppText variant="stat" tone="primary" style={{ fontSize: 22, lineHeight: 26 }}>
                {game.level.level}
              </AppText>
            </View>
          ) : null}
        </View>

        {profile ? (
          <Animated.View entering={FadeIn}>
            <AppText variant="h1" numberOfLines={2}>
              {name}
            </AppText>
            <View style={styles.metaRow}>
              {game ? <TierBadge tier={game.level.tier} /> : null}
              {profile.occupation ? <Pill label={profile.occupation.replace(/^\w/, (c) => c.toUpperCase())} icon="briefcase-outline" color={colors.info} /> : null}
              {game?.streak ? <Pill label={`${game.streak}-day streak`} icon="flame" color={colors.warning} /> : null}
            </View>
            <AppText variant="body" tone={profile.bio ? 'default' : 'faint'} style={{ marginTop: 12 }}>
              {profile.bio || (isMe ? 'Add a short bio so people know what you teach and want to learn.' : 'No bio yet.')}
            </AppText>
          </Animated.View>
        ) : (
          <View style={{ gap: 8 }}>
            <Skeleton width="60%" height={28} />
            <Skeleton width="40%" height={18} />
          </View>
        )}

        {/* Stats */}
        <Card padding={0} style={styles.stats}>
          {[
            { label: 'Followers', value: followers, onPress: () => navigation.navigate('FollowersList', { userId: uid, userName: name, isCurrentUser: isMe }) },
            { label: 'Following', value: following, onPress: () => navigation.navigate('FollowingList', { userId: uid, userName: name, isCurrentUser: isMe }) },
            { label: 'Students', value: students },
            { label: 'XP', value: game ? game.xp.total.toLocaleString() : '–', onPress: isMe ? () => navigation.navigate('Achievements') : undefined },
          ].map((s, i) => (
            <PressableScale key={s.label} onPress={s.onPress} disabled={!s.onPress} style={[styles.stat, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }]} accessibilityLabel={`${s.value} ${s.label}`}>
              <AppText variant="stat" style={{ fontSize: 20 }}>
                {s.value}
              </AppText>
              <AppText variant="caption" tone="muted">
                {s.label}
              </AppText>
            </PressableScale>
          ))}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {isMe ? (
            <>
              <Button title="Edit profile" icon="create-outline" variant="secondary" onPress={() => navigation.navigate('EditProfile')} style={{ flex: 1 }} />
              <Button title="Teach" icon="easel-outline" onPress={() => navigation.navigate('CourseTypeSelection')} style={{ flex: 1 }} />
            </>
          ) : blockedByMe ? null : (
            <>
              <Button
                title={isFollowing ? 'Following' : 'Follow'}
                icon={isFollowing ? 'checkmark' : 'person-add'}
                variant={isFollowing ? 'outline' : 'primary'}
                loading={followBusy}
                onPress={toggleFollow}
                style={{ flex: 1 }}
              />
              <Button title="Message" icon="chatbubble-ellipses-outline" variant="secondary" loading={messageBusy} onPress={message} style={{ flex: 1 }} />
            </>
          )}
        </View>

        {/* Skill chips */}
        {skills.length ? (
          <View style={styles.chips}>
            {skills.slice(0, 6).map(([s, d]) => (
              <Chip key={s} label={s} icon="checkmark-circle" size="sm" color={LEVEL_COLORS[d.level] || colors.primary} />
            ))}
          </View>
        ) : null}

        <Segmented value={tab} onChange={setTab} options={tabs} style={{ marginTop: spacing.xl, marginBottom: spacing.lg }} />
        <Animated.View key={tab} entering={FadeInDown.duration(250)}>
          {renderTab()}
        </Animated.View>
      </View>

      <Composer visible={composerOpen} onClose={() => setComposerOpen(false)} onPosted={prepend} author={{ name, photo: profile?.profileImage }} />

      <ContentOptionsSheet
        target={options}
        onClose={() => setOptions(null)}
        onDelete={(t) => remove(t.id)}
        onBlocked={() => {
          if (options?.profile) navigation.goBack();
          else loadPosts();
        }}
        extra={
          options?.profile && blockedByMe ? (
            <ActionRow
              icon="lock-open-outline"
              label="Unblock"
              onPress={async () => {
                const { unblockUser } = await import('../services/postService');
                await unblockUser(viewedId);
                setOptions(null);
              }}
            />
          ) : null
        }
      />

      <Sheet visible={photoSheet} onClose={() => setPhotoSheet(false)} title="Profile photo">
        <View style={{ gap: 10 }}>
          <ActionRow icon="image-outline" label="Choose from library" onPress={changePhoto} />
          {profile?.profileImage ? <ActionRow icon="trash-outline" label="Remove photo" danger onPress={deletePhoto} /> : null}
        </View>
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  cover: { height: 190, overflow: 'hidden' },
  coverShine: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.07)', top: -120, right: -80 },
  coverBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  identity: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -56, marginBottom: 12 },
  avatarWrap: { padding: 4, borderRadius: 60 },
  camera: { position: 'absolute', right: 6, bottom: 6, width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  levelChip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  stats: { flexDirection: 'row', marginTop: 18 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  skillRow: { flexDirection: 'row', alignItems: 'center' },
  skillIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});

export default ProfileScreen;
