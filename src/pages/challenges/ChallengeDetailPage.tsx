import {useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Grid} from '@astryxdesign/core/Grid';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {Collapsible} from '@astryxdesign/core/Collapsible';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Icon} from '@astryxdesign/core/Icon';
import {Link} from '@astryxdesign/core/Link';
import {List, ListItem} from '@astryxdesign/core/List';
import {Markdown} from '@astryxdesign/core/Markdown';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Timestamp} from '@astryxdesign/core/Timestamp';
import {useToast} from '@astryxdesign/core/Toast';
import {Pencil, Trash2} from 'lucide-react';
import {safeExternalUrl} from '../../lib/safeUrl';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {DifficultyBadge} from '../../components/badges';
import {NotFoundPage} from '../NotFoundPage';
import {getStore} from '../../data/store';
import {useChallenges, useMembers, useSubmissions} from '../../data/useStoreQuery';
import {byId} from '../../data/selectors';

export function ChallengeDetailPage() {
  const {id = ''} = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const challenges = useChallenges();
  const members = useMembers();
  const submissions = useSubmissions();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!challenges.data || !members.data || !submissions.data) {
    return (
      <PageLayout title="Challenge">
        <QueryGate states={[challenges, members, submissions]}>{null}</QueryGate>
      </PageLayout>
    );
  }
  const challenge = challenges.data.find(c => c.id === id);
  if (!challenge) return <NotFoundPage what="challenge" />;

  const memberById = byId(members.data);
  const done = submissions.data
    .filter(s => s.challengeId === challenge.id)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const isOpen = new Date(challenge.dueDate).getTime() >= Date.now();

  const remove = async () => {
    setIsDeleting(true);
    try {
      await getStore().challenges.remove(challenge.id);
      showToast({body: `“${challenge.title}” was deleted.`, type: 'info'});
      navigate('/challenges');
    } catch (e) {
      setConfirmOpen(false);
      showToast({body: e instanceof Error ? e.message : 'Could not delete challenge.', type: 'error'});
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout
      title={challenge.title}
      crumbs={[{label: 'Challenges', href: '/challenges'}, {label: challenge.title}]}
      actions={
        <>
          <Button label="Edit" icon={<Icon icon={Pencil} />} href={`/challenges/${challenge.id}/edit`} />
          <Button label="Delete" icon={<Icon icon={Trash2} />} variant="destructive" onClick={() => setConfirmOpen(true)} />
        </>
      }>
      <Grid columns={{minWidth: 320}} gap={4}>
        <VStack gap={4}>
          <Card>
            <VStack gap={3}>
              <Heading level={2}>Prompt</Heading>
              <Markdown headingLevelStart={3}>{challenge.prompt}</Markdown>
              <MetadataList>
                <MetadataListItem label="Difficulty">
                  <DifficultyBadge level={challenge.difficulty} />
                </MetadataListItem>
                <MetadataListItem label="Due">
                  <HStack gap={2} vAlign="center">
                    <Timestamp value={challenge.dueDate} format="date_long" color="primary" type="body" />
                    {!isOpen && <Badge label="Closed" />}
                  </HStack>
                </MetadataListItem>
              </MetadataList>
            </VStack>
          </Card>

          <Card>
            <VStack gap={2}>
              <Heading level={2}>Hints</Heading>
              {challenge.hints.length === 0 ? (
                <Text color="secondary">No hints for this challenge.</Text>
              ) : (
                <>
                  <Text type="supporting" color="secondary">
                    Stuck? Reveal one hint at a time.
                  </Text>
                  <VStack gap={2}>
                    {challenge.hints.map((hint, i) => (
                      <Collapsible key={i} defaultIsOpen={false} trigger={`Hint ${i + 1} of ${challenge.hints.length}`}>
                        <Text>{hint}</Text>
                      </Collapsible>
                    ))}
                  </VStack>
                </>
              )}
            </VStack>
          </Card>
        </VStack>

        <Card>
          <VStack gap={3}>
            <Heading level={2}>Completed by</Heading>
            <ProgressBar
              label="Completion"
              value={done.length}
              max={members.data.length}
              hasValueLabel
              formatValueLabel={(v, max) => `${v} of ${max} members`}
            />
            {done.length === 0 ? (
              <EmptyState isCompact title="No submissions yet" description="Be the first to complete this challenge." />
            ) : (
              <List hasDividers edge="bleed">
                {done.map(s => {
                  const m = memberById.get(s.memberId);
                  return (
                    <ListItem
                      key={s.id}
                      startContent={<Avatar name={m?.name ?? '?'} size="sm" tooltip={false} />}
                      label={m ? <Link href={`/members/${m.id}`}>{m.name}</Link> : 'Unknown member'}
                      description={<Timestamp value={s.submittedAt} format="date" />}
                      endContent={
                        safeExternalUrl(s.repoUrl) ? (
                          <Link href={safeExternalUrl(s.repoUrl)} target="_blank" rel="noopener noreferrer">
                            Repo
                          </Link>
                        ) : undefined
                      }
                    />
                  );
                })}
              </List>
            )}
          </VStack>
        </Card>
      </Grid>

      <AlertDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete “${challenge.title}”?`}
        description={`This also deletes its ${done.length} ${done.length === 1 ? 'submission' : 'submissions'}. This can't be undone.`}
        actionLabel="Delete challenge"
        isActionLoading={isDeleting}
        onAction={remove}
      />
    </PageLayout>
  );
}
