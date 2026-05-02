"use client";

import { useState } from "react";
import Icon from "./Icon";

const TYPES = [
  { key: "all", label: "All" },
  { key: "studio", label: "Studio" },
  { key: "1-bedroom", label: "1-bedroom" },
  { key: "2-bedroom", label: "2-bedroom" },
  { key: "shared", label: "Shared" },
  { key: "apartment", label: "Apartment" }
];

export default function FilterBar() {
  const [active, setActive] = useState("all");

  return (
    <div className="flex items-center justify-between gap-3 overflow-x-auto">
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`chip whitespace-nowrap ${active === t.key ? "chip-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <button type="button" className="chip">
          <Icon name="chevron-down" className="h-4 w-4" />
          Price
        </button>
        <button type="button" className="chip">
          <Icon name="chevron-down" className="h-4 w-4" />
          Sort
        </button>
      </div>
    </div>
  );
}
