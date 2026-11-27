-- Studio Burimi · rezervimi sipas berberit, me disa shërbime njëherësh
--
-- 1. oraret_e_berberit(berberi, data, kohëzgjatja): të gjitha orët e ditës (çdo 30 min) brenda
--    orarit të berberit, secila me statusin e saj:
--      'e_lire'       – mund të rezervohet për gjithë kohëzgjatjen e zgjedhur;
--      'ne_pritje'    – një termin pret konfirmimin në këtë orë;
--      'e_rezervuar'  – një termin i konfirmuar zë këtë orë;
--      'pa_vend'      – ora është e lirë, por kohëzgjatja e zgjedhur nuk nxë (termin tjetër,
--                       pushim ose mbyllja e lokalit);
--      'pushim'       – berberi është në pushim;
--      'kaluar'       – ora ka kaluar (ose fillon pas më pak se 15 minutash).
--    Kthen vetëm orën dhe statusin, asnjë të dhënë të klientëve të tjerë.
-- 2. rezervo_me_sherbime(berberi, shërbimet[], fillon_me, shënime): rezervon disa shërbime njëri pas
--    tjetrit te i njëjti berber, si termine të njëpasnjëshme. Kontrollon në server orarin, pushimet
--    dhe terminet e tjera; çmimi dhe zbritjet llogariten këtu, si te rezervo_termin.

begin;

-- 1 ───────────────────────────────────────────────────────────────
create function public.oraret_e_berberit(p_berberi_id uuid, p_data date, p_kohezgjatja_min integer)
returns table (fillon_me timestamptz, ora text, statusi text)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_lokali public.lokalet%rowtype;
  v_orar_vecante boolean;
  v_dita int := extract(dow from p_data)::int;
  v_kohezgjatja interval := make_interval(mins => greatest(coalesce(p_kohezgjatja_min, 30), 15));
begin
  select * into v_lokali
  from public.lokalet
  where id = '7828d796-304f-4253-aa38-a748cbcd5365'::uuid and i_publikuar;
  if not found then
    return;
  end if;

  select a.orar_i_vecante into v_orar_vecante
  from public.anetaret_e_lokalit a
  where a.lokali_id = v_lokali.id and a.profili_id = p_berberi_id and a.aktiv;
  if not found then
    return;
  end if;

  return query
  with intervalet as (
    select
      (p_data + o.hapet) at time zone v_lokali.zona_kohore as fillimi,
      (p_data + o.mbyllet) at time zone v_lokali.zona_kohore as fundi
    from public.oraret_e_lokalit o
    where not v_orar_vecante and o.lokali_id = v_lokali.id and o.dita = v_dita
    union all
    select
      (p_data + s.hapet) at time zone v_lokali.zona_kohore,
      (p_data + s.mbyllet) at time zone v_lokali.zona_kohore
    from public.oraret_e_stafit s
    where v_orar_vecante and s.lokali_id = v_lokali.id and s.profili_id = p_berberi_id and s.dita = v_dita
  ),
  slotet as (
    select g.koha, i.fundi
    from intervalet i
    cross join lateral generate_series(i.fillimi, i.fundi - interval '30 minutes', interval '30 minutes') as g(koha)
  )
  select
    s.koha,
    to_char(s.koha at time zone v_lokali.zona_kohore, 'HH24:MI'),
    case
      when exists (
        select 1 from public.terminet t
        where t.berberi_id = p_berberi_id and t.statusi = 'konfirmuar'
          and tstzrange(t.fillon_me, t.mbaron_me, '[)') && tstzrange(s.koha, s.koha + interval '30 minutes', '[)')
      ) then 'e_rezervuar'
      when exists (
        select 1 from public.terminet t
        where t.berberi_id = p_berberi_id and t.statusi = 'ne_pritje'
          and tstzrange(t.fillon_me, t.mbaron_me, '[)') && tstzrange(s.koha, s.koha + interval '30 minutes', '[)')
      ) then 'ne_pritje'
      when s.koha < now() + interval '15 minutes' then 'kaluar'
      when exists (
        select 1 from public.pushimet_e_stafit p
        where p.profili_id = p_berberi_id and p.lokali_id = v_lokali.id
          and tstzrange(p.fillon_me, p.mbaron_me, '[)') && tstzrange(s.koha, s.koha + interval '30 minutes', '[)')
      ) then 'pushim'
      when s.koha + v_kohezgjatja > s.fundi then 'pa_vend'
      when exists (
        select 1 from public.terminet t
        where t.berberi_id = p_berberi_id and t.statusi in ('ne_pritje', 'konfirmuar')
          and tstzrange(t.fillon_me, t.mbaron_me, '[)') && tstzrange(s.koha, s.koha + v_kohezgjatja, '[)')
      ) or exists (
        select 1 from public.pushimet_e_stafit p
        where p.profili_id = p_berberi_id and p.lokali_id = v_lokali.id
          and tstzrange(p.fillon_me, p.mbaron_me, '[)') && tstzrange(s.koha, s.koha + v_kohezgjatja, '[)')
      ) then 'pa_vend'
      else 'e_lire'
    end
  from slotet s
  order by s.koha;
