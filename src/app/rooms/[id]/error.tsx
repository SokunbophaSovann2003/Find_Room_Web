"use client";

import Link from "next/link";

export default function RoomDetailError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        We hit an error showing this listing. Try again, or head back to
        Explore.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <button type="button" onClick={reset} className="btn-secondary">
          Try again
        </button>
        <Link href="/explore" className="btn-primary">
          Back to Explore
        </Link>
      </div>
    </div>
  );
}
