-- TrimTime · Faza 3 · Motori i rezervimeve
-- Oraret e lira, rezervimi, anulimi, riplanifikimi, listat e termineve dhe realtime.
-- Ekzekutohet pas 20261022150000_lokalet_osm.sql: SQL Editor → New query → Run.

-- ─────────────────────────────────────────────────────────────
-- Rregullat e rezervimit për çdo lokal
-- ─────────────────────────────────────────────────────────────
alter table public.lokalet
  -- true: rezervimet konfirmohen vetë; false: berberi i konfirmon me dorë.
  add column pranimi_automatik boolean not null default true,
  -- Klienti mund të anulojë ose riplanifikojë falas deri kaq orë para terminit.
  add column anulimi_deri_ore integer not null default 2 check (anulimi_deri_ore between 0 and 72);

create index terminet_berberi_koha_idx on public.terminet (berberi_id, fillon_me);

-- Pamja merr rregullat e reja (kolonat e reja shtohen në fund).
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
  l.anulimi_deri_ore
from public.lokalet l;

-- ─────────────────────────────────────────────────────────────
-- Oraret e lira për një shërbim në një datë (data sipas orës së lokalit)
-- ─────────────────────────────────────────────────────────────
-- Çdo 15 minuta brenda orarit, ku shërbimi + pushimi pas tij mbarojnë para mbylljes
-- dhe berberi nuk ka termin aktiv që mbivendoset. Pa berber të zgjedhur, për çdo orë
-- kthehet berberi më pak i ngarkuar atë ditë.
create function public.oraret_e_lira(
  p_lokali_id uuid,
  p_sherbimi_id uuid,
  p_data date,
  p_berberi_id uuid default null,
  -- Gjatë riplanifikimit, termini që po zhvendoset nuk e bllokon veten.
  p_perjashto_terminin uuid default null,
  -- Stafi mund të shtojë termine që fillojnë menjëherë (walk-in); klientët 15 min më vonë.
  p_per_stafin boolean default false
)
returns table (fillon_me timestamptz, ora text, berberi_id uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_lokali public.lokalet%rowtype;
  v_sherbimi public.sherbimet%rowtype;
  v_kohezgjatja interval;
  v_me_heret timestamptz;
begin
  select * into v_lokali from public.lokalet where id = p_lokali_id;
  if not found or v_lokali.burimi <> 'trimtime' then
    return;
  end if;
  if p_per_stafin and not public.eshte_anetar(p_lokali_id) then
    return;
  end if;
  if not p_per_stafin and not v_lokali.i_publikuar then
    return;
  end if;

  select * into v_sherbimi
  from public.sherbimet
  where id = p_sherbimi_id and lokali_id = p_lokali_id and (aktiv or p_per_stafin);
  if not found then
    return;
  end if;

  v_kohezgjatja := make_interval(mins => v_sherbimi.kohezgjatja_min + v_sherbimi.pushimi_pas_min);
  v_me_heret := now() + case when p_per_stafin then interval '0' else interval '15 minutes' end;

  return query
  with intervalet as (
    select
      (p_data + o.hapet) at time zone v_lokali.zona_kohore as fillimi,
      (p_data + o.mbyllet) at time zone v_lokali.zona_kohore as fundi
    from public.oraret_e_lokalit o
    where o.lokali_id = p_lokali_id
      and o.dita = extract(dow from p_data)::int
  ),
  kandidatet as (
    select g.koha
    from intervalet i
    cross join lateral generate_series(i.fillimi, i.fundi - v_kohezgjatja, interval '15 minutes') as g(koha)
    -- Stafi i rrumbullakon orët e kaluara te 15 minutat e ardhshme.
    where g.koha >= v_me_heret - case when p_per_stafin then interval '14 minutes' else interval '0' end
  ),
  berberet as (
    select a.profili_id
    from public.anetaret_e_lokalit a
    where a.lokali_id = p_lokali_id
      and a.aktiv
      and (p_berberi_id is null or a.profili_id = p_berberi_id)
  ),
  te_lira as (
    select
      k.koha,
      b.profili_id,
      (
        select count(*)
        from public.terminet t2
        where t2.berberi_id = b.profili_id
          and t2.statusi in ('ne_pritje', 'konfirmuar')
          and (t2.fillon_me at time zone v_lokali.zona_kohore)::date = p_data
      ) as ngarkesa
    from kandidatet k
    cross join berberet b
    where not exists (
      select 1
      from public.terminet t
      where t.berberi_id = b.profili_id
        and t.statusi in ('ne_pritje', 'konfirmuar')
        and (p_perjashto_terminin is null or t.id <> p_perjashto_terminin)
        and tstzrange(t.fillon_me, t.mbaron_me, '[)') && tstzrange(k.koha, k.koha + v_kohezgjatja, '[)')
    )
  )
  select distinct on (tl.koha)
    tl.koha,
    to_char(tl.koha at time zone v_lokali.zona_kohore, 'HH24:MI'),
    tl.profili_id
  from te_lira tl
  order by tl.koha, tl.ngarkesa, tl.profili_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Rezervimi nga klienti: çmimi dhe ora e mbarimit llogariten këtu, jo në aplikacion
-- ─────────────────────────────────────────────────────────────
create function public.rezervo_termin(
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

  insert into public.terminet (
    lokali_id, berberi_id, klienti_id, sherbimi_id,
    fillon_me, mbaron_me, statusi, cmimi_centa, shenime
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
    nullif(left(trim(coalesce(p_shenime, '')), 500), '')
  )
  returning id into v_id;

  return v_id;
exception
  -- Dy klientë e kanë zgjedhur të njëjtin orar në të njëjtin çast: fiton i pari.
  when exclusion_violation then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Termin i shtuar nga stafi (walk-in ose rezervim me telefon)
-- ─────────────────────────────────────────────────────────────
create function public.shto_termin_nga_stafi(
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

  insert into public.terminet (
    lokali_id, berberi_id, emri_klientit, telefoni_klientit, sherbimi_id,
    fillon_me, mbaron_me, statusi, cmimi_centa, shenime
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
-- Anulimi: klienti deri në afatin e lokalit, stafi kurdo
-- ─────────────────────────────────────────────────────────────
create function public.anulo_terminin(p_termini_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_perdoruesi uuid := (select auth.uid());
  v_termini public.terminet%rowtype;
  v_afati integer;
  v_eshte_stafi boolean;
begin
  select * into v_termini from public.terminet where id = p_termini_id for update;
  if not found then
    raise exception 'Termini nuk u gjet' using errcode = 'P0002';
  end if;

  v_eshte_stafi := public.eshte_anetar(v_termini.lokali_id);
  if v_termini.klienti_id is distinct from v_perdoruesi and not v_eshte_stafi then
    raise exception 'Nuk ke leje për këtë termin' using errcode = '42501';
  end if;

  if v_termini.statusi not in ('ne_pritje', 'konfirmuar') then
    raise exception 'Termini nuk mund të anulohet' using errcode = 'TT003';
  end if;

  select anulimi_deri_ore into v_afati from public.lokalet where id = v_termini.lokali_id;
  if not v_eshte_stafi and now() > v_termini.fillon_me - make_interval(hours => v_afati) then
    raise exception 'Afati për anulim ka kaluar' using errcode = 'TT002';
  end if;

  update public.terminet set statusi = 'anuluar' where id = p_termini_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Riplanifikimi nga klienti: e njëjta ditë/afat si anulimi, i njëjti berber
-- ─────────────────────────────────────────────────────────────
create function public.riplanifiko_terminin(p_termini_id uuid, p_fillon_me timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_perdoruesi uuid := (select auth.uid());
  v_termini public.terminet%rowtype;
  v_lokali public.lokalet%rowtype;
  v_sherbimi public.sherbimet%rowtype;
  v_i_lire boolean;
begin
  select * into v_termini from public.terminet where id = p_termini_id for update;
  if not found or v_termini.klienti_id is distinct from v_perdoruesi then
    raise exception 'Nuk ke leje për këtë termin' using errcode = '42501';
  end if;
  if v_termini.statusi not in ('ne_pritje', 'konfirmuar') then
    raise exception 'Termini nuk mund të ndryshohet' using errcode = 'TT003';
  end if;

  select * into v_lokali from public.lokalet where id = v_termini.lokali_id;
  if now() > v_termini.fillon_me - make_interval(hours => v_lokali.anulimi_deri_ore) then
    raise exception 'Afati për ndryshim ka kaluar' using errcode = 'TT002';
  end if;

  select * into v_sherbimi from public.sherbimet where id = v_termini.sherbimi_id;

  select exists (
    select 1
    from public.oraret_e_lira(
      v_termini.lokali_id,
      v_termini.sherbimi_id,
      (p_fillon_me at time zone v_lokali.zona_kohore)::date,
      v_termini.berberi_id,
      p_termini_id
    ) o
    where o.fillon_me = p_fillon_me
  ) into v_i_lire;

  if not v_i_lire then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
  end if;

  update public.terminet
  set fillon_me = p_fillon_me,
      mbaron_me = p_fillon_me + make_interval(mins => v_sherbimi.kohezgjatja_min + v_sherbimi.pushimi_pas_min),
      statusi = case when v_lokali.pranimi_automatik then 'konfirmuar' else 'ne_pritje' end::public.statusi_terminit
  where id = p_termini_id;
exception
  when exclusion_violation then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Terminet e klientit me emrat e lokalit, shërbimit dhe berberit
-- ─────────────────────────────────────────────────────────────
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
  mund_te_ndryshohet boolean
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
      and now() <= t.fillon_me - make_interval(hours => l.anulimi_deri_ore)
  from public.terminet t
  join public.lokalet l on l.id = t.lokali_id
  join public.sherbimet s on s.id = t.sherbimi_id
  join public.profilet p on p.id = t.berberi_id
  where t.klienti_id = (select auth.uid())
  order by t.fillon_me desc
  limit 200;
$$;

-- ─────────────────────────────────────────────────────────────
-- Terminet e një dite për stafin e lokalit
-- ─────────────────────────────────────────────────────────────
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
  shenime text
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
    t.shenime
  from public.terminet t
  join public.lokalet l on l.id = t.lokali_id
  join public.sherbimet s on s.id = t.sherbimi_id
  join public.profilet b on b.id = t.berberi_id
  left join public.profilet k on k.id = t.klienti_id
  where t.lokali_id = p_lokali_id
    and public.eshte_anetar(p_lokali_id)
    and (t.fillon_me at time zone l.zona_kohore)::date = p_data
  order by t.fillon_me;
$$;

-- ─────────────────────────────────────────────────────────────
-- Realtime: stafi merr rezervimet e reja menjëherë (RLS vendos kush i sheh)
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.terminet;

-- ─────────────────────────────────────────────────────────────
-- Privilegjet
-- ─────────────────────────────────────────────────────────────
revoke execute on function
  public.oraret_e_lira(uuid, uuid, date, uuid, uuid, boolean),
  public.rezervo_termin(uuid, uuid, timestamptz, uuid, text),
  public.shto_termin_nga_stafi(uuid, uuid, timestamptz, uuid, text, text, text),
  public.anulo_terminin(uuid),
  public.riplanifiko_terminin(uuid, timestamptz),
  public.terminet_e_mia(),
  public.terminet_e_lokalit(uuid, date)
  from public, anon;

grant execute on function
  public.oraret_e_lira(uuid, uuid, date, uuid, uuid, boolean),
  public.rezervo_termin(uuid, uuid, timestamptz, uuid, text),
  public.shto_termin_nga_stafi(uuid, uuid, timestamptz, uuid, text, text, text),
  public.anulo_terminin(uuid),
  public.riplanifiko_terminin(uuid, timestamptz),
  public.terminet_e_mia(),
  public.terminet_e_lokalit(uuid, date)
  to authenticated;
