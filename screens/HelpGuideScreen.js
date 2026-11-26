import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { ContactCard, Faq } from '../components/DocPage';
import { AppText, Chip, Header, Screen, TextField } from '../components/ui';

const FAQS = [
  ['Getting started', 'What is P2PSkillX?', 'A peer-to-peer skill exchange. You prove what you know with an AI quiz, teach it as a course to earn credits, and spend credits to learn from others.'],
  ['Getting started', 'How do credits work?', 'You start with 100 credits. Joining a course costs the price set by its instructor. You earn credits when learners join your courses and when you reach a new tier.'],
  ['Skills', 'How do I verify a skill?', 'Home → Verify (or Profile → Skills). Pick a category, type the skill, choose a level and pass the 10-question quiz with 70% or more.'],
  ['Skills', 'I failed a quiz. Can I retry?', 'Yes. After a short cooldown you can try again, or pick an easier level first. The results screen shows the correct answers so you can learn from them.'],
  ['Skills', 'Why can I only teach verified skills?', 'So learners can trust every instructor. A verified badge shows you passed an independent quiz at that level.'],
  ['Courses', 'How do I create a course?', 'Learn tab → “Know something cool?”, or Profile → Teach. Choose a verified skill, add lessons (text, video links, readings, images), set a price and publish.'],
  ['Courses', 'Can I delete a course?', 'Yes, from the course page. If learners have already paid, it’s archived instead: hidden from new learners but still available to those who joined.'],
  ['Courses', 'How do I track my progress?', 'Open the course and tick each lesson as you finish it. Completing every lesson earns +40 XP and the Graduate badge.'],
  ['XP & levels', 'How do I earn XP?', 'Verified skills (+30 to +100), courses taught (+80), courses joined (+25), courses completed (+40), followers (+5) and every active day (+5).'],
  ['XP & levels', 'What are tiers and themes?', 'Levels group into tiers: Bronze, Silver, Gold, Platinum, Diamond and Legend. Higher tiers unlock credit rewards and extra colour themes in Settings.'],
  ['XP & levels', 'How do streaks work?', 'Open the app on consecutive days to grow your streak. Miss a day and it resets, but your best streak is kept.'],
  ['Safety', 'How do I report or block someone?', 'Tap ••• on a post, profile or chat and choose Report or Block. Blocked people’s posts, comments and messages are hidden from you.'],
  ['Account', 'How do I change my password?', 'Settings → Change password. We’ll email you a secure reset link.'],
  ['Account', 'How do I delete my account?', 'Settings → Delete account. Confirm with your password and your profile is permanently deleted.'],
];

const TOPICS = ['All', ...new Set(FAQS.map((f) => f[0]))];

const HelpGuideScreen = ({ navigation }) => {
  const [topic, setTopic] = useState('All');
  const [search, setSearch] = useState('');

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAQS.filter(([t, question, a]) => (topic === 'All' || t === topic) && (!q || `${question} ${a}`.toLowerCase().includes(q)));
  }, [topic, search]);

  return (
    <Screen header={<Header title="Help & FAQs" onBack={() => navigation.goBack()} />}>
      <TextField icon="search" placeholder="Search help" value={search} onChangeText={setSearch} autoCorrect={false} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {TOPICS.map((t) => (
          <Chip key={t} label={t} size="sm" selected={topic === t} onPress={() => setTopic(t)} />
        ))}
      </View>
      <View style={{ gap: 10 }}>
        {shown.map(([t, q, a]) => (
          <Faq key={q} q={q} a={a} />
        ))}
      </View>
      {!shown.length ? (
        <AppText variant="body" tone="muted" align="center" style={{ marginTop: 16 }}>
          No answers match “{search}”.
        </AppText>
      ) : null}
      <AppText variant="smallStrong" tone="primary" align="center" style={{ marginTop: 18 }} onPress={() => navigation.navigate('UserManual')}>
        Read the full user manual →
      </AppText>
      <ContactCard />
    </Screen>
  );
};

export default HelpGuideScreen;
