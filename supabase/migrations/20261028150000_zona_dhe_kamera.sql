-- TrimTime · Zona e klientit, lokalet për meshkuj, portofoli, foto e stilit dhe check-in me QR
-- Ekzekutohet pas 20261028090000_rritja.sql: SQL Editor → New query → Run.
-- Pastaj ekzekutohet përsëri supabase/seed/lokalet_osm_kosove.sql (mbush qytetet dhe klientelën).

-- ─────────────────────────────────────────────────────────────
-- Qytetet: qendrat e qyteteve, që klienti të shohë lokalet e qytetit ku ndodhet
-- ─────────────────────────────────────────────────────────────
create table public.qytetet (
  id integer generated always as identity primary key,
  emri text not null unique check (char_length(emri) between 2 and 80),
  vendndodhja extensions.geography(point, 4326) not null,
  -- "city" ose "town" në OpenStreetMap.
  lloji text not null default 'town' check (lloji in ('city', 'town'))
);

alter table public.lokalet
  -- Qyteti më i afërt (nga tabela qytetet); mbahet nga trigger-i më poshtë.
  add column qyteti_id integer references public.qytetet (id) on delete set null,
  -- TrimTime është për berberë; sallonet vetëm për femra nga OSM nuk shfaqen te klientët.
  add column klientela text not null default 'meshkuj' check (klientela in ('meshkuj', 'femra', 'unisex'));

create index lokalet_qyteti_idx on public.lokalet (qyteti_id) where i_publikuar;

create function public.qyteti_me_i_afert(p_vendndodhja extensions.geography)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select q.id
  from public.qytetet q
  order by extensions.st_distance(q.vendndodhja, p_vendndodhja)
  limit 1;
$$;

create function public.vendos_qytetin_e_lokalit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.qyteti_id := public.qyteti_me_i_afert(new.vendndodhja);
  return new;
end;
$$;

create trigger lokalet_vendos_qytetin
  before insert or update of vendndodhja on public.lokalet
  for each row execute function public.vendos_qytetin_e_lokalit();

-- Qyteti ku ndodhet klienti (për titullin "Lokalet në Mitrovicë").
create function public.qyteti_prane(p_lat double precision, p_lng double precision)
returns table (id integer, emri text, distanca_m double precision)
language sql
stable
security definer
set search_path = ''
as $$
  with pika as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  )
  select q.id, q.emri, extensions.st_distance(q.vendndodhja, pika.g)
  from public.qytetet q
  cross join pika
  order by extensions.st_distance(q.vendndodhja, pika.g)
  limit 1;
$$;

-- ─────────────────────────────────────────────────────────────
-- lokalet_prane: me p_qyteti_id kthen vetëm lokalet e atij qyteti dhe ato brenda
-- p_rrezja_km nga klienti; pa të (harta) sillet si më parë. Sallonet për femra nuk shfaqen.
-- ─────────────────────────────────────────────────────────────
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
  p_limit integer default 50,
  p_qyteti_id integer default null
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
      and l.klientela <> 'femra'
      and (
        case
          when p_qyteti_id is null then
            extensions.st_dwithin(l.vendndodhja, pika.g, least(p_rrezja_km, 300) * 1000)
          else
            l.qyteti_id = p_qyteti_id
            or extensions.st_dwithin(l.vendndodhja, pika.g, least(p_rrezja_km, 300) * 1000)
        end
      )
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
-- Portofoli: fotot e qethjeve që bëjnë berberët (në dosjen <lokali_id>/portofoli/)
-- ─────────────────────────────────────────────────────────────
create table public.portofoli (
  id uuid primary key default gen_random_uuid(),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  berberi_id uuid references public.profilet (id) on delete set null default auth.uid(),
  foto_url text not null check (char_length(foto_url) <= 500),
  pershkrimi text check (char_length(pershkrimi) <= 200),
  krijuar_me timestamptz not null default now()
);

create index portofoli_lokali_idx on public.portofoli (lokali_id, krijuar_me desc);

-- ─────────────────────────────────────────────────────────────
-- Termini: foto e stilit nga klienti dhe check-in kur arrin në lokal
-- ─────────────────────────────────────────────────────────────
alter table public.terminet
  -- Shtegu në bucket-in privat "stilet": <klienti_id>/<emri>.jpg
  add column foto_stili text check (char_length(foto_stili) <= 300),
  add column arriti_me timestamptz;

