"use client";

import { Component, type ReactNode } from "react";
import { useT } from "@/lib/language";

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
    return <DefaultFallback onReset={this.reset} />;
  }
}

function DefaultFallback({ onReset }: { onReset: () => void }) {
  const t = useT();
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <h3 className="text-base font-bold">{t("errorBoundary.title")}</h3>
      <p className="max-w-sm text-sm text-ink-muted">{t("errorBoundary.body")}</p>
      <button type="button" onClick={onReset} className="btn-secondary">
        {t("common.tryAgain")}
      </button>
    </div>
  );
}
