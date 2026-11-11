-- TrimTime · Asistenti AI
--
-- Asistenti thërret Claude nga Edge Function-i "asistenti". Këtu:
--   * perdorimi_i_asistentit + rrit_perdorimin_e_asistentit(): kufiri ditor për çdo përdorues
--     (çdo thirrje e Claude kushton para);
--   * oraret_per_asistentin(): pasi Claude kupton kërkesën ("fade nesër pas 17:00"), gjen orën e
--     parë të lirë në lokalet pranë që pranojnë rezervime online.

-- ─────────────────────────────────────────────────────────────
-- Kufiri ditor
-- ─────────────────────────────────────────────────────────────
create table public.perdorimi_i_asistentit (
  profili_id uuid not null references public.profilet (id) on delete cascade,
  data date not null,
  numri integer not null default 0 check (numri >= 0),
  primary key (profili_id, data)
);

-- Vetëm funksioni më poshtë e prek tabelën; përdoruesit nuk e lexojnë dhe nuk e shkruajnë direkt.
alter table public.perdorimi_i_asistentit enable row level security;
revoke all on table public.perdorimi_i_asistentit from anon, authenticated;

-- Shton një përdorim për sot (ora e Kosovës) dhe kthen true nëse përdoruesi është ende brenda kufirit.
create function public.rrit_perdorimin_e_asistentit(p_kufiri integer default 20)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perdoruesi uuid := auth.uid();
  v_sot date := (now() at time zone 'Europe/Belgrade')::date;
  v_numri integer;
begin
  if v_perdoruesi is null then
    raise exception using errcode = 'TT008', message = 'Duhet të hysh në llogari.';
  end if;

  insert into public.perdorimi_i_asistentit as p (profili_id, data, numri)
  values (v_perdoruesi, v_sot, 1)
  on conflict (profili_id, data) do update set numri = p.numri + 1
  returning numri into v_numri;

  return v_numri <= least(greatest(p_kufiri, 1), 100);
end;
$$;

revoke all on function public.rrit_perdorimin_e_asistentit(integer) from public, anon;
grant execute on function public.rrit_perdorimin_e_asistentit(integer) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Ora e parë e lirë në lokalet pranë, për një shërbim, ditë dhe interval orësh
-- ─────────────────────────────────────────────────────────────
create function public.oraret_per_asistentin(
  p_lat double precision,
  p_lng double precision,
  p_qyteti_id integer,
  -- 'qethje', 'fade', 'mjeker', 'femije', 'ngjyrosje' ose null (çdo shërbim)
  p_kategoria text,
  p_data date,
  -- "HH:MM", sipas orës së lokalit
  p_ora_nga text default '00:00',
  p_ora_deri text default '23:59',
  p_limit integer default 6
)
returns table (
  lokali_id uuid,
  lokali_emri text,
  adresa text,
  sherbimi_id uuid,
  sherbimi_emri text,
  cmimi_centa integer,
  distanca_m double precision,
  fillon_me timestamptz,
  ora text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_lokali record;
  v_sherbimi record;
  v_ora record;
  v_gjetur integer := 0;
begin
  for v_lokali in
    select l.id, l.emri, l.adresa, l.distanca_m
    from public.lokalet_prane(
      p_lat, p_lng, 10, null, false, null, 'distanca', 30, p_qyteti_id,
      p_kategoria, null, null, true, false
    ) l
  loop
    -- Shërbimi më i lirë i kategorisë në këtë lokal.
    select s.id, s.emri, s.cmimi_centa into v_sherbimi
    from public.sherbimet s
    where s.lokali_id = v_lokali.id
      and s.aktiv
      and (p_kategoria is null or public.sherbimi_ne_kategori(s.emri, p_kategoria))
    order by s.cmimi_centa
    limit 1;
    continue when not found;

    select o.fillon_me, o.ora into v_ora
    from public.oraret_e_lira(v_lokali.id, v_sherbimi.id, p_data) o
    where o.ora >= p_ora_nga and o.ora <= p_ora_deri
    order by o.fillon_me
    limit 1;
    continue when not found;

    lokali_id := v_lokali.id;
    lokali_emri := v_lokali.emri;
    adresa := v_lokali.adresa;
    sherbimi_id := v_sherbimi.id;
    sherbimi_emri := v_sherbimi.emri;
    cmimi_centa := v_sherbimi.cmimi_centa;
    distanca_m := v_lokali.distanca_m;
    fillon_me := v_ora.fillon_me;
    ora := v_ora.ora;
    return next;

    v_gjetur := v_gjetur + 1;
    exit when v_gjetur >= least(greatest(p_limit, 1), 10);
  end loop;
end;
$$;

revoke all on function public.oraret_per_asistentin(double precision, double precision, integer, text, date, text, text, integer) from public, anon;
grant execute on function public.oraret_per_asistentin(double precision, double precision, integer, text, date, text, text, integer) to authenticated;
