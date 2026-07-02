# JoulKH — Project Status

_Last updated: 2026-05-28. Source of truth: actual code in `src/`._

---

## 1. Team

- **Bobe** — business co-founder (strategy, scope, pitch)
- Technical team handles development (names TBD)

---

## 2. Product Vision

A web marketplace for room rentals in Cambodia. Every account is both renter and landlord — no separate roles. The differentiator versus Facebook groups is permanent, structured listings with fields for price, deposit, utilities, amenities, and availability status.

---

## 3. MVP Scope (Bobe's 5 user actions)

1. Create / log in to an account
2. See a list of rooms on the Explore screen
3. See a room detail page
4. List a new room / edit an existing room
5. View other user profiles and the rooms they have listed

---

## 4. Page Routes

| Route | Screen | Status |
|---|---|---|
| `/` | Redirects to `/explore` | ✅ Done |
| `/explore` | Explore screen — listing grid + map tab + search/filter | ✅ Done |
| `/rooms/[id]` | Room detail — photos, fees, amenities, contact, map | ✅ Done |
| `/profile` | Logged-in user profile — info, my listings (grid/list/table views) | ✅ Done |
| `/profile/list-room` | Create / edit listing form (multi-step, photo upload, map pin) | ✅ Done |
| `/profile/notifications` | User notifications — outbound campaigns from admin | ✅ Done |
| `/users/[uid]` | Public host profile — owner info + their active listings | ✅ Done |
| `/user/admin` | Admin: listings management — stats, filters, availability toggle, delete | ✅ Done |
| `/user/admin/users` | Admin: user management — list, add, edit, enable/disable, delete | ✅ Done |
| `/user/admin/users/[uid]` | Admin: individual user detail with their listings | ✅ Done |
| `/user/admin/notifications` | Admin: incoming events + outbound campaign sender | ✅ Done |
| `/user/admin/settings` | Admin: platform settings — site info, moderation, taxonomy, pricing defaults, auto-occupy | ✅ Done |

> Note: README references `/login` and `/register` routes. Those pages do not exist. Auth is handled through an `AuthModal` overlay triggered from any page.

---

## 5. Current Build State

### 5.1 Authentication

Phone-to-email bridge: a phone number is packed as `<digits>@findroom.app` and passed to Firebase Email+Password auth. When Firebase environment variables are absent the app runs in **demo mode** — any credentials are accepted and the session is stored in `localStorage`. Login, register, and forgot-password flows all live inside the `AuthModal` component.

Admin identity is determined by a hardcoded UID allowlist (`SEED_ADMIN_UIDS` in `admin.ts`) plus any user whose admin-store entry has `role === "admin"` and `status === "active"`. Demo admin phone: `+855 12 000 000`.

### 5.2 Data Layer

All listing and user data is **client-side only**. No Firestore reads or writes occur anywhere in the codebase today.

| Store | Key | Managed by |
|---|---|---|
| User-created rooms | `findroom.local-rooms` | `src/lib/local-rooms.ts` |
| Admin user directory | `findroom.admin-users` | `src/lib/admin.ts` |
| Admin settings | `findroom.admin-settings` | `src/lib/admin.ts` |
| Admin notifications | `findroom.admin-notifications` | `src/lib/admin.ts` |
| Admin UID allowlist | `findroom.admin-uids` | `src/lib/admin.ts` |
| Language preference | `findroom.language` | `src/lib/language.ts` |
| Session | `findroom.session` | `src/lib/session.ts` |

**MOCK_ROOMS** — 30 hardcoded listings in `src/lib/mock-data.ts` covering Phnom Penh, Siem Reap, Sihanoukville, Battambang, Kampot, Kep, and Kandal. On first admin visit these are seeded into `findroom.local-rooms` with a `mock-` id prefix. The Explore screen deduplicates by canonical id so the same room never appears twice.

