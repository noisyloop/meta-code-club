import type {ReactNode} from 'react';
import {Spinner} from '@astryxdesign/core/Spinner';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {VStack} from '@astryxdesign/core/Stack';
import type {QueryState as State} from '../data/useStoreQuery';

/** Minimal loading / error gate. Stage 6 swaps the spinner for skeletons. */
export function QueryGate({states, children}: {states: State<unknown>[]; children: ReactNode}) {
  const error = states.find(s => s.error)?.error;
  if (error) return <EmptyState title="Something went wrong" description={error.message} />;
  if (states.some(s => s.isLoading && s.data === undefined)) {
    return (
      <VStack align="center" padding={8}>
        <Spinner label="Loading" />
      </VStack>
    );
  }
  return <>{children}</>;
}
