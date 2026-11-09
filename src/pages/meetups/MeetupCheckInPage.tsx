import {useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {CheckboxList, CheckboxListItem} from '@astryxdesign/core/CheckboxList';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Text} from '@astryxdesign/core/Text';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Timestamp} from '@astryxdesign/core/Timestamp';
import {useToast} from '@astryxdesign/core/Toast';
import {Search} from 'lucide-react';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {SKILL_LABEL} from '../../components/badges';
import {NotFoundPage} from '../NotFoundPage';
import {getStore} from '../../data/store';
import {useMeetups, useMembers} from '../../data/useStoreQuery';
import type {Meetup, Member} from '../../data/types';

export function MeetupCheckInPage() {
  const {id = ''} = useParams();
  const meetups = useMeetups();
  const members = useMembers();
  const meetup = meetups.data?.find(m => m.id === id);
  if (meetups.data && !meetup) return <NotFoundPage what="meetup" />;
  return (
    <PageLayout
      title={meetup ? `Check-in: ${meetup.topic}` : 'Check-in'}
      crumbs={meetup ? [{label: 'Meetups', href: '/meetups'}, {label: meetup.topic, href: `/meetups/${meetup.id}`}, {label: 'Check-in'}] : undefined}
      actions={meetup && <Button label="Done" variant="primary" href={`/meetups/${meetup.id}`} />}>
      <QueryGate states={[meetups, members]}>{meetup && members.data && <CheckIn meetup={meetup} members={members.data} />}</QueryGate>
    </PageLayout>
  );
}

function CheckIn({meetup, members}: {meetup: Meetup; members: Member[]}) {
  const showToast = useToast();
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => [...members].sort((a, b) => a.name.localeCompare(b.name)), [members]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sorted.filter(m => m.name.toLowerCase().includes(q)) : sorted;
  }, [sorted, query]);

  // Only people who still exist count (a deleted member is removed from attendance by the store too).
  const present = meetup.attendeeIds.filter(id => members.some(m => m.id === id));

  const save = async (attendeeIds: string[]) => {
    try {
      await getStore().meetups.update(meetup.id, {attendeeIds});
    } catch (e) {
      showToast({body: e instanceof Error ? e.message : 'Could not save attendance.', type: 'error'});
    }
  };

  // The list may show only a filtered subset, so keep the check state of people who are hidden.
  const onChange = (values: string[]) => {
    const visibleIds = new Set(visible.map(m => m.id));
    void save([...present.filter(id => !visibleIds.has(id)), ...values.filter(v => visibleIds.has(v))]);
  };

  const isFuture = new Date(meetup.date).getTime() > Date.now();

  return (
    <VStack gap={4} maxWidth={720}>
      <HStack gap={2} wrap="wrap">
        <Text color="secondary">
          <Timestamp value={meetup.date} format="date_time" />
        </Text>
        {isFuture && <Text color="secondary">· This meetup hasn&apos;t happened yet, but you can check people in early.</Text>}
      </HStack>

      <Card>
        <VStack gap={4}>
          <ProgressBar
            label="Attendance"
            value={present.length}
            max={members.length}
            hasValueLabel
            formatValueLabel={(v, max) => `${v} of ${max} present`}
            variant="success"
          />
          <HStack gap={3} wrap="wrap" vAlign="center">
            <TextInput label="Find a member" isLabelHidden placeholder="Find a member" startIcon={Search} hasClear value={query} onChange={setQuery} width={260} />
            <Button label="Mark all present" onClick={() => save(members.map(m => m.id))} isDisabled={present.length === members.length} />
            <Button label="Clear all" variant="ghost" onClick={() => save([])} isDisabled={present.length === 0} />
          </HStack>
          <Text type="supporting" color="secondary" role="status">
            {query ? `${visible.length} of ${members.length} members shown. ` : ''}
            {present.length} of {members.length} present
          </Text>

          {visible.length === 0 ? (
            <EmptyState isCompact title="No members match" description="Try a different name." />
          ) : (
            <CheckboxList label="Members present" isLabelHidden hasDividers value={present} onChange={onChange}>
              {visible.map(m => (
                <CheckboxListItem key={m.id} value={m.id} label={m.name} description={`${SKILL_LABEL[m.skillLevel]} · ${m.languages.join(', ')}`} />
              ))}
            </CheckboxList>
          )}
        </VStack>
      </Card>
    </VStack>
  );
}
