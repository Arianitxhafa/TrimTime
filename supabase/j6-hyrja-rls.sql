-- J6 · Hyrja dhe RLS për TrimTime (hapat A dhe C të kartës së studentit).
--
-- Ndjek shabllonin e kursit (hyrja-fillestare/supabase/j6-hyrja-rls.sql), por për tabelën e
-- TrimTime-it: public.lokalet në vend të public.porosite.
--
-- Këto rregulla ekzistojnë tashmë në bazë që nga migrimi 20261021120000_themeli.sql. Ky skedar i
-- mbledh në një vend dhe i shpjegon. Mund të ekzekutohet sërish pa dëm: çdo policy fshihet
-- ("if exists") dhe krijohet njësoj si ishte, brenda një transaksioni (begin … commit).
--
-- Ideja kryesore: telefoni vetëm pyet, serveri vendos. Çdo kërkesë nga aplikacioni mbart
-- token-in e përdoruesit; Postgres e lexon me auth.uid() dhe për çdo rresht kontrollon:
-- a është ky rresht i yti?

begin;

-- #region A · dera e mbyllur
-- A1 · Policy-të "zhvillim" të javës 5: në TrimTime nuk ka asnjë. Kontrolluar më 11.11.2026 me
--      select policyname from pg_policies
--      where schemaname = 'public' and policyname ilike '%zhvillim%';
--      → "No rows returned".
--
-- A2 · RLS i ndezur: pa policy që e lejon, asnjë rresht nuk shihet dhe asnjë rresht nuk ndryshohet.
alter table public.lokalet enable row level security;
alter table public.terminet enable row level security;
--
-- A3 · anon (pa hyrë) lexon VETËM informata publike: lokalet e publikuara, berberët dhe shërbimet
--      e tyre, si në Google Maps. Nuk ka asnjë qasje te terminet, profilet apo vlerësimet e klientëve.
revoke all on public.terminet from anon;
-- #endregion

-- #region C1 · pronari i rreshtit
-- Kolona pronari_id ekziston te lokalet që nga dita e parë (uuid not null, references profilet).
-- Prandaj nuk shtohet si te shablloni. Aplikacioni e dërgon pronari_id kur krijon lokalin, por
-- policy e shtimit më poshtë e refuzon nëse nuk është vetë përdoruesi i kyçur.
-- Për terminet, roli i njëjtë e ka kolona klienti_id (klienti që e rezervoi terminin).
-- #endregion

-- #region C2 · qasja për përdoruesin e kyçur
-- grant = çfarë veprimesh lejohen në tabelë; policy = cilat rreshta.
grant select, insert, update on public.lokalet to authenticated;

-- 1 · LEXIM: secili pronar sheh lokalet e veta (edhe kur s'janë publikuar ende).
--     using (...) = filtri: rreshtat ku kushti s'është i vërtetë thjesht nuk kthehen.
drop policy if exists "Pronari sheh lokalet e veta" on public.lokalet;
create policy "Pronari sheh lokalet e veta"
  on public.lokalet for select to authenticated
  using (pronari_id = (select auth.uid()));

-- 2 · SHTIM: lokali i ri mund të krijohet vetëm me veten si pronar.
--     with check (...) = kontrolli i rreshtit të ri: nëse dikush dërgon pronari_id të një tjetri,
--     Postgres e refuzon me "new row violates row-level security policy".
drop policy if exists "Përdoruesi krijon lokal ku është pronar" on public.lokalet;
create policy "Përdoruesi krijon lokal ku është pronar"
  on public.lokalet for insert to authenticated
  with check (pronari_id = (select auth.uid()));

-- 3 · NDRYSHIM: vetëm pronari e ndryshon lokalin.
--     using = cilët rreshta lejohet t'i prekë; with check = si duhet të duket rreshti pas ndryshimit.
--     eshte_pronar(id) kontrollon te anetaret_e_lokalit që auth.uid() ka rolin 'pronar' dhe është
--     aktiv. Kështu edhe një pronar i dytë i shtuar më vonë e ndryshon lokalin.
drop policy if exists "Pronari përditëson lokalin" on public.lokalet;
create policy "Pronari përditëson lokalin"
  on public.lokalet for update to authenticated
  using (public.eshte_pronar(id))
  with check (public.eshte_pronar(id));
-- #endregion

-- #region D · dy telefona: secili klient sheh vetëm terminet e veta
-- Kjo është policy që e provojmë me dy llogari: termini i Arianitit nuk del te Alberti.
drop policy if exists "Klienti sheh terminet e veta" on public.terminet;
create policy "Klienti sheh terminet e veta"
  on public.terminet for select to authenticated
  using (klienti_id = (select auth.uid()));
-- #endregion

commit;

-- Gabime që nuk i bëjmë:
-- · using (true) për të dhëna personale: do t'ia jepte çdo rresht çdo llogarie.
-- · Filtri .eq("klienti_id", …) vetëm në telefon: sulmuesi e thërret API-n pa të.
-- · Roli në user_metadata: atë e ndryshon vetë përdoruesi dhe bëhet admin. Rolet në TrimTime
--   ruhen te tabela anetaret_e_lokalit, që përdoruesi s'mund ta ndryshojë për vete.
