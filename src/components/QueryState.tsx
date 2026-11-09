import {useEffect, useState, type ReactNode} from 'react';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Grid} from '@astryxdesign/core/Grid';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import type {QueryState as State} from '../data/useStoreQuery';

export type SkeletonKind = 'table' | 'cards' | 'detail';

/** True only after `on` has stayed true for `ms`. Avoids a skeleton flash on instant loads. */
export function useDelayedFlag(on: boolean, ms = 150) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!on) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), ms);
    return () => clearTimeout(t);
  }, [on, ms]);
  return show;
}

export function LoadingSkeleton({kind = 'detail'}: {kind?: SkeletonKind}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label="Loading">
      {kind === 'table' && (
        <VStack gap={3}>
          <HStack gap={3}>
            <Skeleton width={240} height={36} />
            <Skeleton width={180} height={36} />
          </HStack>
          {Array.from({length: 6}, (_, i) => (
            <Skeleton key={i} width="100%" height={44} index={i} />
          ))}
        </VStack>
      )}
      {kind === 'cards' && (
        <Grid columns={{minWidth: 280}} gap={4}>
          {Array.from({length: 6}, (_, i) => (
            <Skeleton key={i} width="100%" height={150} index={i} />
          ))}
        </Grid>
      )}
      {kind === 'detail' && (
        <Grid columns={{minWidth: 320}} gap={4}>
          <Card>
            <VStack gap={3}>
              <Skeleton width={120} height={24} />
              <Skeleton width="100%" height={18} />
              <Skeleton width="80%" height={18} />
              <Skeleton width="60%" height={18} />
            </VStack>
          </Card>
          <Card>
            <VStack gap={3}>
              <Skeleton width={160} height={24} />
              <Skeleton width="100%" height={44} />
              <Skeleton width="100%" height={44} />
            </VStack>
          </Card>
        </Grid>
      )}
    </div>
  );
}

/** Loading / error gate. Shows a skeleton (after a short delay) while any query is loading. */
export function QueryGate({states, skeleton = 'detail', children}: {states: State<unknown>[]; skeleton?: SkeletonKind; children: ReactNode}) {
  const error = states.find(s => s.error)?.error;
  const isLoading = !error && states.some(s => s.isLoading && s.data === undefined);
  const showSkeleton = useDelayedFlag(isLoading);
  if (error) {
    return <EmptyState headingLevel={2} title="Something went wrong" description={error.message} actions={<Button label="Reload" onClick={() => window.location.reload()} />} />;
  }
  if (isLoading) return showSkeleton ? <LoadingSkeleton kind={skeleton} /> : null;
  return <>{children}</>;
}
