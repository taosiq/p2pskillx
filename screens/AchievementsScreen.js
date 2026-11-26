import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AchievementTile, LevelCard, TierMedal } from '../components/game';
import { AppText, Card, Header, ProgressBar, Screen, Segmented, Sheet } from '../components/ui';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme';
import { RARITY, TIERS, XP_RULES, xpForLevel } from '../utils/gamification';

/** Progress hub: level, tier road, XP breakdown, and every badge. */
const AchievementsScreen = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const { game } = useUser();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const list = useMemo(() => {
    if (!game) return [];
    if (filter === 'unlocked') return game.achievements.filter((a) => a.unlocked);
    if (filter === 'locked') return game.achievements.filter((a) => !a.unlocked);
    return game.achievements;
  }, [game, filter]);

  if (!game) {
    return <Screen header={<Header title="Progress" onBack={() => navigation.goBack()} />} />;
  }

  const { level } = game;

  return (
    <Screen header={<Header title="Progress" onBack={() => navigation.goBack()} />}>
      <LevelCard level={level} />

      {/* Tier road */}
      <AppText variant="h3" style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}>
        Tier road
      </AppText>
      <Card padding={16}>
        {TIERS.map((t, i) => {
          const reached = level.level >= t.minLevel;
          const current = level.tier.key === t.key;
          return (
            <View key={t.key} style={styles.tierRow}>
              <View style={styles.tierLeft}>
                <View style={{ opacity: reached ? 1 : 0.35 }}>
                  <TierMedal tier={t} size={40} />
                </View>
                {i < TIERS.length - 1 ? (
                  <View style={[styles.connector, { backgroundColor: reached && level.level >= TIERS[i + 1].minLevel ? t.colors[0] : colors.border }]} />
                ) : null}
              </View>
              <View style={{ flex: 1, marginLeft: 14, paddingBottom: i < TIERS.length - 1 ? 18 : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText variant="title" tone={reached ? 'default' : 'muted'}>
                    {t.name}
                  </AppText>
                  {current ? (
                    <View style={[styles.you, { backgroundColor: colors.primary }]}>
                      <AppText variant="caption" color="#fff" style={{ fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
                        YOU
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText variant="caption" tone="muted">
                  {t.title} · from Level {t.minLevel} ({xpForLevel(t.minLevel).toLocaleString()} XP)
                  {t.reward ? ` · +${t.reward} credits` : ''}
                </AppText>
              </View>
              {reached ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : <Ionicons name="lock-closed" size={16} color={colors.textFaint} />}
            </View>
          );
        })}
      </Card>

      {/* XP breakdown */}
      <AppText variant="h3" style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}>
        Where your XP comes from
      </AppText>
      <Card padding={16}>
        {game.xp.breakdown.map((b) => (
          <View key={b.key} style={styles.xpRow}>
            <View style={[styles.xpIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={b.icon} size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.xpHead}>
                <AppText variant="bodyStrong">{b.label}</AppText>
                <AppText variant="smallStrong" tone="xp">
                  +{b.xp.toLocaleString()} XP
                </AppText>
              </View>
              <ProgressBar value={game.xp.total ? b.xp / game.xp.total : 0} height={5} style={{ marginTop: 6 }} />
            </View>
          </View>
        ))}
        <View style={[styles.rules, { borderTopColor: colors.border }]}>
          <AppText variant="caption" tone="muted">
            Verified skill +{XP_RULES.skill.Beginner}–{XP_RULES.skill.Expert} · Course taught +{XP_RULES.courseCreated} · Course joined +
            {XP_RULES.courseEnrolled} · Follower +{XP_RULES.follower} · Active day +{XP_RULES.activeDay}
          </AppText>
        </View>
      </Card>

      {/* Badges */}
      <View style={styles.badgesHead}>
        <AppText variant="h3">Badges</AppText>
        <AppText variant="smallStrong" tone="muted">
          {game.unlockedCount}/{game.achievements.length} unlocked
        </AppText>
      </View>
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'unlocked', label: 'Unlocked', count: game.unlockedCount },
          { value: 'locked', label: 'Locked' },
        ]}
        style={{ marginBottom: spacing.lg }}
      />
      <View style={styles.grid}>
        {list.map((a) => (
          <AchievementTile key={a.id} achievement={a} onPress={setSelected} width="31%" />
        ))}
      </View>
      {!list.length ? (
        <AppText variant="body" tone="muted" align="center" style={{ marginTop: 12 }}>
          {filter === 'unlocked' ? 'No badges yet: verify a skill to earn your first.' : 'You’ve unlocked everything. Legend!'}
        </AppText>
      ) : null}

      <Sheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected ? (
          <View style={{ alignItems: 'center', paddingBottom: 8 }}>
            <LinearGradient
              colors={selected.unlocked ? selected.gradient : [colors.surfaceAlt, colors.surfaceAlt]}
              style={styles.bigIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={selected.icon} size={44} color={selected.unlocked ? '#fff' : colors.textFaint} />
            </LinearGradient>
            <AppText variant="caption" color={RARITY[selected.rarity].color} style={{ marginTop: 12, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
              {RARITY[selected.rarity].label.toUpperCase()}
            </AppText>
            <AppText variant="h2" align="center" style={{ marginTop: 4 }}>
              {selected.title}
            </AppText>
            <AppText variant="body" tone="muted" align="center" style={{ marginTop: 6 }}>
              {selected.description}
            </AppText>
            <View style={{ alignSelf: 'stretch', marginTop: 18 }}>
              <ProgressBar value={selected.progress} gradient={selected.gradient} height={10} />
              <AppText variant="smallStrong" tone={selected.unlocked ? 'success' : 'muted'} align="center" style={{ marginTop: 8 }}>
                {selected.unlocked ? 'Unlocked ✓' : `${selected.value} / ${selected.target}`}
              </AppText>
            </View>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  tierRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tierLeft: { alignItems: 'center' },
  connector: { width: 3, flex: 1, minHeight: 18, borderRadius: 2, marginVertical: 4 },
  you: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  xpRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  xpIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  xpHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rules: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10, paddingTop: 10 },
  badgesHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bigIcon: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});

export default AchievementsScreen;
