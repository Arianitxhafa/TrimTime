-- Studio Burimi · fjalëkalim i ri për llogaritë me telefon, pa SMS dhe pa email
--
-- Llogaritë me telefon s'kanë email të vërtetë, ndaj "Ke harruar fjalëkalimin?" nuk mund të dërgojë
-- lidhje. Në vend të saj:
-- 1. Klienti kontakton Studion. Pronari, pasi e njeh, krijon një kod 6-shifror për atë numër
--    (krijo_kodin_e_rivendosjes). Kodi vlen 30 minuta; ruhet vetëm si hash.
-- 2. Klienti, në aplikacion, shkruan numrin, kodin dhe fjalëkalimin e ri
--    (rivendos_fjalekalimin_me_kod). Pas 5 tentativave të gabuara kodi nuk vlen më.
-- Fjalëkalimi ruhet si bcrypt, në formatin që përdor Supabase Auth.

begin;

create table public.kodet_e_rivendosjes (
  perdoruesi_id uuid primary key references auth.users (id) on delete cascade,
  kodi_hash text not null,
  skadon_me timestamptz not null,
  tentativat integer not null default 0,
  krijuar_nga uuid references public.profilet (id) on delete set null,
  krijuar_me timestamptz not null default now()
);

-- Asnjë politikë: tabela lexohet dhe shkruhet vetëm nga funksionet më poshtë.
alter table public.kodet_e_rivendosjes enable row level security;
revoke all on table public.kodet_e_rivendosjes from public, anon, authenticated;

-- Llogaria e telefonit: "+383 48 169 820" → id e "38348169820@tel.studioburimi.app".
create function public.llogaria_e_telefonit(p_telefoni text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from auth.users u
  where u.email = regexp_replace(coalesce(p_telefoni, ''), '\D', '', 'g') || '@tel.studioburimi.app'
    and length(regexp_replace(coalesce(p_telefoni, ''), '\D', '', 'g')) between 7 and 15;
$$;

-- 1 ───────────────────────────────────────────────────────────────
create function public.krijo_kodin_e_rivendosjes(p_telefoni text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_kodi text;
begin
  if not public.eshte_pronar('7828d796-304f-4253-aa38-a748cbcd5365'::uuid) then
    raise exception using errcode = '42501', message = 'Vetëm pronari.';
  end if;

  v_id := public.llogaria_e_telefonit(p_telefoni);
  if v_id is null then
    raise exception using errcode = 'TT012', message = 'Nuk ka llogari me këtë numër telefoni.';
  end if;
  if v_id = auth.uid() then
    raise exception using errcode = 'TT012', message = 'Fjalëkalimin tënd e ndryshon te Cilësimet.';
  end if;

  -- 6 shifra nga një burim i rastësishëm kriptografik.
  v_kodi := lpad(
    (('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint % 1000000)::text,
    6, '0'
  );

  insert into public.kodet_e_rivendosjes (perdoruesi_id, kodi_hash, skadon_me, tentativat, krijuar_nga, krijuar_me)
  values (v_id, extensions.crypt(v_kodi, extensions.gen_salt('bf', 8)), now() + interval '30 minutes', 0, auth.uid(), now())
  on conflict (perdoruesi_id) do update
    set kodi_hash = excluded.kodi_hash,
        skadon_me = excluded.skadon_me,
        tentativat = 0,
        krijuar_nga = excluded.krijuar_nga,
        krijuar_me = excluded.krijuar_me;

  return v_kodi;
end;
$$;

-- 2 ───────────────────────────────────────────────────────────────
-- Kthen 'ok', ose 'kodi_gabim' (numër, kod ose afat i gabuar) / 'fjalekalimi_i_shkurter'.
-- Nuk hedh gabim te kodi i gabuar, që numri i tentativave të ruhet.
create function public.rivendos_fjalekalimin_me_kod(p_telefoni text, p_kodi text, p_fjalekalimi text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_kodi public.kodet_e_rivendosjes;
begin
  if length(coalesce(p_fjalekalimi, '')) < 8 or length(p_fjalekalimi) > 72 then
    return 'fjalekalimi_i_shkurter';
  end if;

  v_id := public.llogaria_e_telefonit(p_telefoni);
  if v_id is null then
    return 'kodi_gabim';
  end if;

  select * into v_kodi from public.kodet_e_rivendosjes where perdoruesi_id = v_id for update;
  if not found or v_kodi.skadon_me < now() or v_kodi.tentativat >= 5 then
    return 'kodi_gabim';
  end if;

  if extensions.crypt(trim(coalesce(p_kodi, '')), v_kodi.kodi_hash) <> v_kodi.kodi_hash then
    update public.kodet_e_rivendosjes set tentativat = tentativat + 1 where perdoruesi_id = v_id;
    return 'kodi_gabim';
  end if;

  update auth.users
    set encrypted_password = extensions.crypt(p_fjalekalimi, extensions.gen_salt('bf', 10)),
        updated_at = now()
    where id = v_id;
  delete from public.kodet_e_rivendosjes where perdoruesi_id = v_id;
  return 'ok';
end;
$$;

revoke all on function public.llogaria_e_telefonit(text) from public, anon, authenticated;
revoke all on function public.krijo_kodin_e_rivendosjes(text) from public, anon;
revoke all on function public.rivendos_fjalekalimin_me_kod(text, text, text) from public;
grant execute on function public.krijo_kodin_e_rivendosjes(text) to authenticated;
-- Klienti që ka harruar fjalëkalimin nuk ka hyrë: funksioni duhet edhe për anon.
grant execute on function public.rivendos_fjalekalimin_me_kod(text, text, text) to anon, authenticated;

commit;

-- Kontrolli: duhet të dalin 2 funksione.
select proname from pg_proc where proname in ('krijo_kodin_e_rivendosjes', 'rivendos_fjalekalimin_me_kod');
