-- TrimTime · Faza 4 · Mjetet e biznesit
-- Orari dhe pushimet e çdo berberi, kalendari, zhvendosja nga stafi, klientët (CRM) dhe analitika.
-- Ekzekutohet pas 20261023090000_rezervimet.sql: SQL Editor → New query → Run.

-- ─────────────────────────────────────────────────────────────
-- Orari i veçantë i berberit (pa të, berberi ndjek orarin e lokalit)
-- ─────────────────────────────────────────────────────────────
alter table public.anetaret_e_lokalit
  add column orar_i_vecante boolean not null default false;

create table public.oraret_e_stafit (
  id uuid primary key default gen_random_uuid(),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  profili_id uuid not null references public.profilet (id) on delete cascade,
  dita smallint not null check (dita between 0 and 6),
  hapet time not null,
  mbyllet time not null,
  constraint oraret_e_stafit_intervali check (mbyllet > hapet)
);

create index oraret_e_stafit_idx on public.oraret_e_stafit (lokali_id, profili_id, dita);

-- ─────────────────────────────────────────────────────────────
-- Pushimet: kohë kur berberi nuk pranon termine (pushim, ditë e lirë, takim)
-- ─────────────────────────────────────────────────────────────
create table public.pushimet_e_stafit (
  id uuid primary key default gen_random_uuid(),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  profili_id uuid not null references public.profilet (id) on delete cascade,
  fillon_me timestamptz not null,
  mbaron_me timestamptz not null,
  arsyeja text check (char_length(arsyeja) <= 120),
  krijuar_me timestamptz not null default now(),
  constraint pushimet_koha check (mbaron_me > fillon_me)
);

create index pushimet_e_stafit_idx on public.pushimet_e_stafit (profili_id, fillon_me);

-- ─────────────────────────────────────────────────────────────
-- Shënimet dhe etiketa VIP për klientët e lokalit
-- ─────────────────────────────────────────────────────────────
create table public.shenimet_e_klienteve (
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  -- Shih celesi_i_klientit(): llogaria, telefoni ose emri.
  celesi text not null check (char_length(celesi) <= 120),
  shenime text check (char_length(shenime) <= 1000),
  vip boolean not null default false,
  perditesuar_me timestamptz not null default now(),
  primary key (lokali_id, celesi)
);

create trigger shenimet_e_klienteve_perditesuar_me
  before update on public.shenimet_e_klienteve
  for each row execute function public.vendos_perditesuar_me();

