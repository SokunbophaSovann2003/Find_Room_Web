# JoulKH — Web

Website for JoulKH, a room rental platform for Cambodia. (Project directory and Firebase backend keep the `findroom` name for storage compatibility; only the user-facing brand is "Joul".) Shares its backend with the `findroom_kh` Flutter mobile app.

## Stack

- Next.js 14 (App Router) + React 18
- TypeScript (strict)
- Tailwind CSS
- Firebase (Auth, Firestore, Storage)

## Getting started

```bash
cd findroom_web
npm install
cp .env.local.example .env.local   # fill in Firebase keys
npm run dev
```

Open <http://localhost:3000>.

## Project layout

```
findroom_web/
├── src/
│   ├── app/                       # App Router pages
│   │   ├── layout.tsx             # Root layout + Navbar
│   │   ├── page.tsx               # "/" → redirects to /explore
│   │   ├── globals.css
│   │   ├── explore/page.tsx       # Screen: Explore Room
│   │   ├── rooms/[id]/page.tsx    # Screen: Room Detail
│   │   ├── profile/
│   │   │   ├── page.tsx           # Screen: Profile (user info + my listings)
│   │   │   └── list-room/page.tsx # Screen: List a room (form)
│   │   ├── login/page.tsx         # Screen: Login
│   │   └── register/page.tsx      # Screen: Register
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── RoomCard.tsx
│   └── lib/
│       ├── types.ts               # Room, UserProfile
│       ├── mock-data.ts           # In-memory rooms for local dev
│       ├── firebase.ts            # Firebase client init
│       └── auth.ts                # Phone + password register/login
├── public/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

## Screens

| Route                   | Screen             |
| ----------------------- | ------------------ |
| `/explore`              | Explore Room       |
| `/rooms/[id]`           | Room Detail        |
| `/profile`              | Profile            |
| `/profile/list-room`    | List Room (form)   |
| `/login`                | Login              |
| `/register`             | Register           |

## Auth note

Firebase Auth has no native phone + password flow. `src/lib/auth.ts` bridges it by turning the phone number into a pseudo-email (`<digits>@findroom.app`) and using Firebase email+password under the hood. The same bridge needs to be applied in the Flutter app for both clients to share accounts.

## Next steps

- Wire the login/register forms to `src/lib/auth.ts` (currently pure HTML forms).
- Replace `MOCK_ROOMS` with Firestore queries in `/explore` and `/rooms/[id]`.
- Add image upload to Firebase Storage in the List Room form.
- Add a client auth context so `/profile` can gate behind a logged-in user.
