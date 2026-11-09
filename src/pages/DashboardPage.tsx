import type {ReactNode} from 'react';
import {Grid} from '@astryxdesign/core/Grid';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Badge} from '@astryxdesign/core/Badge';
import {Icon} from '@astryxdesign/core/Icon';
import {List, ListItem} from '@astryxdesign/core/List';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Timestamp} from '@astryxdesign/core/Timestamp';
import {CalendarDays, Flag, Rocket, Users} from 'lucide-react';
import {PageLayout} from '../components/PageLayout';
import {QueryGate} from '../components/QueryState';
import {useChallenges, useMeetups, useMembers, useProjects, useSubmissions} from '../data/useStoreQuery';
import {activeMembers, byId, nextMeetup, openChallenges, shippedProjects, submissionCount} from '../data/selectors';

function StatCard({label, icon, children, hint}: {label: string; icon: typeof Users; children: ReactNode; hint?: ReactNode}) {
  return (
    <Card>
      <VStack gap={1}>
        <HStack gap={2} vAlign="center">
          <Icon icon={icon} color="secondary" size="sm" />
          <Text type="label" color="secondary">
            {label}
          </Text>
        </HStack>
        <Heading level={2} type="display-3">
          {children}
        </Heading>
        {hint && (
          <Text type="supporting" color="secondary">
            {hint}
          </Text>
        )}
      </VStack>
    </Card>
  );
}

export function DashboardPage() {
  const members = useMembers();
  const challenges = useChallenges();
  const submissions = useSubmissions();
  const projects = useProjects();
  const meetups = useMeetups();

  return (
    <PageLayout title="Dashboard">
      <QueryGate states={[members, challenges, submissions, projects, meetups]}>
        {members.data && challenges.data && submissions.data && projects.data && meetups.data && (
          <DashboardBody
            members={members.data}
            challenges={challenges.data}
            submissions={submissions.data}
            projects={projects.data}
            meetups={meetups.data}
          />
        )}
      </QueryGate>
    </PageLayout>
  );
}

type Body = {
  members: NonNullable<ReturnType<typeof useMembers>['data']>;
  challenges: NonNullable<ReturnType<typeof useChallenges>['data']>;
  submissions: NonNullable<ReturnType<typeof useSubmissions>['data']>;
  projects: NonNullable<ReturnType<typeof useProjects>['data']>;
  meetups: NonNullable<ReturnType<typeof useMeetups>['data']>;
};

function DashboardBody({members, challenges, submissions, projects, meetups}: Body) {
  const now = new Date();
  const next = nextMeetup(meetups, now);
  const open = openChallenges(challenges, now);
  const memberById = byId(members);

  const upcoming = [
    ...meetups
      .filter(m => new Date(m.date) >= now)
      .map(m => ({
        key: m.id,
        date: m.date,
        kind: 'Meetup' as const,
        title: m.topic,
        detail: `Hosted by ${memberById.get(m.hostId)?.name ?? 'unknown'}`,
      })),
    ...open.map(c => ({
      key: c.id,
      date: c.dueDate,
      kind: 'Challenge due' as const,
      title: c.title,
      detail: `${submissionCount(submissions, c.id)} ${submissionCount(submissions, c.id) === 1 ? 'submission' : 'submissions'} so far`,
    })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <VStack gap={6}>
      <Grid columns={{minWidth: 220}} gap={4}>
        <StatCard
          label="Next meetup"
          icon={CalendarDays}
          hint={next?.topic ?? 'Nothing scheduled'}>
          {next ? <Timestamp value={next.date} format="date" type="display-3" color="primary" /> : '—'}
        </StatCard>
        <StatCard label="Active members" icon={Users} hint={`of ${members.length} total`}>
          {activeMembers(members).length}
        </StatCard>
        <StatCard label="Open challenges" icon={Flag} hint="Still accepting submissions">
          {open.length}
        </StatCard>
        <StatCard label="Projects shipped" icon={Rocket} hint={`of ${projects.length} projects`}>
          {shippedProjects(projects).length}
        </StatCard>
      </Grid>

      <Card>
        <VStack gap={2}>
          <Heading level={2}>Upcoming</Heading>
          {upcoming.length === 0 ? (
            <EmptyState isCompact title="Nothing coming up" description="Schedule a meetup or add a challenge." />
          ) : (
            <List hasDividers edge="bleed">
              {upcoming.map(u => (
                <ListItem
                  key={u.key}
                  label={u.title}
                  description={u.detail}
                  startContent={<Badge variant={u.kind === 'Meetup' ? 'blue' : 'orange'} label={u.kind} />}
                  endContent={<Timestamp value={u.date} format="date_weekday" />}
                />
              ))}
            </List>
          )}
        </VStack>
      </Card>
    </VStack>
  );
}
