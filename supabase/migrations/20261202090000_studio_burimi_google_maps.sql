-- Studio Burimi · të dhënat nga profili i Google Maps ("StudioBurimi", Hairdresser)
--
-- Adresa: Skenderbeu, Mitrovica e Veriut 42000 · Telefoni: +383 49 339 912
-- Pika në hartë nga Plus Code VVPC+X6 Mitrovica (8GJ2VVPC+X6) → 42.8874375, 20.8705625.
-- Orari javor dhe shërbimet mbeten si janë derisa të kemi orarin e plotë.

update public.lokalet
set adresa = 'Rruga Skënderbeu',
    qyteti = 'Mitrovicë',
    telefoni = '+383 49 339 912',
    vendndodhja = extensions.st_setsrid(extensions.st_makepoint(20.8705625, 42.8874375), 4326)::extensions.geography
where id = '7828d796-304f-4253-aa38-a748cbcd5365';

-- Kontrolli: një rresht me adresën, telefonin dhe pikën e re.
select emri, adresa, qyteti, telefoni,
       extensions.st_y(vendndodhja::extensions.geometry) as lat,
       extensions.st_x(vendndodhja::extensions.geometry) as lng
from public.lokalet
where id = '7828d796-304f-4253-aa38-a748cbcd5365';
