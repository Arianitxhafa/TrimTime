-- TrimTime · Faza 5 · Pagesat në lokal dhe rritja
-- Pagesa e shënuar nga stafi (kesh/kartë), vlerësimet, karta e besnikërisë, promocionet
-- dhe lista e pritjes. Pagesat online shtohen më vonë, kur të zgjidhet ofruesi (Stripe nuk punon në Kosovë).
-- Ekzekutohet pas 20261026090000_mjetet_e_biznesit.sql: SQL Editor → New query → Run.

-- ─────────────────────────────────────────────────────────────
-- Lokali: vlerësimi mesatar dhe rregullat e besnikërisë
-- ─────────────────────────────────────────────────────────────
alter table public.lokalet
  -- Mbahen nga trigger-i i vlerësimeve, që lista dhe harta të mos i llogarisin çdo herë.
  add column vleresimi_mesatar numeric(2, 1),
  add column nr_vleresimeve integer not null default 0,
  add column besnikeria_aktive boolean not null default false,
  -- Pas kaq vizitash të përfunduara klienti fiton shpërblimin.
  add column besnikeria_vizita integer not null default 10 check (besnikeria_vizita between 3 and 50),
  add column besnikeria_shperblimi text check (char_length(besnikeria_shperblimi) <= 80),
  add constraint lokalet_besnikeria_ka_shperblim
    check (not besnikeria_aktive or char_length(trim(coalesce(besnikeria_shperblimi, ''))) >= 2);

-- ─────────────────────────────────────────────────────────────
-- Promocionet: zbritje në përqindje, opsionalisht për një shërbim, ditë ose orar (happy hour)
-- ─────────────────────────────────────────────────────────────
create table public.promocionet (
  id uuid primary key default gen_random_uuid(),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  titulli text not null check (char_length(titulli) between 2 and 60),
  perqindja smallint not null check (perqindja between 5 and 90),
  -- null: vlen për të gjitha shërbimet.
  sherbimi_id uuid references public.sherbimet (id) on delete cascade,
  -- Ditët e javës (0 = e diel); null: çdo ditë.
  ditet smallint[] check (ditet is null or (cardinality(ditet) between 1 and 7 and ditet <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[])),
  ora_nga time,
  ora_deri time,
  vlen_nga date not null default current_date,
  vlen_deri date,
  aktiv boolean not null default true,
  krijuar_me timestamptz not null default now(),
  constraint promocionet_orari check ((ora_nga is null) = (ora_deri is null) and (ora_deri is null or ora_deri > ora_nga)),
  constraint promocionet_periudha check (vlen_deri is null or vlen_deri >= vlen_nga)
);

create index promocionet_lokali_idx on public.promocionet (lokali_id) where aktiv;

-- ─────────────────────────────────────────────────────────────
-- Termini: çmimi para zbritjes, promocioni, shpërblimi dhe pagesa
-- ─────────────────────────────────────────────────────────────
create type public.menyra_e_pageses as enum ('kesh', 'karte');

alter table public.terminet
  -- cmimi_centa mbetet çmimi që paguan klienti; këto tregojnë si u arrit.
  add column cmimi_baze_centa integer check (cmimi_baze_centa >= 0),
  add column zbritja_centa integer not null default 0 check (zbritja_centa >= 0),
  add column promocioni_id uuid references public.promocionet (id) on delete set null,
  -- Vizita falas nga karta e besnikërisë.
  add column shperblim boolean not null default false,
  add column paguar_me timestamptz,
  add column menyra_e_pageses public.menyra_e_pageses,
  add constraint terminet_pagesa_e_plote check ((paguar_me is null) = (menyra_e_pageses is null));

update public.terminet set cmimi_baze_centa = cmimi_centa where cmimi_baze_centa is null;

-- ─────────────────────────────────────────────────────────────
-- Vlerësimet: një për çdo termin të përfunduar, vetëm nga klienti i tij
-- ─────────────────────────────────────────────────────────────
create table public.vleresimet (
  id uuid primary key default gen_random_uuid(),
  termini_id uuid not null unique references public.terminet (id) on delete cascade,
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  klienti_id uuid not null references public.profilet (id) on delete cascade,
  berberi_id uuid references public.profilet (id) on delete set null,
  yjet smallint not null check (yjet between 1 and 5),
  komenti text check (char_length(komenti) <= 1000),
  pergjigjja text check (char_length(pergjigjja) <= 1000),
  pergjigjur_me timestamptz,
  krijuar_me timestamptz not null default now(),
  perditesuar_me timestamptz not null default now()
);

create index vleresimet_lokali_idx on public.vleresimet (lokali_id, krijuar_me desc);

create trigger vleresimet_perditesuar_me
  before update on public.vleresimet
  for each row execute function public.vendos_perditesuar_me();

create function public.rifresko_vleresimin_e_lokalit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lokali_id uuid := coalesce(new.lokali_id, old.lokali_id);
begin
  update public.lokalet l
  set vleresimi_mesatar = v.mesatarja,
      nr_vleresimeve = v.numri
  from (
    select round(avg(yjet)::numeric, 1) as mesatarja, count(*)::integer as numri
    from public.vleresimet
    where lokali_id = v_lokali_id
  ) v
  where l.id = v_lokali_id;
  return null;
end;
$$;

create trigger vleresimet_rifresko_lokalin
  after insert or update of yjet or delete on public.vleresimet
  for each row execute function public.rifresko_vleresimin_e_lokalit();

-- ─────────────────────────────────────────────────────────────
-- Lista e pritjes: klienti njoftohet kur lirohet një orë në datën që do
-- ─────────────────────────────────────────────────────────────
create table public.lista_e_pritjes (
  id uuid primary key default gen_random_uuid(),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  klienti_id uuid not null references public.profilet (id) on delete cascade,
  sherbimi_id uuid not null references public.sherbimet (id) on delete cascade,
  -- null: çdo berber.
  berberi_id uuid references public.profilet (id) on delete set null,
  data date not null,
  njoftuar_me timestamptz,
  krijuar_me timestamptz not null default now(),
  unique (klienti_id, lokali_id, sherbimi_id, data)
);

