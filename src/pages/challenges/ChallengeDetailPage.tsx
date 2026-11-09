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
import {IconButton} from '@astryxdesign/core/IconButton';
import {Pencil, Plus, Trash2} from 'lucide-react';
import {safeExternalUrl} from '../../lib/safeUrl';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {DifficultyBadge} from '../../components/badges';
import {SubmissionDialog} from './SubmissionDialog';
import {NotFoundPage} from '../NotFoundPage';
import {getStore} from '../../data/store';
import {useChallenges, useMembers, useSubmissions} from '../../data/useStoreQuery';
import {byId} from '../../data/selectors';
import type {Submission} from '../../data/types';

export function ChallengeDetailPage() {
  const {id = ''} = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const challenges = useChallenges();
  const members = useMembers();
  const submissions = useSubmissions();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Submission dialog: undefined = closed, null = adding, Submission = editing.
  const [dialog, setDialog] = useState<Submission | null | undefined>(undefined);
  const [removing, setRemoving] = useState<Submission | undefined>(undefined);
  const [dialogKey, setDialogKey] = useState(0);

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
            <HStack gap={2} vAlign="center" justify="between" wrap="wrap">
              <Heading level={2}>Completed by</Heading>
              <Button
                size="sm"
                label="Submit solution"
                variant="primary"
                icon={<Icon icon={Plus} />}
                isDisabled={members.data.length === done.length}
                onClick={() => {
                  setDialogKey(k => k + 1);
                  setDialog(null);
                }}
              />
            </HStack>
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
                        <HStack gap={1} vAlign="center">
                          {safeExternalUrl(s.repoUrl) && (
                            <Link href={safeExternalUrl(s.repoUrl)} target="_blank" rel="noopener noreferrer">
                              Repo
                            </Link>
                          )}
                          <IconButton
                            label={`Edit ${m?.name ?? 'member'}'s submission`}
                            size="sm"
                            variant="ghost"
                            icon={<Icon icon={Pencil} />}
                            onClick={() => {
                              setDialogKey(k => k + 1);
                              setDialog(s);
                            }}
                          />
                          <IconButton
                            label={`Remove ${m?.name ?? 'member'}'s submission`}
                            size="sm"
                            variant="ghost"
                            icon={<Icon icon={Trash2} />}
                            onClick={() => setRemoving(s)}
                          />
                        </HStack>
                      }
                    />
                  );
                })}
              </List>
            )}
          </VStack>
        </Card>
      </Grid>

      <SubmissionDialog
        key={dialogKey}
        challenge={challenge}
        members={members.data}
        submissions={submissions.data}
        editing={dialog ?? undefined}
        isOpen={dialog !== undefined}
        onClose={() => setDialog(undefined)}
      />
      <AlertDialog
        isOpen={removing !== undefined}
        onOpenChange={open => !open && setRemoving(undefined)}
        title="Remove this submission?"
        description={`${removing ? (memberById.get(removing.memberId)?.name ?? 'This member') : ''} will no longer be listed as having completed “${challenge.title}”.`}
        actionLabel="Remove submission"
        onAction={async () => {
          if (!removing) return;
          try {
            await getStore().submissions.remove(removing.id);
            showToast({body: 'Submission removed.', type: 'info'});
          } catch (e) {
            showToast({body: e instanceof Error ? e.message : 'Could not remove submission.', type: 'error'});
          } finally {
            setRemoving(undefined);
          }
        }}
      />
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
