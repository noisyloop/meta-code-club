import * as stylex from '@stylexjs/stylex';
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout';
import {Heading, Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {getStore} from '../data/store';
import {useChallenges, useMeetups, useMembers, useProjects, useSubmissions} from '../data/useStoreQuery';

const styles = stylex.create({
  hero: {maxWidth: 640},
});

// Stage 2 placeholder: proves the data layer end to end. Replaced by real stat cards in Stage 3.
export function DashboardPage() {
  const members = useMembers();
  const challenges = useChallenges();
  const submissions = useSubmissions();
  const projects = useProjects();
  const meetups = useMeetups();
  const counts = [
    ['Members', members.data?.length],
    ['Challenges', challenges.data?.length],
    ['Submissions', submissions.data?.length],
    ['Projects', projects.data?.length],
    ['Meetups', meetups.data?.length],
  ] as const;

  return (
    <Layout
      header={
        <LayoutHeader hasDivider>
          <Heading level={1}>Dashboard</Heading>
        </LayoutHeader>
      }>
      <LayoutContent>
        <VStack gap={4}>
          <Card xstyle={styles.hero}>
            <VStack gap={3} align="start">
              <Badge variant="info" label="Stage 2" />
              <Heading level={2}>Data layer check</Heading>
              <Text color="secondary">
                Records currently in localStorage. Stat cards and the upcoming list arrive in Stage 3.
              </Text>
              <VStack gap={1}>
                {counts.map(([name, n]) => (
                  <Text key={name}>
                    {name}: <Text weight="bold">{n ?? '…'}</Text>
                  </Text>
                ))}
              </VStack>
              <Button label="Reset demo data" variant="secondary" onClick={() => getStore().reset()} />
            </VStack>
          </Card>
        </VStack>
      </LayoutContent>
    </Layout>
  );
}
