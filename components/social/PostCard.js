import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import haptics from '../../utils/haptics';
import { safeImageUri } from '../../utils/media';
import { timeAgo } from '../../utils/time';
import { AppText, Avatar, PressableScale } from '../ui';

/**
 * Social post. Owners can delete; everyone else can report / block.
 * onComment(postId, text) must resolve to true when the comment was saved.
 */
function PostCard({ post, currentUid, onLike, onComment, onDelete, onMore, onOpenProfile, blocked = [] }) {
  const { colors, radius, fonts } = useTheme();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const heart = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heart.value }] }));

  const liked = (post.likes || []).includes(currentUid);
  const likeCount = (post.likes || []).length;
  const comments = (Array.isArray(post.comments) ? post.comments : []).filter((c) => !blocked.includes(c.userId));
  const image = safeImageUri(post.image);
  const mine = post.userId === currentUid;

  const like = () => {
    heart.value = withSequence(withSpring(1.35, { damping: 6 }), withSpring(1));
    haptics.tap();
    onLike?.(post.id);
  };

  const send = async () => {
    const text = comment.trim();
    if (!text || sending) return;
    setSending(true);
    const ok = await onComment?.(post.id, text);
    setSending(false);
    if (ok) {
      setComment('');
      haptics.success();
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <View style={styles.head}>
        <PressableScale onPress={() => onOpenProfile?.(post.userId)} style={styles.author} accessibilityLabel={`${post.userName}'s profile`}>
          <Avatar uri={post.userProfileImage} name={post.userName} size={42} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {post.userName || 'Learner'}
            </AppText>
            <AppText variant="caption" tone="faint">
              {timeAgo(post.createdAt)}
            </AppText>
          </View>
        </PressableScale>
        <PressableScale onPress={() => onMore?.(post, mine)} hitSlop={10} accessibilityLabel="Post options">
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
        </PressableScale>
      </View>

      {post.text ? (
        <AppText variant="body" style={styles.text}>
          {post.text}
        </AppText>
      ) : null}

      {image ? <Image source={{ uri: image }} style={[styles.image, { borderRadius: radius.md }]} resizeMode="cover" /> : null}

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <PressableScale onPress={like} haptic={null} style={styles.action} accessibilityLabel={liked ? 'Unlike' : 'Like'} accessibilityState={{ selected: liked }}>
          <Animated.View style={heartStyle}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.danger : colors.textMuted} />
          </Animated.View>
          <AppText variant="smallStrong" tone={liked ? 'danger' : 'muted'} style={styles.count}>
            {likeCount || 'Like'}
          </AppText>
        </PressableScale>
        <PressableScale onPress={() => setShowComments((s) => !s)} style={styles.action} accessibilityLabel="Comments">
          <Ionicons name={showComments ? 'chatbubble' : 'chatbubble-outline'} size={20} color={showComments ? colors.primary : colors.textMuted} />
          <AppText variant="smallStrong" tone={showComments ? 'primary' : 'muted'} style={styles.count}>
            {comments.length || 'Comment'}
          </AppText>
        </PressableScale>
      </View>

      {showComments ? (
        <View style={{ marginTop: 6 }}>
          {comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <PressableScale onPress={() => onOpenProfile?.(c.userId)}>
                <Avatar uri={c.userProfileImage} name={c.userName} size={30} />
              </PressableScale>
              <View style={[styles.bubble, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="smallStrong">{c.userName}</AppText>
                  <AppText variant="caption" tone="faint">
                    {timeAgo(c.createdAt)}
                  </AppText>
                </View>
                <AppText variant="small" style={{ marginTop: 2 }}>
                  {c.text}
                </AppText>
              </View>
            </View>
          ))}
          <View style={[styles.input, { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill }]}>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Write a comment…"
              placeholderTextColor={colors.textFaint}
              style={[styles.inputText, { color: colors.text, fontFamily: fonts.medium }]}
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={send}
            />
            <PressableScale onPress={send} disabled={!comment.trim() || sending} accessibilityLabel="Send comment">
              <Ionicons name="send" size={18} color={comment.trim() ? colors.primary : colors.textFaint} />
            </PressableScale>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default memo(PostCard);

const styles = StyleSheet.create({
  card: { padding: 14, borderWidth: 1 },
  head: { flexDirection: 'row', alignItems: 'center' },
  author: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  text: { marginTop: 12 },
  image: { width: '100%', aspectRatio: 4 / 3, marginTop: 12 },
  actions: { flexDirection: 'row', marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 20 },
  action: { flexDirection: 'row', alignItems: 'center' },
  count: { marginLeft: 6 },
  comment: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 8 },
  bubble: { flex: 1, padding: 10 },
  input: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 14, height: 44 },
  inputText: { flex: 1, fontSize: 14, marginRight: 8 },
});
