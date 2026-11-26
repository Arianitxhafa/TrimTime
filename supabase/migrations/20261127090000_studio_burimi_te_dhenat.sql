-- Studio Burimi · emri, qyteti dhe adresa sipas profilit të Instagram-it (@studioburimi)
--
-- Profili: "Burim Bajrami · Hair Salon · Mitrovicë", vendndodhja "Skenderbe, Mitrovica, Kosovo".
-- Shërbimet, çmimet, orari dhe pika e saktë në hartë mbeten si më parë derisa t'i japë berberi;
-- pronari i ndryshon nga aplikacioni (Lokali → Informacioni, Shërbimet, Orari).

update public.lokalet
set emri = 'Studio Burimi',
    qyteti = 'Mitrovicë',
    adresa = 'Rruga Skënderbe',
    pershkrimi = 'Berber për meshkuj në Mitrovicë. Prerje klasike dhe moderne, fade dhe rregullim mjekre, me Burim Bajramin.'
where id = '7828d796-304f-4253-aa38-a748cbcd5365';

-- Kontrolli: duhet të dalë një rresht me të dhënat e reja.
select emri, qyteti, adresa, pershkrimi from public.lokalet where id = '7828d796-304f-4253-aa38-a748cbcd5365';
