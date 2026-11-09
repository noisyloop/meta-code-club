import {useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Grid} from '@astryxdesign/core/Grid';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
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
import {Flame, Pencil, Trash2} from 'lucide-react';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {SkillBadge} from '../../components/badges';
import {NotFoundPage} from '../NotFoundPage';
import {getStore} from '../../data/store';
import {useChallenges, useMembers, useProjects, useSubmissions} from '../../data/useStoreQuery';
import {byId} from '../../data/selectors';

const STATUS_VARIANT = {idea: 'neutral', building: 'blue', shipped: 'green'} as const;

export function MemberDetailPage() {
  const {id = ''} = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const members = useMembers();
  const projects = useProjects();
  const submissions = useSubmissions();
  const challenges = useChallenges();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const gate = (
    <QueryGate states={[members, projects, submissions, challenges]}>{null}</QueryGate>
  );
  const ready = members.data && projects.data && submissions.data && challenges.data;
  if (!ready) return <PageLayout title="Member">{gate}</PageLayout>;

  const member = members.data!.find(m => m.id === id);
  if (!member) return <NotFoundPage what="member" />;

  const mentor = member.mentorId ? members.data!.find(m => m.id === member.mentorId) : undefined;
  const mentees = members.data!.filter(m => m.mentorId === member.id);
  const myProjects = projects.data!.filter(p => p.memberId === member.id);
  const challengeById = byId(challenges.data!);
  const mySubmissions = submissions.data!
    .filter(s => s.memberId === member.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const remove = async () => {
    setIsDeleting(true);
    try {
      await getStore().members.remove(member.id);
      showToast({body: `${member.name} was removed.`, type: 'info'});
      navigate('/members');
    } catch (e) {
      setConfirmOpen(false);
      showToast({body: e instanceof Error ? e.message : 'Could not delete member.', type: 'error'});
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout
      title={member.name}
      crumbs={[{label: 'Members', href: '/members'}, {label: member.name}]}
      startContent={<Avatar name={member.name} size="lg" tooltip={false} />}
      actions={
        <>
          <Button label="Edit" icon={<Icon icon={Pencil} />} href={`/members/${member.id}/edit`} />
          <Button label="Delete" icon={<Icon icon={Trash2} />} variant="destructive" onClick={() => setConfirmOpen(true)} />
        </>
      }>
      <Grid columns={{minWidth: 320}} gap={4}>
        <Card>
          <VStack gap={3}>
            <Heading level={2}>Profile</Heading>
            <MetadataList>
              <MetadataListItem label="Skill level">
                <SkillBadge level={member.skillLevel} />
              </MetadataListItem>
              <MetadataListItem label="Languages">
                <HStack gap={1} wrap="wrap">
                  {member.languages.map(l => (
                    <Badge key={l} label={l} />
                  ))}
                </HStack>
              </MetadataListItem>
              <MetadataListItem label="Joined">
                <Timestamp value={member.joinedAt} format="date_long" color="primary" type="body" />
              </MetadataListItem>
              <MetadataListItem label="Attendance streak">
                <HStack gap={1} vAlign="center">
                  <Icon icon={Flame} size="sm" color={member.attendanceStreak > 0 ? 'orange' : 'disabled'} />
                  <Text>
                    {member.attendanceStreak} {member.attendanceStreak === 1 ? 'meetup' : 'meetups'} in a row
                  </Text>
                </HStack>
              </MetadataListItem>
              <MetadataListItem label="Mentor">
                {mentor ? <Link href={`/members/${mentor.id}`}>{mentor.name}</Link> : <Text color="secondary">None</Text>}
              </MetadataListItem>
              {mentees.length > 0 && (
                <MetadataListItem label="Mentees">
                  <VStack gap={1}>
                    {mentees.map(m => (
                      <Link key={m.id} href={`/members/${m.id}`}>
                        {m.name}
                      </Link>
                    ))}
                  </VStack>
                </MetadataListItem>
              )}
            </MetadataList>
          </VStack>
        </Card>

        <Card>
          <VStack gap={2}>
            <Heading level={2}>Projects</Heading>
            {myProjects.length === 0 ? (
              <EmptyState isCompact title="No projects yet" description={`${member.name} hasn't added a project.`} />
            ) : (
              <List hasDividers edge="bleed">
                {myProjects.map(p => (
                  <ListItem
                    key={p.id}
                    label={p.title}
                    href={`/projects/${p.id}`}
                    description={p.techStack.join(' · ')}
                    endContent={<Badge variant={STATUS_VARIANT[p.status]} label={p.status} />}
                  />
                ))}
              </List>
            )}
          </VStack>
        </Card>

        <Card>
          <VStack gap={2}>
            <Heading level={2}>Challenge submissions</Heading>
            {mySubmissions.length === 0 ? (
              <EmptyState isCompact title="No submissions yet" description="Completed challenges will show up here." />
            ) : (
              <List hasDividers edge="bleed">
                {mySubmissions.map(s => (
                  <ListItem
                    key={s.id}
                    label={<Link href={`/challenges/${s.challengeId}`}>{challengeById.get(s.challengeId)?.title ?? 'Unknown challenge'}</Link>}
                    description={<Timestamp value={s.submittedAt} format="date" />}
                    endContent={
                      <Link href={s.repoUrl} target="_blank">
                        Repo
                      </Link>
                    }
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
        title={`Delete ${member.name}?`}
        description="This also deletes their projects and challenge submissions. This can't be undone."
        actionLabel="Delete member"
        isActionLoading={isDeleting}
        onAction={remove}
      />
    </PageLayout>
  );
}
