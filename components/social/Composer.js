import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, TextInput, View } from 'react-native';
import { createPost } from '../../services/postService';
import { useTheme } from '../../theme';
import haptics from '../../utils/haptics';
import { pickImage } from '../../utils/media';
import { AppText, Avatar, Button, IconButton, Sheet } from '../ui';

const MAX = 1000;
const PROMPTS = ['Share a tip you learned today…', 'What skill are you practising?', 'Ask the community a question…', 'Celebrate a win! 🎉'];

/** Bottom-sheet post composer. onPosted(post) receives the created post. */
export default function Composer({ visible, onClose, onPosted, author }) {
  const { colors, radius, fonts } = useTheme();
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [posting, setPosting] = useState(false);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  const reset = () => {
    setText('');
    setImage(null);
  };

  const addImage = async () => {
    const picked = await pickImage({ aspect: [4, 3], quality: 0.5 });
    if (picked?.dataUri) setImage(picked.dataUri);
  };

  const submit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    const r = await createPost({ text: text.trim(), image });
    setPosting(false);
    if (r.success) {
      haptics.success();
      onPosted?.(r.post);
      reset();
      onClose();
    } else {
      Alert.alert('Couldn’t publish', 'Please check your connection and try again.');
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Create post">
      <View style={styles.row}>
        <Avatar uri={author?.photo} name={author?.name} size={42} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <AppText variant="bodyStrong">{author?.name}</AppText>
          <AppText variant="caption" tone="muted">
            Posting to the community
          </AppText>
        </View>
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={prompt}
        placeholderTextColor={colors.textFaint}
        multiline
        maxLength={MAX}
        autoFocus
        style={[styles.input, { color: colors.text, fontFamily: fonts.medium, backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}
      />
      {image ? (
        <View style={{ marginTop: 10 }}>
          <Image source={{ uri: image }} style={[styles.preview, { borderRadius: radius.md }]} />
          <IconButton icon="close" size={32} iconSize={16} variant="glass" color="#fff" onPress={() => setImage(null)} style={styles.remove} accessibilityLabel="Remove image" />
        </View>
      ) : null}
      <View style={styles.footer}>
        <IconButton icon="image-outline" variant="primary" onPress={addImage} accessibilityLabel="Add a photo" />
        <AppText variant="caption" tone={text.length > MAX - 50 ? 'warning' : 'faint'} style={{ flex: 1, marginLeft: 12 }}>
          {text.length}/{MAX}
        </AppText>
        <Button title="Post" icon="paper-plane" onPress={submit} loading={posting} disabled={!text.trim()} size="sm" />
      </View>
    </Sheet>
  );
}

export function ComposerPrompt({ onPress, author }) {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <Avatar uri={author?.photo} name={author?.name} size={38} />
      <AppText variant="body" tone="faint" style={{ flex: 1, marginLeft: 12 }} onPress={onPress}>
        Share something with the community…
      </AppText>
      <Ionicons name="image-outline" size={22} color={colors.primary} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { minHeight: 110, maxHeight: 180, padding: 14, fontSize: 16, textAlignVertical: 'top' },
  preview: { width: '100%', aspectRatio: 4 / 3 },
  remove: { position: 'absolute', top: 8, right: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  prompt: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1 },
});
