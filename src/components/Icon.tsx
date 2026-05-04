import type { SVGProps } from "react";

type IconName =
  | "home"
  | "search"
  | "map-pin"
  | "bed"
  | "ruler"
  | "wifi"
  | "parking"
  | "ac"
  | "shield"
  | "elevator"
  | "pool"
  | "gym"
  | "kitchen"
  | "laundry"
  | "balcony"
  | "phone"
  | "message"
  | "user"
  | "menu"
  | "x"
  | "arrow-right"
  | "check"
  | "plus"
  | "camera"
  | "chevron-down"
  | "calendar"
  | "facebook"
  | "instagram"
  | "twitter"
  | "telegram"
  | "wechat"
  | "email";

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10.5Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M12 22s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  bed: (
    <>
      <path d="M3 20V9" />
      <path d="M3 13h18V9a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v4" />
      <path d="M21 20v-7" />
      <path d="M3 17h18" />
    </>
  ),
  ruler:<path d="M15.8 2.2 21.8 8.2a1 1 0 0 1 0 1.4l-12 12a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4l12-12a1 1 0 0 1 1.4 0Zm-1.6 2.4L8 10.8l1.5 1.5M11 7.8l1.5 1.5M14 4.8l1.5 1.5M5 13.8l1.5 1.5M8 10.8l1.5 1.5" />,
  wifi: (
    <>
      <path d="M2 9a15 15 0 0 1 20 0" />
      <path d="M5 12.5a10 10 0 0 1 14 0" />
      <path d="M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="1" />
    </>
  ),
  parking: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 17V7h4a3 3 0 1 1 0 6H9" />
    </>
  ),
  ac: (
    <>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <path d="M7 15v1M12 15v1M17 15v1M5 19l1-1M12 19v1M19 19l-1-1" />
    </>
  ),
  shield: <path d="M12 2 4 5v7c0 4.5 3.5 8.5 8 10 4.5-1.5 8-5.5 8-10V5l-8-3Z" />,
  elevator: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 9l3-3 3 3M9 15l3 3 3-3" />
    </>
  ),
  pool: (
    <>
      <path d="M2 20c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1" />
      <path d="M6 14V6a2 2 0 0 1 4 0v10" />
      <path d="M14 14V6a2 2 0 0 1 4 0v10" />
      <path d="M6 10h8" />
    </>
  ),
  gym: <path d="M4 14h2v-2H4v2Zm14 0h2v-2h-2v2ZM7 17h2V7H7v10Zm8 0h2V7h-2v10Zm-4-4h2v-2h-2v2Z" />,
  kitchen: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 10h16" />
      <circle cx="8" cy="6.5" r="0.8" />
      <circle cx="12" cy="6.5" r="0.8" />
      <path d="M12 13v5" />
    </>
  ),
  laundry: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="14" r="4.5" />
      <circle cx="8" cy="6.5" r="0.8" />
      <circle cx="16" cy="6.5" r="0.8" />
    </>
  ),
  balcony: (
    <>
      <path d="M3 10h18" />
      <path d="M5 10v11M19 10v11M9 10v11M15 10v11" />
      <path d="M3 21h18" />
      <path d="M7 10V4a5 5 0 0 1 10 0v6" />
    </>
  ),
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  message: <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2Z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  x: <path d="M6 6l12 12M6 18L18 6" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="m5 12 5 5L20 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  facebook: <path d="M13 22v-8h3l1-4h-4V7.5c0-1.1.3-2 2-2h2V2h-3c-3 0-5 1.7-5 5v3H6v4h3v8h4Z" />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </>
  ),
  twitter: <path d="M22 5.5c-.7.3-1.4.5-2.2.6.8-.5 1.4-1.3 1.7-2.2-.8.5-1.6.8-2.5 1a3.9 3.9 0 0 0-6.7 3.6A11 11 0 0 1 3 4.8a3.9 3.9 0 0 0 1.2 5.2c-.6 0-1.2-.2-1.7-.4 0 1.9 1.3 3.5 3.1 3.9-.5.1-1.1.2-1.7.1.5 1.5 2 2.6 3.8 2.7A7.9 7.9 0 0 1 2 18.3 11.2 11.2 0 0 0 8.1 20c7.3 0 11.3-6 11.3-11.3v-.5c.8-.5 1.5-1.2 2-2Z" />,
  telegram: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 8-3-1.5 7L11 14l-1.5 2.5L9 13l-1-1Z" />
    </>
  ),
  wechat: (
    <>
      <path d="M8.5 4C4.9 4 2 6.6 2 9.8c0 1.8 1 3.4 2.5 4.4l-.6 2 2.4-1.2c.7.2 1.4.3 2.2.3.2 0 .4 0 .6-.1-.2-.6-.3-1.2-.3-1.8 0-3 2.8-5.4 6.3-5.4h.3C14.7 5.8 11.9 4 8.5 4Zm-2 3.2a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Zm4 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Z" />
      <path d="M21.5 13.8c0-2.6-2.4-4.8-5.5-4.8s-5.5 2.2-5.5 4.8 2.4 4.8 5.5 4.8c.6 0 1.3-.1 1.8-.3l2 1-.5-1.7c1.3-.9 2.2-2.2 2.2-3.8Zm-7-1.2a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2Zm3 0a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2Z" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 7 9-7" />
    </>
  )
};

export default function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.8,
  ...rest
}: { name: IconName; className?: string; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

export function amenityIcon(amenity: string): IconName {
  const a = amenity.toLowerCase();
  if (a.includes("wifi")) return "wifi";
  if (a.includes("parking")) return "parking";
  if (a.includes("air") || a === "ac") return "ac";
  if (a.includes("security")) return "shield";
  if (a.includes("elevator") || a.includes("lift")) return "elevator";
  if (a.includes("pool")) return "pool";
  if (a.includes("gym")) return "gym";
  if (a.includes("kitchen")) return "kitchen";
  if (a.includes("laundry")) return "laundry";
  if (a.includes("balcony")) return "balcony";
  return "check";
}
