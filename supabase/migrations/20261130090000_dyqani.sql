-- Studio Burimi · dyqani me produkte
--
-- Studio shet produktet e veta (makina, wax, spray, kujdes). Klienti porosit në aplikacion dhe
-- e merr e paguan në lokal; pagesa online vjen më vonë.
--
-- 1. produktet: katalogu. E shohin të gjithë që kanë hyrë; e menaxhon vetëm pronari.
-- 2. porosite + porosite_artikujt: porositë dhe çfarë përmbajnë. Klienti sheh vetëm të vetat,
--    stafi të gjitha porositë e Studios.
-- 3. porosit(): krijon porosinë; çmimet merren nga databaza, jo nga aplikacioni, dhe stoku ulet.
-- 4. ndrysho_statusin_e_porosise(): stafi e kalon porosinë "gati", "marrë" ose "anuluar";
--    klienti mund ta anulojë vetëm derisa është "e re". Anulimi e kthen stokun.

begin;

-- 1 ───────────────────────────────────────────────────────────────
create table public.produktet (
  id uuid primary key default gen_random_uuid(),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  emri text not null check (char_length(emri) between 2 and 80),
  pershkrimi text check (char_length(pershkrimi) <= 1000),
  kategoria text not null default 'tjeter'
    check (kategoria in ('pajisje', 'stilim', 'kujdes', 'tjeter')),
  cmimi_centa integer not null check (cmimi_centa between 0 and 10000000),
  foto_url text check (char_length(foto_url) <= 500),
  -- null: pa kufi; 0: s'ka më.
  ne_stok integer check (ne_stok >= 0),
  aktiv boolean not null default true,
  krijuar_me timestamptz not null default now()
);

create index produktet_lokali on public.produktet (lokali_id, aktiv);

alter table public.produktet enable row level security;

create policy "Të gjithë që kanë hyrë shohin produktet aktive"
  on public.produktet for select to authenticated
  using (aktiv or public.eshte_anetar(lokali_id));

create policy "Pronari shton produkte"
  on public.produktet for insert to authenticated
  with check (public.eshte_pronar(lokali_id));

create policy "Pronari ndryshon produktet"
  on public.produktet for update to authenticated
  using (public.eshte_pronar(lokali_id))
  with check (public.eshte_pronar(lokali_id));

create policy "Pronari fshin produktet"
  on public.produktet for delete to authenticated
  using (public.eshte_pronar(lokali_id));

grant select, insert, update, delete on public.produktet to authenticated;

-- 2 ───────────────────────────────────────────────────────────────
create table public.porosite (
  id uuid primary key default gen_random_uuid(),
  lokali_id uuid not null references public.lokalet (id) on delete cascade,
  klienti_id uuid not null references public.profilet (id) on delete cascade,
  statusi text not null default 'e_re' check (statusi in ('e_re', 'gati', 'marre', 'anuluar')),
  totali_centa integer not null check (totali_centa >= 0),
  shenime text check (char_length(shenime) <= 500),
  krijuar_me timestamptz not null default now()
);

create index porosite_lokali on public.porosite (lokali_id, krijuar_me desc);
create index porosite_klienti on public.porosite (klienti_id, krijuar_me desc);

create table public.porosite_artikujt (
  id uuid primary key default gen_random_uuid(),
  porosia_id uuid not null references public.porosite (id) on delete cascade,
  produkti_id uuid references public.produktet (id) on delete set null,
  -- Emri dhe çmimi ruhen në çastin e porosisë, që porosia të mos ndryshojë kur ndryshon produkti.
  emri text not null,
  cmimi_centa integer not null check (cmimi_centa >= 0),
  sasia integer not null check (sasia between 1 and 20)
);

create index porosite_artikujt_porosia on public.porosite_artikujt (porosia_id);

alter table public.porosite enable row level security;
alter table public.porosite_artikujt enable row level security;

create policy "Klienti sheh porositë e veta, stafi të Studios"
  on public.porosite for select to authenticated
  using (klienti_id = (select auth.uid()) or public.eshte_anetar(lokali_id));

create policy "Artikujt e porosive që mund t'i shohë"
  on public.porosite_artikujt for select to authenticated
  using (exists (
    select 1 from public.porosite p
    where p.id = porosia_id and (p.klienti_id = (select auth.uid()) or public.eshte_anetar(p.lokali_id))
  ));

-- Stafi sheh emrin dhe telefonin e klientit që ka porositur, edhe kur s'ka rezervuar kurrë.
create policy "Stafi lexon profilet e klientëve që kanë porositur"
  on public.profilet for select to authenticated
  using (exists (
    select 1 from public.porosite p
    where p.klienti_id = profilet.id and public.eshte_anetar(p.lokali_id)
  ));

-- Porositë krijohen dhe ndryshohen vetëm përmes funksioneve më poshtë.
grant select on public.porosite, public.porosite_artikujt to authenticated;

