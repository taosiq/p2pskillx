import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useUser } from '../context/UserContext';
import { addComment, deletePost, getAllPosts, getUserPosts, toggleLikePost } from '../services/postService';

/**
 * Loads posts (whole community or one user's) and provides optimistic
 * like / comment / delete handlers. Posts by blocked users are hidden.
 */
export default function usePosts({ userId } = {}) {
  const { user, profile } = useUser();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(false);
  const blocked = profile?.blocked || [];

  const load = useCallback(async () => {
    setError(false);
    const r = userId ? await getUserPosts(userId) : await getAllPosts();
    if (r.success) setPosts(r.posts);
    else {
      setError(true);
      setPosts((p) => p || []);
    }
  }, [userId]);

  const visible = useMemo(() => (posts || []).filter((p) => !blocked.includes(p.userId)), [posts, blocked]);

  const like = useCallback(
    async (postId) => {
      const uid = user?.uid;
      if (!uid) return;
      const flip = (list) =>
        list.map((p) => {
          if (p.id !== postId) return p;
          const likes = p.likes || [];
          return { ...p, likes: likes.includes(uid) ? likes.filter((x) => x !== uid) : [...likes, uid] };
        });
      setPosts((list) => flip(list || []));
      const r = await toggleLikePost(postId);
      if (!r.success) setPosts((list) => flip(list || [])); // roll back
    },
    [user?.uid]
  );

  const comment = useCallback(async (postId, text) => {
    const r = await addComment(postId, text);
    if (!r.success) {
      Alert.alert('Couldn’t comment', 'Please try again.');
      return false;
    }
    setPosts((list) =>
      (list || []).map((p) => (p.id === postId ? { ...p, comments: [...(Array.isArray(p.comments) ? p.comments : []), r.comment] } : p))
    );
    return true;
  }, []);

  const remove = useCallback(
    (postId) =>
      new Promise((resolve) =>
        Alert.alert('Delete post?', 'This can’t be undone.', [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const r = await deletePost(postId);
              if (r.success) setPosts((list) => (list || []).filter((p) => p.id !== postId));
              else Alert.alert('Couldn’t delete', 'Please try again.');
              resolve(r.success);
            },
          },
        ])
      ),
    []
  );

  const prepend = useCallback((post) => setPosts((list) => [post, ...(list || [])]), []);

  return { posts: posts === null ? null : visible, error, load, like, comment, remove, prepend, blocked };
}
