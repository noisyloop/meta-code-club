import {useMemo} from 'react';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Table, proportional, pixel} from '@astryxdesign/core/Table';
import type {TableColumn} from '@astryxdesign/core/Table';
import {Button} from '@astryxdesign/core/Button';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Icon} from '@astryxdesign/core/Icon';
import {Link} from '@astryxdesign/core/Link';
import {Timestamp} from '@astryxdesign/core/Timestamp';
import {CalendarPlus, ClipboardCheck} from 'lucide-react';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {useMeetups, useMembers} from '../../data/useStoreQuery';
import type {Meetup, Member} from '../../data/types';

type Row = {id: string; topic: string; date: string; host: string; attendance: number};

const columns = (isPast: boolean): TableColumn<Row>[] => [
  {key: 'topic', header: 'Topic', width: proportional(2, {minWidth: 180}), renderCell: r => <Link href={`/meetups/${r.id}`}>{r.topic}</Link>},
  {key: 'date', header: 'When', width: pixel(210), renderCell: r => <Timestamp value={r.date} format="date_time" />},
  {key: 'host', header: 'Host', width: proportional(1, {minWidth: 130})},
  {
    key: 'attendance',
    header: isPast ? 'Attended' : 'Checked in',
    width: pixel(120),
    align: 'end',
  },
  {
    key: 'id',
    header: 'Check-in',
    width: pixel(150),
    renderCell: r => <Button size="sm" label="Check in" aria-label={`Check in for ${r.topic}`} icon={<Icon icon={ClipboardCheck} />} href={`/meetups/${r.id}/checkin`} />,
  },
];

export function MeetupsPage() {
  const meetups = useMeetups();
  const members = useMembers();
  return (
    <PageLayout
      title="Meetups"
      actions={<Button label="Schedule meetup" icon={<Icon icon={CalendarPlus} />} variant="primary" href="/meetups/new" />}>
      <QueryGate states={[meetups, members]}>
        {meetups.data && members.data && <MeetupLists meetups={meetups.data} members={members.data} />}
      </QueryGate>
    </PageLayout>
  );
}

function MeetupLists({meetups, members}: {meetups: Meetup[]; members: Member[]}) {
  const {upcoming, past} = useMemo(() => {
    const name = new Map(members.map(m => [m.id, m.name]));
    const now = Date.now();
    const rows = meetups.map<Row & {t: number}>(m => ({
      id: m.id,
      topic: m.topic,
      date: m.date,
      host: name.get(m.hostId) ?? 'Unknown',
      attendance: m.attendeeIds.length,
      t: new Date(m.date).getTime(),
    }));
    return {
      upcoming: rows.filter(r => r.t >= now).sort((a, b) => a.t - b.t),
      past: rows.filter(r => r.t < now).sort((a, b) => b.t - a.t),
    };
  }, [meetups, members]);

  return (
    <VStack gap={6}>
      <Section title="Upcoming" rows={upcoming} isPast={false} empty="No upcoming meetups. Schedule one to get started." />
      <Section title="Past" rows={past} isPast empty="No past meetups yet." />
    </VStack>
  );
}

function Section({title, rows, isPast, empty}: {title: string; rows: Row[]; isPast: boolean; empty: string}) {
  // A table would hide the Check-in button behind horizontal scroll on a phone, so use cards there.
  const isNarrow = useMediaQuery('(max-width: 640px)');
  return (
    <Card>
      <VStack gap={3}>
        <Heading level={2}>
          {title} <Text color="secondary">({rows.length})</Text>
        </Heading>
        {rows.length === 0 ? (
          <EmptyState isCompact title={empty} />
        ) : isNarrow ? (
          <VStack gap={3}>
            {rows.map(r => (
              <Card key={r.id} variant="muted">
                <VStack gap={2}>
                  <Heading level={3}>
                    <Link href={`/meetups/${r.id}`}>{r.topic}</Link>
                  </Heading>
                  <Text color="secondary">
                    <Timestamp value={r.date} format="date_time" />
                  </Text>
                  <Text type="supporting" color="secondary">
                    Hosted by {r.host} · {r.attendance} {isPast ? 'attended' : 'checked in'}
                  </Text>
                  <HStack>
                    <Button size="sm" label="Check in" aria-label={`Check in for ${r.topic}`} icon={<Icon icon={ClipboardCheck} />} href={`/meetups/${r.id}/checkin`} />
                  </HStack>
                </VStack>
              </Card>
            ))}
          </VStack>
        ) : (
          <Table data={rows} columns={columns(isPast)} idKey="id" hasHover />
        )}
      </VStack>
    </Card>
  );
}
