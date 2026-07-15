import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** Remounts the boundary (clears the error) when this changes. */
  resetKey?: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/runtime errors in a single module so one bad panel shows a
 * recoverable error card instead of white-screening the whole terminal.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props): void {
    // A new active tab clears a previous tab's error.
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[market-terminal] module crashed:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="state state-error">
          <div className="state-title">This module hit an error</div>
          <div className="state-detail">{this.state.error.message}</div>
          <div className="state-hint">
            Switch tabs and back, or re-run the command. The rest of the terminal is unaffected.
          </div>
          <button type="button" className="btn" onClick={() => this.setState({ error: null })}>
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
