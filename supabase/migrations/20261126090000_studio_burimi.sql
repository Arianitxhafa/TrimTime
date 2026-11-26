-- Studio Burimi · aplikacioni bëhet vetëm për një lokal
--
-- Nga 26.11.2026 aplikacioni nuk është më katalog i berberive të Kosovës: shërben vetëm Studio
-- Burimin. Lokalet e importuara nga OpenStreetMap (burimi = 'osm') dhe nga Numrat.com
-- (burimi = 'numrat') fshihen. Lokali i Studio Burimit (burimi = 'trimtime') mbetet me
-- shërbimet, orarin, stafin dhe terminet e veta.
--
-- Të gjitha tabelat që lidhen me lokalet (oraret, shërbimet, vlerësimet, promocionet, etj.) kanë
-- "on delete cascade", ndaj rreshtat e tyre për lokalet e katalogut fshihen bashkë me to. Lokalet
-- e katalogut nuk kishin termine, shërbime apo staf.
--
-- Nuk kthehet mbrapsht: për t'i pasur sërish duhen importuar nga e para.

begin;

delete from public.lokalet
where burimi in ('osm', 'numrat');

commit;

-- Kontrolli pas ekzekutimit: duhet të mbetet vetëm Studio Burimi.
select id, emri, burimi from public.lokalet;
