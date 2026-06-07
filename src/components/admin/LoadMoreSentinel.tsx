"use client";

import { useEffect, useRef, useState } from "react";

// Infinite-scroll trigger. Renders a spinner while there are more items and,
// when scrolled into view, calls onLoadMore (after a short delay so the spinner
// is visible). Re-checks after each load so a tall viewport keeps filling until
// the sentinel leaves the screen.
export default function LoadMoreSentinel({
  hasMore,
  onLoadMore,
  className = ""
}: {
  hasMore: boolean;
  onLoadMore: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    if (!hasMore) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadingRef.current = true;
          window.setTimeout(() => {
            onLoadMoreRef.current();
            loadingRef.current = false;
            setTick((t) => t + 1);
          }, 500);
        }
      },
      { rootMargin: "150px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, tick]);

  if (!hasMore) return null;

  return (
    <div ref={ref} className={`flex justify-center py-4 ${className}`}>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
    </div>
  );
}