end;
$$;

-- 2 ───────────────────────────────────────────────────────────────
create function public.rezervo_me_sherbime(
  p_berberi_id uuid,
  p_sherbimet uuid[],
  p_fillon_me timestamptz,
  p_shenime text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_klienti uuid := (select auth.uid());
  v_lokali public.lokalet%rowtype;
  v_orar_vecante boolean;
  v_sherbimi public.sherbimet%rowtype;
  v_sid uuid;
  v_koha timestamptz := p_fillon_me;
  v_fundi timestamptz;
  v_data date;
  v_dita int;
  v_promocioni_id uuid;
  v_perqindja smallint;
  v_zbritja integer;
  v_id uuid;
  v_i_pari uuid;
begin
  if v_klienti is null then
    raise exception 'Duhet të hysh në llogari' using errcode = '42501';
  end if;

  if p_sherbimet is null or cardinality(p_sherbimet) = 0 or cardinality(p_sherbimet) > 5
     or cardinality(p_sherbimet) <> (select count(distinct x) from unnest(p_sherbimet) x) then
    raise exception 'Zgjidh nga një deri në pesë shërbime' using errcode = 'TT004';
  end if;

  select * into v_lokali
  from public.lokalet
  where id = '7828d796-304f-4253-aa38-a748cbcd5365'::uuid and i_publikuar;
  if not found then
    raise exception 'Studio nuk pranon rezervime tani' using errcode = 'TT004';
  end if;

  if (select count(*) from public.sherbimet s
      where s.id = any (p_sherbimet) and s.lokali_id = v_lokali.id and s.aktiv) <> cardinality(p_sherbimet) then
    raise exception 'Shërbimi nuk ekziston' using errcode = 'TT004';
  end if;

  select a.orar_i_vecante into v_orar_vecante
  from public.anetaret_e_lokalit a
  where a.lokali_id = v_lokali.id and a.profili_id = p_berberi_id and a.aktiv;
  if not found then
    raise exception 'Berberi nuk punon te Studio' using errcode = 'TT004';
  end if;

  if p_fillon_me < now() + interval '15 minutes' then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
  end if;

  v_fundi := p_fillon_me + make_interval(mins => (
    select sum(s.kohezgjatja_min + s.pushimi_pas_min)::int from public.sherbimet s where s.id = any (p_sherbimet)
  ));
  v_data := (p_fillon_me at time zone v_lokali.zona_kohore)::date;
  v_dita := extract(dow from v_data)::int;

  -- Gjithë rezervimi duhet të jetë brenda orarit të berberit atë ditë.
  if not exists (
    select 1 from public.oraret_e_lokalit o
    where not v_orar_vecante and o.lokali_id = v_lokali.id and o.dita = v_dita
      and p_fillon_me >= (v_data + o.hapet) at time zone v_lokali.zona_kohore
      and v_fundi <= (v_data + o.mbyllet) at time zone v_lokali.zona_kohore
    union all
    select 1 from public.oraret_e_stafit s
    where v_orar_vecante and s.lokali_id = v_lokali.id and s.profili_id = p_berberi_id and s.dita = v_dita
      and p_fillon_me >= (v_data + s.hapet) at time zone v_lokali.zona_kohore
      and v_fundi <= (v_data + s.mbyllet) at time zone v_lokali.zona_kohore
  ) then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
  end if;

  if exists (
    select 1 from public.pushimet_e_stafit p
    where p.profili_id = p_berberi_id and p.lokali_id = v_lokali.id
      and tstzrange(p.fillon_me, p.mbaron_me, '[)') && tstzrange(p_fillon_me, v_fundi, '[)')
  ) or exists (
    select 1 from public.terminet t
    where t.berberi_id = p_berberi_id and t.statusi in ('ne_pritje', 'konfirmuar')
      and tstzrange(t.fillon_me, t.mbaron_me, '[)') && tstzrange(p_fillon_me, v_fundi, '[)')
  ) then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
  end if;

  -- Një termin për çdo shërbim, njëri pas tjetrit, në rendin që i zgjodhi klienti.
  foreach v_sid in array p_sherbimet loop
    select * into v_sherbimi from public.sherbimet where id = v_sid;
    v_promocioni_id := null;
    v_perqindja := null;
    v_zbritja := 0;
    select p.id, p.perqindja into v_promocioni_id, v_perqindja
    from public.promocioni_per(v_lokali.id, v_sid, v_koha) p;
    if v_promocioni_id is not null then
      v_zbritja := round(v_sherbimi.cmimi_centa * v_perqindja / 100.0)::integer;
    end if;

    insert into public.terminet (
      lokali_id, berberi_id, klienti_id, sherbimi_id,
      fillon_me, mbaron_me, statusi,
      cmimi_baze_centa, zbritja_centa, promocioni_id, cmimi_centa, shenime
    )
    values (
      v_lokali.id,
      p_berberi_id,
      v_klienti,
      v_sid,
      v_koha,
      v_koha + make_interval(mins => v_sherbimi.kohezgjatja_min + v_sherbimi.pushimi_pas_min),
      case when v_lokali.pranimi_automatik then 'konfirmuar' else 'ne_pritje' end::public.statusi_terminit,
      v_sherbimi.cmimi_centa,
      v_zbritja,
      v_promocioni_id,
      v_sherbimi.cmimi_centa - v_zbritja,
      case when v_i_pari is null then nullif(left(trim(coalesce(p_shenime, '')), 500), '') end
    )
    returning id into v_id;

    if v_i_pari is null then
      v_i_pari := v_id;
    end if;
    v_koha := v_koha + make_interval(mins => v_sherbimi.kohezgjatja_min + v_sherbimi.pushimi_pas_min);
  end loop;

  delete from public.lista_e_pritjes
  where klienti_id = v_klienti and lokali_id = v_lokali.id and data = v_data;

  return v_i_pari;
exception
  -- Dy klientë e zgjodhën të njëjtën orë në të njëjtin çast: fiton i pari.
  when exclusion_violation then
    raise exception 'Ky orar nuk është më i lirë' using errcode = 'TT001';
end;
$$;

revoke all on function public.oraret_e_berberit(uuid, date, integer) from public, anon;
revoke all on function public.rezervo_me_sherbime(uuid, uuid[], timestamptz, text) from public, anon;
grant execute on function public.oraret_e_berberit(uuid, date, integer) to authenticated;
grant execute on function public.rezervo_me_sherbime(uuid, uuid[], timestamptz, text) to authenticated;

commit;

-- Kontrolli: dy funksionet e reja duhet të dalin këtu.
select proname from pg_proc where proname in ('oraret_e_berberit', 'rezervo_me_sherbime');
