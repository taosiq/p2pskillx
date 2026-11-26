import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { blockUser, reportContent } from '../../services/postService';
import { useTheme } from '../../theme';
import haptics from '../../utils/haptics';
import { AppText, Button, PressableScale, Sheet } from '../ui';

const REASONS = [
  { value: 'spam', label: 'Spam or scam', icon: 'mail-unread-outline' },
  { value: 'harassment', label: 'Harassment or hate', icon: 'hand-left-outline' },
  { value: 'inappropriate', label: 'Inappropriate content', icon: 'eye-off-outline' },
  { value: 'misinformation', label: 'False information', icon: 'alert-circle-outline' },
  { value: 'other', label: 'Something else', icon: 'ellipsis-horizontal-circle-outline' },
];

export function ActionRow({ icon, label, onPress, danger }) {
  const { colors, radius } = useTheme();
  const c = danger ? colors.danger : colors.text;
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={label}>
      <View style={[styles.row, { backgroundColor: danger ? colors.dangerSoft : colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
        <Ionicons name={icon} size={20} color={c} />
        <AppText variant="bodyStrong" color={c} style={{ marginLeft: 12 }}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

/**
 * Options for a piece of content: delete (own) or report / block (others).
 * target: { type, id, userId, userName } or null to hide.
 */
export function ContentOptionsSheet({ target, onClose, onDelete, onBlocked, extra }) {
  const [step, setStep] = useState('menu');
  const [sending, setSending] = useState(false);
  const { colors, radius } = useTheme();

  const close = () => {
    setStep('menu');
    onClose();
  };

  const report = async (reason) => {
    setSending(true);
    const r = await reportContent({ type: target.type, targetId: target.id, targetUserId: target.userId, reason });
    setSending(false);
    close();
    if (r.success) {
      haptics.success();
      Alert.alert('Thanks for reporting', 'Our team will review this. You can also block this person so you no longer see their content.');
    } else {
      Alert.alert('Couldn’t send report', 'Please try again.');
    }
  };

  const block = () =>
    Alert.alert(`Block ${target.userName || 'this user'}?`, 'You won’t see their posts, comments or messages. They won’t be told.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          const r = await blockUser(target.userId);
          close();
          if (r.success) {
            haptics.success();
            onBlocked?.(target.userId);
          }
        },
      },
    ]);

  return (
    <Sheet visible={!!target} onClose={close} title={step === 'report' ? 'Why are you reporting this?' : undefined}>
      {target && step === 'menu' ? (
        <View style={{ gap: 10 }}>
          {extra}
          {target.mine ? (
            <ActionRow
              icon="trash-outline"
              label={`Delete ${target.type}`}
              danger
              onPress={() => {
                close();
                onDelete?.(target);
              }}
            />
          ) : (
            <>
              <ActionRow icon="flag-outline" label={`Report ${target.type}`} onPress={() => setStep('report')} />
              {target.userId ? <ActionRow icon="ban-outline" label={`Block ${target.userName || 'user'}`} danger onPress={block} /> : null}
            </>
          )}
        </View>
      ) : null}
      {target && step === 'report' ? (
        <View style={{ gap: 8 }}>
          {REASONS.map((r) => (
            <PressableScale key={r.value} onPress={() => report(r.value)} disabled={sending} scaleTo={0.98}>
              <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
                <Ionicons name={r.icon} size={20} color={colors.textMuted} />
                <AppText variant="bodyStrong" style={{ marginLeft: 12 }}>
                  {r.label}
                </AppText>
              </View>
            </PressableScale>
          ))}
          <Button title="Back" variant="ghost" onPress={() => setStep('menu')} full />
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1 },
});
