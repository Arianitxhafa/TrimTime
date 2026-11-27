-- Studio Burimi · llogaritë aktive menjëherë dhe fjalëkalimi i harruar me email rikuperimi
--
-- 1. Pronari nuk aprovon më llogaritë: çdo llogari e re është 'aprovuar' që në fillim, edhe ato
--    që sot presin.
-- 2. rikuperimi: email-i opsional i klientit për fjalëkalimin e harruar (llogaritë me telefon s'kanë
--    email të vërtetë). Secili sheh dhe ndryshon vetëm të tijin; stafi nuk e sheh.
-- 3. kodet_e_rivendosjes: kodi 6-shifror, i ruajtur vetëm si hash, vlen 15 minuta dhe 5 tentativa.
-- 4. pergatit_kodin_e_rikuperimit(telefoni): e thërret vetëm funksioni "dergo-kodin" në server
--    (service_role), që ia dërgon kodin me email. Një kod i ri më së shumti një herë në minutë.
-- 5. rivendos_fjalekalimin_me_kod(telefoni, kodi, fjalekalimi): klienti, pa hyrë, vendos
--    fjalëkalimin e ri. Fjalëkalimi ruhet si bcrypt, në formatin e Supabase Auth.

begin;

-- 1 ───────────────────────────────────────────────────────────────
alter table public.profilet alter column statusi set default 'aprovuar';
update public.profilet set statusi = 'aprovuar' where statusi = 'ne_pritje';

-- 2 ───────────────────────────────────────────────────────────────
create table public.rikuperimi (
  perdoruesi_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  email text not null check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ndryshuar_me timestamptz not null default now()
);

alter table public.rikuperimi enable row level security;

create policy "Secili lexon email-in e vet të rikuperimit"
  on public.rikuperimi for select to authenticated
  using (perdoruesi_id = (select auth.uid()));

create policy "Secili shton email-in e vet të rikuperimit"
  on public.rikuperimi for insert to authenticated
  with check (perdoruesi_id = (select auth.uid()));

create policy "Secili ndryshon email-in e vet të rikuperimit"
  on public.rikuperimi for update to authenticated
  using (perdoruesi_id = (select auth.uid()))
  with check (perdoruesi_id = (select auth.uid()));

create policy "Secili fshin email-in e vet të rikuperimit"
  on public.rikuperimi for delete to authenticated
  using (perdoruesi_id = (select auth.uid()));

revoke all on table public.rikuperimi from public, anon;
grant select, insert, update, delete on table public.rikuperimi to authenticated;

-- 3 ───────────────────────────────────────────────────────────────
create table public.kodet_e_rivendosjes (
  perdoruesi_id uuid primary key references auth.users (id) on delete cascade,
  kodi_hash text not null,
  skadon_me timestamptz not null,
  tentativat integer not null default 0,
  krijuar_me timestamptz not null default now()
);

-- Asnjë politikë: tabela përdoret vetëm nga funksionet më poshtë.
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

-- 4 ───────────────────────────────────────────────────────────────
create function public.pergatit_kodin_e_rikuperimit(p_telefoni text)
returns table (email text, kodi text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_email text;
  v_kodi text;
begin
  v_id := public.llogaria_e_telefonit(p_telefoni);
  if v_id is null then
    return;
  end if;

  select r.email into v_email from public.rikuperimi r where r.perdoruesi_id = v_id;
  if v_email is null then
    return;
  end if;

  -- Jo më shumë se një email në minutë për të njëjtën llogari.
  if exists (
    select 1 from public.kodet_e_rivendosjes k
    where k.perdoruesi_id = v_id and k.krijuar_me > now() - interval '1 minute'
  ) then
    return;
  end if;

  -- 6 shifra nga një burim i rastësishëm kriptografik.
  v_kodi := lpad(
    (('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint % 1000000)::text,
    6, '0'
  );

  insert into public.kodet_e_rivendosjes (perdoruesi_id, kodi_hash, skadon_me, tentativat, krijuar_me)
  values (v_id, extensions.crypt(v_kodi, extensions.gen_salt('bf', 8)), now() + interval '15 minutes', 0, now())
  on conflict (perdoruesi_id) do update
    set kodi_hash = excluded.kodi_hash,
        skadon_me = excluded.skadon_me,
        tentativat = 0,
        krijuar_me = excluded.krijuar_me;

  return query select v_email, v_kodi;
end;
$$;

-- 5 ───────────────────────────────────────────────────────────────
-- Kthen 'ok', 'kodi_gabim' (numër, kod ose afat i gabuar) ose 'fjalekalimi_i_shkurter'.
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
  v_rreshti public.kodet_e_rivendosjes;
begin
  if length(coalesce(p_fjalekalimi, '')) < 8 or length(p_fjalekalimi) > 72 then
    return 'fjalekalimi_i_shkurter';
  end if;

  v_id := public.llogaria_e_telefonit(p_telefoni);
  if v_id is null then
    return 'kodi_gabim';
  end if;

  select * into v_rreshti from public.kodet_e_rivendosjes where perdoruesi_id = v_id for update;
  if not found or v_rreshti.skadon_me < now() or v_rreshti.tentativat >= 5 then
    return 'kodi_gabim';
  end if;

  if extensions.crypt(trim(coalesce(p_kodi, '')), v_rreshti.kodi_hash) <> v_rreshti.kodi_hash then
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
revoke all on function public.pergatit_kodin_e_rikuperimit(text) from public, anon, authenticated;
revoke all on function public.rivendos_fjalekalimin_me_kod(text, text, text) from public;
grant execute on function public.pergatit_kodin_e_rikuperimit(text) to service_role;
-- Klienti që ka harruar fjalëkalimin nuk ka hyrë: funksioni duhet edhe për anon.
grant execute on function public.rivendos_fjalekalimin_me_kod(text, text, text) to anon, authenticated;

commit;

-- Kontrolli: 0 llogari në pritje dhe 3 funksione.
select
  (select count(*) from public.profilet where statusi = 'ne_pritje') as ne_pritje,
  (select count(*) from pg_proc where proname in
    ('llogaria_e_telefonit', 'pergatit_kodin_e_rikuperimit', 'rivendos_fjalekalimin_me_kod')) as funksionet;
