import {useMemo, useState, type FormEvent} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import {Selector} from '@astryxdesign/core/Selector';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Tokenizer} from '@astryxdesign/core/Tokenizer';
import {useToast} from '@astryxdesign/core/Toast';
import type {SearchableItem, SearchSource} from '@astryxdesign/core/Typeahead';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {PROJECT_STATUSES, STATUS_LABEL} from '../../components/badges';
import {NotFoundPage} from '../NotFoundPage';
import {getStore} from '../../data/store';
import {useMembers, useProjects} from '../../data/useStoreQuery';
import {validateProject, type ProjectDraft, type ProjectField} from '../../data/validation';
import type {Member, Project} from '../../data/types';

const COMMON_TECH = ['C#', 'C++', 'Django', 'Express', 'Flask', 'Go', 'HTML/CSS', 'Java', 'JavaScript', 'Kotlin', 'Next.js', 'Node.js', 'PostgreSQL', 'Python', 'React', 'Ruby', 'Rust', 'SQLite', 'Swift', 'TypeScript', 'Vue'];
const toItem = (l: string): SearchableItem => ({id: l, label: l});

export function ProjectFormPage() {
  const {id} = useParams();
  const projects = useProjects();
  const members = useMembers();
  return (
    <QueryGate states={[projects, members]}>
      {projects.data && members.data && <ProjectForm key={id ?? 'new'} projects={projects.data} members={members.data} editingId={id} />}
    </QueryGate>
  );
}

function ProjectForm({projects, members, editingId}: {projects: Project[]; members: Member[]; editingId?: string}) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [params] = useSearchParams();
  const existing = editingId ? projects.find(p => p.id === editingId) : undefined;

  const [draft, setDraft] = useState<ProjectDraft>(() =>
    existing
      ? {memberId: existing.memberId, title: existing.title, description: existing.description, techStack: [...existing.techStack], repoUrl: existing.repoUrl, demoUrl: existing.demoUrl ?? '', status: existing.status}
      : {memberId: members.some(m => m.id === params.get('member')) ? params.get('member')! : '', title: '', description: '', techStack: [], repoUrl: '', demoUrl: '', status: 'idea'},
  );
  const [touched, setTouched] = useState<Set<ProjectField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const errors = useMemo(() => validateProject(draft, members), [draft, members]);
  const set = <K extends keyof ProjectDraft>(k: K, v: ProjectDraft[K]) => setDraft(d => ({...d, [k]: v}));
  const touch = (f: ProjectField) => setTouched(t => new Set(t).add(f));
  const status = (f: ProjectField) => {
    const message = submitted || touched.has(f) ? errors[f] : undefined;
    return message ? ({type: 'error', message} as const) : undefined;
  };

  const techSource = useMemo<SearchSource>(() => {
    const all = [...new Set([...COMMON_TECH, ...projects.flatMap(p => p.techStack)])].sort().map(toItem);
    return {search: q => all.filter(i => i.label.toLowerCase().includes(q.toLowerCase())), bootstrap: () => all};
  }, [projects]);

  if (editingId && !existing) return <NotFoundPage what="project" />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setIsSaving(true);
    try {
      const payload: ProjectDraft = {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        repoUrl: draft.repoUrl.trim(),
        demoUrl: draft.demoUrl?.trim() || undefined,
      };
      const saved = existing ? await getStore().projects.update(existing.id, payload) : await getStore().projects.create(payload);
      showToast({body: existing ? 'Project updated.' : 'Project added.', type: 'info'});
      navigate(`/projects/${saved.id}`);
    } catch (err) {
      showToast({body: err instanceof Error ? err.message : 'Could not save project.', type: 'error'});
      setIsSaving(false);
    }
  };

  return (
    <PageLayout
      title={existing ? `Edit ${existing.title}` : 'Add project'}
      crumbs={[
        {label: 'Projects', href: '/projects'},
        ...(existing ? [{label: existing.title, href: `/projects/${existing.id}`}] : []),
        {label: existing ? 'Edit' : 'New'},
      ]}>
      <Card maxWidth={640}>
        <form onSubmit={onSubmit} noValidate>
          <VStack gap={5}>
            <FormLayout>
              <TextInput label="Title" isRequired value={draft.title} onChange={v => set('title', v)} onBlur={() => touch('title')} status={status('title')} autoComplete="off" />
              <Selector
                label="Owner"
                isRequired
                hasSearch
                placeholder="Choose a member"
                value={draft.memberId}
                onChange={v => {
                  set('memberId', v ?? '');
                  touch('memberId');
                }}
                options={members.map(m => ({value: m.id, label: m.name}))}
                status={status('memberId')}
              />
              <TextArea label="Description" isRequired value={draft.description} onChange={v => set('description', v)} onBlur={() => touch('description')} status={status('description')} />
              <Tokenizer
                label="Tech stack"
                isRequired
                description="Pick from the list or type a new one and press Enter."
                searchSource={techSource}
                value={draft.techStack.map(toItem)}
                onChange={items => {
                  set('techStack', items.map(i => i.label));
                  touch('techStack');
                }}
                hasCreate
                hasEntriesOnFocus
                presentation="popover"
                placeholder="Add a technology…"
                status={status('techStack')}
              />
              <TextInput label="Repository URL" isRequired type="url" placeholder="https://github.com/you/project" value={draft.repoUrl} onChange={v => set('repoUrl', v)} onBlur={() => touch('repoUrl')} status={status('repoUrl')} autoComplete="off" />
              <TextInput label="Demo URL" isOptional type="url" placeholder="https://" value={draft.demoUrl ?? ''} onChange={v => set('demoUrl', v)} onBlur={() => touch('demoUrl')} status={status('demoUrl')} autoComplete="off" />
              <Selector
                label="Status"
                isRequired
                value={draft.status}
                onChange={v => set('status', v as ProjectDraft['status'])}
                options={PROJECT_STATUSES.map(s => ({value: s, label: STATUS_LABEL[s]}))}
              />
            </FormLayout>
            <HStack gap={2}>
              <Button type="submit" label={existing ? 'Save changes' : 'Add project'} variant="primary" isLoading={isSaving} />
              <Button label="Cancel" variant="ghost" href={existing ? `/projects/${existing.id}` : '/projects'} />
            </HStack>
          </VStack>
        </form>
      </Card>
    </PageLayout>
  );
}
