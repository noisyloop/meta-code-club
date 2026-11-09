import {useMemo, useState} from 'react';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Table, proportional, pixel, useTableSortable, useTableSortableState} from '@astryxdesign/core/Table';
import type {TableColumn} from '@astryxdesign/core/Table';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {Card} from '@astryxdesign/core/Card';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Link} from '@astryxdesign/core/Link';
import {Selector} from '@astryxdesign/core/Selector';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Timestamp} from '@astryxdesign/core/Timestamp';
import {Icon} from '@astryxdesign/core/Icon';
import {Flame, Plus, Search} from 'lucide-react';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {SKILL_LABEL, SKILL_LEVELS, SkillBadge} from '../../components/badges';
import {useMembers} from '../../data/useStoreQuery';
import type {Member, SkillLevel} from '../../data/types';

type Row = {
  id: string;
  name: string;
  skillLevel: SkillLevel;
  languages: string[];
  languagesText: string;
  joinedAt: string;
  attendanceStreak: number;
  mentorId?: string;
  mentorName: string;
};

const columns: TableColumn<Row>[] = [
  {
    key: 'name',
    header: 'Name',
    width: proportional(2, {minWidth: 160}),
    sortable: true,
    renderCell: r => (
      <HStack gap={2} vAlign="center">
        <Avatar name={r.name} size="sm" tooltip={false} />
        <Link href={`/members/${r.id}`}>{r.name}</Link>
      </HStack>
    ),
  },
  {key: 'skillLevel', header: 'Skill', width: pixel(140), sortable: true, renderCell: r => <SkillBadge level={r.skillLevel} />},
  {
    key: 'languagesText',
    header: 'Languages',
    width: proportional(2, {minWidth: 150}),
    renderCell: r => (
      <HStack gap={1} wrap="wrap">
        {r.languages.map(l => (
          <Badge key={l} variant="neutral" label={l} />
        ))}
      </HStack>
    ),
  },
  {
    key: 'attendanceStreak',
    header: 'Streak',
    width: pixel(100),
    sortable: true,
    renderCell: r => (
      <HStack gap={1} vAlign="center">
        <Icon icon={Flame} size="sm" color={r.attendanceStreak > 0 ? 'orange' : 'disabled'} />
        <Text>{r.attendanceStreak}</Text>
      </HStack>
    ),
  },
  {key: 'joinedAt', header: 'Joined', width: pixel(130), sortable: true, renderCell: r => <Timestamp value={r.joinedAt} format="date" />},
  {
    key: 'mentorName',
    header: 'Mentor',
    width: proportional(1, {minWidth: 120}),
    sortable: true,
    renderCell: r => (r.mentorId ? <Link href={`/members/${r.mentorId}`}>{r.mentorName}</Link> : <Text color="secondary">—</Text>),
  },
];

const skillRank = (l: SkillLevel) => SKILL_LEVELS.indexOf(l);

function toRows(members: Member[]): Row[] {
  const name = new Map(members.map(m => [m.id, m.name]));
  return members.map(m => ({
    ...m,
    languagesText: m.languages.join(', '),
    mentorName: m.mentorId ? (name.get(m.mentorId) ?? '') : '',
  }));
}

export function MembersPage() {
  const members = useMembers();
  return (
    <PageLayout
      title="Members"
      actions={<Button label="Add member" icon={<Icon icon={Plus} />} variant="primary" href="/members/new" />}>
      <QueryGate states={[members]} skeleton="table">{members.data && <MembersTable members={members.data} />}</QueryGate>
    </PageLayout>
  );
}

function MembersTable({members}: {members: Member[]}) {
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState('');
  const [language, setLanguage] = useState('');

  const languageOptions = useMemo(
    () => [...new Set(members.flatMap(m => m.languages))].sort((a, b) => a.localeCompare(b)).map(l => ({value: l, label: l})),
    [members],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return toRows(members).filter(
      r =>
        (!q || r.name.toLowerCase().includes(q)) &&
        (!skill || r.skillLevel === skill) &&
        (!language || r.languages.includes(language)),
    );
  }, [members, query, skill, language]);

  const {sortedData, sortConfig} = useTableSortableState<Row>({
    data: filtered,
    defaultSort: [{sortKey: 'name', direction: 'ascending'}],
    comparators: {skillLevel: (a, b) => skillRank(a.skillLevel) - skillRank(b.skillLevel)},
  });
  const sortable = useTableSortable<Row>(sortConfig);
  const isFiltered = Boolean(query || skill || language);
  const isNarrow = useMediaQuery('(max-width: 640px)');
  const clearFilters = () => {
    setQuery('');
    setSkill('');
    setLanguage('');
  };

  if (members.length === 0) {
    return <EmptyState headingLevel={2} title="No members yet" description="Add your first club member to get started." actions={<Button label="Add member" variant="primary" href="/members/new" />} />;
  }

  return (
    <VStack gap={4}>
      <HStack gap={3} wrap="wrap" vAlign="end">
        <TextInput
          label="Search members"
          isLabelHidden
          placeholder="Search by name"
          startIcon={Search}
          hasClear
          value={query}
          onChange={setQuery}
          width={240}
        />
        <Selector
          label="Skill level"
          isLabelHidden
          placeholder="Any skill level"
          hasClear
          value={skill}
          onChange={v => setSkill(v ?? '')}
          options={SKILL_LEVELS.map(l => ({value: l, label: SKILL_LABEL[l]}))}
          width={200}
        />
        <Selector
          label="Language"
          isLabelHidden
          placeholder="Any language"
          hasClear
          value={language}
          onChange={v => setLanguage(v ?? '')}
          options={languageOptions}
          width={200}
        />
      </HStack>
      <Text type="supporting" color="secondary" role="status">
        {isFiltered ? `${filtered.length} of ${members.length} members` : `${members.length} members`}
      </Text>
      {sortedData.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title="No members match"
          description="Try a different name, skill level or language."
          actions={<Button label="Clear filters" onClick={clearFilters} />}
        />
      ) : isNarrow ? (
        <VStack gap={3}>
          {sortedData.map(r => (
            <Card key={r.id} variant="muted">
              <VStack gap={2}>
                <HStack gap={2} vAlign="center" justify="between">
                  <HStack gap={2} vAlign="center">
                    <Avatar name={r.name} size="sm" tooltip={false} />
                    <Link href={`/members/${r.id}`}>{r.name}</Link>
                  </HStack>
                  <SkillBadge level={r.skillLevel} />
                </HStack>
                <HStack gap={1} wrap="wrap">
                  {r.languages.map(l => (
                    <Badge key={l} label={l} />
                  ))}
                </HStack>
                <Text type="supporting" color="secondary">
                  {r.attendanceStreak} meetup streak{r.mentorName ? ` · Mentor: ${r.mentorName}` : ''}
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
