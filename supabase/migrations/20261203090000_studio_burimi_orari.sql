-- Studio Burimi · orari i vërtetë nga Google Maps
--
-- E hënë – e shtunë 09:00–19:30, e diel mbyllur (dita: 0 = e diel … 6 = e shtunë).
-- Berberët pa orar të veçantë ndjekin këtë orar.

begin;

delete from public.oraret_e_lokalit where lokali_id = '7828d796-304f-4253-aa38-a748cbcd5365';

insert into public.oraret_e_lokalit (lokali_id, dita, hapet, mbyllet)
select '7828d796-304f-4253-aa38-a748cbcd5365', d, '09:00', '19:30'
from generate_series(1, 6) as d;

commit;

-- Kontrolli: 6 rreshta, dita 1–6, 09:00–19:30.
select dita, hapet, mbyllet
from public.oraret_e_lokalit
where lokali_id = '7828d796-304f-4253-aa38-a748cbcd5365'
order by dita;
