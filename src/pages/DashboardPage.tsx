import * as stylex from '@stylexjs/stylex';
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout';
import {Heading, Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';

const styles = stylex.create({
  // Proves our own StyleX compiles alongside the prebuilt Astryx CSS.
  hero: {maxWidth: 640},
});

export function DashboardPage() {
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
              <Badge variant="info" label="Stage 1" />
              <Heading level={2}>Welcome to Code Club Hub</Heading>
              <Text color="secondary">
                Setup and theme are in place. Stat cards and the upcoming list arrive in Stage 3.
              </Text>
              <Button label="Primary action" variant="primary" />
            </VStack>
          </Card>
        </VStack>
      </LayoutContent>
    </Layout>
  );
}
