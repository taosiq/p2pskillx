import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { AppText, Avatar, EmptyState, PressableScale, Skeleton } from '../ui';
import { TierBadge } from '../game';

/**
 * Searchable list of people. people: [{ id, name, photo, info (levelInfo), subtitle }]
 * renderAction(person) renders the right-hand button.
 */
export default function PeopleList({ people, onOpen, renderAction, emptyTitle, emptyMessage, emptyIcon = 'people-outline', header, searchPlaceholder = 'Search people' }) {
  const { colors, radius, fonts } = useTheme();
  const [search, setSearch] = useState('');

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!people) return null;
    return q ? people.filter((p) => `${p.name} ${p.subtitle || ''}`.toLowerCase().includes(q)) : people;
  }, [people, search]);

  return (
    <FlatList
      data={shown || []}
      keyExtractor={(p) => p.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ padding: 20, paddingTop: 12, gap: 8 }}
      ListHeaderComponent={
        <>
          {header}
          <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <Ionicons name="search" size={18} color={colors.textFaint} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textFaint}
              autoCorrect={false}
              style={{ flex: 1, marginLeft: 8, color: colors.text, fontFamily: fonts.medium, fontSize: 15 }}
            />
          </View>
        </>
      }
      renderItem={({ item: p, index }) => (
        <Animated.View entering={index < 12 ? FadeInDown.delay(index * 30) : undefined}>
          <PressableScale onPress={() => onOpen(p)} scaleTo={0.98} accessibilityLabel={p.name}>
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
              <Avatar uri={p.photo} name={p.name} size={50} ring={p.info?.tier.colors} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <AppText variant="title" numberOfLines={1}>
                  {p.name}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 }}>
                  {p.info ? <TierBadge tier={p.info.tier} compact /> : null}
                  {p.subtitle ? (
                    <AppText variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
                      {p.subtitle}
                    </AppText>
                  ) : null}
                </View>
              </View>
              {renderAction ? renderAction(p) : null}
            </View>
          </PressableScale>
        </Animated.View>
      )}
      ListEmptyComponent={
        shown === null ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={74} radius={18} />
            ))}
          </View>
        ) : (
          <EmptyState icon={search ? 'search-outline' : emptyIcon} title={search ? 'No matches' : emptyTitle} message={search ? undefined : emptyMessage} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 12, borderWidth: 1, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1 },
});
