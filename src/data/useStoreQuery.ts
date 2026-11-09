import {useCallback, useEffect, useRef, useState} from 'react';
import {getStore, type Store} from './store';

export interface QueryState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

/** Runs an async store query, re-running whenever the store changes. */
export function useStoreQuery<T>(query: (store: Store) => Promise<T>, deps: unknown[] = []): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({data: undefined, isLoading: true, error: undefined});
  const queryRef = useRef(query);
  queryRef.current = query;

  const run = useCallback(() => {
    let cancelled = false;
    queryRef.current(getStore()).then(
      data => !cancelled && setState({data, isLoading: false, error: undefined}),
      (error: Error) => !cancelled && setState(s => ({...s, isLoading: false, error})),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    setState(s => ({...s, isLoading: true}));
    let cancel = run();
    const unsub = getStore().subscribe(() => {
      cancel();
      cancel = run();
    });
    return () => {
      cancel();
      unsub();
    };
  }, [run]);

  return state;
}

export const useMembers = () => useStoreQuery(s => s.members.list());
export const useChallenges = () => useStoreQuery(s => s.challenges.list());
export const useSubmissions = () => useStoreQuery(s => s.submissions.list());
export const useProjects = () => useStoreQuery(s => s.projects.list());
export const useMeetups = () => useStoreQuery(s => s.meetups.list());
