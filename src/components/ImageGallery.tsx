"use client";

import { useRef, useState } from "react";
import Icon, { propertyIcon } from "./Icon";
import { useT } from "@/lib/language";

// A swipeable photo slideshow: one image at a time, swipe on touch, arrows on
// desktop, and dots to jump. No thumbnail strip or fullscreen preview.
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
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const n = images.length;
  const go = (i: number) => setIndex((i + n) % n);

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 lg:aspect-[16/10] lg:max-h-[560px]">
      {n === 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <Icon
            name={propertyIcon(typeLabel ?? "")}
            className="h-32 w-32 text-slate-300 lg:h-40 lg:w-40"
            strokeWidth={1.4}
          />
        </div>
      ) : (
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (startX.current == null) return;
            const dx = e.changedTouches[0].clientX - startX.current;
            if (dx < -40) go(index + 1);
            else if (dx > 40) go(index - 1);
            startX.current = null;
          }}
        >
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src + i}
              src={src}
              alt={`${title} ${i + 1}`}
              className="h-full w-full shrink-0 object-cover"
              draggable={false}
            />
          ))}
        </div>
      )}

      {typeLabel ? (
        <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow">
          {t(`type.${typeLabel}`) || typeLabel}
        </span>
      ) : null}

      {n > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label={t("gallery.prev.aria")}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow transition hover:bg-white"
          >
            <Icon name="chevron-left" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label={t("gallery.next.aria")}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow transition hover:bg-white"
          >
            <Icon name="chevron-right" className="h-5 w-5" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t("gallery.showPhoto.aria", { n: i + 1 })}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
