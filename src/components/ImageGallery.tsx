"use client";

import { useEffect, useState } from "react";
import Icon, { propertyIcon } from "./Icon";

export default function ImageGallery({
  images,
  title,
  typeLabel
}: {
  images: string[];
  title: string;
  typeLabel?: string;
}) {
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const hero = images[active] ?? images[0];
  const thumbs = images.slice(0, 5);

  // Lock body scroll while the fullscreen viewer is open and close on Esc.
  useEffect(() => {
    if (!viewerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setViewerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [viewerOpen]);

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
          <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold capitalize text-white shadow">
            {typeLabel}
          </span>
        ) : null}
        {images.length > 0 ? (
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold shadow transition hover:bg-white"
          >
            <Icon name="camera" className="h-4 w-4" />
            {images.length} photos
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
          aria-label={`${title} — all photos`}
          className="fixed inset-0 z-[1100] flex flex-col bg-ink/95"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-semibold">
              {images.length} {images.length === 1 ? "photo" : "photos"}
            </span>
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-6 sm:px-6">
            <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
              {images.map((src, i) => (
                <li
                  key={src + i}
                  className="overflow-hidden rounded-xl bg-slate-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${title} ${i + 1}`}
                    className="h-full w-full object-contain"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
