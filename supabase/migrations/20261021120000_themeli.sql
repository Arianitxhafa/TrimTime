-- TrimTime · Faza 1 · Themeli i databazës
-- Tabelat bazë, mbrojtja nga rezervimet e dyfishta dhe Row Level Security.
-- Ekzekutohet një herë: Supabase → SQL Editor → ngjit gjithë skedarin → Run.

-- ─────────────────────────────────────────────────────────────
-- Zgjerimet
-- ─────────────────────────────────────────────────────────────
create extension if not exists postgis with schema extensions;
-- Lejon `=` mbi uuid brenda një exclusion constraint me GiST.
create extension if not exists btree_gist with schema extensions;

-- ─────────────────────────────────────────────────────────────
-- Tipet
-- ─────────────────────────────────────────────────────────────
create type public.roli_ne_lokal as enum ('pronar', 'berber');

create type public.statusi_terminit as enum (
  'ne_pritje',
  'konfirmuar',
  'perfunduar',
  'anuluar',
  'nuk_erdhi'
);

-- ─────────────────────────────────────────────────────────────
-- Funksion i përbashkët për kolonën perditesuar_me
-- ─────────────────────────────────────────────────────────────
create function public.vendos_perditesuar_me()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.perditesuar_me := now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- profilet: një rresht për çdo përdorues të auth.users
-- ─────────────────────────────────────────────────────────────
create table public.profilet (
  id uuid primary key references auth.users (id) on delete cascade,
  emri text not null default '' check (char_length(emri) <= 80),
  telefoni text check (char_length(telefoni) <= 30),
  foto_url text,
  gjuha text not null default 'sq' check (gjuha in ('sq', 'en')),
  krijuar_me timestamptz not null default now(),
  perditesuar_me timestamptz not null default now()
);

create trigger profilet_perditesuar_me
  before update on public.profilet
  for each row execute function public.vendos_perditesuar_me();

-- Krijon profilin automatikisht kur regjistrohet një përdorues.
-- Emri vjen nga options.data.emri te supabase.auth.signUp().
create function public.krijo_profilin_e_ri()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profilet (id, emri)
  values (new.id, coalesce(left(trim(new.raw_user_meta_data ->> 'emri'), 80), ''));
  return new;
end;
$$;

create trigger auth_perdoruesi_i_ri
  after insert on auth.users
  for each row execute function public.krijo_profilin_e_ri();

-- ─────────────────────────────────────────────────────────────
-- lokalet
-- ─────────────────────────────────────────────────────────────
create table public.lokalet (
  id uuid primary key default gen_random_uuid(),
  pronari_id uuid not null references public.profilet (id) on delete restrict,
  emri text not null check (char_length(emri) between 2 and 80),
  pershkrimi text check (char_length(pershkrimi) <= 1000),
  adresa text not null check (char_length(adresa) between 3 and 200),
  qyteti text not null check (char_length(qyteti) between 2 and 80),
  vendndodhja extensions.geography(point, 4326) not null,
  telefoni text check (char_length(telefoni) <= 30),
  logo_url text,
  -- Kosova përdor Europe/Belgrade, Shqipëria Europe/Tirane (të dyja CET/CEST).
  zona_kohore text not null default 'Europe/Belgrade',
  i_publikuar boolean not null default false,
  krijuar_me timestamptz not null default now(),
  perditesuar_me timestamptz not null default now()
);

create index lokalet_vendndodhja_idx on public.lokalet using gist (vendndodhja);
create index lokalet_pronari_idx on public.lokalet (pronari_id);

create trigger lokalet_perditesuar_me
  before update on public.lokalet
  for each row execute function public.vendos_perditesuar_me();

-- ─────────────────────────────────────────────────────────────
-- anetaret_e_lokalit: pronari dhe berberët e çdo lokali
-- ─────────────────────────────────────────────────────────────
create table public.anetaret_e_lokalit (
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  profili_id uuid not null references public.profilet (id) on delete cascade,
  roli public.roli_ne_lokal not null default 'berber',
  aktiv boolean not null default true,
  krijuar_me timestamptz not null default now(),
  primary key (lokali_id, profili_id)
);

create index anetaret_profili_idx on public.anetaret_e_lokalit (profili_id);

-- Pronari bëhet automatikisht anëtar me rolin 'pronar' kur krijon lokalin.
create function public.shto_pronarin_si_anetar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.anetaret_e_lokalit (lokali_id, profili_id, roli)
  values (new.id, new.pronari_id, 'pronar');
  return new;
end;
$$;

create trigger lokalet_shto_pronarin
  after insert on public.lokalet
  for each row execute function public.shto_pronarin_si_anetar();

