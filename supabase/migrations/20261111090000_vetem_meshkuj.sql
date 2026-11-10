-- TrimTime · Tani për tani vetëm për meshkuj
--
-- Lokalet nga OpenStreetMap pa shenjë të qartë klasifikoheshin si "për meshkuj", ndaj në listë
-- dilnin edhe sallone për femra ("Sallon Ondulimi …", "Frizere …", "Brows and Glow"). Këtu:
--   1. eshte_per_femra(emri) njeh sallonet për femra nga emri;
--   2. lokalet e tilla nga OSM shënohen "femra";
--   3. lista, harta dhe zgjedhja e qytetit tregojnë vetëm lokalet "meshkuj" (as unisex).

-- ─────────────────────────────────────────────────────────────
-- Shenja e emrit. Një shenjë e qartë berberie ("berber", "barber", "Frizer X") e mban lokalin
-- për meshkuj; përndryshe fjalët e salloneve për femra dhe emrat e femrave e bëjnë "femra".
-- ─────────────────────────────────────────────────────────────
create or replace function public.eshte_per_femra(p_emri text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_emri !~* '(barber|berber|bri[cç]|p[eë]r meshkuj|\mman\M|\mmen\M|\mgent|\mfrizer\M|\mfrizeri\M|clipper|gillette)'
    and p_emri ~* (
      '(frizere|ondulim|undulim|\msallon|beauty|bukuri|glow|glam|brow|lash|qerpik|vetull|nail|thonj|manikyr|pedikyr|make ?up|estetik|kozmet|masazh|massage|\mspa\M|wax|depil'
      || '|\m(adelina|agnesa|alba|anisa|arjeta|ardita|bardha|besa|betty|beti|blerta|eda|egzona|ezana|gjyla|hira|kujta|linda|lona|lonita|lumja|malena|migena|mimi|mina|monaliza|morena|njomza|nela|nisa|sadeti|selvie|sellma|shkurta|tina|verona|viki|viola|vjollca|vlera|vlerina|zana|zoja)\M)'
    );
$$;

grant execute on function public.eshte_per_femra(text) to anon, authenticated;

update public.lokalet set klientela = 'femra'
where burimi = 'osm' and klientela = 'meshkuj' and public.eshte_per_femra(emri);

-- ─────────────────────────────────────────────────────────────
-- Zgjedhja e qytetit: numri i lokaleve për meshkuj.
-- ─────────────────────────────────────────────────────────────
create or replace function public.qytetet_me_lokale()
returns table (id integer, emri text, lat double precision, lng double precision, nr_lokaleve integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    q.id,
    q.emri,
    extensions.st_y(q.vendndodhja::extensions.geometry),
    extensions.st_x(q.vendndodhja::extensions.geometry),
    (select count(*)::integer from public.lokalet l where l.qyteti_id = q.id and l.i_publikuar and l.klientela = 'meshkuj')
  from public.qytetet q
  order by q.lloji, q.emri;
$$;

-- ─────────────────────────────────────────────────────────────
-- lokalet_prane: vetëm lokalet për meshkuj (lista e Zbulo dhe harta).
-- ─────────────────────────────────────────────────────────────
create or replace function public.lokalet_prane(
  p_lat double precision,
  p_lng double precision,
  p_rrezja_km double precision default 25,
  p_kerkimi text default null,
  p_vetem_hapur boolean default false,
  p_cmimi_max integer default null,
  -- 'distanca', 'cmimi' ose 'vleresimi'
  p_renditja text default 'distanca',
  p_limit integer default 50,
  p_qyteti_id integer default null,
  -- 'qethje', 'fade', 'mjeker', 'femije' ose 'ngjyrosje'
  p_sherbimi text default null,
  p_vleresimi_min numeric default null,
  -- Kur jepet, vlen vetëm distanca nga klienti (edhe brenda qytetit).
  p_distanca_max_km double precision default null,
  p_vetem_online boolean default false,
  p_vetem_oferta boolean default false
)
returns table (
  id uuid,
  emri text,
  adresa text,
  qyteti text,
  telefoni text,
  logo_url text,
  kopertina_url text,
  lat double precision,
  lng double precision,
  distanca_m double precision,
  i_hapur_tani boolean,
  ka_orar boolean,
  cmimi_min integer,
  nr_sherbimeve integer,
  burimi text,
  rezervim_online boolean,
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
      l.telefoni,
      l.logo_url,
      l.kopertina_url,
      extensions.st_y(l.vendndodhja::extensions.geometry) as lat,
      extensions.st_x(l.vendndodhja::extensions.geometry) as lng,
      extensions.st_distance(l.vendndodhja, pika.g) as distanca_m,
      public.eshte_hapur_tani(l.id) as i_hapur_tani,
      exists (select 1 from public.oraret_e_lokalit o where o.lokali_id = l.id) as ka_orar,
      s.cmimi_min,
      coalesce(s.nr, 0)::integer as nr_sherbimeve,
      l.burimi,
      (l.burimi <> 'osm' and coalesce(s.nr, 0) > 0) as rezervim_online,
      l.vleresimi_mesatar,
      l.nr_vleresimeve,
      public.promocioni_max(l.id) as promocioni_max
    from public.lokalet l
    cross join pika
    cross join kerkimi
    left join lateral (
      -- Me filtër shërbimi, çmimi minimal llogaritet vetëm nga shërbimet e asaj kategorie.
      select min(sh.cmimi_centa)::integer as cmimi_min, count(*) as nr
      from public.sherbimet sh
      where sh.lokali_id = l.id
        and sh.aktiv
        and (p_sherbimi is null or public.sherbimi_ne_kategori(sh.emri, p_sherbimi))
    ) s on true
    where l.i_publikuar
      and l.klientela = 'meshkuj'
      and (
        case
          when p_distanca_max_km is not null then
            extensions.st_dwithin(l.vendndodhja, pika.g, least(p_distanca_max_km, 300) * 1000)
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
      and (p_sherbimi is null or coalesce(s.nr, 0) > 0)
      and (p_cmimi_max is null or s.cmimi_min <= p_cmimi_max)
      and (p_vleresimi_min is null or l.vleresimi_mesatar >= p_vleresimi_min)
  )
  select *
  from rezultatet r
  where (not p_vetem_hapur or r.i_hapur_tani)
    and (not p_vetem_online or r.rezervim_online)
    and (not p_vetem_oferta or r.promocioni_max is not null)
  order by
    case when p_renditja = 'cmimi' then r.cmimi_min end asc nulls last,
    case when p_renditja = 'vleresimi' then r.vleresimi_mesatar end desc nulls last,
    case when p_renditja = 'vleresimi' then r.nr_vleresimeve end desc,
    r.distanca_m asc
  limit least(greatest(p_limit, 1), 300);
$$;

