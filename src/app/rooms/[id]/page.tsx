"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageGallery from "@/components/ImageGallery";
import Icon, { amenityIcon, type IconName } from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import AuthModal from "@/components/AuthModal";
import { findRoomById } from "@/lib/mock-data";
import { deleteLocalRoom, getLocalRoomById, updateLocalRoom } from "@/lib/local-rooms";
import { useSession } from "@/lib/session";
import { isAdmin, pushIncomingNotification, useAdminSettings } from "@/lib/admin";
import { isAutoOccupied } from "@/lib/auto-occupy";
import { useViewMode } from "@/lib/view-mode";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/language";
import type { Room } from "@/lib/types";

const REPORT_REASONS = [
  { value: "misleading", key: "room.report.reason.misleading" },
  { value: "priceWrong", key: "room.report.reason.priceWrong" },
  { value: "alreadyRented", key: "room.report.reason.alreadyRented" },
  { value: "suspicious", key: "room.report.reason.suspicious" },
  { value: "other", key: "room.report.reason.other" }
] as const;
type ReportReason = (typeof REPORT_REASONS)[number]["value"];

type RoomState = Room | "loading" | "missing";

export default function RoomDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const session = useSession();
  const viewMode = useViewMode();
  const t = useT();
  const [room, setRoom] = useState<RoomState>(() => findRoomById(params.id) ?? "loading");
  const [trackedId, setTrackedId] = useState(params.id);
  const [contactOpen, setContactOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [adminDeleteOpen, setAdminDeleteOpen] = useState(false);
  // Defer the Google Maps embed until the user explicitly asks for it. The
  // embed pulls www.google.com which is blocked by the dev preview tool, and
  // the iframe is heavy on initial load anyway.
  const [mapLoaded, setMapLoaded] = useState(false);
  const { autoOccupyDays } = useAdminSettings();

  // Reset state synchronously when the route param changes so we never
  // render the previous room under a new id.
  if (trackedId !== params.id) {
    setTrackedId(params.id);
    setRoom(findRoomById(params.id) ?? "loading");
  }

  useEffect(() => {
    if (findRoomById(params.id)) return;
    setRoom(getLocalRoomById(params.id) ?? "missing");
  }, [params.id]);

  useEffect(() => {
    if (!contactOpen && !locationOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setContactOpen(false);
        setLocationOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contactOpen, locationOpen]);

  useEffect(() => {
    if (!contactOpen && !locationOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [contactOpen, locationOpen]);

  if (room === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }
  if (room === "missing") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("room.notFound.title")}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {t("room.notFound.body")}
        </p>
        <Link href="/explore" className="btn-primary mt-6">
          {t("room.notFound.cta")}
        </Link>
      </div>
    );
  }

  const isOwner = session?.uid === room.owner.id;
  // Admin chrome: the admin has switched to "Admin" view and we're rendering
  // /rooms/[id] outside the admin shell. In that mode we surface moderation
  // actions in place of the renter-facing CTAs (Contact / Location), hide the
  // marketing footer, and drop the Similar Rooms strip.
  const adminViewActive = viewMode === "admin" && isAdmin(session);
  const effectivelyOccupied = room.isOccupied || isAutoOccupied(room, autoOccupyDays);
  const mapQuery =
    room.lat != null && room.lng != null
      ? `${room.lat},${room.lng}`
      : `${room.address}, ${room.city}`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const phoneNumbers = room.owner.phoneNumbers ?? [];
  const telegramPhones = room.owner.telegramPhones ?? [];
  const pricePeriod = room.pricePeriod ?? "monthly";
  const priceSuffix = t(`room.suffix.${pricePeriod}`);
  const rentLabel = t(`room.fee.rent.${pricePeriod}`);

  const fullAddress = [room.address, room.area, room.district, room.city]
    .filter(Boolean)
    .join(", ");

  const locationCard = (
    <section>
      <div className="mb-2 flex items-end justify-between">
        <h2 className="text-base font-semibold">{t("room.section.location")}</h2>
        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-brand hover:text-brand-dark"
        >
          {t("room.location.openMaps")}
        </a>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-start gap-2 border-b border-slate-200 px-3 py-2.5">
          <Icon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p className="text-xs font-medium leading-snug text-ink">{fullAddress}</p>
        </div>
        <div className="relative aspect-[16/9] w-full bg-slate-100 lg:aspect-[4/3]">
          {mapLoaded ? (
            <iframe
              title={`${room.title} — map`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <button
              type="button"
              onClick={() => setMapLoaded(true)}
              className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-muted transition hover:bg-slate-200/60"
            >
              <Icon name="map-pin" className="h-8 w-8 text-brand" />
              <span className="text-sm font-semibold text-ink">{t("room.location.showMap")}</span>
              <span className="text-[11px] text-ink-soft">{t("room.location.loadsGoogleMaps")}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );

  const ownerIdentity = (
    <>
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-brand/20">
        {room.owner.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.owner.avatarUrl}
            alt={room.owner.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-bold text-brand">
            {room.owner.name.trim().charAt(0).toUpperCase() || "?"}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-ink-soft">
          {t("room.host.listedBy")}
        </p>
        <p className="truncate font-semibold text-ink">{room.owner.name}</p>
        {!adminViewActive ? (
          <p className="mt-0.5 truncate text-[11px] font-medium text-brand">
            {t("room.host.viewProfile")}
          </p>
        ) : null}
      </div>
    </>
  );

  // Profile-link target: admins land in the moderation detail page, everyone
  // else (including signed-out renters) lands on the public host profile.
  const ownerProfileHref = adminViewActive
    ? `/user/admin/users/${room.owner.id}`
    : `/users/${room.owner.id}`;

  const hostCard = (
    <section>
      <h2 className="mb-3 text-base font-semibold lg:hidden">{t("room.section.host")}</h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <Link
          href={ownerProfileHref}
          className="-m-1 flex items-center gap-3 rounded-xl p-1 transition hover:bg-slate-50"
        >
          {ownerIdentity}
        </Link>

        <ul className="mt-4 space-y-2">
          {phoneNumbers.map((p) => (
            <ContactRow
              key={`tel-${p}`}
              icon="phone"
              label={t("room.contactLabel.phone")}
              value={p}
              href={`tel:${p.replace(/\s/g, "")}`}
            />
          ))}
          {telegramPhones.map((tg) => {
            const handle = `+${tg.replace(/\D/g, "")}`;
            return (
              <ContactRow
                key={`tg-${tg}`}
                icon="telegram"
                label={t("room.contactLabel.telegram")}
                value={tg}
                href={`https://t.me/${handle}`}
              />
            );
          })}
        </ul>

      </div>
    </section>
  );

  function handleSubmitReport() {
    if (!reportReason) return;
    const reporter = session?.username ?? session?.phoneNumber ?? t("room.report.guestName");
    const detailsLine = reportDetails.trim()
      ? t("room.report.notif.details", { value: reportDetails.trim() })
      : "";
    pushIncomingNotification({
      kind: "listing-flagged",
      title: t("room.report.notif.title"),
      body: t("room.report.notif.body", {
        reporter,
        title: (room as Room).title,
        reason: t(`room.report.reason.${reportReason}`),
        details: detailsLine
      }),
      relatedId: (room as Room).id
    });
    setReportSent(true);
  }

  return (
    // pb-24 clears the mobile sticky CTA / admin pill. The renter view drops
    // that padding on sm+ because the sticky bar is mobile-only there, but the
    // admin pill stays at every breakpoint, so keep the cushion when adminViewActive.
    <div className={adminViewActive ? "pb-28" : "pb-24 sm:pb-0"}>
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-8">
        <button
          type="button"
          onClick={() => {
            // router.back() is a no-op when the user opened this page from a
            // direct link (no history). Fall back to /explore so the button
            // always does something visible.
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/explore");
            }
          }}
          // h-9 gives a 36px touch target (a bit closer to Apple's 44px guideline
          // than the original ~20px text-only target). touch-action: manipulation
          // eliminates the 300ms tap delay that older mobile Safari versions add.
          style={{ touchAction: "manipulation" }}
          className="mb-3 -ml-2 inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-ink-muted transition hover:bg-slate-100 hover:text-brand active:scale-[0.98]"
        >
          <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
          {t("common.back")}
        </button>

        <ImageGallery images={room.images} title={room.title} typeLabel={room.type} />

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="space-y-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl">
                    {room.title}
                  </h1>
                  {adminViewActive ? <AdminStatusPill occupied={effectivelyOccupied} /> : null}
                </div>
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink-muted">
                  <Icon name="map-pin" className="h-4 w-4" />
                  {fullAddress}
                </p>
              </div>
              <div className="hidden shrink-0 whitespace-nowrap sm:block sm:pt-1">
                <span className="text-3xl font-semibold text-brand sm:text-4xl">
                  ${room.price}
                </span>
                <span className="ml-1 text-sm text-ink-muted">{priceSuffix}</span>
              </div>
            </header>

            {/*
              flex (natural width) instead of grid-cols-3 (stretches to fill).
              The chips cluster to the left with a consistent gap regardless
              of viewport width — fixes the huge empty gutters on desktop
              where the parent column is ~730px wide.
            */}
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:gap-x-8">
              <StatChip icon="bed" value={room.bedrooms} label={t("room.stat.bed")} />
              {room.areaSqm ? (
                <StatChip icon="ruler" value={room.areaSqm} label="m²" />
              ) : null}
              {room.floor != null ? (
                <StatChip icon="elevator" value={room.floor} label={t("room.stat.floor")} />
              ) : null}
            </ul>

            <section>
              <h2 className="mb-2 text-base font-semibold">{t("room.section.about")}</h2>
              <p className="text-sm leading-relaxed text-ink-muted">
                {room.description}
              </p>
            </section>

            {room.amenities.length > 0 ? (
              <section>
                <h2 className="mb-3 text-base font-semibold">{t("room.section.amenities")}</h2>
                <ul className="flex flex-wrap gap-2">
                  {room.amenities.map((a) => (
                    <li
                      key={a}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm"
                    >
                      <Icon name={amenityIcon(a)} className="h-4 w-4 text-brand" />
                      <span className="font-semibold text-ink">{a}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h2 className="mb-2 text-base font-semibold">{t("room.section.fees")}</h2>
              <dl className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <FeeRow label={rentLabel} value={`$${room.price} ${priceSuffix}`} />
                {room.deposit != null ? (
                  <FeeRow label={t("room.fee.deposit")} value={`$${room.deposit}`} />
                ) : null}
                {room.electricityPrice != null ? (
                  <FeeRow label={t("room.fee.electricity")} value={`$${room.electricityPrice} ${t("room.fee.electricity.unit")}`} />
                ) : null}
                {room.waterPrice != null ? (
                  <FeeRow label={t("room.fee.water")} value={`$${room.waterPrice} ${t("room.fee.water.unit")}`} />
                ) : null}
                {room.wifiPrice != null ? (
                  <FeeRow label={t("room.fee.wifi")} value={`$${room.wifiPrice} ${t("room.fee.wifi.unit")}`} />
                ) : null}
                {room.otherFees?.map((f) => (
                  <FeeRow key={f.label} label={f.label} value={f.amount} />
                ))}
              </dl>
            </section>

            <div className="hidden space-y-8 sm:block lg:hidden">
              {hostCard}
              {locationCard}
            </div>
          </div>

          <aside className="hidden space-y-4 lg:block">
            {hostCard}
            {locationCard}
          </aside>
        </div>


      </div>

      {/*
        Sticky action bar. Mobile-only when in renter view (the desktop layout
        keeps Contact/Location inline). In admin view it stays visible at every
        breakpoint so the admin always has the moderation tools within reach.
        - Solid bg + no backdrop-blur: backdrop-filter on `position: fixed`
          elements has historically caused event-handling glitches on iOS
          Safari where taps on the bar's children silently fail.
        - pb adds safe-area-inset for iPhone home indicator so the buttons
          don't sit under the device chrome.
        - touch-action: manipulation removes the 300ms tap delay.
      */}
      {adminViewActive ? (
        // Mobile: edge-to-edge bar (matches the global AdminFloatingNav chrome).
        // Desktop: centered floating pill so it doesn't span the whole window.
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[1050] flex justify-center sm:px-3"
          style={{ paddingBottom: "env(safe-area-inset-bottom)", touchAction: "manipulation" }}
        >
          <div className="pointer-events-auto grid w-full max-w-md grid-cols-2 items-start gap-1 border-t border-slate-200 bg-white/95 px-2 pb-2 pt-2 backdrop-blur sm:items-center sm:rounded-2xl sm:border sm:px-2 sm:py-2 sm:shadow-cardHover sm:mb-3">
            <AdminActionButton
              icon="shield"
              tone={effectivelyOccupied ? "amber" : "emerald"}
              label={t(
                effectivelyOccupied
                  ? "admin.rooms.action.markAvailable"
                  : "admin.rooms.action.markOccupied"
              )}
              onClick={() => {
                if (isAutoOccupied(room, autoOccupyDays)) {
                  // Auto-occupied: reset the clock rather than flipping isOccupied
                  updateLocalRoom(room.id, { isOccupied: false, lastActivityAt: Date.now() });
                  setRoom({ ...(room as Room), isOccupied: false, lastActivityAt: Date.now() });
                  toast.success(t("toast.admin.listing.available", { title: room.title }));
                } else {
                  const next = !room.isOccupied;
                  // When marking occupied by admin, preserve lastActivityAt so the
                  // auto-occupy clock is not reset to now.
                  updateLocalRoom(room.id, {
                    isOccupied: next,
                    ...(next ? { lastActivityAt: room.lastActivityAt ?? room.createdAt ?? Date.now() } : {})
                  });
                  setRoom({ ...(room as Room), isOccupied: next });
                  toast.success(
                    next
                      ? t("toast.admin.listing.occupied", { title: room.title })
                      : t("toast.admin.listing.available", { title: room.title })
                  );
                }
              }}
            />
            <AdminActionButton
              icon="trash"
              label={t("admin.rooms.action.delete")}
              danger
              onClick={() => setAdminDeleteOpen(true)}
            />
          </div>
        </div>
      ) : (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-3 sm:hidden"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)", touchAction: "manipulation" }}
        >
          <div className="flex items-center gap-2">
            <div className="shrink-0 whitespace-nowrap">
              <span className="text-xl font-extrabold leading-tight text-brand">${room.price}</span>
              <span className="ml-0.5 text-xs font-medium text-ink-muted">{priceSuffix}</span>
            </div>
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="btn-secondary h-11 flex-1 justify-center px-3"
            >
              <Icon name="map-pin" className="h-4 w-4" />
              {t("room.cta.location")}
            </button>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="btn-primary h-11 flex-1 justify-center px-3"
            >
              <Icon name="phone" className="h-4 w-4" />
              {t("room.cta.contact")}
            </button>
          </div>
        </div>
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          setReportReason(null);
          setReportDetails("");
          setReportSent(false);
          setReportOpen(true);
        }}
      />

      <ConfirmModal
        open={adminDeleteOpen}
        title={t("admin.rooms.delete.title")}
        body={
          <>
            <b>{(room as Room).title}</b>{t("admin.rooms.delete.body.suffix")}
          </>
        }
        onCancel={() => setAdminDeleteOpen(false)}
        onConfirm={() => {
          const title = (room as Room).title;
          deleteLocalRoom((room as Room).id);
          setAdminDeleteOpen(false);
          toast.success(t("toast.admin.listing.deleted", { title }));
          router.push("/user/admin");
        }}
      />

      <SheetModal
        open={contactOpen}
        title={t("room.section.host")}
        onClose={() => setContactOpen(false)}
      >
        <div className="overflow-y-auto p-4">
          <Link
            href={ownerProfileHref}
            onClick={() => setContactOpen(false)}
            className="-m-2 flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-brand/20">
              {room.owner.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={room.owner.avatarUrl}
                  alt={room.owner.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-bold text-brand">
                  {room.owner.name.trim().charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wide text-ink-soft">{t("room.host.listedBy")}</p>
              <p className="truncate font-semibold text-ink">{room.owner.name}</p>
              <p className="mt-0.5 truncate text-[11px] font-medium text-brand">
                {t("room.host.viewProfile")}
              </p>
            </div>
            <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-ink-soft" />
          </Link>
          <ul className="mt-4 space-y-2">
            {phoneNumbers.map((p) => (
              <ContactRow
                key={`tel-${p}`}
                icon="phone"
                label={t("room.contactLabel.phone")}
                value={p}
                href={`tel:${p.replace(/\s/g, "")}`}
              />
            ))}
            {telegramPhones.map((tg) => {
              const handle = `+${tg.replace(/\D/g, "")}`;
              return (
                <ContactRow
                  key={`tg-${tg}`}
                  icon="telegram"
                  label={t("room.contactLabel.telegram")}
                  value={tg}
                  href={`https://t.me/${handle}`}
                />
              );
            })}
          </ul>
        </div>
      </SheetModal>

      <SheetModal
        open={locationOpen}
        title={t("room.section.location")}
        onClose={() => setLocationOpen(false)}
        bodyClassName="flex flex-1 flex-col overflow-hidden"
        panelClassName="h-[85vh] sm:h-auto"
      >
        <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-3">
          <Icon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p className="text-sm font-medium leading-snug text-ink">{fullAddress}</p>
        </div>
        <div className="relative w-full flex-1 bg-slate-100 sm:aspect-[16/10] sm:flex-none">
          {mapLoaded ? (
            <iframe
              title={`${room.title} — map`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <button
              type="button"
              onClick={() => setMapLoaded(true)}
              className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-muted transition hover:bg-slate-200/60"
            >
              <Icon name="map-pin" className="h-10 w-10 text-brand" />
              <span className="text-sm font-semibold text-ink">{t("room.location.showMap")}</span>
              <span className="text-[11px] text-ink-soft">{t("room.location.loadsGoogleMaps")}</span>
            </button>
          )}
        </div>
        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          className="border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-brand hover:bg-brand/5"
        >
          {t("room.location.openMaps")}
        </a>
      </SheetModal>

      <SheetModal
        open={reportOpen}
        title={t("room.report.title")}
        onClose={() => setReportOpen(false)}
      >
        {reportSent ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Icon name="check" className="h-6 w-6" />
            </span>
            <h3 className="text-base font-semibold">{t("room.report.success.title")}</h3>
            <p className="max-w-sm text-sm text-ink-muted">
              {t("room.report.success.body")}
            </p>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="btn-primary mt-2"
            >
              {t("room.report.done")}
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <p className="text-sm text-ink-muted">
              {t("room.report.intro")}
            </p>
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {t("room.report.reason.label")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REPORT_REASONS.map((r) => {
                  const active = reportReason === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReportReason(r.value)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        active
                          ? "bg-brand text-white shadow-sm"
                          : "border border-slate-200 bg-white text-ink-muted hover:text-ink"
                      }`}
                    >
                      {t(r.key)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">
                {t("room.report.details.label")} <span className="font-normal text-ink-soft">{t("common.optional")}</span>
              </label>
              <textarea
                className="input min-h-[100px] resize-y"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder={t("room.report.details.placeholder")}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="btn-ghost"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={!reportReason}
                className="btn-primary disabled:opacity-50"
              >
                {t("room.report.submit")}
              </button>
            </div>
          </div>
        )}
      </SheetModal>
    </div>
  );
}

function SheetModal({
  open,
  title,
  onClose,
  children,
  panelClassName = "",
  bodyClassName = ""
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  bodyClassName?: string;
}) {
  const t = useT();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-cardHover sm:max-h-[80vh] sm:w-full sm:max-w-md sm:rounded-3xl ${panelClassName}`}
      >
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-slate-100 px-2 py-3">
          <span aria-hidden />
          <h2 className="text-center text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        {bodyClassName ? <div className={bodyClassName}>{children}</div> : children}
      </div>
    </div>
  );
}

function StatChip({
  icon,
  value,
  label
}: {
  icon: "bed" | "ruler" | "elevator";
  value: number | string;
  label: string;
}) {
  return (
    <li className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
      <Icon name={icon} className="h-4 w-4 text-brand" />
      <span className="text-sm">
        <span className="font-bold text-ink">{value}</span>
        <span className="ml-1 text-ink-muted">{label}</span>
      </span>
    </li>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href
}: {
  icon: "phone" | "telegram" | "email" | "wechat" | "facebook";
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="truncate text-sm font-semibold text-ink">{value}</p>
      </div>
    </>
  );
  return (
    <li>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
          className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 transition hover:border-brand hover:bg-brand/5"
        >
          {inner}
        </a>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
          {inner}
        </div>
      )}
    </li>
  );
}

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

function AdminStatusPill({ occupied }: { occupied: boolean }) {
  const t = useT();
  if (occupied) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {t("admin.status.occupied")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {t("admin.status.available")}
    </span>
  );
}

function AdminActionButton({
  icon,
  label,
  onClick,
  danger = false,
  tone
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  danger?: boolean;
  // Optional accent that matches the status pill semantics (amber = occupied,
  // emerald = available). Overrides the default neutral text color.
  tone?: "amber" | "emerald";
}) {
  const colorClass = danger
    ? "text-red-700 hover:bg-red-50"
    : tone === "amber"
      ? "text-amber-700 hover:bg-amber-50"
      : tone === "emerald"
        ? "text-emerald-700 hover:bg-emerald-50"
        : "text-ink-muted hover:bg-slate-50 hover:text-ink";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-2 text-[11px] font-semibold transition ${colorClass}`}
    >
      <Icon name={icon} className="h-5 w-5" />
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
}