-- ─────────────────────────────────────────────────────────────
-- sherbimet
-- ─────────────────────────────────────────────────────────────
create table public.sherbimet (
  id uuid primary key default gen_random_uuid(),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  emri text not null check (char_length(emri) between 2 and 80),
  pershkrimi text check (char_length(pershkrimi) <= 500),
  -- Çmimet ruhen në cent (800 = 8.00 €) që të shmangen gabimet e numrave me presje.
  cmimi_centa integer not null check (cmimi_centa >= 0),
  kohezgjatja_min integer not null check (kohezgjatja_min between 5 and 480),
  pushimi_pas_min integer not null default 0 check (pushimi_pas_min between 0 and 120),
  aktiv boolean not null default true,
  renditja integer not null default 0,
  krijuar_me timestamptz not null default now(),
  perditesuar_me timestamptz not null default now()
);

create index sherbimet_lokali_idx on public.sherbimet (lokali_id);

create trigger sherbimet_perditesuar_me
  before update on public.sherbimet
  for each row execute function public.vendos_perditesuar_me();

-- ─────────────────────────────────────────────────────────────
-- terminet
-- ─────────────────────────────────────────────────────────────
create table public.terminet (
  id uuid primary key default gen_random_uuid(),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  berberi_id uuid not null references public.profilet (id) on delete restrict,
  -- Bosh për klientët pa llogari (walk-in ose rezervim me telefon).
  klienti_id uuid references public.profilet (id) on delete set null,
  emri_klientit text check (char_length(emri_klientit) <= 80),
  telefoni_klientit text check (char_length(telefoni_klientit) <= 30),
  sherbimi_id uuid not null references public.sherbimet (id) on delete restrict,
  fillon_me timestamptz not null,
  mbaron_me timestamptz not null,
  statusi public.statusi_terminit not null default 'ne_pritje',
  cmimi_centa integer not null check (cmimi_centa >= 0),
  shenime text check (char_length(shenime) <= 500),
  krijuar_me timestamptz not null default now(),
  perditesuar_me timestamptz not null default now(),
  constraint terminet_koha_e_vlefshme check (mbaron_me > fillon_me),
  constraint terminet_ka_klient check (klienti_id is not null or emri_klientit is not null),
  -- Mbrojtja kryesore: një berber nuk mund të ketë dy termine aktive që mbivendosen.
  -- Edhe nëse dy klientë shtypin "Rezervo" në të njëjtin milisekondë, njëri refuzohet.
  constraint terminet_pa_mbivendosje exclude using gist (
    berberi_id with =,
    tstzrange(fillon_me, mbaron_me, '[)') with &&
  ) where (statusi in ('ne_pritje', 'konfirmuar'))
);

create index terminet_lokali_koha_idx on public.terminet (lokali_id, fillon_me);
create index terminet_klienti_idx on public.terminet (klienti_id, fillon_me);

create trigger terminet_perditesuar_me
  before update on public.terminet
  for each row execute function public.vendos_perditesuar_me();

-- Siguron që shërbimi dhe berberi i përkasin të njëjtit lokal si termini.
create function public.kontrollo_terminin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.sherbimet s
    where s.id = new.sherbimi_id and s.lokali_id = new.lokali_id
  ) then
    raise exception 'Shërbimi nuk i përket këtij lokali' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.anetaret_e_lokalit a
    where a.lokali_id = new.lokali_id and a.profili_id = new.berberi_id and a.aktiv
  ) then
    raise exception 'Berberi nuk punon në këtë lokal' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger terminet_kontrollo
  before insert or update of lokali_id, berberi_id, sherbimi_id on public.terminet
  for each row execute function public.kontrollo_terminin();

-- ─────────────────────────────────────────────────────────────
-- Funksione ndihmëse për RLS
-- security definer shmang rekursionin kur politikat lexojnë anetaret_e_lokalit.
-- ─────────────────────────────────────────────────────────────
create function public.eshte_anetar(p_lokali_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.anetaret_e_lokalit
    where lokali_id = p_lokali_id and profili_id = (select auth.uid()) and aktiv
  );
$$;

create function public.eshte_pronar(p_lokali_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.anetaret_e_lokalit
    where lokali_id = p_lokali_id and profili_id = (select auth.uid()) and roli = 'pronar' and aktiv
  );
$$;

create function public.eshte_lokal_publik(p_lokali_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.lokalet where id = p_lokali_id and i_publikuar);
$$;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profilet enable row level security;
alter table public.lokalet enable row level security;
alter table public.anetaret_e_lokalit enable row level security;
alter table public.sherbimet enable row level security;
alter table public.terminet enable row level security;

-- profilet
create policy "Përdoruesi lexon profilin e vet"
  on public.profilet for select to authenticated
  using (id = (select auth.uid()));

create policy "Stafi lexon profilet e kolegëve dhe klientëve të lokalit"
  on public.profilet for select to authenticated
  using (
    exists (
      select 1 from public.anetaret_e_lokalit a
      where a.profili_id = profilet.id and public.eshte_anetar(a.lokali_id)
    )
    or exists (
      select 1 from public.terminet t
      where t.klienti_id = profilet.id and public.eshte_anetar(t.lokali_id)
    )
  );

