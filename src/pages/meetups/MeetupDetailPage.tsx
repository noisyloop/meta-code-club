import {useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Grid} from '@astryxdesign/core/Grid';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Button} from '@astryxdesign/core/Button';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Icon} from '@astryxdesign/core/Icon';
import {Link} from '@astryxdesign/core/Link';
import {List, ListItem} from '@astryxdesign/core/List';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {Timestamp} from '@astryxdesign/core/Timestamp';
import {useToast} from '@astryxdesign/core/Toast';
import {ClipboardCheck, Pencil, Trash2} from 'lucide-react';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {NotFoundPage} from '../NotFoundPage';
import {getStore} from '../../data/store';
import {useMeetups, useMembers} from '../../data/useStoreQuery';

export function MeetupDetailPage() {
  const {id = ''} = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const meetups = useMeetups();
  const members = useMembers();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!meetups.data || !members.data) {
    return (
      <PageLayout title="Meetup">
        <QueryGate states={[meetups, members]}>{null}</QueryGate>
      </PageLayout>
    );
  }
  const meetup = meetups.data.find(m => m.id === id);
  if (!meetup) return <NotFoundPage what="meetup" />;
  const host = members.data.find(m => m.id === meetup.hostId);
  const attendees = members.data.filter(m => meetup.attendeeIds.includes(m.id));

  const remove = async () => {
    setIsDeleting(true);
    try {
      await getStore().meetups.remove(meetup.id);
      showToast({body: `“${meetup.topic}” was deleted.`, type: 'info'});
      navigate('/meetups');
    } catch (e) {
      setConfirmOpen(false);
      showToast({body: e instanceof Error ? e.message : 'Could not delete meetup.', type: 'error'});
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout
      title={meetup.topic}
      crumbs={[{label: 'Meetups', href: '/meetups'}, {label: meetup.topic}]}
      actions={
        <>
          <Button label="Check in" icon={<Icon icon={ClipboardCheck} />} variant="primary" href={`/meetups/${meetup.id}/checkin`} />
          <Button label="Edit" icon={<Icon icon={Pencil} />} href={`/meetups/${meetup.id}/edit`} />
          <Button label="Delete" icon={<Icon icon={Trash2} />} variant="destructive" onClick={() => setConfirmOpen(true)} />
        </>
      }>
      <Grid columns={{minWidth: 320}} gap={4}>
        <VStack gap={4}>
          <Card>
            <VStack gap={3}>
              <Heading level={2}>Details</Heading>
              <MetadataList>
                <MetadataListItem label="When">
                  <Timestamp value={meetup.date} format="date_time" color="primary" type="body" />
                </MetadataListItem>
                <MetadataListItem label="Host">
                  {host ? <Link href={`/members/${host.id}`}>{host.name}</Link> : <Text color="secondary">Unknown</Text>}
                </MetadataListItem>
              </MetadataList>
            </VStack>
          </Card>
          <Card>
            <VStack gap={2}>
              <Heading level={2}>Agenda</Heading>
              <List listStyle="decimal">
                {meetup.agenda.map((a, i) => (
                  <ListItem key={i} label={a} />
                ))}
              </List>
            </VStack>
          </Card>
        </VStack>
        <Card>
          <VStack gap={2}>
            <HStack gap={2} vAlign="center" justify="between">
              <Heading level={2}>Attendance ({attendees.length})</Heading>
              <Button size="sm" label="Manage" href={`/meetups/${meetup.id}/checkin`} />
            </HStack>
            {attendees.length === 0 ? (
              <EmptyState isCompact title="No one checked in yet" description="Use Check in to mark who is here." />
            ) : (
              <List hasDividers edge="bleed">
                {attendees.map(m => (
                  <ListItem
                    key={m.id}
                    startContent={<Avatar name={m.name} size="sm" tooltip={false} />}
                    label={<Link href={`/members/${m.id}`}>{m.name}</Link>}
                  />
                ))}
              </List>
            )}
          </VStack>
        </Card>
      </Grid>
      <AlertDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete “${meetup.topic}”?`}
        description="Its agenda and attendance record will be lost. This can't be undone."
        actionLabel="Delete meetup"
        isActionLoading={isDeleting}
        onAction={remove}
      />
    </PageLayout>
  );
}