-- Identifikon një klient brenda lokalit: llogaria kur ka, përndryshe telefoni ose emri
-- (klientët walk-in pa llogari).
create function public.celesi_i_klientit(p_klienti_id uuid, p_emri text, p_telefoni text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    'id:' || p_klienti_id::text,
    'tel:' || nullif(regexp_replace(coalesce(p_telefoni, ''), '\D', '', 'g'), ''),
    'emri:' || lower(trim(coalesce(p_emri, '')))
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Oraret e lira: tani me orarin e çdo berberi dhe pushimet e tij
-- ─────────────────────────────────────────────────────────────
create or replace function public.oraret_e_lira(
  p_lokali_id uuid,
  p_sherbimi_id uuid,
  p_data date,
  p_berberi_id uuid default null,
  p_perjashto_terminin uuid default null,
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
  v_dita int := extract(dow from p_data)::int;
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
  -- Stafi mund të shtojë termine që sapo kanë filluar (walk-in); klientët 15 min përpara.
  v_me_heret := now() - case when p_per_stafin then interval '14 minutes' else interval '-15 minutes' end;

  return query
  with berberet as (
    select a.profili_id, a.orar_i_vecante
    from public.anetaret_e_lokalit a
    where a.lokali_id = p_lokali_id
      and a.aktiv
      and (p_berberi_id is null or a.profili_id = p_berberi_id)
  ),
  intervalet as (
    select
      b.profili_id,
      (p_data + o.hapet) at time zone v_lokali.zona_kohore as fillimi,
      (p_data + o.mbyllet) at time zone v_lokali.zona_kohore as fundi
    from berberet b
    join public.oraret_e_lokalit o
      on not b.orar_i_vecante and o.lokali_id = p_lokali_id and o.dita = v_dita
    union all
    select
      b.profili_id,
      (p_data + s.hapet) at time zone v_lokali.zona_kohore,
      (p_data + s.mbyllet) at time zone v_lokali.zona_kohore
    from berberet b
    join public.oraret_e_stafit s
      on b.orar_i_vecante and s.lokali_id = p_lokali_id and s.profili_id = b.profili_id and s.dita = v_dita
  ),
  kandidatet as (
    select i.profili_id, g.koha
    from intervalet i
    cross join lateral generate_series(i.fillimi, i.fundi - v_kohezgjatja, interval '15 minutes') as g(koha)
    where g.koha >= v_me_heret
  ),
  te_lira as (
    select
      k.koha,
      k.profili_id,
      (
        select count(*)
        from public.terminet t2
        where t2.berberi_id = k.profili_id
          and t2.statusi in ('ne_pritje', 'konfirmuar')
          and (t2.fillon_me at time zone v_lokali.zona_kohore)::date = p_data
      ) as ngarkesa
    from kandidatet k
    where not exists (
      select 1
      from public.terminet t
      where t.berberi_id = k.profili_id
        and t.statusi in ('ne_pritje', 'konfirmuar')
        and (p_perjashto_terminin is null or t.id <> p_perjashto_terminin)
        and tstzrange(t.fillon_me, t.mbaron_me, '[)') && tstzrange(k.koha, k.koha + v_kohezgjatja, '[)')
    )
    and not exists (
      select 1
      from public.pushimet_e_stafit p
      where p.profili_id = k.profili_id
        and p.lokali_id = p_lokali_id
        and tstzrange(p.fillon_me, p.mbaron_me, '[)') && tstzrange(k.koha, k.koha + v_kohezgjatja, '[)')
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
-- Ruajtja e orarit të berberit (pronari, ose vetë berberi)
-- ─────────────────────────────────────────────────────────────
create function public.ruaj_orarin_e_berberit(
  p_lokali_id uuid,
  p_profili_id uuid,
  p_orar_i_vecante boolean,
  p_oraret jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.eshte_pronar(p_lokali_id) or (p_profili_id = (select auth.uid()) and public.eshte_anetar(p_lokali_id))) then
    raise exception 'Nuk ke leje për këtë orar' using errcode = '42501';
  end if;

  update public.anetaret_e_lokalit
  set orar_i_vecante = p_orar_i_vecante
  where lokali_id = p_lokali_id and profili_id = p_profili_id;

  delete from public.oraret_e_stafit where lokali_id = p_lokali_id and profili_id = p_profili_id;

  if p_orar_i_vecante then
    insert into public.oraret_e_stafit (lokali_id, profili_id, dita, hapet, mbyllet)
    select p_lokali_id, p_profili_id, (o ->> 'dita')::smallint, (o ->> 'hapet')::time, (o ->> 'mbyllet')::time
    from jsonb_array_elements(p_oraret) as o;
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Kalendari: terminet e një periudhe, me pozicionin në minuta nga mesnata
-- ─────────────────────────────────────────────────────────────
create function public.terminet_e_periudhes(p_lokali_id uuid, p_nga date, p_deri date)
returns table (
  id uuid,
  klienti_emri text,
  sherbimi_emri text,
  kohezgjatja_min integer,
  berberi_id uuid,
  berberi_emri text,
  fillon_me timestamptz,
  data_lokale text,
  ora_lokale text,
  minuta_e_dites integer,
  statusi public.statusi_terminit,
  cmimi_centa integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id,
    coalesce(nullif(k.emri, ''), t.emri_klientit, '—'),
    s.emri,
    s.kohezgjatja_min,
    t.berberi_id,
    b.emri,
    t.fillon_me,
    to_char(t.fillon_me at time zone l.zona_kohore, 'YYYY-MM-DD'),
    to_char(t.fillon_me at time zone l.zona_kohore, 'HH24:MI'),
    (extract(hour from t.fillon_me at time zone l.zona_kohore) * 60
      + extract(minute from t.fillon_me at time zone l.zona_kohore))::integer,
    t.statusi,
    t.cmimi_centa
  from public.terminet t
  join public.lokalet l on l.id = t.lokali_id
  join public.sherbimet s on s.id = t.sherbimi_id
  join public.profilet b on b.id = t.berberi_id
  left join public.profilet k on k.id = t.klienti_id
  where t.lokali_id = p_lokali_id
    and public.eshte_anetar(p_lokali_id)
    and (t.fillon_me at time zone l.zona_kohore)::date between p_nga and least(p_deri, p_nga + 31)
  order by t.fillon_me;
$$;

-- ─────────────────────────────────────────────────────────────
-- Zhvendosja e terminit nga stafi (orë tjetër dhe/ose berber tjetër)
-- ─────────────────────────────────────────────────────────────
create function public.zhvendos_terminin_nga_stafi(p_termini_id uuid, p_fillon_me timestamptz, p_berberi_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_termini public.terminet%rowtype;
  v_lokali public.lokalet%rowtype;
  v_sherbimi public.sherbimet%rowtype;
  v_i_lire boolean;
begin
  select * into v_termini from public.terminet where id = p_termini_id for update;
  if not found or not public.eshte_anetar(v_termini.lokali_id) then
    raise exception 'Nuk ke leje për këtë termin' using errcode = '42501';
  end if;
  if v_termini.statusi not in ('ne_pritje', 'konfirmuar') then
    raise exception 'Termini nuk mund të ndryshohet' using errcode = 'TT003';
  end if;

  select * into v_lokali from public.lokalet where id = v_termini.lokali_id;
  select * into v_sherbimi from public.sherbimet where id = v_termini.sherbimi_id;

  select exists (
    select 1
    from public.oraret_e_lira(
      v_termini.lokali_id,
      v_termini.sherbimi_id,
      (p_fillon_me at time zone v_lokali.zona_kohore)::date,
      p_berberi_id,
      p_termini_id,
      true
    ) o
    where o.fillon_me = p_fillon_me
  ) into v_i_lire;

  if not v_i_lire then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
  end if;

  update public.terminet
  set fillon_me = p_fillon_me,
      mbaron_me = p_fillon_me + make_interval(mins => v_sherbimi.kohezgjatja_min + v_sherbimi.pushimi_pas_min),
      berberi_id = p_berberi_id
  where id = p_termini_id;
exception
  when exclusion_violation then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Klientët e lokalit (CRM)
-- ─────────────────────────────────────────────────────────────
create function public.klientet_e_lokalit(p_lokali_id uuid)
returns table (
  celesi text,
  emri text,
  telefoni text,
  klienti_id uuid,
  vizita integer,
  shpenzuar_centa integer,
  vizita_e_fundit timestamptz,
  termini_i_ardhshem timestamptz,
  nuk_erdhi integer,
  vip boolean,
  shenime text
)
language sql
stable
security definer
set search_path = ''
as $$
  with te_gjitha as (
    select
      public.celesi_i_klientit(t.klienti_id, coalesce(nullif(k.emri, ''), t.emri_klientit), coalesce(k.telefoni, t.telefoni_klientit)) as celesi,
      coalesce(nullif(k.emri, ''), t.emri_klientit, '—') as emri,
      coalesce(k.telefoni, t.telefoni_klientit) as telefoni,
      t.klienti_id,
      t.statusi,
      t.cmimi_centa,
      t.fillon_me
    from public.terminet t
    left join public.profilet k on k.id = t.klienti_id
    where t.lokali_id = p_lokali_id
      and public.eshte_anetar(p_lokali_id)
  )
  select
    g.celesi,
    (array_agg(g.emri order by g.fillon_me desc))[1],
    (array_agg(g.telefoni order by g.fillon_me desc) filter (where g.telefoni is not null))[1],
    (array_agg(g.klienti_id) filter (where g.klienti_id is not null))[1],
    (count(*) filter (where g.statusi = 'perfunduar'))::integer,
    coalesce(sum(g.cmimi_centa) filter (where g.statusi = 'perfunduar'), 0)::integer,
    max(g.fillon_me) filter (where g.statusi = 'perfunduar'),
    min(g.fillon_me) filter (where g.statusi in ('ne_pritje', 'konfirmuar') and g.fillon_me > now()),
    (count(*) filter (where g.statusi = 'nuk_erdhi'))::integer,
    coalesce(bool_or(s.vip), false),
    max(s.shenime)
  from te_gjitha g
  left join public.shenimet_e_klienteve s on s.lokali_id = p_lokali_id and s.celesi = g.celesi
  group by g.celesi
  order by max(g.fillon_me) desc
  limit 500;
$$;

create function public.historiku_i_klientit(p_lokali_id uuid, p_celesi text)
returns table (
  id uuid,
  data_lokale text,
  ora_lokale text,
  sherbimi_emri text,
  berberi_emri text,
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
    to_char(t.fillon_me at time zone l.zona_kohore, 'YYYY-MM-DD'),
    to_char(t.fillon_me at time zone l.zona_kohore, 'HH24:MI'),
    s.emri,
    b.emri,
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
    and public.celesi_i_klientit(t.klienti_id, coalesce(nullif(k.emri, ''), t.emri_klientit), coalesce(k.telefoni, t.telefoni_klientit)) = p_celesi
  order by t.fillon_me desc
  limit 200;
$$;

-- ─────────────────────────────────────────────────────────────
-- Analitika e lokalit për një periudhë (sipas datës së lokalit)
-- ─────────────────────────────────────────────────────────────
create function public.analitika_e_lokalit(p_lokali_id uuid, p_nga date, p_deri date)
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
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.oraret_e_stafit enable row level security;
alter table public.pushimet_e_stafit enable row level security;
alter table public.shenimet_e_klienteve enable row level security;

create policy "Stafi sheh oraret e berberëve"
  on public.oraret_e_stafit for select to authenticated
  using (public.eshte_anetar(lokali_id));

-- Oraret e berberëve ndryshohen vetëm përmes ruaj_orarin_e_berberit().

create policy "Stafi sheh pushimet"
  on public.pushimet_e_stafit for select to authenticated
  using (public.eshte_anetar(lokali_id));

create policy "Pronari ose vetë berberi shton pushime"
  on public.pushimet_e_stafit for insert to authenticated
  with check (
    public.eshte_pronar(lokali_id)
    or (profili_id = (select auth.uid()) and public.eshte_anetar(lokali_id))
  );

create policy "Pronari ose vetë berberi fshin pushimet"
  on public.pushimet_e_stafit for delete to authenticated
  using (
    public.eshte_pronar(lokali_id)
    or (profili_id = (select auth.uid()) and public.eshte_anetar(lokali_id))
  );

create policy "Stafi sheh shënimet e klientëve"
  on public.shenimet_e_klienteve for select to authenticated
  using (public.eshte_anetar(lokali_id));

create policy "Stafi shton shënime për klientët"
  on public.shenimet_e_klienteve for insert to authenticated
  with check (public.eshte_anetar(lokali_id));

create policy "Stafi ndryshon shënimet e klientëve"
  on public.shenimet_e_klienteve for update to authenticated
  using (public.eshte_anetar(lokali_id))
  with check (public.eshte_anetar(lokali_id));

-- ─────────────────────────────────────────────────────────────
-- Privilegjet
-- ─────────────────────────────────────────────────────────────
grant select on public.oraret_e_stafit to authenticated;
grant select, insert, delete on public.pushimet_e_stafit to authenticated;
grant select, insert, update on public.shenimet_e_klienteve to authenticated;

revoke execute on function
  public.ruaj_orarin_e_berberit(uuid, uuid, boolean, jsonb),
  public.terminet_e_periudhes(uuid, date, date),
  public.zhvendos_terminin_nga_stafi(uuid, timestamptz, uuid),
  public.klientet_e_lokalit(uuid),
  public.historiku_i_klientit(uuid, text),
  public.analitika_e_lokalit(uuid, date, date)
  from public, anon;

grant execute on function
  public.celesi_i_klientit(uuid, text, text),
  public.ruaj_orarin_e_berberit(uuid, uuid, boolean, jsonb),
  public.terminet_e_periudhes(uuid, date, date),
  public.zhvendos_terminin_nga_stafi(uuid, timestamptz, uuid),
  public.klientet_e_lokalit(uuid),
  public.historiku_i_klientit(uuid, text),
  public.analitika_e_lokalit(uuid, date, date)
  to authenticated;
