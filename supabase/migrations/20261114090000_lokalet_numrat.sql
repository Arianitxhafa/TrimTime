-- TrimTime · Berberët nga katalogu Numrat.com
--
-- Katalogu Numrat.com ka 237 berberë në Kosovë me emër, telefon dhe koordinata. Këtu:
--   * burimi i ri 'numrat' (si 'osm': lokal pa pronar, pa rezervim online, derisa ta marrë pronari);
--   * emri_baze(): emri pa fjalët e përgjithshme ("Barber Shop", "Berber"…) për të gjetur dublikatat;
--   * bashko_lokalet_e_numrat(): thirret nga seed-i supabase/seed/lokalet_numrat_kosove.sql. Një lokal
--     që ekziston tashmë (OSM ose TrimTime) nuk shtohet dy herë; lokali nga OSM merr vetëm telefonin.
-- Kolona osm_id mban identifikuesin e jashtëm për të dy burimet ("numrat/<id>" për Numrat).

alter table public.lokalet drop constraint lokalet_burimi_check;
alter table public.lokalet
  add constraint lokalet_burimi_check check (burimi in ('trimtime', 'osm', 'numrat'));

alter table public.lokalet drop constraint lokalet_pronari_ose_osm;
alter table public.lokalet
  add constraint lokalet_pronari_ose_osm check (pronari_id is not null or burimi in ('osm', 'numrat'));

-- "BARBER SHOP Goni" → "goni", "Ardit's BarberShop" → "ardit"
create function public.emri_baze(p_emri text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
    regexp_replace(
      translate(lower(coalesce(p_emri, '')), 'ëçé', 'ece'),
      '(barber|berber|shop|frizer[ie]?|hair|haircut|studio|sallon[i]?|salon|the|\ms\M)', '', 'g'
    ),
    '[^a-z0-9]', '', 'g'
  );
$$;

-- Tetë shifrat e fundit të telefonit, që "+383 44 522 886" dhe "044 522 886" të jenë i njëjti numër.
create function public.telefoni_baze(p_telefoni text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(right(regexp_replace(coalesce(p_telefoni, ''), '\D', '', 'g'), 8), '');
$$;

-- Pret tabelën e përkohshme numrat_e_reja (osm_id, emri, qyteti, telefoni, vendndodhja) nga seed-i.
create function public.bashko_lokalet_e_numrat()
returns void
language plpgsql
set search_path = ''
as $$
begin
  -- 1. Dublikatat: lokal ekzistues brenda 150 m me emër të ngjashëm, ose me të njëjtin telefon.
  create temporary table perputhjet_numrat on commit drop as
  select distinct on (n.osm_id) n.osm_id as numrat_id, l.id as lokali_id
  from pg_temp.numrat_e_reja n
  join public.lokalet l
    on l.burimi <> 'numrat'
   and extensions.st_dwithin(l.vendndodhja, n.vendndodhja, 150)
   and (
     (
       length(public.emri_baze(l.emri)) >= 3
       and length(public.emri_baze(n.emri)) >= 3
       and (
         public.emri_baze(l.emri) = public.emri_baze(n.emri)
         or position(public.emri_baze(n.emri) in public.emri_baze(l.emri)) > 0
         or position(public.emri_baze(l.emri) in public.emri_baze(n.emri)) > 0
       )
     )
     or public.telefoni_baze(l.telefoni) = public.telefoni_baze(n.telefoni)
   )
  order by n.osm_id, extensions.st_distance(l.vendndodhja, n.vendndodhja);

  -- 2. Lokali nga OSM merr telefonin e katalogut nëse s'e ka.
  update public.lokalet l
  set telefoni = n.telefoni
  from pg_temp.perputhjet_numrat p
  join pg_temp.numrat_e_reja n on n.osm_id = p.numrat_id
  where l.id = p.lokali_id and l.burimi = 'osm' and l.telefoni is null and n.telefoni is not null;

  -- 3. Të rejat shtohen; ato të shtuara më parë nga Numrat përditësohen.
  insert into public.lokalet (osm_id, emri, adresa, qyteti, telefoni, klientela, vendndodhja, burimi, i_publikuar)
  select n.osm_id, n.emri, 'Shiko në hartë', coalesce(nullif(n.qyteti, ''), 'Kosovë'), n.telefoni, 'meshkuj',
         n.vendndodhja, 'numrat', true
  from pg_temp.numrat_e_reja n
  where length(n.emri) >= 2
    and not exists (select 1 from pg_temp.perputhjet_numrat p where p.numrat_id = n.osm_id)
  on conflict (osm_id) do update set
    emri = excluded.emri,
    qyteti = excluded.qyteti,
    telefoni = excluded.telefoni,
    vendndodhja = excluded.vendndodhja
  where public.lokalet.burimi = 'numrat';

  -- 4. Qyteti dhe gjinia, si te lokalet nga OSM.
  update public.lokalet set qyteti_id = public.qyteti_me_i_afert(vendndodhja) where burimi = 'numrat';
  update public.lokalet set klientela = 'femra'
  where burimi = 'numrat' and klientela = 'meshkuj' and public.eshte_per_femra(emri);
end;
$$;

-- Vetëm seed-i (në SQL Editor) e thërret; përdoruesit e aplikacionit jo.
revoke all on function public.bashko_lokalet_e_numrat() from public, anon, authenticated;
grant execute on function public.emri_baze(text) to anon, authenticated;
grant execute on function public.telefoni_baze(text) to anon, authenticated;
