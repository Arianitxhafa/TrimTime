# MODELI · si e përdorëm AI-n në TrimTime

Ekipi: Arianit Xhafa dhe Albert. Mjeti: **Claude Code** (Anthropic), në aplikacionin Claude për desktop.

Profesori e lejoi përdorimin e AI-t për J6, me kusht që ta dimë dhe ta shpjegojmë vetë çka është bërë.
Këtu shkruajmë sinqerisht çka e pyetëm, çka mbajtëm dhe çka kontrolluam vetë.

## Çka e pyetëm AI-n

**Gjatë semestrit (ndërtimi i TrimTime):**
- Skema e Supabase (tabelat, migrimet, RLS-i, funksionet RPC) dhe ekranet në Expo Router.
- Shqipja si gjuhë kryesore, filtrat e kërkimit, vendndodhja, harta me udhëzime brenda aplikacionit.
- Importi i berberive nga OpenStreetMap dhe Numrat.com (me atribuim).
- Dizajni (i errët me ar, si aplikacionet e Apple) dhe ngjyrat e tab-eve.
- Fshirja e llogarisë dhe politika e privatësisë.

**Sot, për J6:**
- Të kontrollojë repository-n sipas kontrollit automatik të J6.
- Ta zhvendosë ekranin e hyrjes te `src/app/hyrja.tsx` (ishte te `src/app/(auth)/hyrja.tsx`).
- Ta krahasojë `hyrja-fillestare.zip` me TrimTime.
- Ta shkruajë `supabase/j6-hyrja-rls.sql` me shpjegime për çdo policy.
- Të na ndihmojë me këtë skedar, `MODELI.md`.

## Çka mbajtëm dhe çka nuk e mbajtëm

- **Mbajtëm** zhvendosjen e `hyrja.tsx`. Pamja dhe mënyra e hyrjes nuk ndryshuan.
- **Nuk i kopjuam** pesë skedarët nga `hyrja-fillestare.zip` (`hyrja.ts`, `sesioni.tsx`, `ButoniDil.tsx` …).
  TrimTime i kishte tashmë të njëjtat pjesë (`signInWithPassword`, `signUp`, `signOut`,
  `onAuthStateChange`, `AppState`, `Stack.Protected`). Me to do të kishim dy sisteme hyrjeje.
- **Mbajtëm** `j6-hyrja-rls.sql`: policy-të janë ato që ishin tashmë në bazë (nga migrimi
  `20261021120000_themeli.sql`), të mbledhura në një vend dhe të shpjeguara në shqip.
- **Refuzuam** gjatë semestrit: disa dizajne të para, asistentin me AI me pagesë (e zëvendësuam me
  një lexues falas të fjalive) dhe kopjimin e orareve nga Google Maps (s'lejohet nga kushtet e tyre).

## Çka kontrolluam vetë (pa AI)

- Fikëm **Confirm email** te Supabase → Authentication → Sign In / Providers.
- Në SQL Editor kontrolluam që nuk ka asnjë policy `zhvillim`: "No rows returned".
- Migrimet i ekzekutuam vetë, njëri pas tjetrit, në SQL Editor.
- Testi me dy telefona dhe dy llogari (hapi D): secili duhet të shohë vetëm terminet e veta.

## Rolet: kush sheh çka

| Kush | Çka sheh / çka bën |
|---|---|
| **Pa hyrë (`anon`)** | Vetëm informata publike: lokalet e publikuara me berberët, shërbimet, oraret, promocionet aktive dhe fotot e punimeve; qytetet. Asnjë termin, asnjë profil. |
| **Klienti** | Terminet e veta (`klienti_id = auth.uid()`), profilin e vet, vlerësimet e veta. |
| **Berberi (stafi)** | Terminet, klientët dhe oraret e lokalit ku punon (`eshte_anetar`). |
| **Pronari** | Gjithçka e lokalit të vet: e ndryshon, shton shërbime, staf, promocione (`eshte_pronar`). |

**Ku ruhet roli:** rolet që japin qasje (`pronar`, `berber`) ruhen në tabelën
`anetaret_e_lokalit`, që përdoruesi nuk mund ta ndryshojë për vete. Për rolet, policy-të lexojnë vetëm
këtë tabelë (përmes funksioneve `eshte_anetar` dhe `eshte_pronar`).

Në `user_metadata` ruhet vetëm zgjedhja e pamjes, "klient" apo "biznes" (cilat tab-e shfaqen).
Ajo **nuk jep asnjë qasje**: asnjë policy nuk e lexon. Nëse dikush e ndryshon, sheh ekranet e biznesit
dhe mund të krijojë vetëm lokalin e vet, si çdo përdorues; të dhënat e lokaleve të tjera ia ndalon RLS-i.
