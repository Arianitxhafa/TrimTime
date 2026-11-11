-- TrimTime · Adresat e rrugëve për berberët nga Numrat.com
--
-- Seed-i i Numrat sjell tani edhe adresën e rrugës (nga faqja e detajeve të secilit lokal).
-- bashko_lokalet_e_numrat() rikrijohet: lokalet e reja marrin adresën, dhe lokalet nga OSM që
-- kishin vetëm "Shiko në hartë" marrin adresën e katalogut kur janë i njëjti lokal.

create or replace function public.bashko_lokalet_e_numrat()
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

  -- 2. Lokali nga OSM merr telefonin dhe adresën e katalogut nëse s'i ka.
  update public.lokalet l
  set telefoni = coalesce(l.telefoni, n.telefoni),
      adresa = case
        when l.adresa = 'Shiko në hartë' and char_length(coalesce(n.adresa, '')) between 3 and 200 then n.adresa
        else l.adresa
      end
  from pg_temp.perputhjet_numrat p
  join pg_temp.numrat_e_reja n on n.osm_id = p.numrat_id
  where l.id = p.lokali_id and l.burimi = 'osm';

  -- 3. Të rejat shtohen; ato të shtuara më parë nga Numrat përditësohen.
  insert into public.lokalet (osm_id, emri, adresa, qyteti, telefoni, klientela, vendndodhja, burimi, i_publikuar)
  select n.osm_id,
         n.emri,
         case when char_length(coalesce(n.adresa, '')) between 3 and 200 then n.adresa else 'Shiko në hartë' end,
         coalesce(nullif(n.qyteti, ''), 'Kosovë'),
         n.telefoni,
         'meshkuj',
         n.vendndodhja,
         'numrat',
         true
  from pg_temp.numrat_e_reja n
  where length(n.emri) >= 2
    and not exists (select 1 from pg_temp.perputhjet_numrat p where p.numrat_id = n.osm_id)
  on conflict (osm_id) do update set
    emri = excluded.emri,
    adresa = excluded.adresa,
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

revoke all on function public.bashko_lokalet_e_numrat() from public, anon, authenticated;
