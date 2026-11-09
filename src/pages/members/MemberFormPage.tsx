import {useEffect, useMemo, useState, type FormEvent} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {DateInput} from '@astryxdesign/core/DateInput';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {Selector} from '@astryxdesign/core/Selector';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Tokenizer} from '@astryxdesign/core/Tokenizer';
import {useToast} from '@astryxdesign/core/Toast';
import type {ISODateString} from '@astryxdesign/core/Calendar';
import type {SearchableItem, SearchSource} from '@astryxdesign/core/Typeahead';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {SKILL_LABEL, SKILL_LEVELS} from '../../components/badges';
import {NotFoundPage} from '../NotFoundPage';
import {getStore} from '../../data/store';
import {useMembers} from '../../data/useStoreQuery';
import {validateMember, wouldCreateMentorCycle, type MemberDraft, type MemberField} from '../../data/validation';
import type {Member} from '../../data/types';

const COMMON_LANGUAGES = ['C#', 'C++', 'Go', 'HTML/CSS', 'Java', 'JavaScript', 'Kotlin', 'Python', 'Ruby', 'Rust', 'Scratch', 'SQL', 'Swift', 'TypeScript'];
const toItem = (l: string): SearchableItem => ({id: l, label: l});
const todayIso = () => new Date().toISOString().slice(0, 10) as ISODateString;

export function MemberFormPage() {
  const {id} = useParams();
  const members = useMembers();
  return (
    <QueryGate states={[members]}>
      {members.data && <MemberForm key={id ?? 'new'} members={members.data} editingId={id} />}
    </QueryGate>
  );
}

function MemberForm({members, editingId}: {members: Member[]; editingId?: string}) {
  const navigate = useNavigate();
  const showToast = useToast();
  const existing = editingId ? members.find(m => m.id === editingId) : undefined;

  const [draft, setDraft] = useState<MemberDraft>(() =>
    existing
      ? {name: existing.name, skillLevel: existing.skillLevel, languages: existing.languages, joinedAt: existing.joinedAt, attendanceStreak: existing.attendanceStreak, mentorId: existing.mentorId}
      : {name: '', skillLevel: 'beginner', languages: [], joinedAt: new Date().toISOString(), attendanceStreak: 0},
  );
  const [touched, setTouched] = useState<Set<MemberField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const others = useMemo(() => members.filter(m => m.id !== editingId), [members, editingId]);
  const errors = validateMember(draft, members, editingId);
  const show = (f: MemberField) => (submitted || touched.has(f) ? errors[f] : undefined);
  const touch = (f: MemberField) => setTouched(t => new Set(t).add(f));
  const set = <K extends keyof MemberDraft>(k: K, v: MemberDraft[K]) => setDraft(d => ({...d, [k]: v}));
  const status = (f: MemberField) => {
    const message = show(f);
    return message ? ({type: 'error', message} as const) : undefined;
  };

  const languageSource = useMemo<SearchSource>(() => {
    const all = [...new Set([...COMMON_LANGUAGES, ...members.flatMap(m => m.languages)])].sort().map(toItem);
    return {search: q => all.filter(i => i.label.toLowerCase().includes(q.toLowerCase())), bootstrap: () => all};
  }, [members]);

  const mentorOptions = others
    .filter(m => !editingId || !wouldCreateMentorCycle(members, editingId, m.id))
    .map(m => ({value: m.id, label: m.name}));

  // Move focus to the first invalid field's message region is handled by Astryx status; just block submit.
  useEffect(() => {
    if (submitted && Object.keys(errors).length === 0) setSubmitted(false);
  }, [submitted, errors]);

  if (editingId && !existing) return <NotFoundPage what="member" />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setIsSaving(true);
    try {
      const payload = {...draft, name: draft.name.trim(), mentorId: draft.mentorId || undefined};
      const saved = existing ? await getStore().members.update(existing.id, payload) : await getStore().members.create(payload);
      showToast({body: existing ? 'Member updated.' : 'Member added.', type: 'info'});
      navigate(`/members/${saved.id}`);
    } catch (err) {
      showToast({body: err instanceof Error ? err.message : 'Could not save member.', type: 'error'});
      setIsSaving(false);
    }
  };

  const title = existing ? `Edit ${existing.name}` : 'Add member';
  return (
    <PageLayout
      title={title}
      crumbs={[
        {label: 'Members', href: '/members'},
        ...(existing ? [{label: existing.name, href: `/members/${existing.id}`}] : []),
        {label: existing ? 'Edit' : 'New'},
      ]}>
      <Card maxWidth={640}>
        <form onSubmit={onSubmit} noValidate>
          <VStack gap={5}>
            <FormLayout>
              <TextInput
                label="Name"
                isRequired
                value={draft.name}
                onChange={v => set('name', v)}
                onBlur={() => touch('name')}
                status={status('name')}
                autoComplete="off"
              />
              <Selector
                label="Skill level"
                isRequired
                value={draft.skillLevel}
                onChange={v => set('skillLevel', v as MemberDraft['skillLevel'])}
                options={SKILL_LEVELS.map(l => ({value: l, label: SKILL_LABEL[l]}))}
              />
              <Tokenizer
                label="Languages"
                isRequired
                description="Pick from the list or type a new one and press Enter."
                searchSource={languageSource}
                value={draft.languages.map(toItem)}
                onChange={items => {
                  set('languages', items.map(i => i.label));
                  touch('languages');
                }}
                hasCreate
                hasEntriesOnFocus
                presentation="popover"
                placeholder="Add a language…"
                status={status('languages')}
              />
              <DateInput
                label="Joined"
                isRequired
                value={draft.joinedAt.slice(0, 10) as ISODateString}
                max={todayIso()}
                onChange={v => {
                  set('joinedAt', v ? `${v}T12:00:00.000Z` : '');
                  touch('joinedAt');
                }}
                status={status('joinedAt')}
              />
              <NumberInput
                label="Attendance streak"
                description="Consecutive meetups attended."
                min={0}
                value={draft.attendanceStreak}
                onChange={v => {
                  set('attendanceStreak', v);
                  touch('attendanceStreak');
                }}
                status={status('attendanceStreak')}
              />
              <Selector
                label="Mentor"
                isOptional
                hasClear
                hasSearch
                placeholder="No mentor"
                value={draft.mentorId ?? ''}
                onChange={v => set('mentorId', v || undefined)}
                options={mentorOptions}
                status={status('mentorId')}
              />
            </FormLayout>
            <HStack gap={2}>
              <Button type="submit" label={existing ? 'Save changes' : 'Add member'} variant="primary" isLoading={isSaving} />
              <Button label="Cancel" variant="ghost" href={existing ? `/members/${existing.id}` : '/members'} />
            </HStack>
          </VStack>
        </form>
      </Card>
    </PageLayout>
  );
}