create policy "Përdoruesi përditëson profilin e vet"
  on public.profilet for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- lokalet
create policy "Kushdo sheh lokalet e publikuara"
  on public.lokalet for select to anon, authenticated
  using (i_publikuar);

create policy "Stafi sheh lokalin e vet edhe kur s'është publikuar"
  on public.lokalet for select to authenticated
  using (public.eshte_anetar(id));

-- Nevojitet që `insert ... returning` të funksionojë: anëtarësia e pronarit shtohet
-- nga trigger-i vetëm pasi rreshti të jetë kthyer.
create policy "Pronari sheh lokalet e veta"
  on public.lokalet for select to authenticated
  using (pronari_id = (select auth.uid()));

create policy "Përdoruesi krijon lokal ku është pronar"
  on public.lokalet for insert to authenticated
  with check (pronari_id = (select auth.uid()));

create policy "Pronari përditëson lokalin"
  on public.lokalet for update to authenticated
  using (public.eshte_pronar(id))
  with check (public.eshte_pronar(id));

create policy "Pronari fshin lokalin"
  on public.lokalet for delete to authenticated
  using (public.eshte_pronar(id));

-- anetaret_e_lokalit
create policy "Kushdo sheh berberët e lokaleve të publikuara"
  on public.anetaret_e_lokalit for select to anon, authenticated
  using (aktiv and public.eshte_lokal_publik(lokali_id));

create policy "Stafi sheh anëtarët e lokalit të vet"
  on public.anetaret_e_lokalit for select to authenticated
  using (public.eshte_anetar(lokali_id) or profili_id = (select auth.uid()));

create policy "Pronari shton anëtarë"
  on public.anetaret_e_lokalit for insert to authenticated
  with check (public.eshte_pronar(lokali_id));

create policy "Pronari ndryshon anëtarët"
  on public.anetaret_e_lokalit for update to authenticated
  using (public.eshte_pronar(lokali_id))
  with check (public.eshte_pronar(lokali_id));

create policy "Pronari heq anëtarët, por jo veten"
  on public.anetaret_e_lokalit for delete to authenticated
  using (public.eshte_pronar(lokali_id) and profili_id <> (select auth.uid()));

-- sherbimet
create policy "Kushdo sheh shërbimet aktive të lokaleve të publikuara"
  on public.sherbimet for select to anon, authenticated
  using (aktiv and public.eshte_lokal_publik(lokali_id));

create policy "Stafi sheh të gjitha shërbimet e lokalit"
  on public.sherbimet for select to authenticated
  using (public.eshte_anetar(lokali_id));

create policy "Pronari shton shërbime"
  on public.sherbimet for insert to authenticated
  with check (public.eshte_pronar(lokali_id));

create policy "Pronari ndryshon shërbimet"
  on public.sherbimet for update to authenticated
  using (public.eshte_pronar(lokali_id))
  with check (public.eshte_pronar(lokali_id));

create policy "Pronari fshin shërbimet"
  on public.sherbimet for delete to authenticated
  using (public.eshte_pronar(lokali_id));

-- terminet
-- Klientët do të rezervojnë përmes një funksioni të sigurt në Fazën 3, që llogarit
-- çmimin dhe orarin në server. Deri atëherë terminet i krijon vetëm stafi.
create policy "Klienti sheh terminet e veta"
  on public.terminet for select to authenticated
  using (klienti_id = (select auth.uid()));

create policy "Stafi sheh terminet e lokalit"
  on public.terminet for select to authenticated
  using (public.eshte_anetar(lokali_id));

create policy "Stafi krijon termine"
  on public.terminet for insert to authenticated
  with check (public.eshte_anetar(lokali_id));

create policy "Stafi ndryshon terminet"
  on public.terminet for update to authenticated
  using (public.eshte_anetar(lokali_id))
  with check (public.eshte_anetar(lokali_id));

create policy "Pronari fshin terminet"
  on public.terminet for delete to authenticated
  using (public.eshte_pronar(lokali_id));

-- ─────────────────────────────────────────────────────────────
-- Privilegjet
-- "Automatically expose new tables" është çaktivizuar, ndaj çdo qasje jepet këtu
-- me dorë. RLS më sipër vendos cilat rreshta shihen.
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

grant select on public.lokalet, public.anetaret_e_lokalit, public.sherbimet to anon;

grant select, update on public.profilet to authenticated;
grant select, insert, update, delete on
  public.lokalet,
  public.anetaret_e_lokalit,
  public.sherbimet,
  public.terminet
  to authenticated;

revoke execute on function
  public.vendos_perditesuar_me(),
  public.krijo_profilin_e_ri(),
  public.shto_pronarin_si_anetar(),
  public.kontrollo_terminin()
  from public, anon, authenticated;

grant execute on function
  public.eshte_anetar(uuid),
  public.eshte_pronar(uuid),
  public.eshte_lokal_publik(uuid)
  to anon, authenticated;
