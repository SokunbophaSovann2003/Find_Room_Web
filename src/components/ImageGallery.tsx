"use client";

import { useEffect, useState } from "react";
import Icon, { propertyIcon } from "./Icon";
import { useT } from "@/lib/language";

export default function ImageGallery({
  images,
  title,
  typeLabel
}: {
  images: string[];
  title: string;
  typeLabel?: string;
}) {
  const t = useT();
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const hero = images[active] ?? images[0];
  const thumbs = images.slice(0, 5);

  // Lock body scroll while the fullscreen viewer is open and close on Esc.
  // Arrow keys page through images.
  useEffect(() => {
    if (!viewerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setViewerOpen(false);
      else if (e.key === "ArrowRight") setActive((i) => (i + 1) % images.length);
      else if (e.key === "ArrowLeft") setActive((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [viewerOpen, images.length]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 lg:aspect-[16/10] lg:max-h-[560px]">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon
              name={propertyIcon(typeLabel ?? "")}
              className="h-32 w-32 text-slate-300 lg:h-40 lg:w-40"
              strokeWidth={1.4}
            />
          </div>
        )}
        {typeLabel ? (
          <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow">
            {t(`type.${typeLabel}`) || typeLabel}
          </span>
        ) : null}
        {images.length > 0 ? (
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold shadow transition hover:bg-white"
          >
            <Icon name="camera" className="h-4 w-4" />
            {t("gallery.photoCount", { n: images.length })}
          </button>
        ) : null}
      </div>

      {thumbs.length > 1 ? (
        <div className="flex gap-2">
          {thumbs.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-[4/3] h-16 overflow-hidden rounded-lg bg-slate-100 ring-2 transition sm:h-20 ${
                i === active ? "ring-brand" : "ring-transparent hover:ring-slate-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {viewerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("gallery.allPhotos.aria", { title })}
          className="fixed inset-0 z-[1100] flex flex-col bg-ink"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-semibold">
              {active + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              aria-label={t("common.close")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-3 sm:px-6">
            {images[active] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[active]}
                alt={`${title} ${active + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : null}

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
                  aria-label={t("gallery.prev.aria")}
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6 sm:h-12 sm:w-12"
                >
                  <Icon name="chevron-left" className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setActive((i) => (i + 1) % images.length)}
                  aria-label={t("gallery.next.aria")}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6 sm:h-12 sm:w-12"
                >
                  <Icon name="chevron-right" className="h-6 w-6" />
                </button>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="flex justify-center gap-2 overflow-x-auto px-3 pb-5 pt-2 sm:px-6">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={t("gallery.showPhoto.aria", { n: i + 1 })}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                    i === active ? "ring-white" : "ring-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