create index lista_e_pritjes_lokali_data_idx on public.lista_e_pritjes (lokali_id, data);

-- Kur një termin anulohet ose zhvendoset, orari i vjetër lirohet: shënohen si të njoftuar
-- klientët që presin atë ditë. Aplikacioni i merr me realtime dhe shfaq njoftimin.
create function public.njofto_listen_e_pritjes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_zona text;
begin
  if old.statusi not in ('ne_pritje', 'konfirmuar') then
    return null;
  end if;
  if not (
    new.statusi = 'anuluar'
    or (new.statusi in ('ne_pritje', 'konfirmuar')
        and (new.fillon_me <> old.fillon_me or new.berberi_id <> old.berberi_id))
  ) then
    return null;
  end if;

  select zona_kohore into v_zona from public.lokalet where id = old.lokali_id;

  update public.lista_e_pritjes
  set njoftuar_me = now()
  where lokali_id = old.lokali_id
    and data = (old.fillon_me at time zone v_zona)::date
    and (berberi_id is null or berberi_id = old.berberi_id)
    and klienti_id is distinct from old.klienti_id
    and njoftuar_me is null;
  return null;
end;
$$;

create trigger terminet_njofto_listen_e_pritjes
  after update of statusi, fillon_me, berberi_id on public.terminet
  for each row execute function public.njofto_listen_e_pritjes();

-- ─────────────────────────────────────────────────────────────
-- Promocioni më i mirë për një shërbim në një orë të caktuar
-- ─────────────────────────────────────────────────────────────
create function public.promocioni_per(p_lokali_id uuid, p_sherbimi_id uuid, p_fillon_me timestamptz)
returns table (id uuid, titulli text, perqindja smallint)
language sql
stable
security definer
set search_path = ''
as $$
  with koha as (
    select p_fillon_me at time zone l.zona_kohore as lokale
    from public.lokalet l
    where l.id = p_lokali_id
  )
  select p.id, p.titulli, p.perqindja
  from public.promocionet p
  cross join koha
  where p.lokali_id = p_lokali_id
    and p.aktiv
    and (p.sherbimi_id is null or p.sherbimi_id = p_sherbimi_id)
    and koha.lokale::date >= p.vlen_nga
    and (p.vlen_deri is null or koha.lokale::date <= p.vlen_deri)
    and (p.ditet is null or extract(dow from koha.lokale)::smallint = any (p.ditet))
    and (p.ora_nga is null or (koha.lokale::time >= p.ora_nga and koha.lokale::time < p.ora_deri))
  order by p.perqindja desc
  limit 1;
$$;

