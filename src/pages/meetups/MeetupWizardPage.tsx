import {useMemo, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {VStack, HStack, StackItem} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {DateTimeInput, type ISODateTimeString} from '@astryxdesign/core/DateTimeInput';
import {FieldStatus} from '@astryxdesign/core/FieldStatus';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {List, ListItem} from '@astryxdesign/core/List';
import {MetadataList, MetadataListItem} from '@astryxdesign/core/MetadataList';
import {Selector} from '@astryxdesign/core/Selector';
import {Step, Stepper} from '@astryxdesign/core/Stepper';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Timestamp} from '@astryxdesign/core/Timestamp';
import {useToast} from '@astryxdesign/core/Toast';
import {Plus, Trash2} from 'lucide-react';
import {PageLayout} from '../../components/PageLayout';
import {QueryGate} from '../../components/QueryState';
import {NotFoundPage} from '../NotFoundPage';
import {getStore} from '../../data/store';
import {useMeetups, useMembers} from '../../data/useStoreQuery';
import {errorsForStep, MAX_AGENDA_ITEMS, validateMeetup, type MeetupDraft, type MeetupField} from '../../data/validation';
import {fromLocalInput, toLocalInput} from '../../lib/datetime';
import type {Meetup, Member} from '../../data/types';

const STEPS = ['Date and topic', 'Host and agenda', 'Review'];