**Firestore** is initialised in `src/lib/firebase.ts` (reads env vars) but no page or component performs any Firestore read or write today.

### 5.3 Room Data Model (`src/lib/types.ts`)

```ts
interface Room {
  id: string;
  title: string;
  description: string;
  price: number;
  pricePeriod?: "daily" | "weekly" | "monthly" | "yearly";
  currency: "USD" | "KHR";
  deposit?: number;
  waterPrice?: number;
  electricityPrice?: number;
  wifiPrice?: number;
  otherFees?: { label: string; amount: string }[];
  type: "room" | "house" | "apartment" | "condo" | "flat" | "villa";
  address: string;
  city: string;
  district?: string;
  area?: string;
  lat?: number;
  lng?: number;
  images: string[];           // browser JPEG data URLs
  bedrooms: number;
  areaSqm?: number;
  floor?: number;
  amenities: string[];
  availableFrom?: string;     // ISO date
  isOccupied?: boolean;       // manually marked by owner or admin
  lastActivityAt?: number;    // ms epoch — set on create/edit/toggle; drives auto-occupy
  owner: Owner;
  createdAt: number;          // ms epoch
}
```

### 5.4 Auto-Occupy Feature (`src/lib/auto-occupy.ts`)

Implemented. Every room tracks `lastActivityAt` (set on create, edit, or availability toggle). After N days of inactivity on an Available room, it is **automatically treated as Occupied** — silently, with no stored mutation. The occupied state is **derived on every read** so no background job is needed.

Rules:
- `isAutoOccupied(room, thresholdDays)` — returns `true` if `Date.now() - lastActivityAt >= N * 86_400_000` AND `room.isOccupied` is falsy
- `daysSinceActivity(room)` — full days elapsed since the last activity timestamp
- N is configurable by admin (default 30, minimum 7) via `/user/admin/settings`
- Auto-occupied rooms are hidden from the Explore screen
- On `/profile`, auto-occupied listings show an amber banner: "Auto-marked Occupied — no activity for X days. Tap to mark Available again." Clicking "Mark Available" resets `lastActivityAt` to now
- `ListingActionMenu` correctly computes `effectivelyOccupied = room.isOccupied || isAutoOccupied(...)` and shows the right label and toggle action
- `getLocalRooms()` back-fills `lastActivityAt = createdAt` for rooms that pre-date the field, preventing instant mass expiry on upgrade

### 5.5 Explore Screen (`/explore`)

- Listing grid (default) with room cards; map view tab (react-leaflet, lazy-loaded)
- Filter bar: text search (title, address, owner, district), property type, location (province / district / area), created date range, price range
- `ExploreFilterContext` provides filter state to both the grid and the map
- Auto-occupied and manually-occupied rooms are excluded from the Explore feed
- `ExploreRooms` merges `MOCK_ROOMS` and localStorage rooms, deduplicates by canonical id, applies filters, then strips auto-occupied rooms

### 5.6 Listing Form (`/profile/list-room`)

Multi-step form. Fields: property type, title, description, price/currency/period, deposit, utilities (water, electricity, Wi-Fi), other fees, location (province / district / area / full address), map pin, bedrooms, area (m²), floor, amenities, available-from date, up to 5 photos.

Photos are downscaled to JPEG data URLs in-browser (`src/lib/image.ts`, max 10 MB each). They are **not** uploaded to Firebase Storage — they live inside the localStorage room record.

Edit mode: `?editing=<id>` loads the existing room into the form. Copy mode: `?copyFrom=<id>` pre-fills fields from another room.

On save, `lastActivityAt` is set to `Date.now()` so the auto-occupy clock resets.

### 5.7 Profile Page (`/profile`)

Three listing views switchable by the user: grid cards, list rows, desktop table. Each view shows:
- Listing image, title, type badge, price
- Status pill: Available (green) or Occupied (amber) — uses `effectivelyOccupied` (manual OR auto)
- For auto-occupied rooms: amber banner with "Mark Available" button that resets `lastActivityAt`
- `ListingActionMenu` (⋮): Mark Occupied / Mark Available, Edit, Copy, Delete

