import {Component, type ErrorInfo, type ReactNode} from 'react';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Button} from '@astryxdesign/core/Button';
import {HStack} from '@astryxdesign/core/Stack';
import {getStore} from '../data/store';

/** Catches render errors in a route so one bad record can't blank the whole app. */
export class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = {hasError: false};
  static getDerivedStateFromError() {
    return {hasError: true};
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route crashed:', error, info.componentStack);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <EmptyState
        headingLevel={1}
        title="Something went wrong"
        description="This page hit an unexpected error. Your data is untouched. Try again, or reset the demo data if the problem keeps happening."
        actions={
          <HStack gap={2}>
            <Button label="Try again" variant="primary" onClick={() => this.setState({hasError: false})} />
            <Button label="Reset demo data" onClick={() => void getStore().reset().then(() => this.setState({hasError: false}))} />
          </HStack>
        }
      />
    );
  }
}