-- Çmimi që do të paguajë klienti, që ekrani i rezervimit ta tregojë para konfirmimit.
create function public.cmimi_i_terminit(p_lokali_id uuid, p_sherbimi_id uuid, p_fillon_me timestamptz)
returns table (cmimi_baze_centa integer, zbritja_centa integer, cmimi_centa integer, promocioni_titulli text, perqindja smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.cmimi_centa,
    coalesce(round(s.cmimi_centa * p.perqindja / 100.0)::integer, 0),
    s.cmimi_centa - coalesce(round(s.cmimi_centa * p.perqindja / 100.0)::integer, 0),
    p.titulli,
    p.perqindja
  from public.sherbimet s
  left join lateral public.promocioni_per(p_lokali_id, p_sherbimi_id, p_fillon_me) p on true
  where s.id = p_sherbimi_id
    and s.lokali_id = p_lokali_id
    and (public.eshte_lokal_publik(p_lokali_id) or public.eshte_anetar(p_lokali_id));
$$;

-- Zbritja më e madhe që lokali ofron sot, për etiketën "deri −20%" në listë dhe hartë.
create function public.promocioni_max(p_lokali_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select max(p.perqindja)::integer
  from public.promocionet p
  join public.lokalet l on l.id = p.lokali_id
  where p.lokali_id = p_lokali_id
    and p.aktiv
    and (now() at time zone l.zona_kohore)::date >= p.vlen_nga
    and (p.vlen_deri is null or (now() at time zone l.zona_kohore)::date <= p.vlen_deri);
$$;

-- ─────────────────────────────────────────────────────────────
-- Rezervimi dhe termini nga stafi: tani me promocionin e orës së zgjedhur
-- ─────────────────────────────────────────────────────────────
create or replace function public.rezervo_termin(
  p_lokali_id uuid,
  p_sherbimi_id uuid,
  p_fillon_me timestamptz,
  p_berberi_id uuid default null,
  p_shenime text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_klienti uuid := (select auth.uid());
  v_lokali public.lokalet%rowtype;
  v_sherbimi public.sherbimet%rowtype;
  v_promocioni_id uuid;
  v_perqindja smallint;
  v_zbritja integer := 0;
  v_berberi uuid;
  v_id uuid;
begin
  if v_klienti is null then
    raise exception 'Duhet të hysh në llogari' using errcode = '42501';
  end if;

  select * into v_lokali
  from public.lokalet
  where id = p_lokali_id and i_publikuar and burimi = 'trimtime';
  if not found then
    raise exception 'Ky lokal nuk pranon rezervime' using errcode = 'TT004';
  end if;

  select * into v_sherbimi
  from public.sherbimet
  where id = p_sherbimi_id and lokali_id = p_lokali_id and aktiv;
  if not found then
    raise exception 'Shërbimi nuk ekziston' using errcode = 'TT004';
  end if;

  select o.berberi_id into v_berberi
  from public.oraret_e_lira(
    p_lokali_id,
    p_sherbimi_id,
    (p_fillon_me at time zone v_lokali.zona_kohore)::date,
    p_berberi_id
  ) o
  where o.fillon_me = p_fillon_me
  limit 1;

  if v_berberi is null then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
  end if;

  select p.id, p.perqindja into v_promocioni_id, v_perqindja
  from public.promocioni_per(p_lokali_id, p_sherbimi_id, p_fillon_me) p;
  if v_promocioni_id is not null then
    v_zbritja := round(v_sherbimi.cmimi_centa * v_perqindja / 100.0)::integer;
  end if;

  insert into public.terminet (
    lokali_id, berberi_id, klienti_id, sherbimi_id,
    fillon_me, mbaron_me, statusi,
    cmimi_baze_centa, zbritja_centa, promocioni_id, cmimi_centa, shenime
  )
  values (
    p_lokali_id,
    v_berberi,
    v_klienti,
    p_sherbimi_id,
    p_fillon_me,
    p_fillon_me + make_interval(mins => v_sherbimi.kohezgjatja_min + v_sherbimi.pushimi_pas_min),
    case when v_lokali.pranimi_automatik then 'konfirmuar' else 'ne_pritje' end::public.statusi_terminit,
    v_sherbimi.cmimi_centa,
    v_zbritja,
    v_promocioni_id,
    v_sherbimi.cmimi_centa - v_zbritja,
    nullif(left(trim(coalesce(p_shenime, '')), 500), '')
  )
  returning id into v_id;

  -- Klienti që rezervoi nuk pret më në listë për atë ditë.
  delete from public.lista_e_pritjes
  where klienti_id = v_klienti
    and lokali_id = p_lokali_id
    and data = (p_fillon_me at time zone v_lokali.zona_kohore)::date;

  return v_id;
exception
  -- Dy klientë e kanë zgjedhur të njëjtin orar në të njëjtin çast: fiton i pari.
  when exclusion_violation then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
end;
$$;

create or replace function public.shto_termin_nga_stafi(
  p_lokali_id uuid,
  p_sherbimi_id uuid,
  p_fillon_me timestamptz,
  p_berberi_id uuid,
  p_emri_klientit text,
  p_telefoni text default null,
  p_shenime text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_sherbimi public.sherbimet%rowtype;
  v_lokali public.lokalet%rowtype;
  v_promocioni_id uuid;
  v_perqindja smallint;
  v_zbritja integer := 0;
  v_berberi uuid;
  v_id uuid;
begin
  if not public.eshte_anetar(p_lokali_id) then
    raise exception 'Vetëm stafi mund të shtojë termine' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_emri_klientit, ''))) < 2 then
    raise exception 'Mungon emri i klientit' using errcode = '22023';
  end if;

  select * into v_lokali from public.lokalet where id = p_lokali_id;
  select * into v_sherbimi from public.sherbimet where id = p_sherbimi_id and lokali_id = p_lokali_id;
  if not found then
    raise exception 'Shërbimi nuk ekziston' using errcode = 'TT004';
  end if;

  select o.berberi_id into v_berberi
  from public.oraret_e_lira(
    p_lokali_id,
    p_sherbimi_id,
    (p_fillon_me at time zone v_lokali.zona_kohore)::date,
    p_berberi_id,
    null,
    true
  ) o
  where o.fillon_me = p_fillon_me
  limit 1;

  if v_berberi is null then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
  end if;

  select p.id, p.perqindja into v_promocioni_id, v_perqindja
  from public.promocioni_per(p_lokali_id, p_sherbimi_id, p_fillon_me) p;
  if v_promocioni_id is not null then
    v_zbritja := round(v_sherbimi.cmimi_centa * v_perqindja / 100.0)::integer;
  end if;

  insert into public.terminet (
    lokali_id, berberi_id, emri_klientit, telefoni_klientit, sherbimi_id,
    fillon_me, mbaron_me, statusi,
    cmimi_baze_centa, zbritja_centa, promocioni_id, cmimi_centa, shenime
  )
  values (
    p_lokali_id,
    v_berberi,
    left(trim(p_emri_klientit), 80),
    nullif(left(trim(coalesce(p_telefoni, '')), 30), ''),
    p_sherbimi_id,
    p_fillon_me,
    p_fillon_me + make_interval(mins => v_sherbimi.kohezgjatja_min + v_sherbimi.pushimi_pas_min),
    'konfirmuar',
    v_sherbimi.cmimi_centa,
    v_zbritja,
    v_promocioni_id,
    v_sherbimi.cmimi_centa - v_zbritja,
    nullif(left(trim(coalesce(p_shenime, '')), 500), '')
  )
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Pagesa në lokal: stafi e shënon (p_menyra null e zhbën)
-- ─────────────────────────────────────────────────────────────
create function public.regjistro_pagesen(p_termini_id uuid, p_menyra public.menyra_e_pageses)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_termini public.terminet%rowtype;
begin
  select * into v_termini from public.terminet where id = p_termini_id for update;
  if not found or not public.eshte_anetar(v_termini.lokali_id) then
    raise exception 'Nuk ke leje për këtë termin' using errcode = '42501';
  end if;

  if p_menyra is null then
    update public.terminet set paguar_me = null, menyra_e_pageses = null where id = p_termini_id;
    return;
  end if;

  if v_termini.statusi not in ('ne_pritje', 'konfirmuar', 'perfunduar') then
    raise exception 'Termini nuk mund të ndryshohet' using errcode = 'TT003';
  end if;

  -- Pagesa do të thotë që klienti erdhi dhe shërbimi u krye.
  update public.terminet
  set paguar_me = now(),
      menyra_e_pageses = p_menyra,
      statusi = 'perfunduar'
  where id = p_termini_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Karta e besnikërisë (klienti identifikohet si në CRM: llogaria, telefoni ose emri)
-- ─────────────────────────────────────────────────────────────
create function public.besnikeria_e_klientit(p_lokali_id uuid, p_celesi text)
returns table (
  vizita integer,
  te_disponueshme integer,
  progresi integer,
  nevojiten integer,
  shperblimi text
)
language sql
stable
security definer
set search_path = ''
as $$
  with lokali as (
    select besnikeria_vizita as n, besnikeria_shperblimi as shperblimi
    from public.lokalet
    where id = p_lokali_id and besnikeria_aktive
  ),
  numrat as (
    select
      -- Vizitat falas nuk numërohen për shpërblimin e ardhshëm.
      count(*) filter (where t.statusi = 'perfunduar' and not t.shperblim)::integer as vizita,
      count(*) filter (where t.shperblim and t.statusi in ('ne_pritje', 'konfirmuar', 'perfunduar'))::integer as te_perdorura
    from public.terminet t
    left join public.profilet k on k.id = t.klienti_id
    where t.lokali_id = p_lokali_id
      and public.celesi_i_klientit(t.klienti_id, coalesce(nullif(k.emri, ''), t.emri_klientit), coalesce(k.telefoni, t.telefoni_klientit)) = p_celesi
  )
  select
    numrat.vizita,
    greatest(numrat.vizita / lokali.n - numrat.te_perdorura, 0),
    numrat.vizita % lokali.n,
    lokali.n,
    lokali.shperblimi
  from lokali, numrat
  where public.eshte_anetar(p_lokali_id) or p_celesi = 'id:' || (select auth.uid())::text;
$$;

-- Stafi e kthen një termin në vizitë falas (ose e zhbën).
create function public.perdor_shperblimin(p_termini_id uuid, p_perdor boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_termini public.terminet%rowtype;
  v_celesi text;
  v_te_disponueshme integer;
begin
  select * into v_termini from public.terminet where id = p_termini_id for update;
  if not found or not public.eshte_anetar(v_termini.lokali_id) then
    raise exception 'Nuk ke leje për këtë termin' using errcode = '42501';
  end if;
  if v_termini.statusi not in ('ne_pritje', 'konfirmuar', 'perfunduar') then
    raise exception 'Termini nuk mund të ndryshohet' using errcode = 'TT003';
  end if;
  if p_perdor = v_termini.shperblim then
    return;
  end if;

  if p_perdor then
    select public.celesi_i_klientit(v_termini.klienti_id, coalesce(nullif(k.emri, ''), v_termini.emri_klientit), coalesce(k.telefoni, v_termini.telefoni_klientit))
    into v_celesi
    from (select 1) x
    left join public.profilet k on k.id = v_termini.klienti_id;

    select b.te_disponueshme into v_te_disponueshme
    from public.besnikeria_e_klientit(v_termini.lokali_id, v_celesi) b;

    if coalesce(v_te_disponueshme, 0) < 1 then
      raise exception 'Klienti nuk ka shpërblim të disponueshëm' using errcode = 'TT006';
    end if;
  end if;

  update public.terminet
  set shperblim = p_perdor,
      cmimi_centa = case
        when p_perdor then 0
        else coalesce(cmimi_baze_centa, cmimi_centa) - zbritja_centa
      end
  where id = p_termini_id;
end;
$$;

-- Kartat e klientit në lokalet ku ka vizita dhe besnikëria është aktive.
create function public.besnikeria_ime()
returns table (
  lokali_id uuid,
  lokali_emri text,
  lokali_logo_url text,
  vizita integer,
  te_disponueshme integer,
  progresi integer,
  nevojiten integer,
  shperblimi text
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.emri, l.logo_url, b.vizita, b.te_disponueshme, b.progresi, b.nevojiten, b.shperblimi
  from public.lokalet l
  cross join lateral public.besnikeria_e_klientit(l.id, 'id:' || (select auth.uid())::text) b
  where l.besnikeria_aktive
    and exists (
      select 1 from public.terminet t
      where t.lokali_id = l.id and t.klienti_id = (select auth.uid()) and t.statusi = 'perfunduar'
    )
  order by b.te_disponueshme desc, b.progresi desc;
$$;

-- ─────────────────────────────────────────────────────────────
-- Vlerësimet
-- ─────────────────────────────────────────────────────────────
create function public.vlereso_terminin(p_termini_id uuid, p_yjet integer, p_komenti text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_termini public.terminet%rowtype;
begin
  select * into v_termini from public.terminet where id = p_termini_id;
  if not found or v_termini.klienti_id is distinct from (select auth.uid()) then
    raise exception 'Nuk ke leje për këtë termin' using errcode = '42501';
  end if;
  if v_termini.statusi <> 'perfunduar' or v_termini.fillon_me < now() - interval '60 days' then
    raise exception 'Ky termin nuk mund të vlerësohet' using errcode = 'TT005';
  end if;
  if p_yjet not between 1 and 5 then
    raise exception 'Vlerësimi duhet të jetë 1 deri 5 yje' using errcode = '22023';
  end if;

  insert into public.vleresimet (termini_id, lokali_id, klienti_id, berberi_id, yjet, komenti)
  values (
    p_termini_id,
    v_termini.lokali_id,
    v_termini.klienti_id,
    v_termini.berberi_id,
    p_yjet,
    nullif(left(trim(coalesce(p_komenti, '')), 1000), '')
  )
  on conflict (termini_id) do update
  set yjet = excluded.yjet,
      komenti = excluded.komenti;
end;
$$;

create function public.pergjigju_vleresimit(p_vleresimi_id uuid, p_pergjigjja text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lokali_id uuid;
begin
  select lokali_id into v_lokali_id from public.vleresimet where id = p_vleresimi_id;
  if v_lokali_id is null or not public.eshte_pronar(v_lokali_id) then
    raise exception 'Vetëm pronari mund të përgjigjet' using errcode = '42501';
  end if;

  update public.vleresimet
  set pergjigjja = nullif(left(trim(coalesce(p_pergjigjja, '')), 1000), ''),
      pergjigjur_me = case when nullif(trim(coalesce(p_pergjigjja, '')), '') is null then null else now() end
  where id = p_vleresimi_id;
end;
$$;

-- Lista publike: emri i klientit shkurtohet ("Arta K.") për privatësi.
create function public.vleresimet_e_lokalit(p_lokali_id uuid, p_limit integer default 20, p_offset integer default 0)
returns table (
  id uuid,
  yjet smallint,
  komenti text,
  pergjigjja text,
  pergjigjur_me timestamptz,
  krijuar_me timestamptz,
  klienti_emri text,
  sherbimi_emri text,
  berberi_emri text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    v.id,
    v.yjet,
    v.komenti,
    v.pergjigjja,
    v.pergjigjur_me,
    v.krijuar_me,
    coalesce(
      nullif(
        trim(split_part(trim(k.emri), ' ', 1) || ' ' || coalesce(left(nullif(split_part(trim(k.emri), ' ', 2), ''), 1) || '.', '')),
        ''
      ),
      '—'
    ),
    s.emri,
    b.emri
  from public.vleresimet v
  join public.terminet t on t.id = v.termini_id
  join public.sherbimet s on s.id = t.sherbimi_id
  left join public.profilet k on k.id = v.klienti_id
  left join public.profilet b on b.id = v.berberi_id
  where v.lokali_id = p_lokali_id
    and (public.eshte_lokal_publik(p_lokali_id) or public.eshte_anetar(p_lokali_id))
  order by v.krijuar_me desc
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

-- ─────────────────────────────────────────────────────────────
-- Lista e pritjes: shtimi dhe lista e klientit
-- ─────────────────────────────────────────────────────────────
create function public.shto_ne_listen_e_pritjes(
  p_lokali_id uuid,
  p_sherbimi_id uuid,
  p_data date,
  p_berberi_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_klienti uuid := (select auth.uid());
  v_lokali public.lokalet%rowtype;
  v_sot date;
  v_id uuid;
begin
  if v_klienti is null then
    raise exception 'Duhet të hysh në llogari' using errcode = '42501';
  end if;

  select * into v_lokali from public.lokalet where id = p_lokali_id and i_publikuar and burimi = 'trimtime';
  if not found then
    raise exception 'Ky lokal nuk pranon rezervime' using errcode = 'TT004';
  end if;
  if not exists (select 1 from public.sherbimet where id = p_sherbimi_id and lokali_id = p_lokali_id and aktiv) then
    raise exception 'Shërbimi nuk ekziston' using errcode = 'TT004';
  end if;

  v_sot := (now() at time zone v_lokali.zona_kohore)::date;
  if p_data < v_sot or p_data > v_sot + 60 then
    raise exception 'Data nuk është e vlefshme' using errcode = '22023';
  end if;

  insert into public.lista_e_pritjes (lokali_id, klienti_id, sherbimi_id, berberi_id, data)
  values (p_lokali_id, v_klienti, p_sherbimi_id, p_berberi_id, p_data)
  on conflict (klienti_id, lokali_id, sherbimi_id, data) do update
  set berberi_id = excluded.berberi_id,
      njoftuar_me = null
  returning id into v_id;

  return v_id;
end;
$$;

create function public.lista_ime_e_pritjes()
returns table (
  id uuid,
  lokali_id uuid,
  lokali_emri text,
  sherbimi_id uuid,
  sherbimi_emri text,
  berberi_id uuid,
  berberi_emri text,
  data date,
  njoftuar_me timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select w.id, w.lokali_id, l.emri, w.sherbimi_id, s.emri, w.berberi_id, b.emri, w.data, w.njoftuar_me
  from public.lista_e_pritjes w
  join public.lokalet l on l.id = w.lokali_id
  join public.sherbimet s on s.id = w.sherbimi_id
  left join public.profilet b on b.id = w.berberi_id
  where w.klienti_id = (select auth.uid())
    and w.data >= (now() at time zone l.zona_kohore)::date
  order by w.data, l.emri;
$$;

-- ─────────────────────────────────────────────────────────────
-- Listat e termineve: tani me pagesën, zbritjen, shpërblimin dhe vlerësimin
-- (lloji i kthimit ndryshon, ndaj funksionet rikrijohen)
-- ─────────────────────────────────────────────────────────────
drop function public.terminet_e_mia();

create function public.terminet_e_mia()
returns table (
  id uuid,
  lokali_id uuid,
  lokali_emri text,
  lokali_adresa text,
  lokali_qyteti text,
  lokali_logo_url text,
  lokali_telefoni text,
  lat double precision,
  lng double precision,
  sherbimi_id uuid,
  sherbimi_emri text,
  kohezgjatja_min integer,
  berberi_id uuid,
  berberi_emri text,
  fillon_me timestamptz,
  data_lokale text,
  ora_lokale text,
  statusi public.statusi_terminit,
  cmimi_centa integer,
  shenime text,
  mund_te_ndryshohet boolean,
  cmimi_baze_centa integer,
  zbritja_centa integer,
  shperblim boolean,
  vleresimi_yjet smallint,
  mund_te_vleresohet boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id,
    t.lokali_id,
    l.emri,
    l.adresa,
    l.qyteti,
    l.logo_url,
    l.telefoni,
    extensions.st_y(l.vendndodhja::extensions.geometry),
    extensions.st_x(l.vendndodhja::extensions.geometry),
    t.sherbimi_id,
    s.emri,
    s.kohezgjatja_min,
    t.berberi_id,
    p.emri,
    t.fillon_me,
    to_char(t.fillon_me at time zone l.zona_kohore, 'YYYY-MM-DD'),
    to_char(t.fillon_me at time zone l.zona_kohore, 'HH24:MI'),
    t.statusi,
    t.cmimi_centa,
    t.shenime,
    t.statusi in ('ne_pritje', 'konfirmuar')
      and now() <= t.fillon_me - make_interval(hours => l.anulimi_deri_ore),
    coalesce(t.cmimi_baze_centa, t.cmimi_centa),
    t.zbritja_centa,
    t.shperblim,
    v.yjet,
    t.statusi = 'perfunduar' and t.fillon_me >= now() - interval '60 days'
  from public.terminet t
  join public.lokalet l on l.id = t.lokali_id
  join public.sherbimet s on s.id = t.sherbimi_id
  join public.profilet p on p.id = t.berberi_id
  left join public.vleresimet v on v.termini_id = t.id
  where t.klienti_id = (select auth.uid())
  order by t.fillon_me desc
  limit 200;
$$;

drop function public.terminet_e_lokalit(uuid, date);

create function public.terminet_e_lokalit(p_lokali_id uuid, p_data date)
returns table (
  id uuid,
  klienti_id uuid,
  klienti_emri text,
  klienti_telefoni text,
  sherbimi_id uuid,
  sherbimi_emri text,
  kohezgjatja_min integer,
  berberi_id uuid,
  berberi_emri text,
  fillon_me timestamptz,
  ora_lokale text,
  statusi public.statusi_terminit,
  cmimi_centa integer,
  shenime text,
  klienti_celesi text,
  cmimi_baze_centa integer,
  zbritja_centa integer,
  promocioni_titulli text,
  shperblim boolean,
  paguar_me timestamptz,
  menyra_e_pageses public.menyra_e_pageses,
  -- null kur lokali nuk ka kartë besnikërie.
  shperblime_te_disponueshme integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id,
    t.klienti_id,
    coalesce(nullif(k.emri, ''), t.emri_klientit, '—'),
    coalesce(k.telefoni, t.telefoni_klientit),
    t.sherbimi_id,
    s.emri,
    s.kohezgjatja_min,
    t.berberi_id,
    b.emri,
    t.fillon_me,
    to_char(t.fillon_me at time zone l.zona_kohore, 'HH24:MI'),
    t.statusi,
    t.cmimi_centa,
    t.shenime,
    c.celesi,
    coalesce(t.cmimi_baze_centa, t.cmimi_centa),
    t.zbritja_centa,
    pr.titulli,
    t.shperblim,
    t.paguar_me,
    t.menyra_e_pageses,
    (select bs.te_disponueshme from public.besnikeria_e_klientit(t.lokali_id, c.celesi) bs)
  from public.terminet t
  join public.lokalet l on l.id = t.lokali_id
  join public.sherbimet s on s.id = t.sherbimi_id
  join public.profilet b on b.id = t.berberi_id
  left join public.profilet k on k.id = t.klienti_id
  left join public.promocionet pr on pr.id = t.promocioni_id
  cross join lateral (
    select public.celesi_i_klientit(t.klienti_id, coalesce(nullif(k.emri, ''), t.emri_klientit), coalesce(k.telefoni, t.telefoni_klientit)) as celesi
  ) c
  where t.lokali_id = p_lokali_id
    and public.eshte_anetar(p_lokali_id)
    and (t.fillon_me at time zone l.zona_kohore)::date = p_data
  order by t.fillon_me;
$$;

-- ─────────────────────────────────────────────────────────────
-- Analitika: shtohen pagesat (kesh/kartë, të papaguara), zbritjet dhe vlerësimi
-- ─────────────────────────────────────────────────────────────
create or replace function public.analitika_e_lokalit(p_lokali_id uuid, p_nga date, p_deri date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with lokali as (
    select zona_kohore from public.lokalet where id = p_lokali_id and public.eshte_anetar(p_lokali_id)
  ),
  te_gjitha as (
    select
      t.*,
      t.fillon_me at time zone lokali.zona_kohore as lokale,
      public.celesi_i_klientit(t.klienti_id, coalesce(nullif(k.emri, ''), t.emri_klientit), coalesce(k.telefoni, t.telefoni_klientit)) as celesi
    from public.terminet t
    cross join lokali
    left join public.profilet k on k.id = t.klienti_id
    where t.lokali_id = p_lokali_id
  ),
  periudha as (
    select * from te_gjitha where lokale::date between p_nga and p_deri
  ),
  hera_e_pare as (
    select celesi, min(fillon_me) as fillimi
    from te_gjitha
    where statusi <> 'anuluar'
    group by celesi
  )
  select jsonb_build_object(
    'te_ardhura', coalesce((select sum(cmimi_centa) from periudha where statusi = 'perfunduar'), 0),
    'termine', (select count(*) from periudha where statusi <> 'anuluar'),
    'perfunduar', (select count(*) from periudha where statusi = 'perfunduar'),
    'anuluar', (select count(*) from periudha where statusi = 'anuluar'),
    'nuk_erdhi', (select count(*) from periudha where statusi = 'nuk_erdhi'),
    'paguar_kesh', coalesce((select sum(cmimi_centa) from periudha where menyra_e_pageses = 'kesh'), 0),
    'paguar_karte', coalesce((select sum(cmimi_centa) from periudha where menyra_e_pageses = 'karte'), 0),
    'pa_paguar', coalesce((
      select sum(cmimi_centa) from periudha where statusi = 'perfunduar' and paguar_me is null and cmimi_centa > 0
    ), 0),
    'zbritjet', coalesce((
      select sum(coalesce(cmimi_baze_centa, cmimi_centa) - cmimi_centa) from periudha where statusi = 'perfunduar'
    ), 0),
    'shperblime', (select count(*) from periudha where shperblim and statusi = 'perfunduar'),
    'vleresimi_mesatar', (
      select round(avg(v.yjet)::numeric, 1)
      from public.vleresimet v
      cross join lokali
      where v.lokali_id = p_lokali_id
        and (v.krijuar_me at time zone lokali.zona_kohore)::date between p_nga and p_deri
    ),
    'nr_vleresimeve', (
      select count(*)
      from public.vleresimet v
      cross join lokali
      where v.lokali_id = p_lokali_id
        and (v.krijuar_me at time zone lokali.zona_kohore)::date between p_nga and p_deri
    ),
    'klientet_e_rinj', (
      select count(distinct p.celesi)
      from periudha p join hera_e_pare h using (celesi)
      where p.statusi <> 'anuluar' and (h.fillimi at time zone (select zona_kohore from lokali))::date >= p_nga
    ),
    'klientet_qe_kthehen', (
      select count(distinct p.celesi)
      from periudha p join hera_e_pare h using (celesi)
      where p.statusi <> 'anuluar' and (h.fillimi at time zone (select zona_kohore from lokali))::date < p_nga
    ),
    'sipas_dites', coalesce((
      select jsonb_agg(jsonb_build_object('data', d.data, 'termine', d.termine, 'te_ardhura', d.te_ardhura) order by d.data)
      from (
        select
          to_char(lokale::date, 'YYYY-MM-DD') as data,
          count(*) filter (where statusi <> 'anuluar') as termine,
          coalesce(sum(cmimi_centa) filter (where statusi = 'perfunduar'), 0) as te_ardhura
        from periudha
        group by lokale::date
      ) d
    ), '[]'::jsonb),
    'sherbimet', coalesce((
      select jsonb_agg(jsonb_build_object('emri', x.emri, 'termine', x.termine, 'te_ardhura', x.te_ardhura) order by x.termine desc)
      from (
        select s.emri, count(*) as termine,
          coalesce(sum(p.cmimi_centa) filter (where p.statusi = 'perfunduar'), 0) as te_ardhura
        from periudha p join public.sherbimet s on s.id = p.sherbimi_id
        where p.statusi <> 'anuluar'
        group by s.emri
        order by count(*) desc
        limit 5
      ) x
    ), '[]'::jsonb),
    'berberet', coalesce((
      select jsonb_agg(jsonb_build_object('emri', x.emri, 'termine', x.termine, 'te_ardhura', x.te_ardhura) order by x.termine desc)
      from (
        select b.emri, count(*) as termine,
          coalesce(sum(p.cmimi_centa) filter (where p.statusi = 'perfunduar'), 0) as te_ardhura
        from periudha p join public.profilet b on b.id = p.berberi_id
        where p.statusi <> 'anuluar'
        group by b.emri
      ) x
    ), '[]'::jsonb),
    'oret', coalesce((
      select jsonb_agg(jsonb_build_object('ora', x.ora, 'termine', x.termine) order by x.ora)
      from (
        select extract(hour from lokale)::int as ora, count(*) as termine
        from periudha
        where statusi <> 'anuluar'
        group by 1
      ) x
    ), '[]'::jsonb)
  )
  where exists (select 1 from lokali);
$$;

-- ─────────────────────────────────────────────────────────────
-- Zbulimi: vlerësimi dhe zbritja në pamje dhe në lokalet_prane
-- ─────────────────────────────────────────────────────────────
create or replace view public.lokalet_me_koordinata
with (security_invoker = true)
as
select
  l.id,
  l.pronari_id,
  l.emri,
  l.pershkrimi,
  l.adresa,
  l.qyteti,
  l.telefoni,
  l.logo_url,
  l.kopertina_url,
  l.zona_kohore,
  l.i_publikuar,
  l.krijuar_me,
  extensions.st_y(l.vendndodhja::extensions.geometry) as lat,
  extensions.st_x(l.vendndodhja::extensions.geometry) as lng,
  public.eshte_hapur_tani(l.id) as i_hapur_tani,
  (
    select min(s.cmimi_centa)
    from public.sherbimet s
    where s.lokali_id = l.id and s.aktiv
  ) as cmimi_min,
  l.burimi,
  l.pranimi_automatik,
  l.anulimi_deri_ore,
  l.vleresimi_mesatar,
  l.nr_vleresimeve,
  l.besnikeria_aktive,
  l.besnikeria_vizita,
  l.besnikeria_shperblimi,
  public.promocioni_max(l.id) as promocioni_max
from public.lokalet l;

drop function public.lokalet_prane(double precision, double precision, double precision, text, boolean, integer, text, integer);

create function public.lokalet_prane(
  p_lat double precision,
  p_lng double precision,
  p_rrezja_km double precision default 25,
  p_kerkimi text default null,
  p_vetem_hapur boolean default false,
  p_cmimi_max integer default null,
  -- 'distanca', 'cmimi' ose 'vleresimi'
  p_renditja text default 'distanca',
  p_limit integer default 50
)
returns table (
  id uuid,
  emri text,
  adresa text,
  qyteti text,
  logo_url text,
  kopertina_url text,
  lat double precision,
  lng double precision,
  distanca_m double precision,
  i_hapur_tani boolean,
  cmimi_min integer,
  nr_sherbimeve integer,
  burimi text,
  vleresimi_mesatar numeric,
  nr_vleresimeve integer,
  promocioni_max integer
)
language sql
stable
set search_path = ''
as $$
  with pika as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  ),
  kerkimi as (
    select nullif(trim(replace(replace(coalesce(p_kerkimi, ''), '%', '\%'), '_', '\_')), '') as k
  ),
  rezultatet as (
    select
      l.id,
      l.emri,
      l.adresa,
      l.qyteti,
      l.logo_url,
      l.kopertina_url,
      extensions.st_y(l.vendndodhja::extensions.geometry) as lat,
      extensions.st_x(l.vendndodhja::extensions.geometry) as lng,
      extensions.st_distance(l.vendndodhja, pika.g) as distanca_m,
      public.eshte_hapur_tani(l.id) as i_hapur_tani,
      s.cmimi_min,
      coalesce(s.nr, 0)::integer as nr_sherbimeve,
      l.burimi,
      l.vleresimi_mesatar,
      l.nr_vleresimeve,
      public.promocioni_max(l.id) as promocioni_max
    from public.lokalet l
    cross join pika
    cross join kerkimi
    left join lateral (
      select min(sh.cmimi_centa)::integer as cmimi_min, count(*) as nr
      from public.sherbimet sh
      where sh.lokali_id = l.id and sh.aktiv
    ) s on true
    where l.i_publikuar
      and extensions.st_dwithin(l.vendndodhja, pika.g, least(p_rrezja_km, 300) * 1000)
      and (
        kerkimi.k is null
        or l.emri ilike '%' || kerkimi.k || '%'
        or l.qyteti ilike '%' || kerkimi.k || '%'
        or l.adresa ilike '%' || kerkimi.k || '%'
        or exists (
          select 1 from public.sherbimet sh
          where sh.lokali_id = l.id and sh.aktiv and sh.emri ilike '%' || kerkimi.k || '%'
        )
      )
      and (p_cmimi_max is null or s.cmimi_min <= p_cmimi_max)
  )
  select *
  from rezultatet r
  where not p_vetem_hapur or r.i_hapur_tani
  order by
    case when p_renditja = 'cmimi' then r.cmimi_min end asc nulls last,
    case when p_renditja = 'vleresimi' then r.vleresimi_mesatar end desc nulls last,
    case when p_renditja = 'vleresimi' then r.nr_vleresimeve end desc,
    r.distanca_m asc
  limit least(greatest(p_limit, 1), 300);
$$;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.promocionet enable row level security;
alter table public.vleresimet enable row level security;
alter table public.lista_e_pritjes enable row level security;

create policy "Kushdo sheh promocionet aktive të lokaleve të publikuara"
  on public.promocionet for select to anon, authenticated
  using (aktiv and public.eshte_lokal_publik(lokali_id));

create policy "Stafi sheh promocionet e lokalit"
  on public.promocionet for select to authenticated
  using (public.eshte_anetar(lokali_id));

create policy "Pronari shton promocione"
  on public.promocionet for insert to authenticated
  with check (public.eshte_pronar(lokali_id));

create policy "Pronari ndryshon promocionet"
  on public.promocionet for update to authenticated
  using (public.eshte_pronar(lokali_id))
  with check (public.eshte_pronar(lokali_id));

create policy "Pronari fshin promocionet"
  on public.promocionet for delete to authenticated
  using (public.eshte_pronar(lokali_id));

-- Vlerësimet shkruhen vetëm përmes vlereso_terminin() dhe pergjigju_vleresimit();
-- lista publike vjen nga vleresimet_e_lokalit(), që shkurton emrat.
create policy "Klienti sheh vlerësimet e veta"
  on public.vleresimet for select to authenticated
  using (klienti_id = (select auth.uid()));

create policy "Stafi sheh vlerësimet e lokalit"
  on public.vleresimet for select to authenticated
  using (public.eshte_anetar(lokali_id));

create policy "Klienti fshin vlerësimin e vet"
  on public.vleresimet for delete to authenticated
  using (klienti_id = (select auth.uid()));

create policy "Klienti sheh listën e vet të pritjes"
  on public.lista_e_pritjes for select to authenticated
  using (klienti_id = (select auth.uid()));

create policy "Stafi sheh listën e pritjes së lokalit"
  on public.lista_e_pritjes for select to authenticated
  using (public.eshte_anetar(lokali_id));

create policy "Klienti largohet nga lista e pritjes"
  on public.lista_e_pritjes for delete to authenticated
  using (klienti_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- Realtime: klienti merr njoftimin kur lirohet një orë
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.lista_e_pritjes;

-- ─────────────────────────────────────────────────────────────
-- Privilegjet
-- ─────────────────────────────────────────────────────────────
grant select on public.promocionet to anon;
grant select, insert, update, delete on public.promocionet to authenticated;
grant select, delete on public.vleresimet to authenticated;
grant select, delete on public.lista_e_pritjes to authenticated;

revoke execute on function
  public.rifresko_vleresimin_e_lokalit(),
  public.njofto_listen_e_pritjes()
  from public, anon, authenticated;

revoke execute on function
  public.promocioni_per(uuid, uuid, timestamptz),
  public.cmimi_i_terminit(uuid, uuid, timestamptz),
  public.promocioni_max(uuid),
  public.regjistro_pagesen(uuid, public.menyra_e_pageses),
  public.besnikeria_e_klientit(uuid, text),
  public.perdor_shperblimin(uuid, boolean),
  public.besnikeria_ime(),
  public.vlereso_terminin(uuid, integer, text),
  public.pergjigju_vleresimit(uuid, text),
  public.vleresimet_e_lokalit(uuid, integer, integer),
  public.shto_ne_listen_e_pritjes(uuid, uuid, date, uuid),
  public.lista_ime_e_pritjes(),
  public.terminet_e_mia(),
  public.terminet_e_lokalit(uuid, date),
  public.lokalet_prane(double precision, double precision, double precision, text, boolean, integer, text, integer)
  from public, anon;

grant execute on function
  public.cmimi_i_terminit(uuid, uuid, timestamptz),
  public.promocioni_max(uuid),
  public.vleresimet_e_lokalit(uuid, integer, integer),
  public.lokalet_prane(double precision, double precision, double precision, text, boolean, integer, text, integer)
  to anon, authenticated;

grant execute on function
  public.promocioni_per(uuid, uuid, timestamptz),
  public.regjistro_pagesen(uuid, public.menyra_e_pageses),
  public.besnikeria_e_klientit(uuid, text),
  public.perdor_shperblimin(uuid, boolean),
  public.besnikeria_ime(),
  public.vlereso_terminin(uuid, integer, text),
  public.pergjigju_vleresimit(uuid, text),
  public.shto_ne_listen_e_pritjes(uuid, uuid, date, uuid),
  public.lista_ime_e_pritjes(),
  public.terminet_e_mia(),
  public.terminet_e_lokalit(uuid, date)
  to authenticated;