Back button always navigates to `/explore` regardless of browser history.

### 5.8 Admin Panel

#### `/user/admin` — Rooms Management

- **Stats row**: Total rooms, Available, Occupied, Property types — all computed using `effectivelyOccupied` (accounts for auto-occupy)
- **Filter bar**: text search, status (any/available/occupied), property type, location, created date range, price range
- **Rooms table** (desktop) columns: Listing, Owner, Location, Price, Status, **Days Available**, Actions
  - "Days Available" column: shows `daysSinceActivity(room)` (in days) for available rooms; blank for occupied rooms
  - Column header is a clickable sort button: cycles null → desc (large→small) → asc (small→large) → null; turns brand-green when active
  - Column is hidden entirely when all visible rooms are occupied (e.g. when the status filter is set to "Occupied"); `colSpan` adjusts automatically
  - `sortDays` state resets to null whenever the column is hidden so stale sort state never persists
- **Mobile cards**: same data as desktop, including the days count inline with the status pill; sort applies to mobile too
- Row actions (⋮): Mark Available / Mark Occupied (correct label for auto-occupied rooms), Delete

#### `/user/admin/users` — User Management

- User directory: list view with avatar, name, phone, email, role, status, join date
- Actions: add user, edit user, enable/disable (toggle status), delete
- Per-user detail page (`/user/admin/users/[uid]`): user info + their listings via `AdminRoomsList` with owner column hidden

#### `/user/admin/notifications` — Notifications Hub

- Incoming event feed: user-registered, listing-posted, listing-flagged, system events
- Mark read / mark all read / delete
- Outbound campaign sender: compose + send a notification to all users (stored in localStorage)

#### `/user/admin/settings` — Platform Settings

| Section | Fields |
|---|---|
| General | Site name, support email, support phone, default currency |
| Moderation | Auto-publish listings, require phone verification, email alerts on reports, **auto-occupy threshold (days, min 7, default 30)** |
| Taxonomy | Active property types (toggle each), amenities list (add/remove) |
| Pricing defaults | Default price period, water price ($/m³), electricity price ($/kWh), Wi-Fi price ($/month), KHR/USD exchange rate |

### 5.9 Multi-Language

Implemented. `src/lib/language.ts` holds a ~500-key Khmer/English dictionary. Default is Khmer. All major UI strings are translated. `LanguageToggle` switches language and persists to `localStorage`. Translation keys use `{placeholder}` interpolation.

### 5.10 Map

- **Explore map**: react-leaflet, lazy-loaded. Markers for all visible (non-occupied) rooms. Clicking a marker navigates to the room detail. Map bounds drive the "X rooms in this area" counter.
- **Listing pin picker**: `MapPinPicker` in the list-room form lets the owner drop a pin at the exact location.
- **Room detail map**: lazy-loaded Google Maps iframe, deferred until the user taps "Show map". Falls back to a `district, city` query when no lat/lng is stored.

### 5.11 Navigation

- **Navbar** (desktop): logo, bell icon (user notifications with unread badge), language toggle, admin shield (if admin), avatar / sign-in button
- **BottomNav** (mobile): Rooms, Users, Notifications, Settings — visible only in the admin section; rendered via `AdminFloatingNav`
- **Back button behaviour**: on both `/profile` and `/profile/notifications`, the Back button always navigates to `/explore`, never uses `router.back()`, regardless of browser history depth

---

## 6. Source File Inventory

