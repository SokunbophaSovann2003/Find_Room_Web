"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoomCard from "@/components/RoomCard";
import Icon from "@/components/Icon";
import LoadMoreSentinel from "@/components/admin/LoadMoreSentinel";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useRooms } from "@/lib/rooms";
import { useAdminSettings } from "@/lib/admin";
import { isAutoOccupied } from "@/lib/auto-occupy";
import { useT } from "@/lib/language";
import { toast } from "@/lib/toast";
import { copyToClipboard } from "@/lib/clipboard";
import type { Owner, Room } from "@/lib/types";

const HOST_PAGE_SIZE = 24;

export default function HostProfilePage() {
  const router = useRouter();
  const params = useParams<{ uid: string }>();
  const uid = decodeURIComponent(params.uid ?? "");
  const t = useT();
  const localRooms = useRooms();
  const { autoOccupyDays } = useAdminSettings();

  // Merge mock + local rooms the same way ExploreRooms does so admin-edited
  // listings (which live in localRooms under a "mock-" prefix) win over their
  // mock originals.
  const allRooms: Room[] = useMemo(() => {
    const seen = new Set<string>();
    const canonical = (id: string) => (id.startsWith("mock-") ? id.slice(5) : id);
    const roomList = isFirebaseConfigured ? localRooms : [...localRooms, ...MOCK_ROOMS];
    return roomList.filter((r) => {
      const key = canonical(r.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [localRooms]);

  // Renter-facing profile: hide occupied listings so the page only shows
  // rooms that are actually bookable. The owner's own /profile view is the
  // place to see the full portfolio.
  const ownerRooms = useMemo(
    () => allRooms.filter((r) => r.owner.id === uid),
    [allRooms, uid]
  );
  const availableRooms = useMemo(
    () => ownerRooms.filter((r) => !(r.isOccupied || isAutoOccupied(r, autoOccupyDays))),
    [ownerRooms, autoOccupyDays]
  );

  // Render a first page of cards, then reveal more on scroll. Reset when
  // viewing a different host.
  const [visibleCount, setVisibleCount] = useState(HOST_PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(HOST_PAGE_SIZE);
  }, [uid]);
  const shownRooms = availableRooms.slice(0, visibleCount);

  // Pick the most recently-created listing's owner snapshot for the header —
  // it has the freshest avatar/name.
  const owner: Owner | undefined = useMemo(() => {
    if (ownerRooms.length === 0) return undefined;
    return [...ownerRooms].sort((a, b) => b.createdAt - a.createdAt)[0].owner;
  }, [ownerRooms]);

  if (!owner) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-muted">
          <Icon name="user" className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("host.notFound.title")}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">{t("host.notFound.body")}</p>
        <Link href="/explore" className="btn-primary mt-6">
          {t("room.notFound.cta")}
        </Link>
      </div>
    );
  }

  const initial = owner.name.trim().charAt(0).toUpperCase() || "?";
  const occupiedCount = ownerRooms.length - availableRooms.length;

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = owner!.name;
    const text = t("host.summary.available.many", { n: availableRooms.length });
    const shareData = { title, text, url };
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        (!navigator.canShare || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        return;
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
    }
    if (await copyToClipboard(url)) {
      toast.success(t("toast.profile.linkCopied"));
    } else {
      toast.error(t("toast.profile.shareFailed"));
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
          } else {
            router.push("/explore");
          }
        }}
        style={{ touchAction: "manipulation" }}
        className="mb-3 -ml-2 inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-ink-muted transition hover:bg-slate-100 hover:text-brand active:scale-[0.98]"
      >
        <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
        {t("common.back")}
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/15 text-3xl font-bold text-brand ring-4 ring-brand/10">
            {owner.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={owner.avatarUrl}
                alt={owner.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {owner.name}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {t(
                availableRooms.length === 1
                  ? "host.summary.available.one"
                  : "host.summary.available.many",
                { n: availableRooms.length }
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink-muted shadow-sm transition hover:border-brand hover:text-brand active:scale-95"
          >
            <Icon name="share" className="h-4 w-4" />
            {t("profile.share")}
          </button>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl">
            {t("host.listings.heading")}
            <span className="ml-2 rounded-full bg-brand/10 px-2.5 py-0.5 text-sm font-semibold text-brand">
              {availableRooms.length}
            </span>
          </h2>
        </div>

        {availableRooms.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Icon name="home" className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-bold">{t("host.empty.title")}</h3>
            <p className="max-w-sm text-sm text-ink-muted">
              {occupiedCount > 0
                ? t(
                    occupiedCount === 1
                      ? "host.empty.allOccupied.one"
                      : "host.empty.allOccupied.many",
                    { n: occupiedCount }
                  )
                : t("host.empty.body")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {shownRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
            <LoadMoreSentinel
              hasMore={visibleCount < availableRooms.length}
              onLoadMore={() => setVisibleCount((c) => c + HOST_PAGE_SIZE)}
            />
          </>
        )}
      </section>
    </div>
  );
}
