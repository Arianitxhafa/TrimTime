-- TrimTime · "Tuna" njihet si sallon për femra
--
-- Pas migrimit 20261111090000_vetem_meshkuj.sql, lokali "Tuna" (emër femre) dilte ende në listë.
-- Funksioni rikrijohet me emrin "tuna" dhe klasifikimi ekzekutohet sërish për lokalet nga OSM.

create or replace function public.eshte_per_femra(p_emri text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_emri !~* '(barber|berber|bri[cç]|p[eë]r meshkuj|\mman\M|\mmen\M|\mgent|\mfrizer\M|\mfrizeri\M|clipper|gillette)'
    and p_emri ~* (
      '(frizere|ondulim|undulim|\msallon|beauty|bukuri|glow|glam|brow|lash|qerpik|vetull|nail|thonj|manikyr|pedikyr|make ?up|estetik|kozmet|masazh|massage|\mspa\M|wax|depil'
      || '|\m(adelina|agnesa|alba|anisa|arjeta|ardita|bardha|besa|betty|beti|blerta|eda|egzona|ezana|gjyla|hira|kujta|linda|lona|lonita|lumja|malena|migena|mimi|mina|monaliza|morena|njomza|nela|nisa|sadeti|selvie|sellma|shkurta|tina|tuna|verona|viki|viola|vjollca|vlera|vlerina|zana|zoja)\M)'
    );
$$;

update public.lokalet set klientela = 'femra'
where burimi = 'osm' and klientela = 'meshkuj' and public.eshte_per_femra(emri);
