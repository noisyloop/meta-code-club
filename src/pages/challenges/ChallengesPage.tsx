import {useMemo, useState} from 'react';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {Card} from '@astryxdesign/core/Card';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Table, proportional, pixel, useTableSortable, useTableSortableState} from '@astryxdesign/core/Table';
import type {TableColumn} from '@astryxdesign/core/Table';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {Link} from '@astryxdesign/core/Link';
import {Selector} from '@astryxdesign/core/Selector';
import {Text} from '@astryxdesign/core/Text';
import {Timestamp} from '@astryxdesign/core/Timestamp';
import {Plus} from 'lucide-react';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {DIFFICULTIES, DIFFICULTY_LABEL, DifficultyBadge} from '../../components/badges';
import {useChallenges, useSubmissions} from '../../data/useStoreQuery';
import {submissionCount} from '../../data/selectors';
import type {Challenge, Difficulty, Submission} from '../../data/types';

type Row = {
  id: string;
  title: string;
  difficulty: Difficulty;
  dueDate: string;
  isOpen: boolean;
  submissions: number;
};

const columns: TableColumn<Row>[] = [
  {
    key: 'title',
    header: 'Challenge',
    width: proportional(3, {minWidth: 200}),
    sortable: true,
    renderCell: r => <Link href={`/challenges/${r.id}`}>{r.title}</Link>,
  },
  {key: 'difficulty', header: 'Difficulty', width: pixel(130), sortable: true, renderCell: r => <DifficultyBadge level={r.difficulty} />},
  {
    key: 'dueDate',
    header: 'Due',
    width: pixel(190),
    sortable: true,
    renderCell: r => (
      <HStack gap={2} vAlign="center">
        <Timestamp value={r.dueDate} format="date" />
        {!r.isOpen && <Badge variant="neutral" label="Closed" />}
      </HStack>
    ),
  },
  {key: 'submissions', header: 'Submissions', width: pixel(130), align: 'end', sortable: true},
];

const rank = (d: Difficulty) => DIFFICULTIES.indexOf(d);

function toRows(challenges: Challenge[], submissions: Submission[]): Row[] {
  const now = Date.now();
  return challenges.map(c => ({
    id: c.id,
    title: c.title,
    difficulty: c.difficulty,
    dueDate: c.dueDate,
    isOpen: new Date(c.dueDate).getTime() >= now,
    submissions: submissionCount(submissions, c.id),
  }));
}

export function ChallengesPage() {
  const challenges = useChallenges();
  const submissions = useSubmissions();
  return (
    <PageLayout
      title="Challenges"
      actions={<Button label="Add challenge" icon={<Icon icon={Plus} />} variant="primary" href="/challenges/new" />}>
      <QueryGate states={[challenges, submissions]} skeleton="table">
        {challenges.data && submissions.data && <ChallengesTable challenges={challenges.data} submissions={submissions.data} />}
      </QueryGate>
    </PageLayout>
  );
}

function ChallengesTable({challenges, submissions}: {challenges: Challenge[]; submissions: Submission[]}) {
  const [difficulty, setDifficulty] = useState('');
  const [state, setState] = useState('');

  const filtered = useMemo(
    () =>
      toRows(challenges, submissions).filter(
        r => (!difficulty || r.difficulty === difficulty) && (!state || (state === 'open') === r.isOpen),
      ),
    [challenges, submissions, difficulty, state],
  );

  const {sortedData, sortConfig} = useTableSortableState<Row>({
    data: filtered,
    defaultSort: [{sortKey: 'dueDate', direction: 'ascending'}],
    comparators: {difficulty: (a, b) => rank(a.difficulty) - rank(b.difficulty)},
  });
  const sortable = useTableSortable<Row>(sortConfig);
  const isFiltered = Boolean(difficulty || state);
  const isNarrow = useMediaQuery('(max-width: 640px)');

  if (challenges.length === 0) {
    return <EmptyState headingLevel={2} title="No challenges yet" description="Add a challenge for the club to tackle." actions={<Button label="Add challenge" variant="primary" href="/challenges/new" />} />;
  }

  return (
    <VStack gap={4}>
      <HStack gap={3} wrap="wrap">
        <Selector
          label="Difficulty"
          isLabelHidden
          placeholder="Any difficulty"
          hasClear
          value={difficulty}
          onChange={v => setDifficulty(v ?? '')}
          options={DIFFICULTIES.map(d => ({value: d, label: DIFFICULTY_LABEL[d]}))}
          width={200}
        />
        <Selector
          label="Status"
          isLabelHidden
          placeholder="Open and closed"
          hasClear
          value={state}
          onChange={v => setState(v ?? '')}
          options={[
            {value: 'open', label: 'Open'},
            {value: 'closed', label: 'Closed'},
          ]}
          width={200}
        />
      </HStack>
      <Text type="supporting" color="secondary" role="status">
        {isFiltered ? `${filtered.length} of ${challenges.length} challenges` : `${challenges.length} challenges`}
      </Text>
      {sortedData.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title="No challenges match"
          description="Try a different difficulty or status."
          actions={
            <Button
              label="Clear filters"
              onClick={() => {
                setDifficulty('');
                setState('');
              }}
            />
          }
        />
      ) : isNarrow ? (
        <VStack gap={3}>
          {sortedData.map(r => (
            <Card key={r.id} variant="muted">
              <VStack gap={2}>
                <HStack gap={2} vAlign="center" justify="between">
                  <Link href={`/challenges/${r.id}`}>{r.title}</Link>
                  <DifficultyBadge level={r.difficulty} />
                </HStack>
                <HStack gap={2} vAlign="center">
                  <Timestamp value={r.dueDate} format="date" />
                  {!r.isOpen && <Badge label="Closed" />}
                </HStack>
                <Text type="supporting" color="secondary">
                  {r.submissions} {r.submissions === 1 ? 'submission' : 'submissions'}
                </Text>
              </VStack>
            </Card>
          ))}
        </VStack>
      ) : (
        <Table data={sortedData} columns={columns} idKey="id" plugins={{sortable}} hasHover />
      )}
    </VStack>
  );
}