-- 3 ───────────────────────────────────────────────────────────────
-- p_artikujt: [{"produkti_id": "…", "sasia": 2}, …]
create function public.porosit(p_artikujt jsonb, p_shenime text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_klienti uuid := (select auth.uid());
  v_lokali uuid := '7828d796-304f-4253-aa38-a748cbcd5365'::uuid;
  v_porosia uuid;
  v_artikulli jsonb;
  v_produkti public.produktet%rowtype;
  v_sasia integer;
  v_totali integer := 0;
begin
  if v_klienti is null then
    raise exception 'Duhet të hysh në llogari' using errcode = '42501';
  end if;
  if not public.eshte_anetar(v_lokali) and not exists (
    select 1 from public.profilet p where p.id = v_klienti and p.statusi = 'aprovuar'
  ) then
    raise exception 'Llogaria juaj pret aprovimin e Studios.' using errcode = 'TT009';
  end if;
  if p_artikujt is null or jsonb_typeof(p_artikujt) <> 'array'
     or jsonb_array_length(p_artikujt) = 0 or jsonb_array_length(p_artikujt) > 20 then
    raise exception 'Shporta është bosh' using errcode = 'TT010';
  end if;

  insert into public.porosite (lokali_id, klienti_id, totali_centa, shenime)
  values (v_lokali, v_klienti, 0, nullif(left(trim(coalesce(p_shenime, '')), 500), ''))
  returning id into v_porosia;

  for v_artikulli in select * from jsonb_array_elements(p_artikujt) loop
    v_sasia := coalesce((v_artikulli ->> 'sasia')::integer, 0);
    if v_sasia < 1 or v_sasia > 20 then
      raise exception 'Sasi e pavlefshme' using errcode = 'TT010';
    end if;

    select * into v_produkti
    from public.produktet
    where id = (v_artikulli ->> 'produkti_id')::uuid and lokali_id = v_lokali and aktiv
    for update;
    if not found then
      raise exception 'Produkti nuk ekziston më' using errcode = 'TT010';
    end if;
    if v_produkti.ne_stok is not null and v_produkti.ne_stok < v_sasia then
      raise exception 'S''ka mjaftueshëm në stok: %', v_produkti.emri using errcode = 'TT011';
    end if;

    if v_produkti.ne_stok is not null then
      update public.produktet set ne_stok = ne_stok - v_sasia where id = v_produkti.id;
    end if;

    insert into public.porosite_artikujt (porosia_id, produkti_id, emri, cmimi_centa, sasia)
    values (v_porosia, v_produkti.id, v_produkti.emri, v_produkti.cmimi_centa, v_sasia);
    v_totali := v_totali + v_produkti.cmimi_centa * v_sasia;
  end loop;

  update public.porosite set totali_centa = v_totali where id = v_porosia;
  return v_porosia;
end;
$$;

-- 4 ───────────────────────────────────────────────────────────────
create function public.ndrysho_statusin_e_porosise(p_porosia_id uuid, p_statusi text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_porosia public.porosite%rowtype;
  v_stafi boolean;
begin
  select * into v_porosia from public.porosite where id = p_porosia_id for update;
  if not found then
    raise exception 'Porosia nuk ekziston' using errcode = 'TT010';
  end if;
  if p_statusi not in ('e_re', 'gati', 'marre', 'anuluar') then
    raise exception 'Status i panjohur' using errcode = '22023';
  end if;

  v_stafi := public.eshte_anetar(v_porosia.lokali_id);
  if not v_stafi and not (
    v_porosia.klienti_id = (select auth.uid()) and v_porosia.statusi = 'e_re' and p_statusi = 'anuluar'
  ) then
    raise exception 'Nuk lejohet' using errcode = '42501';
  end if;

  -- Anulimi e kthen stokun; rikthimi nga "anuluar" s'lejohet (stoku mund të jetë shitur ndërkohë).
  if v_porosia.statusi = 'anuluar' then
    raise exception 'Porosia është anuluar' using errcode = 'TT010';
  end if;
  if p_statusi = 'anuluar' then
    update public.produktet p
    set ne_stok = p.ne_stok + a.sasia
    from public.porosite_artikujt a
    where a.porosia_id = v_porosia.id and a.produkti_id = p.id and p.ne_stok is not null;
  end if;

  update public.porosite set statusi = p_statusi where id = v_porosia.id;
end;
$$;

revoke all on function public.porosit(jsonb, text) from public, anon;
revoke all on function public.ndrysho_statusin_e_porosise(uuid, text) from public, anon;
grant execute on function public.porosit(jsonb, text) to authenticated;
grant execute on function public.ndrysho_statusin_e_porosise(uuid, text) to authenticated;

commit;

-- Kontrolli: tri tabela të reja me RLS.
select tablename, rowsecurity from pg_tables where tablename in ('produktet', 'porosite', 'porosite_artikujt');
