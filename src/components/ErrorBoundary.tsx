"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[findroom] caught render error:", error);
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <h3 className="text-base font-bold">Something went wrong</h3>
        <p className="max-w-sm text-sm text-ink-muted">
          We hit an unexpected error rendering this section. Try again — if it
          keeps happening, refresh the page.
        </p>
        <button type="button" onClick={this.reset} className="btn-secondary">
          Try again
        </button>
      </div>
    );
  }
}
