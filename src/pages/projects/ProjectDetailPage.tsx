import {useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Grid} from '@astryxdesign/core/Grid';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Icon} from '@astryxdesign/core/Icon';
import {Link} from '@astryxdesign/core/Link';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {useToast} from '@astryxdesign/core/Toast';
import {Code2, ExternalLink, Pencil, Trash2} from 'lucide-react';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {StatusBadge} from '../../components/badges';
import {NotFoundPage} from '../NotFoundPage';
import {getStore} from '../../data/store';
import {useMembers, useProjects} from '../../data/useStoreQuery';

export function ProjectDetailPage() {
  const {id = ''} = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const projects = useProjects();
  const members = useMembers();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!projects.data || !members.data) {
    return (
      <PageLayout title="Project">
        <QueryGate states={[projects, members]}>{null}</QueryGate>
      </PageLayout>
    );
  }
  const project = projects.data.find(p => p.id === id);
  if (!project) return <NotFoundPage what="project" />;
  const owner = members.data.find(m => m.id === project.memberId);

  const remove = async () => {
    setIsDeleting(true);
    try {
      await getStore().projects.remove(project.id);
      showToast({body: `“${project.title}” was deleted.`, type: 'info'});
      navigate('/projects');
    } catch (e) {
      setConfirmOpen(false);
      showToast({body: e instanceof Error ? e.message : 'Could not delete project.', type: 'error'});
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout
      title={project.title}
      crumbs={[{label: 'Projects', href: '/projects'}, {label: project.title}]}
      actions={
        <>
          <Button label="Edit" icon={<Icon icon={Pencil} />} href={`/projects/${project.id}/edit`} />
          <Button label="Delete" icon={<Icon icon={Trash2} />} variant="destructive" onClick={() => setConfirmOpen(true)} />
        </>
      }>
      <Grid columns={{minWidth: 320}} gap={4}>
        <Card>
          <VStack gap={3}>
            <HStack gap={2} vAlign="center">
              <Heading level={2}>About</Heading>
              <StatusBadge status={project.status} />
            </HStack>
            <Text>{project.description}</Text>
            <VStack gap={2}>
              <Text type="label" color="secondary">
                Tech stack
              </Text>
              <HStack gap={1} wrap="wrap">
                {project.techStack.map(t => (
                  <Badge key={t} label={t} />
                ))}
              </HStack>
            </VStack>
          </VStack>
        </Card>

        <Card>
          <VStack gap={3}>
            <Heading level={2}>Details</Heading>
            <MetadataList>
              <MetadataListItem label="Owner">
                {owner ? (
                  <HStack gap={2} vAlign="center">
                    <Avatar name={owner.name} size="sm" tooltip={false} />
                    <Link href={`/members/${owner.id}`}>{owner.name}</Link>
                  </HStack>
                ) : (
                  <Text color="secondary">Unknown</Text>
                )}
              </MetadataListItem>
              <MetadataListItem label="Status">
                <StatusBadge status={project.status} />
              </MetadataListItem>
            </MetadataList>
            <Heading level={3}>Links</Heading>
            <HStack gap={2} wrap="wrap">
              <Button label="Repository" icon={<Icon icon={Code2} />} href={project.repoUrl} target="_blank" rel="noopener noreferrer" />
              {project.demoUrl ? (
                <Button label="Live demo" icon={<Icon icon={ExternalLink} />} href={project.demoUrl} target="_blank" rel="noopener noreferrer" variant="primary" />
              ) : (
                <Text type="supporting" color="secondary">
                  No demo yet
                </Text>
              )}
            </HStack>
          </VStack>
        </Card>
      </Grid>

      <AlertDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete “${project.title}”?`}
        description="This can't be undone."
        actionLabel="Delete project"
        isActionLoading={isDeleting}
        onAction={remove}
      />
    </PageLayout>
  );
}
