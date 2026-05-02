"use client";

import { useState } from "react";
import Icon from "./Icon";

export default function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const hero = images[active] ?? images[0];
  const thumbs = images.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 lg:aspect-[16/10] lg:max-h-[560px]">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={title} className="h-full w-full object-cover" />
        ) : null}
        <button
          type="button"
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold shadow"
        >
          <Icon name="camera" className="h-4 w-4" />
          {images.length} photos
        </button>
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
    </div>
  );
}
