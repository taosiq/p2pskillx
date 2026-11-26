import React from 'react';
import { Bullet, ContactCard, DocSection, P } from '../components/DocPage';
import { AppText, Header, Screen } from '../components/ui';
import { MIN_AGE, PRIVACY_LAST_UPDATED, SUPPORT_EMAIL } from '../constants/app';

// Keep this in step with what the app actually stores (see services/ and firestore.rules).
const PrivacyPolicyScreen = ({ navigation }) => (
  <Screen header={<Header title="Privacy policy" onBack={() => navigation.goBack()} />}>
    <AppText variant="caption" tone="faint" style={{ marginBottom: 12 }}>
      Last updated {PRIVACY_LAST_UPDATED}
    </AppText>

    <DocSection icon="document-text" title="What we collect">
      <Bullet>Account: email address and password (the password is handled by Firebase Authentication and never stored by us).</Bullet>
      <Bullet>Profile: name, date of birth, gender, occupation, bio, learning interests and an optional profile photo.</Bullet>
      <Bullet>Activity: verified skills and quiz scores, courses you create or join, lesson progress, reviews, posts, comments, likes, follows, credits, XP and streaks.</Bullet>
      <Bullet>Messages you send in chats.</Bullet>
      <Bullet>Reports you submit about content or people.</Bullet>
      <P>We don’t collect your location, contacts or advertising identifiers, and we don’t track you across other apps.</P>
    </DocSection>

    <DocSection icon="eye" title="Who can see what" color="#12C2FF">
      <Bullet>Other signed-in users can see your name, photo, bio, occupation, verified skills, level, posts, followers and the courses you teach.</Bullet>
      <Bullet>Only you can see your credits, enrolments, lesson progress and notifications.</Bullet>
      <Bullet>Chats are visible only to the people in them.</Bullet>
      <Bullet>Paid lessons are visible only to the instructor and enrolled learners.</Bullet>
    </DocSection>

    <DocSection icon="git-network" title="Services we use" color="#8B6CFF">
      <Bullet>Google Firebase (authentication and database) stores your account and app data.</Bullet>
      <Bullet>OpenRouter generates skill-quiz questions. Only the skill name and level are sent, never your personal details.</Bullet>
      <Bullet>Cloudflare runs our secure server, which grades quizzes and handles credits.</Bullet>
      <P>We don’t sell your data or use it for advertising.</P>
    </DocSection>

    <DocSection icon="shield-checkmark" title="How we protect it" color="#2EE59D">
      <Bullet>All traffic is encrypted (HTTPS).</Bullet>
      <Bullet>Database rules restrict every record to the people allowed to see or change it.</Bullet>
      <Bullet>Credits, quiz grading and enrolments are handled on our server so they can’t be tampered with.</Bullet>
    </DocSection>

    <DocSection icon="trash" title="Your choices & deletion" color="#FF5470">
      <Bullet>Edit your profile any time in Settings → Edit profile.</Bullet>
      <Bullet>Block or report anyone from the ••• menu.</Bullet>
      <Bullet>Delete your account any time in Settings → Delete account. Your profile is removed immediately; remaining posts, messages and reviews are deleted within 30 days.</Bullet>
    </DocSection>

    <DocSection icon="happy" title="Children" color="#FFB547">
      <P>P2PSkillX is for people aged {MIN_AGE} and over. We don’t knowingly collect data from younger children; if you believe a child has an account, report the profile and we’ll remove it.</P>
    </DocSection>

    <DocSection icon="mail" title="Contact">
      <P>{SUPPORT_EMAIL ? `Questions about privacy? Email ${SUPPORT_EMAIL}.` : 'Questions about privacy? Use Report on any profile or post and our team will get back to you.'}</P>
    </DocSection>

    <ContactCard />
  </Screen>
);

export default PrivacyPolicyScreen;
