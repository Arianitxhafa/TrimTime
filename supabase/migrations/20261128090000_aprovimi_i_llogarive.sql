-- Studio Burimi · hyrja me telefon dhe aprovimi i llogarive
--
-- 1. Çdo profil ka një status: 'ne_pritje' (llogari e re), 'aprovuar' ose 'refuzuar'. Llogaritë që
--    ekzistojnë sot kalojnë 'aprovuar'.
-- 2. Profili i ri merr nga regjistrimi edhe numrin e telefonit (klienti hyn me telefon + fjalëkalim).
-- 3. Statusin e ndryshon vetëm pronari i Studios; klienti s'mund ta aprovojë veten.
-- 4. Një klient i paaprovuar nuk mund të rezervojë (gabimi TT009), as përmes API-së.
-- 5. Funksionet për pronarin: lista e llogarive që presin dhe aprovimi/refuzimi.
-- 6. numri_i_klienteve(): sa klientë të aprovuar ka Studio (distinktivi te Ballina).

begin;

-- 1 ───────────────────────────────────────────────────────────────
alter table public.profilet
  add column statusi text not null default 'ne_pritje'
  check (statusi in ('ne_pritje', 'aprovuar', 'refuzuar'));

update public.profilet set statusi = 'aprovuar';

-- 2 ───────────────────────────────────────────────────────────────
create or replace function public.krijo_profilin_e_ri()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profilet (id, emri, telefoni)
  values (
    new.id,
    coalesce(left(trim(new.raw_user_meta_data ->> 'emri'), 80), ''),
    nullif(left(trim(new.raw_user_meta_data ->> 'telefoni'), 20), '')
  );
  return new;
end;
$$;

-- 3 ───────────────────────────────────────────────────────────────
create function public.mbro_statusin_e_profilit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.statusi is distinct from old.statusi
     and not public.eshte_pronar('7828d796-304f-4253-aa38-a748cbcd5365'::uuid) then
    raise exception using errcode = '42501', message = 'Vetëm pronari e ndryshon statusin e llogarisë.';
  end if;
  return new;
end;
$$;

create trigger profilet_mbro_statusin
  before update on public.profilet
  for each row execute function public.mbro_statusin_e_profilit();

-- 4 ───────────────────────────────────────────────────────────────
-- Vetëm kur klienti rezervon për vete; terminet që shton stafi nuk preken.
create function public.kontrollo_klientin_e_aprovuar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.klienti_id is not null
     and new.klienti_id = auth.uid()
     and not public.eshte_anetar(new.lokali_id)
     and not exists (
       select 1 from public.profilet p where p.id = new.klienti_id and p.statusi = 'aprovuar'
     ) then
    raise exception using errcode = 'TT009', message = 'Llogaria juaj pret aprovimin e Studios.';
  end if;
  return new;
end;
$$;

create trigger terminet_klienti_i_aprovuar
  before insert on public.terminet
  for each row execute function public.kontrollo_klientin_e_aprovuar();

-- 5 ───────────────────────────────────────────────────────────────
create function public.llogarite_per_aprovim()
returns table (id uuid, emri text, telefoni text, statusi text, krijuar_me timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.eshte_pronar('7828d796-304f-4253-aa38-a748cbcd5365'::uuid) then
    raise exception using errcode = '42501', message = 'Vetëm pronari.';
  end if;
  return query
    select p.id, p.emri, p.telefoni, p.statusi, p.krijuar_me
    from public.profilet p
    where p.statusi <> 'aprovuar'
      and not exists (select 1 from public.anetaret_e_lokalit a where a.profili_id = p.id and a.aktiv)
    order by (p.statusi = 'ne_pritje') desc, p.krijuar_me desc
    limit 200;
end;
$$;

create function public.ndrysho_statusin_e_llogarise(p_profili_id uuid, p_statusi text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.eshte_pronar('7828d796-304f-4253-aa38-a748cbcd5365'::uuid) then
    raise exception using errcode = '42501', message = 'Vetëm pronari.';
  end if;
  if p_statusi not in ('ne_pritje', 'aprovuar', 'refuzuar') then
    raise exception using errcode = '22023', message = 'Status i panjohur.';
  end if;
  update public.profilet set statusi = p_statusi where id = p_profili_id;
end;
$$;

-- 6 ───────────────────────────────────────────────────────────────
create function public.numri_i_klienteve()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.profilet p
  where p.statusi = 'aprovuar'
    and not exists (select 1 from public.anetaret_e_lokalit a where a.profili_id = p.id and a.aktiv);
$$;

revoke all on function public.llogarite_per_aprovim() from public, anon;
revoke all on function public.ndrysho_statusin_e_llogarise(uuid, text) from public, anon;
revoke all on function public.numri_i_klienteve() from public, anon;
grant execute on function public.llogarite_per_aprovim() to authenticated;
grant execute on function public.ndrysho_statusin_e_llogarise(uuid, text) to authenticated;
grant execute on function public.numri_i_klienteve() to authenticated;

commit;

-- Kontrolli: të gjitha llogaritë ekzistuese duhet të jenë 'aprovuar'.
select statusi, count(*) from public.profilet group by statusi;
