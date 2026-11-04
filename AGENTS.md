This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## TrimTime

TrimTime connects men's barbershops with their clients, starting in Kosovo. Built by Arianit and Albert.

- **Client:** finds shops in the city they are in, books, cancels or reschedules, rates visits and earns loyalty rewards.
- **Barber / shop:** manages the shop, services, hours, staff, calendar, clients (CRM), promotions and analytics.
- **Payment happens at the shop;** staff record it as cash or card. Online payments come later, because Stripe doesn't support businesses in Kosovo.

### Conventions

- Code identifiers, file names and commit messages are in Albanian. Keep new code consistent with them.
- All user-facing text goes in `src/i18n/sq.ts` (default) and `src/i18n/en.ts`, never hardcoded in a screen.
- Styling uses `useStilet` and `useTema` with tokens from `src/theme`, so every screen works in dark and light mode.
- Data access goes through the React Query hooks in `src/api/`.

### Supabase

- Copy `.env.example` to `.env`. It holds only the project URL and the publishable (anon) key. Never put a `service_role`/secret key or the database password in the app, in the repo or in chat.
- Schema changes go in a **new** file in `supabase/migrations/`. Never edit a migration that has already been run. Migrations are run by hand, in filename order, in Supabase → SQL Editor. Every new table needs RLS and explicit grants.
- After the last migration, run `supabase/seed/lokalet_osm_kosove.sql` (cities and shops from OpenStreetMap). `npm run importo:osm` regenerates it. Keep the "© OpenStreetMap contributors" attribution wherever these shops appear.
- Prices, booking times and discounts are calculated on the server, not in the app.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
