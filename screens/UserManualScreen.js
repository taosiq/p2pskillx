import React from 'react';
import { Bullet, ContactCard, DocSection, P } from '../components/DocPage';
import { LogoMark } from '../components/Logo';
import { AppText, Card, Header, Screen } from '../components/ui';
import { TIERS, XP_RULES } from '../utils/gamification';

const UserManualScreen = ({ navigation }) => (
  <Screen header={<Header title="User manual" onBack={() => navigation.goBack()} />}>
    <Card padding={18} style={{ alignItems: 'center', marginBottom: 14 }}>
      <LogoMark size={64} />
      <AppText variant="h2" align="center" style={{ marginTop: 12 }}>
        Teach. Learn. Level up.
      </AppText>
      <AppText variant="body" tone="muted" align="center" style={{ marginTop: 6 }}>
        Everything you need to get the most out of P2PSkillX.
      </AppText>
    </Card>

    <DocSection icon="home" title="1. Your Home">
      <P>Home shows your level, XP, streak, daily quests, skills, badges and course picks. Pull down to refresh.</P>
      <Bullet>Tap the level card to see tiers and where your XP comes from.</Bullet>
      <Bullet>Quick actions: Learn, Teach, Verify and Ranks (leaderboard).</Bullet>
      <Bullet>The bell shows notifications; the ⚡ pill shows your credits.</Bullet>
    </DocSection>

    <DocSection icon="ribbon" title="2. Verify a skill" color="#2EE59D">
      <P>Choose a category, type the skill, pick a level and take a 10-question AI quiz. Score 70% to pass.</P>
      <Bullet>
        Beginner +{XP_RULES.skill.Beginner} · Intermediate +{XP_RULES.skill.Intermediate} · Advanced +{XP_RULES.skill.Advanced} · Expert +{XP_RULES.skill.Expert} XP
      </Bullet>
      <Bullet>Passing a higher level later upgrades your badge.</Bullet>
    </DocSection>

    <DocSection icon="compass" title="3. Learn" color="#12C2FF">
      <P>Browse or search courses by topic, popularity, newest or price. Open a course to see its lessons, instructor and reviews, then enrol with credits.</P>
      <Bullet>Tick lessons as you finish them; completing a course earns +{XP_RULES.courseCompleted} XP.</Bullet>
      <Bullet>Rate a course when you finish it to help other learners.</Bullet>
    </DocSection>

    <DocSection icon="easel" title="4. Teach" color="#FF7A45">
      <P>Turn any verified skill into a course in three steps: basics, lessons, price. Each lesson can include notes, a video link, a reading link and up to three images.</P>
      <Bullet>Publishing earns +{XP_RULES.courseCreated} XP, and learners pay you credits.</Bullet>
    </DocSection>

    <DocSection icon="people" title="5. Community & chat" color="#FF4FD8">
      <P>Share tips, wins and questions in Community. Follow people to see their posts in “Following”, and message instructors or learners in Chats.</P>
      <Bullet>Report or block anyone from the ••• menu.</Bullet>
    </DocSection>

    <DocSection icon="trophy" title="6. Levels, tiers & rewards" color="#FFC83D">
      {TIERS.map((t) => (
        <Bullet key={t.key}>
          {t.name} ({t.title}): from Level {t.minLevel}
          {t.reward ? `, +${t.reward} credits` : ''}
        </Bullet>
      ))}
      <P>Higher levels also unlock colour themes in Settings → Appearance.</P>
    </DocSection>

    <DocSection icon="settings" title="7. Settings" color="#8B6CFF">
      <Bullet>Edit your profile, photo and learning interests.</Bullet>
      <Bullet>Appearance: Auto, Light or Dark, plus colour themes.</Bullet>
      <Bullet>Change your password or permanently delete your account.</Bullet>
    </DocSection>

    <ContactCard />
  </Screen>
);

export default UserManualScreen;
