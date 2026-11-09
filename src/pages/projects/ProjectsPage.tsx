import {useMemo, useState} from 'react';
import {Grid} from '@astryxdesign/core/Grid';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {Table, proportional, pixel, useTableSortable, useTableSortableState} from '@astryxdesign/core/Table';
import type {TableColumn} from '@astryxdesign/core/Table';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Icon} from '@astryxdesign/core/Icon';
import {Link} from '@astryxdesign/core/Link';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {LayoutGrid, Plus, Table as TableIcon} from 'lucide-react';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {PROJECT_STATUSES, STATUS_LABEL, StatusBadge} from '../../components/badges';
import {useMembers, useProjects} from '../../data/useStoreQuery';
import type {Member, Project, ProjectStatus} from '../../data/types';

type Row = {id: string; title: string; owner: string; ownerId: string; techText: string; techStack: string[]; status: ProjectStatus};
type View = 'cards' | 'table';

const VIEW_KEY = 'code-club-hub:projects-view';
const readView = (): View => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'cards';
  } catch {
    return 'cards';
  }
};

const rank = (s: ProjectStatus) => PROJECT_STATUSES.indexOf(s);

const columns: TableColumn<Row>[] = [
  {key: 'title', header: 'Project', width: proportional(2, {minWidth: 160}), sortable: true, renderCell: r => <Link href={`/projects/${r.id}`}>{r.title}</Link>},
  {key: 'owner', header: 'Owner', width: proportional(1, {minWidth: 130}), sortable: true, renderCell: r => <Link href={`/members/${r.ownerId}`}>{r.owner}</Link>},
  {
    key: 'techText',
    header: 'Tech stack',
    width: proportional(2, {minWidth: 160}),
    renderCell: r => (
      <HStack gap={1} wrap="wrap">
        {r.techStack.map(t => (
          <Badge key={t} label={t} />
        ))}
      </HStack>
    ),
  },
  {key: 'status', header: 'Status', width: pixel(120), sortable: true, renderCell: r => <StatusBadge status={r.status} />},
];

export function ProjectsPage() {
  const projects = useProjects();
  const members = useMembers();
  return (
    <PageLayout
      title="Projects"
      actions={<Button label="Add project" icon={<Icon icon={Plus} />} variant="primary" href="/projects/new" />}>
      <QueryGate states={[projects, members]} skeleton="cards">
        {projects.data && members.data && <ProjectsBrowser projects={projects.data} members={members.data} />}
      </QueryGate>
    </PageLayout>
  );
}

function ProjectsBrowser({projects, members}: {projects: Project[]; members: Member[]}) {
  const [status, setStatus] = useState<'all' | ProjectStatus>('all');
  const [view, setViewState] = useState<View>(readView);
  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const rows = useMemo<Row[]>(() => {
    const name = new Map(members.map(m => [m.id, m.name]));
    return projects
      .filter(p => status === 'all' || p.status === status)
      .map(p => ({id: p.id, title: p.title, owner: name.get(p.memberId) ?? 'Unknown', ownerId: p.memberId, techText: p.techStack.join(', '), techStack: p.techStack, status: p.status}));
  }, [projects, members, status]);

  return (
    <VStack gap={4}>
      <HStack gap={3} wrap="wrap" vAlign="center" justify="between">
        <SegmentedControl label="Filter by status" value={status} onChange={v => setStatus(v as typeof status)}>
          <SegmentedControlItem value="all" label="All" />
          {PROJECT_STATUSES.map(s => (
            <SegmentedControlItem key={s} value={s} label={STATUS_LABEL[s]} />
          ))}
        </SegmentedControl>
        <SegmentedControl label="View" value={view} onChange={v => setView(v as View)}>
          <SegmentedControlItem value="cards" label="Cards" icon={<Icon icon={LayoutGrid} />} />
          <SegmentedControlItem value="table" label="Table" icon={<Icon icon={TableIcon} />} />
        </SegmentedControl>
      </HStack>

      <Text type="supporting" color="secondary" role="status">
        {status === 'all' ? `${projects.length} projects` : `${rows.length} of ${projects.length} projects`}
      </Text>

      {projects.length === 0 ? (
        <EmptyState headingLevel={2} title="No projects yet" description="Add the first project for the club." actions={<Button label="Add project" variant="primary" href="/projects/new" />} />
      ) : rows.length === 0 ? (
        <EmptyState headingLevel={2} title="No projects here" description="Try a different status, or add a project." actions={<Button label="Show all" onClick={() => setStatus('all')} />} />
      ) : view === 'cards' ? (
        <Grid columns={{minWidth: 280}} gap={4}>
          {rows.map(r => {
            const p = projects.find(x => x.id === r.id)!;
            return (
              <ClickableCard key={r.id} label={`${r.title}, ${STATUS_LABEL[r.status]}`} href={`/projects/${r.id}`} height="100%">
                <VStack gap={2}>
                  <HStack gap={2} vAlign="start" justify="between">
                    <Heading level={2} maxLines={2}>
                      {r.title}
                    </Heading>
                    <StatusBadge status={r.status} />
                  </HStack>
                  <Text type="supporting" color="secondary">
                    by {r.owner}
                  </Text>
                  <Text maxLines={3}>{p.description}</Text>
                  <HStack gap={1} wrap="wrap">
                    {r.techStack.map(t => (
                      <Badge key={t} label={t} />
                    ))}
                  </HStack>
                </VStack>
              </ClickableCard>
            );
          })}
        </Grid>
      ) : (
        <ProjectsTable rows={rows} />
      )}
    </VStack>
  );
}

function ProjectsTable({rows}: {rows: Row[]}) {
  const {sortedData, sortConfig} = useTableSortableState<Row>({
    data: rows,
    defaultSort: [{sortKey: 'title', direction: 'ascending'}],
    comparators: {status: (a, b) => rank(a.status) - rank(b.status)},
  });
  const sortable = useTableSortable<Row>(sortConfig);
  return <Table data={sortedData} columns={columns} idKey="id" plugins={{sortable}} hasHover />;
}
