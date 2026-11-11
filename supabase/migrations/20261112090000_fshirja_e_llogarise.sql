-- TrimTime · Fshirja e llogarisë
--
-- Apple (App Store 5.1.1(v)) dhe Google kërkojnë që përdoruesi ta fshijë llogarinë nga brenda
-- aplikacionit. fshij_llogarine() fshin llogarinë e përdoruesit që e thërret:
--   * terminet që ka bërë si berber në lokale të të tjerëve kalojnë te pronari i lokalit
--     (historiku dhe pagesat e lokalit mbeten);
--   * lokalet e veta fshihen me gjithçka të tyre (terminet së pari, sepse terminet → shërbimet
--     është "restrict");
--   * si klient: terminet e ardhshme anulohen dhe të gjitha mbeten si "Llogari e fshirë";
--   * llogaria në auth.users fshihet; profili, vlerësimet, kartat e besnikërisë dhe lista e
--     pritjes fshihen me cascade.
-- Fotot e stilit në Storage i fshin aplikacioni para thirrjes (SQL nuk lejon fshirje direkte).

create function public.fshij_llogarine()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perdoruesi uuid := auth.uid();
begin
  if v_perdoruesi is null then
    raise exception using errcode = 'TT008', message = 'Duhet të hysh në llogari.';
  end if;

  -- Si klient: terminet e ardhshme anulohen (lokali nuk e pret më) dhe të gjitha mbeten pa të dhëna
  -- personale, me shënimin "Llogari e fshirë" (terminet duhet të kenë klient ose emër).
  update public.terminet
  set statusi = 'anuluar'
  where klienti_id = v_perdoruesi
    and statusi in ('ne_pritje', 'konfirmuar')
    and fillon_me > now();

  update public.terminet
  set emri_klientit = 'Llogari e fshirë', telefoni_klientit = null
  where klienti_id = v_perdoruesi;

  -- Si berber në lokale të të tjerëve: terminet aktive anulohen (nuk ka kush t'i bëjë dhe, pa këtë,
  -- kalimi te pronari mund të përplasej me një termin të tij në të njëjtën orë), pastaj historiku
  -- kalon te pronari i lokalit.
  update public.terminet t
  set statusi = 'anuluar'
  from public.lokalet l
  where t.lokali_id = l.id
    and t.berberi_id = v_perdoruesi
    and l.pronari_id <> v_perdoruesi
    and t.statusi in ('ne_pritje', 'konfirmuar');

  update public.terminet t
  set berberi_id = l.pronari_id
  from public.lokalet l
  where t.lokali_id = l.id
    and t.berberi_id = v_perdoruesi
    and l.pronari_id <> v_perdoruesi;

  delete from public.terminet t
  using public.lokalet l
  where t.lokali_id = l.id and l.pronari_id = v_perdoruesi;

  delete from public.lokalet where pronari_id = v_perdoruesi;

  delete from auth.users where id = v_perdoruesi;
end;
$$;

revoke all on function public.fshij_llogarine() from public, anon;
grant execute on function public.fshij_llogarine() to authenticated;
