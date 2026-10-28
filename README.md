# 💈 TrimTime

**A modern mobile appointment management app for barbershops.**

TrimTime is a mobile application project built with **React Native, Expo, and TypeScript**. Its goal is to simplify appointment management for barbershops through a clean, intuitive, and user-friendly mobile experience.

The project is being developed as part of a university Mobile Applications course, with an emphasis on reusable components, type safety, interactive interfaces, and collaborative software development.

---

## ✨ Current Features

- **Onboarding** — Three animated intro screens shown on first launch.
- **Accounts** — Sign up and sign in with email and password (Supabase Auth), with validation and translated error messages.
- **Client & Business roles** — The role (client or barber/shop) is chosen before signing in and stays linked to the account. Each role has its own tab bar.
- **Protected navigation** — Screens are only reachable when allowed (onboarding → sign in → tabs), using Expo Router `Stack.Protected`.
- **Dark & light mode** — Follows the phone, or can be set to light or dark in Settings. The choice is remembered.
- **Albanian & English** — Albanian is the default; the language follows the phone or can be changed in Settings.
- **Shop setup (business)** — A 4-step wizard: details, location picked on a map (address filled in automatically), weekly hours with lunch breaks, and first services.
- **Shop management** — Edit details, cover photo and logo (Supabase Storage), hours, services (price, duration, hide/delete) and staff. Publish the shop when it has services and hours.
- **Staff invites** — The owner creates an 8-character code; a barber enters it to join the shop.
- **Discover (client)** — Nearby published shops ranked by distance or price, with search (shop, service or city) and “Open now” / price filters. Falls back to Prishtina without location permission.
- **All barbershops in Kosovo** — 379 shops imported from OpenStreetMap appear on the map and in search, marked as not yet on TrimTime (© OpenStreetMap contributors, ODbL).
- **Map (client)** — Shops on a map with price markers and “Search this area” (phone only; react-native-maps doesn’t run on web).
- **Shop profile** — Cover, open/closed status in the shop’s time zone, call, directions, services, barbers, weekly hours and description.
- **Online booking (client)** — Pick a service, a barber or “Anyone”, a day and a free time; prices and end times are calculated on the server and double bookings are impossible.
- **My bookings (client)** — Upcoming and past bookings, cancel or change the time within the shop’s free-cancellation window, directions and “Book again”.
- **Reminders** — Local notifications 24 h and 2 h before each appointment.
- **Today (business)** — Real bookings per day with live updates, confirm / complete / no-show / cancel, and walk-in or phone bookings added by staff.
- **Booking rules** — Each shop chooses automatic confirmation and the free-cancellation window.
- **Calendar (business)** — Day view with a column per barber and week view per barber, time off and a now-line; staff can move appointments to another time or barber.
- **Clients (business)** — CRM with visits, spend, no-shows, VIP tag, private notes and full history, including walk-in clients.
- **Analytics (business)** — Revenue, appointments, no-show rate, new vs returning clients, revenue by day, top services, barbers and busiest hours.
- **Barber schedules** — Each barber can follow the shop’s hours or have their own, plus time off (full days or a few hours).
- **Pending badge** — The Today tab shows how many of today’s bookings are waiting for confirmation, live.
- **Payment at the shop** — Staff record cash or card payment on the appointment (one tap, can be undone); analytics show cash, card, unpaid and discounts. Online payments come later (Stripe doesn’t support Kosovo businesses).
- **Reviews** — Clients rate completed visits (1–5 stars + comment); shops show the average and latest reviews, and the owner can reply. Discover can sort by rating.
- **Promotions** — % discounts for a service, days of the week or hours (happy hour). The discount is applied on the server when booking and shown on cards, the shop profile and the booking total.
- **Loyalty card** — A reward after N completed visits (e.g. a free haircut). Clients see their progress; staff turn a visit into a free one when a reward is ready.
- **Waitlist** — When a day is full, clients can ask to be notified; a cancellation or move that day notifies them instantly (realtime + local notification).
- **Database foundation** — Supabase/Postgres schema with Row Level Security and database-level protection against double bookings.

> **Development status:** Phase 5 of 7 done. Next: the in-app AI assistant (Phase 6).

---

## 🛠️ Tech Stack

