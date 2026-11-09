import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Button} from '@astryxdesign/core/Button';
import {PageLayout} from '../components/PageLayout';

export function NotFoundPage({what = 'page'}: {what?: string}) {
  return (
    <PageLayout title="Not found">
      <EmptyState
        title={`We couldn't find that ${what}`}
        description="It may have been deleted, or the link is wrong."
        actions={<Button label="Back to dashboard" href="/" variant="primary" />}
      />
    </PageLayout>
  );
}