create function public.vendos_foton_e_stilit(p_termini_id uuid, p_shtegu text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_klienti uuid := (select auth.uid());
begin
  if p_shtegu is not null and split_part(p_shtegu, '/', 1) <> v_klienti::text then
    raise exception 'Shteg i pavlefshëm' using errcode = '42501';
  end if;

  update public.terminet
  set foto_stili = p_shtegu
  where id = p_termini_id
    and klienti_id = v_klienti
    and statusi in ('ne_pritje', 'konfirmuar');

  if not found then
    raise exception 'Nuk ke leje për këtë termin' using errcode = '42501';
  end if;
end;
$$;

-- Klienti skanon QR-në e lokalit kur arrin: shënohet termini i tij i sotëm aty.
create function public.bej_check_in(p_lokali_id uuid)
returns table (termini_id uuid, ora_lokale text, sherbimi_emri text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_klienti uuid := (select auth.uid());
  v_id uuid;
begin
  if v_klienti is null then
    raise exception 'Duhet të hysh në llogari' using errcode = '42501';
  end if;

  select t.id into v_id
  from public.terminet t
  where t.lokali_id = p_lokali_id
    and t.klienti_id = v_klienti
    and t.statusi in ('ne_pritje', 'konfirmuar')
    and t.fillon_me between now() - interval '2 hours' and now() + interval '3 hours'
  order by abs(extract(epoch from t.fillon_me - now()))
  limit 1;

  if v_id is null then
    raise exception 'Nuk ke termin sot në këtë lokal' using errcode = 'TT007';
  end if;

  update public.terminet set arriti_me = coalesce(arriti_me, now()) where id = v_id;

  return query
  select t.id, to_char(t.fillon_me at time zone l.zona_kohore, 'HH24:MI'), s.emri
  from public.terminet t
  join public.lokalet l on l.id = t.lokali_id
  join public.sherbimet s on s.id = t.sherbimi_id
  where t.id = v_id;
end;
$$;

-- terminet_e_lokalit merr foton e stilit dhe check-in-in (lloji i kthimit ndryshon).
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
  shperblime_te_disponueshme integer,
  foto_stili text,
  arriti_me timestamptz
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
    (select bs.te_disponueshme from public.besnikeria_e_klientit(t.lokali_id, c.celesi) bs),
    t.foto_stili,
    t.arriti_me
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
-- Storage
-- ─────────────────────────────────────────────────────────────
-- Fotot e stilit janë private: i sheh vetëm klienti dhe stafi i lokalit ku ka termin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('stilet', 'stilet', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Klienti ngarkon foto stili në dosjen e vet"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'stilet' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Klienti sheh fotot e veta të stilit"
  on storage.objects for select to authenticated
  using (bucket_id = 'stilet' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Stafi sheh fotot e stilit të termineve të lokalit"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'stilet'
    and exists (
      select 1 from public.terminet t
      where t.foto_stili = storage.objects.name and public.eshte_anetar(t.lokali_id)
    )
  );

create policy "Klienti fshin fotot e veta të stilit"
  on storage.objects for delete to authenticated
  using (bucket_id = 'stilet' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Çdo berber (jo vetëm pronari) ngarkon në dosjen e portofolit të lokalit të vet.
create policy "Stafi ngarkon fotot e portofolit"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lokalet'
    and (storage.foldername(name))[2] = 'portofoli'
    and public.eshte_anetar(public.lokali_i_dosjes(name))
  );

create policy "Stafi fshin fotot e portofolit"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'lokalet'
    and (storage.foldername(name))[2] = 'portofoli'
    and public.eshte_anetar(public.lokali_i_dosjes(name))
  );

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.qytetet enable row level security;
alter table public.portofoli enable row level security;

create policy "Kushdo sheh qytetet"
  on public.qytetet for select to anon, authenticated
  using (true);

create policy "Kushdo sheh portofolin e lokaleve të publikuara"
  on public.portofoli for select to anon, authenticated
  using (public.eshte_lokal_publik(lokali_id) or public.eshte_anetar(lokali_id));

create policy "Berberi shton foto në portofolin e lokalit"
  on public.portofoli for insert to authenticated
  with check (public.eshte_anetar(lokali_id) and berberi_id = (select auth.uid()));

create policy "Pronari ose autori fshin foton e portofolit"
  on public.portofoli for delete to authenticated
  using (public.eshte_pronar(lokali_id) or berberi_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- Privilegjet
-- ─────────────────────────────────────────────────────────────
grant select on public.qytetet to anon, authenticated;
grant select on public.portofoli to anon;
grant select, insert, delete on public.portofoli to authenticated;

revoke execute on function
  public.vendos_qytetin_e_lokalit()
  from public, anon, authenticated;

revoke execute on function
  public.qyteti_me_i_afert(extensions.geography),
  public.qyteti_prane(double precision, double precision),
  public.lokalet_prane(double precision, double precision, double precision, text, boolean, integer, text, integer, integer),
  public.vendos_foton_e_stilit(uuid, text),
  public.bej_check_in(uuid),
  public.terminet_e_lokalit(uuid, date)
  from public, anon;

grant execute on function
  public.qyteti_prane(double precision, double precision),
  public.lokalet_prane(double precision, double precision, double precision, text, boolean, integer, text, integer, integer)
  to anon, authenticated;

grant execute on function
  public.vendos_foton_e_stilit(uuid, text),
  public.bej_check_in(uuid),
  public.terminet_e_lokalit(uuid, date)
  to authenticated;