function defaultDate() {
  const d = new Date(Date.now() + 7 * 86_400_000);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

export function MeetupWizardPage() {
  const {id} = useParams();
  const meetups = useMeetups();
  const members = useMembers();
  return (
    <QueryGate states={[meetups, members]}>
      {meetups.data && members.data && <MeetupWizard key={id ?? 'new'} meetups={meetups.data} members={members.data} editingId={id} />}
    </QueryGate>
  );
}

function MeetupWizard({meetups, members, editingId}: {meetups: Meetup[]; members: Member[]; editingId?: string}) {
  const navigate = useNavigate();
  const showToast = useToast();
  const existing = editingId ? meetups.find(m => m.id === editingId) : undefined;

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<MeetupDraft>(() =>
    existing
      ? {date: existing.date, topic: existing.topic, hostId: existing.hostId, agenda: [...existing.agenda], attendeeIds: existing.attendeeIds}
      : {date: defaultDate(), topic: '', hostId: '', agenda: [''], attendeeIds: []},
  );
  const [tried, setTried] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);

  const errors = useMemo(() => validateMeetup(draft, members), [draft, members]);
  const set = <K extends keyof MeetupDraft>(k: K, v: MeetupDraft[K]) => setDraft(d => ({...d, [k]: v}));
  // Errors only show for steps the user has already tried to leave (or the review step).
  const status = (f: MeetupField, forStep: number) => {
    const message = tried.has(forStep) ? errors[f] : undefined;
    return message ? ({type: 'error', message} as const) : undefined;
  };

  if (editingId && !existing) return <NotFoundPage what="meetup" />;

  const go = (to: number) => {
    setStep(to);
    // Move focus to the new step's heading so keyboard and screen-reader users land in the right place.
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const next = () => {
    setTried(t => new Set(t).add(step));
    if (errorsForStep(errors, step).length > 0) return;
    go(step + 1);
  };

  const save = async () => {
    setTried(t => new Set(t).add(2));
    const firstBad = [0, 1].find(s => errorsForStep(errors, s).length > 0);
    if (firstBad !== undefined) {
      setTried(t => new Set(t).add(firstBad));
      go(firstBad);
      return;
    }
    setIsSaving(true);
    try {
      const payload: MeetupDraft = {...draft, topic: draft.topic.trim(), agenda: draft.agenda.map(a => a.trim()).filter(Boolean)};
      const saved = existing ? await getStore().meetups.update(existing.id, payload) : await getStore().meetups.create(payload);
      showToast({body: existing ? 'Meetup updated.' : 'Meetup scheduled.', type: 'info'});
      navigate(`/meetups/${saved.id}`);
    } catch (e) {
      showToast({body: e instanceof Error ? e.message : 'Could not save meetup.', type: 'error'});
      setIsSaving(false);
    }
  };

  const hostName = members.find(m => m.id === draft.hostId)?.name;
  const cleanAgenda = draft.agenda.map(a => a.trim()).filter(Boolean);
  const setAgenda = (i: number, v: string) => set('agenda', draft.agenda.map((a, j) => (j === i ? v : a)));

  return (
    <PageLayout
      title={existing ? `Edit ${existing.topic}` : 'Schedule a meetup'}
      crumbs={[
        {label: 'Meetups', href: '/meetups'},
        ...(existing ? [{label: existing.topic, href: `/meetups/${existing.id}`}] : []),
        {label: existing ? 'Edit' : 'New'},
      ]}>
      <VStack gap={4} maxWidth={720}>
        <Stepper
          activeStep={step}
          label="Meetup setup progress"
          onStepClick={i => i < step && go(i)}
          horizontalOptions={{minimumStepWidth: 140, collapsedVariant: 'hiddenLabel'}}>
          {STEPS.map((label, i) => (
            <Step key={label} step={i} label={label} isDisabled={i > step} />
          ))}
        </Stepper>

        <Card>
          <VStack gap={5}>
            <div ref={headingRef} tabIndex={-1} style={{outline: 'none'}}>
              <Heading level={2}>
                Step {step + 1} of {STEPS.length}: {STEPS[step]}
              </Heading>
            </div>

            {step === 0 && (
              <FormLayout>
                <DateTimeInput
                  label="Date and time"
                  isRequired
                  timeIncrement={5}
                  value={draft.date ? (toLocalInput(draft.date) as ISODateTimeString) : undefined}
                  onChange={v => set('date', fromLocalInput(v))}
                  status={status('date', 0)}
                />
                <TextInput label="Topic" isRequired value={draft.topic} onChange={v => set('topic', v)} status={status('topic', 0)} autoComplete="off" hasAutoFocus />
              </FormLayout>
            )}

            {step === 1 && (
              <VStack gap={4}>
                <FormLayout>
                  <Selector
                    label="Host"
                    isRequired
                    hasSearch
                    placeholder="Choose a member"
                    value={draft.hostId}
                    onChange={v => set('hostId', v ?? '')}
                    options={members.map(m => ({value: m.id, label: m.name}))}
                    status={status('hostId', 1)}
                  />
                </FormLayout>
                <VStack gap={2}>
                  <Text type="label">
                    Agenda <Text color="secondary">· Required</Text>
                  </Text>
                  <Text type="supporting" color="secondary">
                    Add up to {MAX_AGENDA_ITEMS} items, in the order you will run them.
                  </Text>
                  {draft.agenda.map((a, i) => (
                    <HStack key={i} gap={2} vAlign="end">
                      <StackItem size="fill">
                        <TextInput label={`Agenda item ${i + 1}`} value={a} onChange={v => setAgenda(i, v)} autoComplete="off" />
                      </StackItem>
                      <IconButton
                        label={`Remove agenda item ${i + 1}`}
                        icon={<Icon icon={Trash2} />}
                        variant="ghost"
                        isDisabled={draft.agenda.length === 1}
                        onClick={() => set('agenda', draft.agenda.filter((_, j) => j !== i))}
                      />
                    </HStack>
                  ))}
                  {status('agenda', 1)?.message && <FieldStatus type="error" variant="detached" message={status('agenda', 1)!.message!} />}
                  <HStack>
                    <Button label="Add item" icon={<Icon icon={Plus} />} isDisabled={draft.agenda.length >= MAX_AGENDA_ITEMS} onClick={() => set('agenda', [...draft.agenda, ''])} />
                  </HStack>
                </VStack>
              </VStack>
            )}

            {step === 2 && (
              <VStack gap={3}>
                <Text color="secondary">Check the details, then {existing ? 'save your changes' : 'schedule the meetup'}.</Text>
                <MetadataList>
                  <MetadataListItem label="Topic">{draft.topic.trim() || '—'}</MetadataListItem>
                  <MetadataListItem label="When">
                    {draft.date ? <Timestamp value={draft.date} format="date_time" color="primary" type="body" /> : '—'}
                  </MetadataListItem>
                  <MetadataListItem label="Host">{hostName ?? '—'}</MetadataListItem>
                  <MetadataListItem label="Agenda">
                    <List listStyle="decimal" density="compact">
                      {cleanAgenda.map((a, i) => (
                        <ListItem key={i} label={a} />
                      ))}
                    </List>
                  </MetadataListItem>
                </MetadataList>
                {errorsForStep(errors, 2).length > 0 && (
                  <FieldStatus type="error" variant="detached" message="Some details are missing. Go back to fix them." />
                )}
              </VStack>
            )}

            <HStack gap={2} justify="between" wrap="wrap">
              <HStack gap={2}>
                {step > 0 && <Button label="Back" onClick={() => go(step - 1)} />}
                <Button label="Cancel" variant="ghost" href={existing ? `/meetups/${existing.id}` : '/meetups'} />
              </HStack>
              {step < 2 ? (
                <Button label="Next" variant="primary" onClick={next} />
              ) : (
                <Button label={existing ? 'Save changes' : 'Schedule meetup'} variant="primary" isLoading={isSaving} onClick={save} />
              )}
            </HStack>
          </VStack>
        </Card>
      </VStack>
    </PageLayout>
  );
}