### Pages
```
src/app/page.tsx                              → redirect to /explore
src/app/explore/page.tsx                      → explore screen
src/app/rooms/[id]/page.tsx                   → room detail
src/app/rooms/[id]/error.tsx                  → error boundary for room detail
src/app/profile/page.tsx                      → user profile + my listings
src/app/profile/list-room/page.tsx            → create/edit listing form
src/app/profile/notifications/page.tsx        → user notifications
src/app/users/[uid]/page.tsx                  → public host profile
src/app/user/admin/page.tsx                   → admin rooms management
src/app/user/admin/users/page.tsx             → admin user list
src/app/user/admin/users/[uid]/page.tsx       → admin user detail
src/app/user/admin/notifications/page.tsx     → admin notifications hub
src/app/user/admin/settings/page.tsx          → admin settings
src/app/layout.tsx                            → root layout
src/app/profile/layout.tsx                    → profile layout (auth guard)
src/app/user/admin/layout.tsx                 → admin layout (admin guard)
```

### Components
```
src/components/ExploreHero.tsx                → hero search bar on /explore
src/components/ExploreRooms.tsx               → grid/map tabs + room list
src/components/ExploreMap.tsx                 → react-leaflet map
src/components/ExploreFilterContext.tsx       → shared filter state (Context)
src/components/RoomCard.tsx                   → listing card used in grid
src/components/ImageGallery.tsx               → full-screen photo gallery on room detail
src/components/ListingActionMenu.tsx          → ⋮ menu on listing cards (edit/copy/delete/toggle)
src/components/Navbar.tsx                     → top navigation bar
src/components/BottomNav.tsx                  → bottom navigation (mobile)
src/components/Footer.tsx                     → site footer
src/components/AuthModal.tsx                  → login / register / forgot-password overlay
src/components/AuthGuard.tsx                  → redirect-to-login wrapper for protected routes
src/components/Icon.tsx                       → SVG icon library (50+ named icons)
src/components/Toaster.tsx                    → toast notification renderer
src/components/ErrorBoundary.tsx              → React error boundary
src/components/LanguageToggle.tsx             → KM/EN language switcher
src/components/HtmlLangSync.tsx               → syncs <html lang> to chosen language
src/components/LocationPicker.tsx             → province/district/area cascade picker
src/components/MapPinPicker.tsx               → drop-a-pin map widget for listing form
src/components/PropertyTypePicker.tsx         → property type selector
src/components/ContactListEditor.tsx          → multi-contact editor (phone, Telegram, email)
src/components/DateRangePicker.tsx            → from/to date range input
src/components/PriceRangePicker.tsx           → min/max price input
src/components/OptionPicker.tsx               → multi-select chip picker (amenities, etc.)
src/components/SelectField.tsx                → custom dropdown select
src/components/ConfirmModal.tsx               → generic confirmation dialog

src/components/admin/AdminShell.tsx           → admin page wrapper with nav
src/components/admin/AdminFloatingNav.tsx     → mobile floating bottom nav for admin
src/components/admin/AdminRoomsList.tsx       → shared rooms table + mobile cards (admin)
src/components/admin/ListingEditModal.tsx     → inline listing editor modal (admin)
src/components/admin/UserFormModal.tsx        → add/edit user modal (admin)
```

### Libraries
```
src/lib/types.ts              → TypeScript interfaces: Room, Owner, PropertyType, PricePeriod
src/lib/auto-occupy.ts        → isAutoOccupied(), daysSinceActivity() — pure, no side effects
src/lib/local-rooms.ts        → CRUD for localStorage room store + useLocalRooms() hook
src/lib/admin.ts              → admin user/notification/settings stores + hooks
src/lib/mock-data.ts          → 30 hardcoded MOCK_ROOMS listings
src/lib/firebase.ts           → Firebase app init (reads env vars; no-op in demo mode)
src/lib/auth.ts               → Firebase auth helpers (phone-to-email bridge)
src/lib/session.ts            → session read/write helpers + useSession() hook
src/lib/language.ts           → Khmer/English dictionary + useT() translation hook
src/lib/locations.ts          → Cambodia province/district/area data + getLocationFocus()
src/lib/image.ts              → client-side JPEG downscaler for photo uploads
src/lib/toast.ts              → toast.success() / toast.error() helpers
src/lib/profile-overrides.ts  → username/avatar overrides stored in localStorage
src/lib/list-room-prefs.ts    → persists last-used property type in the listing form
src/lib/view-mode.ts          → persists grid/list/table view choice on /profile
src/lib/use-desktop.ts        → responsive breakpoint hook
src/lib/use-keyboard-open.ts  → detects soft keyboard open (mobile)
```

