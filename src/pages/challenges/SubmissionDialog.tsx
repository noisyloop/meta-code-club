import {useMemo, useState, type FormEvent} from 'react';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Layout, LayoutContent, LayoutFooter} from '@astryxdesign/core/Layout';
import {HStack} from '@astryxdesign/core/Stack';
import {Button} from '@astryxdesign/core/Button';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import {Selector} from '@astryxdesign/core/Selector';
import {TextInput} from '@astryxdesign/core/TextInput';
import {useToast} from '@astryxdesign/core/Toast';
import {getStore} from '../../data/store';
import {validateSubmission, type SubmissionField} from '../../data/validation';
import type {Challenge, Member, Submission} from '../../data/types';

/** Add (editing undefined) or edit a challenge submission. One submission per member per challenge. */
export function SubmissionDialog({
  challenge,
  members,
  submissions,
  editing,
  isOpen,
  onClose,
}: {
  challenge: Challenge;
  members: Member[];
  submissions: Submission[];
  editing?: Submission;
  isOpen: boolean;
  onClose: () => void;
}) {
  // Re-mounted by the parent (via `key`) each time it opens, so state always starts fresh.
  const showToast = useToast();
  const [memberId, setMemberId] = useState(editing?.memberId ?? '');
  const [repoUrl, setRepoUrl] = useState(editing?.repoUrl ?? '');
  const [touched, setTouched] = useState<Set<SubmissionField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const errors = useMemo(
    () => validateSubmission({memberId, repoUrl}, challenge.id, members, submissions, editing?.id),
    [memberId, repoUrl, challenge.id, members, submissions, editing?.id],
  );
  const touch = (f: SubmissionField) => setTouched(t => new Set(t).add(f));
  const status = (f: SubmissionField) => {
    const message = submitted || touched.has(f) ? errors[f] : undefined;
    return message ? ({type: 'error', message} as const) : undefined;
  };

  // Members who haven't completed it yet (plus the one being edited).
  const done = new Set(submissions.filter(s => s.challengeId === challenge.id && s.id !== editing?.id).map(s => s.memberId));
  const options = members
    .filter(m => !done.has(m.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(m => ({value: m.id, label: m.name}));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setIsSaving(true);
    try {
      const payload = {memberId, repoUrl: repoUrl.trim()};
      if (editing) await getStore().submissions.update(editing.id, payload);
      else await getStore().submissions.create({...payload, challengeId: challenge.id, submittedAt: new Date().toISOString()});
      showToast({body: editing ? 'Submission updated.' : 'Submission added.', type: 'info'});
      onClose();
    } catch (err) {
      showToast({body: err instanceof Error ? err.message : 'Could not save submission.', type: 'error'});
      setIsSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={open => !open && onClose()} purpose="form" width={480}>
      <form onSubmit={onSubmit} noValidate>
        <Layout
          header={
            <DialogHeader
              title={editing ? 'Edit submission' : 'Submit a solution'}
              subtitle={challenge.title}
              onOpenChange={() => onClose()}
            />
          }
          content={
            <LayoutContent>
              <FormLayout>
                <Selector
                  label="Member"
                  isRequired
                  hasSearch
                  placeholder={options.length === 0 ? 'Everyone has submitted' : 'Choose a member'}
                  isDisabled={Boolean(editing) || options.length === 0}
                  value={memberId}
                  onChange={v => {
                    setMemberId(v ?? '');
                    touch('memberId');
                  }}
                  options={editing ? members.map(m => ({value: m.id, label: m.name})) : options}
                  status={status('memberId')}
                />
                <TextInput
                  label="Repository URL"
                  isRequired
                  type="url"
                  placeholder="https://github.com/you/solution"
                  value={repoUrl}
                  onChange={setRepoUrl}
                  onBlur={() => touch('repoUrl')}
                  status={status('repoUrl')}
                  autoComplete="off"
                />
              </FormLayout>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack gap={2} hAlign="end">
                <Button label="Cancel" variant="ghost" onClick={onClose} />
                <Button type="submit" label={editing ? 'Save changes' : 'Add submission'} variant="primary" isLoading={isSaving} />
              </HStack>
            </LayoutFooter>
          }
        />
      </form>
    </Dialog>
  );
}
