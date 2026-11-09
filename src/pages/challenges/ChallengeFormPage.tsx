import {useMemo, useState, type FormEvent} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {VStack, HStack, StackItem} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {DateInput} from '@astryxdesign/core/DateInput';
import {FieldStatus} from '@astryxdesign/core/FieldStatus';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {Selector} from '@astryxdesign/core/Selector';
import {Text} from '@astryxdesign/core/Text';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {useToast} from '@astryxdesign/core/Toast';
import type {ISODateString} from '@astryxdesign/core/Calendar';
import {Plus, Trash2} from 'lucide-react';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {DIFFICULTIES, DIFFICULTY_LABEL} from '../../components/badges';
import {NotFoundPage} from '../NotFoundPage';
import {getStore} from '../../data/store';
import {useChallenges} from '../../data/useStoreQuery';
import {MAX_HINTS, validateChallenge, type ChallengeDraft, type ChallengeField} from '../../data/validation';
import type {Challenge} from '../../data/types';

const inTwoWeeks = () => new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

export function ChallengeFormPage() {
  const {id} = useParams();
  const challenges = useChallenges();
  return (
    <QueryGate states={[challenges]}>
      {challenges.data && <ChallengeForm key={id ?? 'new'} challenges={challenges.data} editingId={id} />}
    </QueryGate>
  );
}

function ChallengeForm({challenges, editingId}: {challenges: Challenge[]; editingId?: string}) {
  const navigate = useNavigate();
  const showToast = useToast();
  const existing = editingId ? challenges.find(c => c.id === editingId) : undefined;

  const [draft, setDraft] = useState<ChallengeDraft>(() =>
    existing
      ? {title: existing.title, prompt: existing.prompt, difficulty: existing.difficulty, dueDate: existing.dueDate, hints: [...existing.hints]}
      : {title: '', prompt: '', difficulty: 'easy', dueDate: `${inTwoWeeks()}T23:59:59.000Z`, hints: []},
  );
  const [touched, setTouched] = useState<Set<ChallengeField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const errors = useMemo(() => validateChallenge(draft, challenges, editingId), [draft, challenges, editingId]);
  const set = <K extends keyof ChallengeDraft>(k: K, v: ChallengeDraft[K]) => setDraft(d => ({...d, [k]: v}));
  const touch = (f: ChallengeField) => setTouched(t => new Set(t).add(f));
  const status = (f: ChallengeField) => {
    const message = submitted || touched.has(f) ? errors[f] : undefined;
    return message ? ({type: 'error', message} as const) : undefined;
  };

  if (editingId && !existing) return <NotFoundPage what="challenge" />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setIsSaving(true);
    try {
      const payload: ChallengeDraft = {
        ...draft,
        title: draft.title.trim(),
        prompt: draft.prompt.trim(),
        hints: draft.hints.map(h => h.trim()).filter(Boolean),
      };
      const saved = existing ? await getStore().challenges.update(existing.id, payload) : await getStore().challenges.create(payload);
      showToast({body: existing ? 'Challenge updated.' : 'Challenge added.', type: 'info'});
      navigate(`/challenges/${saved.id}`);
    } catch (err) {
      showToast({body: err instanceof Error ? err.message : 'Could not save challenge.', type: 'error'});
      setIsSaving(false);
    }
  };

  const setHint = (i: number, v: string) => {
    set('hints', draft.hints.map((h, j) => (j === i ? v : h)));
    touch('hints');
  };

  return (
    <PageLayout
      title={existing ? `Edit ${existing.title}` : 'Add challenge'}
      crumbs={[
        {label: 'Challenges', href: '/challenges'},
        ...(existing ? [{label: existing.title, href: `/challenges/${existing.id}`}] : []),
        {label: existing ? 'Edit' : 'New'},
      ]}>
      <Card maxWidth={640}>
        <form onSubmit={onSubmit} noValidate>
          <VStack gap={5}>
            <FormLayout>
              <TextInput label="Title" isRequired value={draft.title} onChange={v => set('title', v)} onBlur={() => touch('title')} status={status('title')} autoComplete="off" />
              <Selector
                label="Difficulty"
                isRequired
                value={draft.difficulty}
                onChange={v => set('difficulty', v as ChallengeDraft['difficulty'])}
                options={DIFFICULTIES.map(d => ({value: d, label: DIFFICULTY_LABEL[d]}))}
              />
              <DateInput
                label="Due date"
                isRequired
                value={draft.dueDate.slice(0, 10) as ISODateString}
                onChange={v => {
                  set('dueDate', v ? `${v}T23:59:59.000Z` : '');
                  touch('dueDate');
                }}
                status={status('dueDate')}
              />
              <TextArea
                label="Prompt"
                isRequired
                description="Markdown is supported, e.g. `code` and lists."
                value={draft.prompt}
                onChange={v => set('prompt', v)}
                onBlur={() => touch('prompt')}
                status={status('prompt')}
              />
            </FormLayout>

            <VStack gap={2}>
              <Text type="label">Hints</Text>
              <Text type="supporting" color="secondary">
                Optional, up to {MAX_HINTS}. Members reveal them one at a time, so order them from gentle to revealing.
              </Text>
              {draft.hints.map((h, i) => (
                <HStack key={i} gap={2} vAlign="end">
                  <StackItem size="fill">
                    <TextInput label={`Hint ${i + 1}`} value={h} onChange={v => setHint(i, v)} />
                  </StackItem>
                  <IconButton
                    label={`Remove hint ${i + 1}`}
                    icon={<Icon icon={Trash2} />}
                    variant="ghost"
                    onClick={() => set('hints', draft.hints.filter((_, j) => j !== i))}
                  />
                </HStack>
              ))}
              {status('hints')?.message && <FieldStatus type="error" variant="detached" message={status('hints')!.message!} />}
              <HStack>
                <Button
                  label="Add hint"
                  icon={<Icon icon={Plus} />}
                  isDisabled={draft.hints.length >= MAX_HINTS}
                  onClick={() => set('hints', [...draft.hints, ''])}
                />
              </HStack>
            </VStack>

            <HStack gap={2}>
              <Button type="submit" label={existing ? 'Save changes' : 'Add challenge'} variant="primary" isLoading={isSaving} />
              <Button label="Cancel" variant="ghost" href={existing ? `/challenges/${existing.id}` : '/challenges'} />
            </HStack>
          </VStack>
        </form>
      </Card>
    </PageLayout>
  );
}
