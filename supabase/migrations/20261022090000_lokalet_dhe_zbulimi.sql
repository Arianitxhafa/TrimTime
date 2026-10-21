-- TrimTime · Faza 2 · Lokalet dhe zbulimi
-- Orari i lokaleve, ftesat për stafin, kërkimi sipas distancës dhe fotot.
-- Ekzekutohet pas 20261021120000_themeli.sql: SQL Editor → ngjit gjithë skedarin → Run.

-- ─────────────────────────────────────────────────────────────
-- Foto kopertine për lokalin (logo_url ekziston që në Fazën 1)
-- ─────────────────────────────────────────────────────────────
alter table public.lokalet add column kopertina_url text;

-- ─────────────────────────────────────────────────────────────
-- oraret_e_lokalit: disa intervale në ditë lejojnë pushimin e drekës
-- ─────────────────────────────────────────────────────────────
create table public.oraret_e_lokalit (
  id uuid primary key default gen_random_uuid(),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  -- 0 = e diel … 6 = e shtunë, njësoj si extract(dow) në Postgres dhe Date.getDay() në JS.
  dita smallint not null check (dita between 0 and 6),
  hapet time not null,
  mbyllet time not null,
  constraint oraret_intervali_i_vlefshem check (mbyllet > hapet)
);

create index oraret_lokali_dita_idx on public.oraret_e_lokalit (lokali_id, dita);

-- ─────────────────────────────────────────────────────────────
-- ftesat: pronari krijon një kod, berberi e shkruan për t'u bashkuar
-- ─────────────────────────────────────────────────────────────
create table public.ftesat (
  kodi text primary key check (kodi ~ '^[A-Z2-9]{8}$'),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  krijuar_nga uuid not null references public.profilet (id) on delete cascade,
  skadon_me timestamptz not null default now() + interval '7 days',
  perdorur_nga uuid references public.profilet (id) on delete set null,
  perdorur_me timestamptz,
  krijuar_me timestamptz not null default now()
);

create index ftesat_lokali_idx on public.ftesat (lokali_id);

-- ─────────────────────────────────────────────────────────────
-- A është lokali i hapur tani, sipas zonës kohore të vet?
-- ─────────────────────────────────────────────────────────────
create function public.eshte_hapur_tani(p_lokali_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lokalet l
    join public.oraret_e_lokalit o on o.lokali_id = l.id
    where l.id = p_lokali_id
      and o.dita = extract(dow from (now() at time zone l.zona_kohore))::int
      and (now() at time zone l.zona_kohore)::time >= o.hapet
      and (now() at time zone l.zona_kohore)::time < o.mbyllet
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Pamje me koordinata të lexueshme (PostGIS i kthen si binar).
-- security_invoker: zbatohen politikat RLS të përdoruesit që lexon.
-- ─────────────────────────────────────────────────────────────
create view public.lokalet_me_koordinata
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
  ) as cmimi_min
from public.lokalet l;

-- ─────────────────────────────────────────────────────────────
-- Kërkimi i lokaleve pranë një pike, me filtra
-- ─────────────────────────────────────────────────────────────
create function public.lokalet_prane(
  p_lat double precision,
  p_lng double precision,
  p_rrezja_km double precision default 25,
  p_kerkimi text default null,
  p_vetem_hapur boolean default false,
  p_cmimi_max integer default null,
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
  nr_sherbimeve integer
)
language sql
stable
set search_path = ''
as $$
  with pika as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  ),
  -- % dhe _ të shkruara nga përdoruesi kërkohen si tekst, jo si shenja ilike.
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
      coalesce(s.nr, 0)::integer as nr_sherbimeve
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
    r.distanca_m asc
  limit least(greatest(p_limit, 1), 100);
$$;