---

## 7. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18, TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Map | react-leaflet (Explore map + listing pin picker) |
| Auth | Firebase Authentication (Email+Password, phone-to-email bridge) |
| Database | Firebase Firestore — **initialised but not yet used** |
| Storage | Firebase Storage — **initialised but not yet used** |
| Data (current) | localStorage only — all listing, user, and settings data |
| Language | runtime Khmer/English dictionary (no i18n library) |

---

## 8. What Is NOT Built Yet

- **Real Firestore integration** — `firebase.ts` is wired but no page reads/writes Firestore; all data is localStorage
- **Firebase Storage upload** — images stored as browser JPEG data URLs inside the localStorage room record, not in cloud storage
- **Standalone `/login` and `/register` pages** — auth is modal-only; the routes do not exist
- **In-app messaging** — renters have no way to contact a landlord inside the app; room detail shows phone/Telegram contact info only
- **Payment flow** — no payment gateway, invoice, or billing screen exists
- **Rental contracts** — no contract generation or signing flow
- **Email or SMS notifications** — notifications exist inside the app (localStorage) only; no outbound email or SMS delivery
- **Ratings and reviews** — no review system for rooms or landlords
- **Verification badges** — no identity verification for hosts or renters
- **Bedroom count and floor-area search filters** — price, date, type, and location filters exist; bedroom count and m² range filters do not
- **Public admin protection** — admin UID allowlist lives in localStorage and is trivially tamperable; must be replaced with a server-side check before any real deployment
- **Demo mode retirement** — currently any password is accepted in demo mode; real Firebase credentials must be configured before public launch

---

## 9. Known Technical Debt

- **No server-side rendering for data** — everything is client-rendered from localStorage; Firestore integration will require a data-fetching layer (React Server Components or SWR/React Query)
- **Image data URLs in localStorage** — photos encoded as base64 JPEG data URLs can exceed localStorage quota with multiple high-resolution photos; Firebase Storage upload is the correct fix
- **No optimistic UI for room mutations** — `updateLocalRoom` dispatches a storage event and React re-renders synchronously, which works in demo mode but would need rethinking with async Firestore writes
- **Mock data uid mapping** — `LEGACY_OWNER_TO_DEMO_UID` in `admin.ts` maps short owner ids (sokha, dara…) to `demo-*` uids; this mapping must be removed when real user accounts replace mock data
- **No pagination** — the Explore grid and all admin tables render all items at once; will need pagination or virtual scrolling with real data at scale

---

## 10. Hallucinations Found in Older Documents

- **Flutter mobile app named `findroom_kh`** — no such app exists anywhere in this repository; the README references it but the code does not
- **AI-invented co-founder name** — appeared in older AI-generated documents; no such person is on the team

---

## 11. Open Strategic Questions (TBD — Bobe to decide)

- When does Firestore integration ship? What is the data migration path from localStorage mock data?
- Firebase Storage for images — at launch, or after?
- Which neighbourhood or university area is the first launch target?
- When does the first paid feature appear, and what is it?
- In-app messaging: phone number only, Telegram link, in-app chat, or a combination?
- Search filters at launch: bedroom count and area filters — ship or defer?
- Replace demo-mode localStorage auth with real Firebase credentials before any public launch — currently any password is accepted in demo mode
- Server-side admin protection: replace localStorage UID allowlist with a Firestore-backed or Firebase Custom Claims approach before deployment
