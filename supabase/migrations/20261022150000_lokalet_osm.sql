-- TrimTime · Lokalet e qethjes nga OpenStreetMap
-- Lejon lokale pa pronar (të importuara nga OSM) që të shfaqen në hartë dhe në kërkim.
-- Ekzekutohet pas 20261022090000_lokalet_dhe_zbulimi.sql: SQL Editor → New query → Run.
-- Pastaj ekzekutohet supabase/seed/lokalet_osm_kosove.sql me lokalet.

-- ─────────────────────────────────────────────────────────────
-- Lokalet pa pronar dhe burimi i të dhënave
-- ─────────────────────────────────────────────────────────────
alter table public.lokalet alter column pronari_id drop not null;

alter table public.lokalet
  add column burimi text not null default 'trimtime' check (burimi in ('trimtime', 'osm')),
  -- p.sh. "node/123456"; i bën importet e përsëritura të përditësojnë, jo të dyfishojnë.
  add column osm_id text unique,
  add constraint lokalet_pronari_ose_osm check (pronari_id is not null or burimi = 'osm');

-- Lokalet nga OSM nuk kanë pronar që të bëhet anëtar.
create or replace function public.shto_pronarin_si_anetar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.pronari_id is null then
    return new;
  end if;

  insert into public.anetaret_e_lokalit (lokali_id, profili_id, roli)
  values (new.id, new.pronari_id, 'pronar');
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Pamja me koordinata merr edhe burimin (kolona e re shtohet në fund)
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
  l.burimi
from public.lokalet l;

-- ─────────────────────────────────────────────────────────────
-- lokalet_prane: kthen burimin dhe lejon deri në 300 rezultate për hartën
-- ─────────────────────────────────────────────────────────────
drop function public.lokalet_prane(double precision, double precision, double precision, text, boolean, integer, text, integer);

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
  nr_sherbimeve integer,
  burimi text
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
      l.burimi
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
  limit least(greatest(p_limit, 1), 300);
$$;

grant execute on function
  public.lokalet_prane(double precision, double precision, double precision, text, boolean, integer, text, integer)
  to anon, authenticated;