-- ─────────────────────────────────────────────────────────────
-- Stafi i një lokali me emra e foto (profilet nuk janë publike)
-- ─────────────────────────────────────────────────────────────
create function public.stafi_i_lokalit(p_lokali_id uuid)
returns table (profili_id uuid, emri text, foto_url text, roli public.roli_ne_lokal, aktiv boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select a.profili_id, p.emri, p.foto_url, a.roli, a.aktiv
  from public.anetaret_e_lokalit a
  join public.profilet p on p.id = a.profili_id
  where a.lokali_id = p_lokali_id
    and (
      public.eshte_anetar(p_lokali_id)
      or (a.aktiv and public.eshte_lokal_publik(p_lokali_id))
    )
  order by (a.roli = 'pronar') desc, p.emri;
$$;

-- ─────────────────────────────────────────────────────────────
-- Ruajtja e orarit në një transaksion të vetëm (fshin dhe rishkruan javën)
-- ─────────────────────────────────────────────────────────────
create function public.ruaj_orarin(p_lokali_id uuid, p_oraret jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.eshte_pronar(p_lokali_id) then
    raise exception 'Vetëm pronari mund ta ndryshojë orarin' using errcode = '42501';
  end if;

  delete from public.oraret_e_lokalit where lokali_id = p_lokali_id;

  insert into public.oraret_e_lokalit (lokali_id, dita, hapet, mbyllet)
  select p_lokali_id, (o ->> 'dita')::smallint, (o ->> 'hapet')::time, (o ->> 'mbyllet')::time
  from jsonb_array_elements(p_oraret) as o;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Ftesat për berberët
-- ─────────────────────────────────────────────────────────────
create function public.krijo_ftesen(p_lokali_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Pa 0/O dhe 1/I që kodi të mos ngatërrohet kur lexohet me zë.
  shkronjat constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_kodi text;
begin
  if not public.eshte_pronar(p_lokali_id) then
    raise exception 'Vetëm pronari mund të ftojë berberë' using errcode = '42501';
  end if;

  loop
    select string_agg(substr(shkronjat, 1 + floor(random() * length(shkronjat))::int, 1), '')
      into v_kodi
      from generate_series(1, 8);
    exit when not exists (select 1 from public.ftesat where kodi = v_kodi);
  end loop;

  insert into public.ftesat (kodi, lokali_id, krijuar_nga)
  values (v_kodi, p_lokali_id, (select auth.uid()));

  return v_kodi;
end;
$$;

create function public.prano_ftesen(p_kodi text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ftesa public.ftesat%rowtype;
  v_perdoruesi uuid := (select auth.uid());
begin
  if v_perdoruesi is null then
    raise exception 'Duhet të hysh në llogari' using errcode = '42501';
  end if;

  select * into v_ftesa
  from public.ftesat
  where kodi = upper(trim(p_kodi))
  for update;

  if not found or v_ftesa.perdorur_nga is not null or v_ftesa.skadon_me < now() then
    raise exception 'Kodi i ftesës nuk është i vlefshëm' using errcode = 'P0002';
  end if;

  insert into public.anetaret_e_lokalit (lokali_id, profili_id, roli, aktiv)
  values (v_ftesa.lokali_id, v_perdoruesi, 'berber', true)
  on conflict (lokali_id, profili_id) do update set aktiv = true;

  update public.ftesat
  set perdorur_nga = v_perdoruesi, perdorur_me = now()
  where kodi = v_ftesa.kodi;

  return v_ftesa.lokali_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.oraret_e_lokalit enable row level security;
alter table public.ftesat enable row level security;

create policy "Kushdo sheh orarin e lokaleve të publikuara"
  on public.oraret_e_lokalit for select to anon, authenticated
  using (public.eshte_lokal_publik(lokali_id));

create policy "Stafi sheh orarin e lokalit"
  on public.oraret_e_lokalit for select to authenticated
  using (public.eshte_anetar(lokali_id));

create policy "Pronari shton orarin"
  on public.oraret_e_lokalit for insert to authenticated
  with check (public.eshte_pronar(lokali_id));

create policy "Pronari ndryshon orarin"
  on public.oraret_e_lokalit for update to authenticated
  using (public.eshte_pronar(lokali_id))
  with check (public.eshte_pronar(lokali_id));

create policy "Pronari fshin orarin"
  on public.oraret_e_lokalit for delete to authenticated
  using (public.eshte_pronar(lokali_id));

-- Ftesat krijohen dhe pranohen vetëm përmes funksioneve më sipër.
create policy "Pronari sheh ftesat e lokalit"
  on public.ftesat for select to authenticated
  using (public.eshte_pronar(lokali_id));

-- ─────────────────────────────────────────────────────────────
-- Storage: fotot e lokaleve, në dosjen <lokali_id>/
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lokalet', 'lokalet', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function public.lokali_i_dosjes(p_emri text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return (storage.foldername(p_emri))[1]::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create policy "Pronari ngarkon fotot e lokalit"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'lokalet' and public.eshte_pronar(public.lokali_i_dosjes(name)));

create policy "Pronari zëvendëson fotot e lokalit"
  on storage.objects for update to authenticated
  using (bucket_id = 'lokalet' and public.eshte_pronar(public.lokali_i_dosjes(name)))
  with check (bucket_id = 'lokalet' and public.eshte_pronar(public.lokali_i_dosjes(name)));

create policy "Pronari fshin fotot e lokalit"
  on storage.objects for delete to authenticated
  using (bucket_id = 'lokalet' and public.eshte_pronar(public.lokali_i_dosjes(name)));

-- ─────────────────────────────────────────────────────────────
-- Privilegjet
-- ─────────────────────────────────────────────────────────────
grant select on public.oraret_e_lokalit, public.lokalet_me_koordinata to anon, authenticated;
grant insert, update, delete on public.oraret_e_lokalit to authenticated;
grant select on public.ftesat to authenticated;

grant execute on function
  public.eshte_hapur_tani(uuid),
  public.lokalet_prane(double precision, double precision, double precision, text, boolean, integer, text, integer),
  public.stafi_i_lokalit(uuid)
  to anon, authenticated;

grant execute on function
  public.ruaj_orarin(uuid, jsonb),
  public.krijo_ftesen(uuid),
  public.prano_ftesen(text),
  public.lokali_i_dosjes(text)
  to authenticated;

revoke execute on function
  public.ruaj_orarin(uuid, jsonb),
  public.krijo_ftesen(uuid),
  public.prano_ftesen(text)
  from public, anon;
