-- Profilet që mungojnë
--
-- Trigger-i krijo_profilin_e_ri (nga 20261021120000_themeli.sql) krijon profilin vetëm për
-- llogaritë e regjistruara PASI u ekzekutua ai migrim. Llogaritë e krijuara më herët nuk kanë
-- rresht te public.profilet, ndaj rezervimi dështonte me 409 (terminet.klienti_id i referohet
-- profilet.id) dhe aplikacioni tregonte "Ndodhi një gabim".
--
-- Ky migrim u krijon profilin të gjitha llogarive pa profil, me emrin dhe gjuhën nga regjistrimi.
-- Mund të ekzekutohet sërish pa dëm (on conflict do nothing).

insert into public.profilet (id, emri, gjuha)
select
  u.id,
  coalesce(left(trim(u.raw_user_meta_data ->> 'emri'), 80), ''),
  case when u.raw_user_meta_data ->> 'gjuha' in ('sq', 'en') then u.raw_user_meta_data ->> 'gjuha' else 'sq' end
from auth.users u
where not exists (select 1 from public.profilet p where p.id = u.id)
on conflict (id) do nothing;