| Technology                                                | Purpose                                    |
| --------------------------------------------------------- | ------------------------------------------ |
| [React Native](https://reactnative.dev/)                  | Cross-platform mobile development          |
| [Expo](https://expo.dev/)                                 | Mobile development and testing workflow    |
| [TypeScript](https://www.typescriptlang.org/)             | Static typing and safer code               |
| [Expo Router](https://docs.expo.dev/router/introduction/) | Application navigation                     |
| [Git](https://git-scm.com/)                               | Version control                            |
| [GitHub](https://github.com/)                             | Source code hosting and team collaboration |
| [Supabase](https://supabase.com/)                         | Auth, Postgres database, Row Level Security |
| [i18next](https://www.i18next.com/)                       | Albanian and English translations          |
| [Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Animations                           |
| [Expo Go](https://expo.dev/go)                            | Testing on a physical device               |

---

## 📱 Getting Started

Follow these steps to run TrimTime locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Expo Go](https://expo.dev/go) on your mobile device

### 1. Clone the Repository

```
git clone https://github.com/Arianitxhafa/TrimTime.git
```

### 2. Navigate to the Project

```
cd TrimTime
```

### 3. Install Dependencies

```
npm install
```

### 4. Configure Supabase

1. Copy `.env.example` to `.env` and fill in the **Project URL** and the **publishable (anon) key** from Supabase → Project Settings → API Keys. Never put a secret / `service_role` key in the app.
2. In Supabase → **SQL Editor**, run each file in `supabase/migrations/` **in order** (once per project): `20261021120000_themeli.sql`, `20261022090000_lokalet_dhe_zbulimi.sql`, `20261022150000_lokalet_osm.sql`, `20261023090000_rezervimet.sql`, `20261026090000_mjetet_e_biznesit.sql`, then `20261028090000_rritja.sql`.
   Then run `supabase/seed/lokalet_osm_kosove.sql` to load the barbershops of Kosovo. To refresh them later: `npm run importo:osm` and run the regenerated file again.
3. Optional during development: Authentication → Sign In / Providers → Email → turn off **Confirm email**, so new accounts can sign in immediately.

### 5. Start the Development Server

```
npx expo start
```

### 6. Open the App on Your Phone

1. Open Expo Go on your phone.
2. Scan the QR code displayed by the Expo development server.
3. Wait for TrimTime to load.

For the simplest setup, connect your phone and computer to the same Wi-Fi network.

If the connection does not work, try:

```
npx expo start --tunnel
```

---

## 📂 Project Structure

```
src/
├── app/                    # Screens (Expo Router: every file is a route)
│   ├── _layout.tsx         # Providers + protected navigation
│   ├── onboarding.tsx
│   ├── (auth)/             # hyrja (sign in), regjistrimi (sign up)
│   ├── (klient)/           # Client tabs: zbulo, harta, terminet-e-mia, profili
│   ├── (biznes)/           # Business tabs: sot, kalendari, klientet, lokali, llogaria
│   ├── lokali-i-ri.tsx     # New shop wizard
│   ├── lokali/[id].tsx     # Public shop profile
│   ├── menaxho/            # Shop management: info, orari, sherbimet, sherbimi, stafi, analitika, berberi/[id],
│   │                       #   promocionet, promocioni, besnikeria
│   ├── klienti/[celesi].tsx    # Client profile (CRM)
│   ├── termini/zhvendos.tsx    # Move an appointment (staff)
│   ├── bashkohu.tsx        # Join a shop with an invite code
│   ├── rezervo/[lokaliId].tsx  # Booking flow (client)
│   ├── riplanifiko/[id].tsx    # Change booking time (client)
│   ├── vlereso/[terminiId].tsx # Rate a visit (client)
│   ├── vleresimet/[lokaliId].tsx # All reviews of a shop (owner can reply)
│   ├── kartat.tsx          # The client's loyalty cards
│   ├── termini/[id].tsx    # Appointment details (staff)
│   ├── shto.tsx            # Walk-in / phone booking (staff)
│   └── cilesimet.tsx       # Settings (theme, language)
├── api/                    # React Query hooks (shops, bookings, business, reviews, promotions, loyalty, waitlist)
├── components/             # Reusable UI (Butoni, FushaTekstit, KartaTerminit, …)
├── context/                # Tema, Preferencat, Auth
├── i18n/                   # sq.ts (default), en.ts
├── hooks/                  # useVendndodhjaIme (location), useVonesa (debounce)
├── lib/                    # Supabase client, types, formatting, location helpers
└── theme/                  # Light/dark palettes, spacing, radii
supabase/migrations/        # SQL migrations (run in order)
```

---

## 🧩 Component Design

The appointment card is implemented as a reusable component with typed properties.

Each appointment includes:

- `klienti` — Client name.
- `sherbimi` — Requested service.
- `ora` — Appointment time.
- `statusi` — Appointment status.

The status is restricted to three permitted values:

```
type StatusiTerminit =
  | "Në pritje"
  | "Konfirmuar"
  | "Përfunduar";
```

This approach demonstrates how TypeScript union types can restrict accepted values and improve component reliability.

---

## 🗺️ Development Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 · Foundation | Design system, dark/light mode, i18n, Supabase, auth, role-based navigation, onboarding | ✅ Done |
| 2 · Shops & Discovery | Shop setup wizard, services, staff, map, search & filters, shop profile | ✅ Done |
| 3 · Booking Engine | Available slots, booking flow, cancel/reschedule, realtime, reminders | ✅ Done |
| 4 · Business Tools | Calendar, bookings inbox, walk-ins, client CRM, analytics | ✅ Done |
| 5 · Payments & Growth | Payment at the shop, reviews, loyalty, promotions, waitlist (online payments later) | ✅ Done |
| 6 · AI Assistant | In-app assistant for barbers and clients | ⏳ Next |
| 7 · Polish & Launch | Accessibility, performance, tests, store builds | |

---

## 🤝 Team Collaboration

TrimTime is developed collaboratively using Git and GitHub.

### Recommended Workflow

Before starting work:

```
git pull
```

After making changes:

```
git add .
git commit -m "Describe your changes"
git push
```

**Team guidelines**

- Pull the latest changes before starting a task.
- Use clear and descriptive commit messages.
- Test changes before pushing them.
- Coordinate work to reduce merge conflicts.
- Never commit passwords, API keys, or other secrets.

---

## 🎓 Project Purpose

This project provides practical experience with:

- Cross-platform mobile application development
- React Native components and state management
- TypeScript and type-safe programming
- Expo development workflows
- Git and GitHub collaboration
- Incremental development and debugging

---

## 👨‍💻 Project Information

- **Project:** TrimTime
- **Category:** Mobile Application
- **Platform:** Android and iOS through Expo-compatible development workflows
- **Language:** TypeScript
- **Repository:** [Arianitxhafa/projekti-im](https://github.com/Arianitxhafa/projekti-im)
- **Status:** In development

---

_TrimTime — Making barbershop appointment management simpler, one appointment at a time._ 💈
